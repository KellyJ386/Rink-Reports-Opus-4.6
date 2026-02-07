'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Loader2,
  History,
  Filter,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

// ============================================
// Types
// ============================================

interface Equipment {
  id: string
  name: string
}

interface ReadingTypeInfo {
  id: string
  name: string
  unit: string
  is_oil_level: boolean
}

interface HistoryRow {
  id: string
  equipment_id: string
  equipment_name: string
  recorded_at: string
  recorded_by_name: string
  notes: string | null
  values: Array<{
    reading_type_id: string
    numeric_value: number | null
    oil_level_value: string | null
    is_out_of_range: boolean
  }>
}

// ============================================
// Skeleton Component
// ============================================

function PageSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-8 w-56 rounded bg-wolf-grey-light dark:bg-navy-light" />
      <div className="flex gap-4">
        <div className="h-10 w-48 rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="h-10 w-40 rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="h-10 w-40 rounded bg-wolf-grey-light dark:bg-navy-light" />
      </div>
      <div className="h-64 w-full rounded-lg bg-wolf-grey-light dark:bg-navy-light" />
    </div>
  )
}

// ============================================
// Main Page Component
// ============================================

export default function RefrigerationHistoryPage() {
  const { profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('all')
  const [readingTypes, setReadingTypes] = useState<ReadingTypeInfo[]>([])
  const [readings, setReadings] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)

  // Date range: default to last 7 days
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return format(d, 'yyyy-MM-dd')
  })
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  // Fetch equipment list
  const fetchEquipment = useCallback(async () => {
    if (!profile?.facility_id) return

    const { data, error } = await supabase
      .from('equipment')
      .select('id, name')
      .eq('facility_id', profile.facility_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      toast({ title: 'Failed to load equipment', variant: 'destructive' })
      return
    }

    setEquipment(data ?? [])
  }, [profile?.facility_id, supabase, toast])

  // Fetch all reading types for the facility's equipment
  const fetchReadingTypes = useCallback(async () => {
    if (!profile?.facility_id) return

    // Get all reading types for all facility equipment
    const { data: eqIds } = await supabase
      .from('equipment')
      .select('id')
      .eq('facility_id', profile.facility_id)

    if (!eqIds || eqIds.length === 0) return

    const { data: types } = await supabase
      .from('equipment_reading_types')
      .select('id, name, unit, is_oil_level, equipment_id')
      .in('equipment_id', eqIds.map((e) => e.id))
      .order('sort_order', { ascending: true })

    // Use only unique reading type names (for the column headers)
    const uniqueTypes: ReadingTypeInfo[] = []
    const seen = new Set<string>()
    for (const t of types ?? []) {
      if (!seen.has(t.name)) {
        seen.add(t.name)
        uniqueTypes.push({
          id: t.id,
          name: t.name,
          unit: t.unit,
          is_oil_level: t.is_oil_level,
        })
      }
    }

    setReadingTypes(uniqueTypes)
  }, [profile?.facility_id, supabase])

  // Fetch readings based on filters
  const fetchReadings = useCallback(async () => {
    if (!profile?.facility_id) return

    setDataLoading(true)

    try {
      let query = supabase
        .from('refrigeration_readings')
        .select('id, equipment_id, recorded_at, notes, recorded_by, equipment(name), profiles(full_name)')
        .eq('facility_id', profile.facility_id)
        .gte('recorded_at', `${dateFrom}T00:00:00`)
        .lte('recorded_at', `${dateTo}T23:59:59`)
        .order('recorded_at', { ascending: false })

      if (selectedEquipmentId !== 'all') {
        query = query.eq('equipment_id', selectedEquipmentId)
      }

      const { data: readingsData, error } = await query

      if (error) {
        toast({ title: 'Failed to load readings', variant: 'destructive' })
        setDataLoading(false)
        return
      }

      if (!readingsData || readingsData.length === 0) {
        setReadings([])
        setDataLoading(false)
        return
      }

      // Fetch all values for these readings
      const readingIds = readingsData.map((r) => r.id)
      const { data: valuesData } = await supabase
        .from('refrigeration_reading_values')
        .select('reading_id, reading_type_id, numeric_value, oil_level_value, is_out_of_range, equipment_reading_types(name)')
        .in('reading_id', readingIds)

      // Build rows
      const rows: HistoryRow[] = readingsData.map((r) => {
        const rTyped = r as unknown as {
          id: string
          equipment_id: string
          recorded_at: string
          notes: string | null
          recorded_by: string
          equipment: { name: string } | null
          profiles: { full_name: string } | null
        }

        const rowValues = (valuesData ?? [])
          .filter((v) => v.reading_id === rTyped.id)
          .map((v) => ({
            reading_type_id: v.reading_type_id,
            numeric_value: v.numeric_value,
            oil_level_value: v.oil_level_value,
            is_out_of_range: v.is_out_of_range,
            reading_type_name: (v.equipment_reading_types as unknown as { name: string } | null)?.name ?? '',
          }))

        return {
          id: rTyped.id,
          equipment_id: rTyped.equipment_id,
          equipment_name: rTyped.equipment?.name ?? 'Unknown',
          recorded_at: rTyped.recorded_at,
          recorded_by_name: rTyped.profiles?.full_name ?? 'Unknown',
          notes: rTyped.notes,
          values: rowValues,
        }
      })

      setReadings(rows)
    } catch {
      toast({ title: 'Failed to load history', variant: 'destructive' })
    } finally {
      setDataLoading(false)
    }
  }, [profile?.facility_id, supabase, toast, dateFrom, dateTo, selectedEquipmentId])

  // Initial load
  useEffect(() => {
    if (!authLoading && profile) {
      Promise.all([fetchEquipment(), fetchReadingTypes()]).then(() => setLoading(false))
    }
  }, [authLoading, profile, fetchEquipment, fetchReadingTypes])

  // Fetch readings when filters change
  useEffect(() => {
    if (!loading && profile) {
      fetchReadings()
    }
  }, [loading, profile, fetchReadings])

  if (authLoading || loading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Back Link */}
      <Link
        href="/refrigeration"
        className="inline-flex items-center gap-2 text-sm text-wolf-grey-dark hover:text-navy dark:text-wolf-grey dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Equipment
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
          <History className="h-6 w-6" />
          Refrigeration History
        </h1>
        <p className="mt-1 text-sm text-wolf-grey-dark dark:text-wolf-grey">
          View past equipment readings and trends
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex items-center gap-2 text-sm font-medium text-navy dark:text-white">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="equipment-filter" className="text-xs text-wolf-grey-dark dark:text-wolf-grey">
                Equipment
              </Label>
              <Select
                value={selectedEquipmentId}
                onValueChange={setSelectedEquipmentId}
              >
                <SelectTrigger id="equipment-filter" className="w-[200px]">
                  <SelectValue placeholder="All Equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Equipment</SelectItem>
                  {equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-from" className="text-xs text-wolf-grey-dark dark:text-wolf-grey">
                From
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-to" className="text-xs text-wolf-grey-dark dark:text-wolf-grey">
                To
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[160px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {dataLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-navy dark:text-wolf-grey" />
              <span className="ml-2 text-sm text-wolf-grey-dark dark:text-wolf-grey">
                Loading readings...
              </span>
            </div>
          ) : readings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <History className="h-12 w-12 text-wolf-grey dark:text-wolf-grey-dark" />
              <h3 className="mt-4 text-lg font-semibold text-navy dark:text-white">
                No Readings Found
              </h3>
              <p className="mt-2 text-sm text-wolf-grey-dark dark:text-wolf-grey">
                No readings match your current filters. Try adjusting the date range or equipment selection.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date / Time</TableHead>
                    <TableHead className="whitespace-nowrap">Equipment</TableHead>
                    <TableHead className="whitespace-nowrap">Recorded By</TableHead>
                    {readingTypes.map((rt) => (
                      <TableHead key={rt.id} className="whitespace-nowrap text-center">
                        {rt.name}
                        <span className="block text-xs font-normal text-wolf-grey-dark dark:text-wolf-grey">
                          {rt.unit}
                        </span>
                      </TableHead>
                    ))}
                    <TableHead className="whitespace-nowrap">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(row.recorded_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-medium">
                        {row.equipment_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {row.recorded_by_name}
                      </TableCell>
                      {readingTypes.map((rt) => {
                        // Find matching value by reading type name (since IDs might differ across equipment)
                        const val = row.values.find(
                          (v) => v.reading_type_id === rt.id ||
                            (v as { reading_type_name?: string }).reading_type_name === rt.name
                        )

                        if (!val) {
                          return (
                            <TableCell key={rt.id} className="text-center text-sm text-wolf-grey dark:text-wolf-grey-dark">
                              --
                            </TableCell>
                          )
                        }

                        const displayValue = rt.is_oil_level
                          ? (val.oil_level_value?.toUpperCase() ?? '--')
                          : (val.numeric_value != null ? val.numeric_value.toString() : '--')

                        return (
                          <TableCell
                            key={rt.id}
                            className={cn(
                              'text-center text-sm',
                              val.is_out_of_range && 'text-alert-red font-bold'
                            )}
                          >
                            {displayValue}
                          </TableCell>
                        )
                      })}
                      <TableCell className="max-w-[200px] truncate text-sm text-wolf-grey-dark dark:text-wolf-grey">
                        {row.notes || '--'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Count */}
      {!dataLoading && readings.length > 0 && (
        <p className="text-sm text-wolf-grey-dark dark:text-wolf-grey">
          Showing {readings.length} reading{readings.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
