'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
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
import { ExportButton } from '@/components/shared/ExportButton'

// ============================================
// Types
// ============================================

interface Location {
  id: string
  name: string
}

interface Metric {
  id: string
  name: string
  unit: string
}

interface HistoryRow {
  id: string
  location_name: string
  recorded_at: string
  recorded_by_name: string
  values: Array<{
    metric_id: string
    value: number
    is_out_of_range: boolean
  }>
}

// ============================================
// Skeleton Component
// ============================================

function PageSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-8 w-48 rounded bg-wolf-grey-light dark:bg-navy-light" />
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

export default function AirQualityHistoryPage() {
  const { profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [locations, setLocations] = useState<Location[]>([])
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all')
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

  // Fetch locations and metrics
  const fetchConfig = useCallback(async () => {
    if (!profile?.facility_id) return

    try {
      const [locResult, metricResult] = await Promise.all([
        supabase
          .from('air_quality_locations')
          .select('id, name')
          .eq('facility_id', profile.facility_id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('air_quality_metrics')
          .select('id, name, unit')
          .eq('facility_id', profile.facility_id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ])

      if (locResult.error) {
        toast({ title: 'Failed to load locations', variant: 'destructive' })
      }
      if (metricResult.error) {
        toast({ title: 'Failed to load metrics', variant: 'destructive' })
      }

      setLocations(locResult.data ?? [])
      setMetrics(metricResult.data ?? [])
    } catch {
      toast({ title: 'Failed to load configuration', variant: 'destructive' })
    }
  }, [profile?.facility_id, supabase, toast])

  // Fetch readings based on filters
  const fetchReadings = useCallback(async () => {
    if (!profile?.facility_id) return

    setDataLoading(true)

    try {
      let query = supabase
        .from('air_quality_readings')
        .select('id, location_id, recorded_at, recorded_by, air_quality_locations(name), profiles(full_name)')
        .eq('facility_id', profile.facility_id)
        .gte('recorded_at', `${dateFrom}T00:00:00`)
        .lte('recorded_at', `${dateTo}T23:59:59`)
        .order('recorded_at', { ascending: false })

      if (selectedLocationId !== 'all') {
        query = query.eq('location_id', selectedLocationId)
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
        .from('air_quality_reading_values')
        .select('reading_id, metric_id, value, is_out_of_range')
        .in('reading_id', readingIds)

      // Build rows
      const rows: HistoryRow[] = readingsData.map((r) => {
        const rTyped = r as unknown as {
          id: string
          location_id: string | null
          recorded_at: string
          recorded_by: string
          air_quality_locations: { name: string } | null
          profiles: { full_name: string } | null
        }

        const rowValues = (valuesData ?? [])
          .filter((v) => v.reading_id === rTyped.id)
          .map((v) => ({
            metric_id: v.metric_id,
            value: v.value,
            is_out_of_range: v.is_out_of_range,
          }))

        return {
          id: rTyped.id,
          location_name: rTyped.air_quality_locations?.name ?? 'N/A',
          recorded_at: rTyped.recorded_at,
          recorded_by_name: rTyped.profiles?.full_name ?? 'Unknown',
          values: rowValues,
        }
      })

      setReadings(rows)
    } catch {
      toast({ title: 'Failed to load history', variant: 'destructive' })
    } finally {
      setDataLoading(false)
    }
  }, [profile?.facility_id, supabase, toast, dateFrom, dateTo, selectedLocationId])

  // Initial load
  useEffect(() => {
    if (!authLoading && profile) {
      fetchConfig().then(() => setLoading(false))
    }
  }, [authLoading, profile, fetchConfig])

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
        href="/air-quality"
        className="inline-flex items-center gap-2 text-sm text-wolf-grey-dark hover:text-navy dark:text-wolf-grey dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Air Quality
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
            <History className="h-6 w-6" />
            Air Quality History
          </h1>
          <p className="mt-1 text-sm text-wolf-grey-dark dark:text-wolf-grey">
            View past air quality readings
          </p>
        </div>
        <ExportButton
          module="air_quality"
          reportType="compliance_report"
          startDate={dateFrom}
          endDate={dateTo}
          filters={selectedLocationId !== 'all' ? { locationId: selectedLocationId } : undefined}
        />
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
              <Label htmlFor="location-filter" className="text-xs text-wolf-grey-dark dark:text-wolf-grey">
                Location
              </Label>
              <Select
                value={selectedLocationId}
                onValueChange={setSelectedLocationId}
              >
                <SelectTrigger id="location-filter" className="w-[200px]">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
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
                No readings match your current filters. Try adjusting the date range or location.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date / Time</TableHead>
                    <TableHead className="whitespace-nowrap">Location</TableHead>
                    {metrics.map((m) => (
                      <TableHead key={m.id} className="whitespace-nowrap text-center">
                        {m.name}
                        <span className="block text-xs font-normal text-wolf-grey-dark dark:text-wolf-grey">
                          {m.unit}
                        </span>
                      </TableHead>
                    ))}
                    <TableHead className="whitespace-nowrap">Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(row.recorded_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-medium">
                        {row.location_name}
                      </TableCell>
                      {metrics.map((m) => {
                        const val = row.values.find((v) => v.metric_id === m.id)

                        if (!val) {
                          return (
                            <TableCell key={m.id} className="text-center text-sm text-wolf-grey dark:text-wolf-grey-dark">
                              --
                            </TableCell>
                          )
                        }

                        return (
                          <TableCell
                            key={m.id}
                            className={cn(
                              'text-center text-sm',
                              val.is_out_of_range && 'text-alert-red font-bold'
                            )}
                          >
                            {val.value}
                          </TableCell>
                        )
                      })}
                      <TableCell className="whitespace-nowrap text-sm">
                        {row.recorded_by_name}
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
