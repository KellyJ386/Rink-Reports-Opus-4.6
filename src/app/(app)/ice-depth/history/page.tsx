'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  ArrowLeft,
  Bluetooth,
  Loader2,
  Search,
  Ruler,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// ============================================
// Types
// ============================================

interface Rink {
  id: string
  name: string
  sort_order: number
}

interface Thresholds {
  green_min: number
  green_max: number
  yellow_min: number
  yellow_max: number
  red_min: number
  red_max: number
}

interface HistoryReading {
  id: string
  point_id: string
  reading_inches: number
  reading_source: string
  measured_at: string
  measured_by: string
  ice_depth_points: { point_number: number } | null
  profiles: { full_name: string } | null
}

// ============================================
// Helper Functions
// ============================================

function getReadingColor(
  value: number,
  thresholds: Thresholds | null
): { color: string; label: string; badgeClass: string } {
  if (!thresholds) {
    return { color: 'wolf-grey', label: 'N/A', badgeClass: 'bg-wolf-grey text-white border-transparent' }
  }

  if (value >= thresholds.green_min && value <= thresholds.green_max) {
    return { color: 'green', label: 'Green', badgeClass: 'bg-action-green text-white border-transparent' }
  }
  if (value >= thresholds.yellow_min && value <= thresholds.yellow_max) {
    return { color: 'yellow', label: 'Yellow', badgeClass: 'bg-alert-yellow text-navy border-transparent' }
  }
  if (value >= thresholds.red_min && value <= thresholds.red_max) {
    return { color: 'red', label: 'Red', badgeClass: 'bg-alert-red text-white border-transparent' }
  }

  return { color: 'red', label: 'Out of Range', badgeClass: 'bg-alert-red text-white border-transparent' }
}

// ============================================
// Skeleton Component
// ============================================

function PageSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="h-8 w-48 rounded bg-wolf-grey-light dark:bg-navy-light" />
      </div>
      <div className="flex gap-4">
        <div className="h-10 w-48 rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="h-10 w-40 rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="h-10 w-40 rounded bg-wolf-grey-light dark:bg-navy-light" />
      </div>
      <div className="h-[400px] w-full rounded-lg bg-wolf-grey-light dark:bg-navy-light" />
    </div>
  )
}

// ============================================
// History Page Component
// ============================================

export default function IceDepthHistoryPage() {
  const { profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  // State
  const [rinks, setRinks] = useState<Rink[]>([])
  const [selectedRinkId, setSelectedRinkId] = useState<string | null>(null)
  const [thresholds, setThresholds] = useState<Thresholds | null>(null)
  const [readings, setReadings] = useState<HistoryReading[]>([])
  const [points, setPoints] = useState<{ id: string; point_number: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)

  // Filter state
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedPointNumber, setSelectedPointNumber] = useState<string>('all')

  // Fetch rinks for facility
  const fetchRinks = useCallback(async () => {
    if (!profile?.facility_id) return

    const { data, error } = await supabase
      .from('rinks')
      .select('id, name, sort_order')
      .eq('facility_id', profile.facility_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      toast({ title: 'Failed to load rinks', variant: 'destructive' })
      return
    }

    setRinks(data ?? [])

    if (data && data.length > 0 && !selectedRinkId) {
      setSelectedRinkId(data[0].id)
    }
  }, [profile?.facility_id, supabase, toast, selectedRinkId])

  // Fetch thresholds
  const fetchThresholds = useCallback(async () => {
    if (!profile?.facility_id) return

    const { data } = await supabase
      .from('ice_depth_thresholds')
      .select('green_min, green_max, yellow_min, yellow_max, red_min, red_max')
      .eq('facility_id', profile.facility_id)
      .single()

    setThresholds(data ?? null)
  }, [profile?.facility_id, supabase])

  // Fetch readings for selected rink with filters
  const fetchReadings = useCallback(async () => {
    if (!selectedRinkId || !profile?.facility_id) return

    setDataLoading(true)

    try {
      // Fetch points for this rink (for the filter dropdown)
      const { data: pointsData } = await supabase
        .from('ice_depth_points')
        .select('id, point_number')
        .eq('rink_id', selectedRinkId)
        .order('point_number', { ascending: true })

      setPoints(pointsData ?? [])

      // Build query
      let query = supabase
        .from('ice_depth_readings')
        .select('id, point_id, reading_inches, reading_source, measured_at, measured_by, ice_depth_points(point_number), profiles(full_name)')
        .eq('rink_id', selectedRinkId)
        .eq('facility_id', profile.facility_id)
        .order('measured_at', { ascending: false })
        .limit(200)

      // Apply date filters
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        fromDate.setHours(0, 0, 0, 0)
        query = query.gte('measured_at', fromDate.toISOString())
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        query = query.lte('measured_at', toDate.toISOString())
      }

      // Apply point filter
      if (selectedPointNumber !== 'all') {
        const matchingPoint = pointsData?.find(
          (p) => p.point_number === parseInt(selectedPointNumber, 10)
        )
        if (matchingPoint) {
          query = query.eq('point_id', matchingPoint.id)
        }
      }

      const { data, error } = await query

      if (error) {
        toast({ title: 'Failed to load readings', variant: 'destructive' })
        return
      }

      setReadings((data as unknown as HistoryReading[]) ?? [])
    } catch {
      toast({ title: 'Failed to load history data', variant: 'destructive' })
    } finally {
      setDataLoading(false)
    }
  }, [selectedRinkId, profile?.facility_id, supabase, dateFrom, dateTo, selectedPointNumber, toast])

  // Initial load
  useEffect(() => {
    if (!authLoading && profile) {
      Promise.all([fetchRinks(), fetchThresholds()]).then(() => setLoading(false))
    }
  }, [authLoading, profile, fetchRinks, fetchThresholds])

  // Load readings when rink or filters change
  useEffect(() => {
    if (selectedRinkId) {
      fetchReadings()
    }
  }, [selectedRinkId, fetchReadings])

  // Loading state
  if (authLoading || loading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ice-depth">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Ice Depth</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-white">
              Ice Depth History
            </h1>
            <p className="mt-1 text-sm text-wolf-grey-dark dark:text-wolf-grey">
              View historical ice depth readings across all points
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Rink Selector */}
            <div className="space-y-2">
              <Label htmlFor="history-rink-select" className="text-sm">
                Rink
              </Label>
              <Select
                value={selectedRinkId ?? undefined}
                onValueChange={(value) => setSelectedRinkId(value)}
              >
                <SelectTrigger id="history-rink-select">
                  <SelectValue placeholder="Select rink" />
                </SelectTrigger>
                <SelectContent>
                  {rinks.map((rink) => (
                    <SelectItem key={rink.id} value={rink.id}>
                      {rink.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="date-from" className="text-sm">
                From Date
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="date-to" className="text-sm">
                To Date
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Point Filter */}
            <div className="space-y-2">
              <Label htmlFor="point-filter" className="text-sm">
                Point #
              </Label>
              <Select
                value={selectedPointNumber}
                onValueChange={(value) => setSelectedPointNumber(value)}
              >
                <SelectTrigger id="point-filter">
                  <SelectValue placeholder="All points" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Points</SelectItem>
                  {points.map((point) => (
                    <SelectItem key={point.id} value={String(point.point_number)}>
                      Point #{point.point_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          {(dateFrom || dateTo || selectedPointNumber !== 'all') && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                  setSelectedPointNumber('all')
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Readings Table */}
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
              <Ruler className="h-12 w-12 text-wolf-grey dark:text-wolf-grey-dark" />
              <h3 className="mt-4 text-lg font-semibold text-navy dark:text-white">
                No Readings Found
              </h3>
              <p className="mt-2 text-sm text-wolf-grey-dark dark:text-wolf-grey">
                {dateFrom || dateTo || selectedPointNumber !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No ice depth readings have been recorded for this rink yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Point #</TableHead>
                    <TableHead className="w-[120px]">Reading (&quot;)</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Source</TableHead>
                    <TableHead>Measured By</TableHead>
                    <TableHead className="w-[180px]">Date/Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => {
                    const colorInfo = getReadingColor(reading.reading_inches, thresholds)
                    return (
                      <TableRow key={reading.id}>
                        <TableCell className="font-medium">
                          #{reading.ice_depth_points?.point_number ?? '?'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {reading.reading_inches.toFixed(2)}&quot;
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs', colorInfo.badgeClass)}>
                            {colorInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {reading.reading_source === 'bluetooth' ? (
                            <Badge variant="outline" className="text-xs">
                              <Bluetooth className="mr-1 h-3 w-3" />
                              BT
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Manual
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {reading.profiles?.full_name ?? 'Unknown'}
                        </TableCell>
                        <TableCell className="text-sm text-wolf-grey-dark dark:text-wolf-grey">
                          {format(new Date(reading.measured_at), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      {readings.length > 0 && (
        <p className="text-center text-xs text-wolf-grey-dark dark:text-wolf-grey">
          Showing {readings.length} reading{readings.length !== 1 ? 's' : ''}
          {readings.length === 200 && ' (limited to most recent 200)'}
        </p>
      )}
    </div>
  )
}
