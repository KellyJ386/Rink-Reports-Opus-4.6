'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import IceRinkDiagram from '@/components/diagrams/IceRinkDiagram'
import { saveIceDepthReading } from './actions'
import {
  Ruler,
  Bluetooth,
  Clock,
  User,
  Loader2,
  History,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useBluetoothCaliper } from '@/lib/hooks/useBluetoothCaliper'

// ============================================
// Types
// ============================================

interface Rink {
  id: string
  name: string
  sort_order: number
}

interface DepthPoint {
  id: string
  point_number: number
  x_percent: number
  y_percent: number
}

interface Thresholds {
  green_min: number
  green_max: number
  yellow_min: number
  yellow_max: number
  red_min: number
  red_max: number
}

interface ReadingRecord {
  id: string
  point_id: string
  reading_inches: number
  reading_source: string
  measured_at: string
  measured_by: string
  profiles: { full_name: string } | null
}

interface ReadingMap {
  [pointId: string]: {
    reading_inches: number
    measured_at: string
    measured_by_name: string
  }
}

// ============================================
// Skeleton Component
// ============================================

function PageSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="h-10 w-40 rounded bg-wolf-grey-light dark:bg-navy-light" />
      </div>
      <div className="h-10 w-64 rounded bg-wolf-grey-light dark:bg-navy-light" />
      <div className="h-[300px] w-full rounded-lg bg-wolf-grey-light dark:bg-navy-light" />
      <div className="h-16 w-full rounded-lg bg-wolf-grey-light dark:bg-navy-light" />
    </div>
  )
}

// ============================================
// Main Page Component
// ============================================

export default function IceDepthPage() {
  const { profile, facility, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  const bluetooth = useBluetoothCaliper()

  // State
  const [rinks, setRinks] = useState<Rink[]>([])
  const [selectedRinkId, setSelectedRinkId] = useState<string | null>(null)
  const [points, setPoints] = useState<DepthPoint[]>([])
  const [thresholds, setThresholds] = useState<Thresholds | null>(null)
  const [readings, setReadings] = useState<ReadingMap>({})
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [selectedPointNumber, setSelectedPointNumber] = useState<number | null>(null)
  const [measurementValue, setMeasurementValue] = useState('')
  const [saving, setSaving] = useState(false)

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

    // Auto-select if single rink or first rink
    if (data && data.length > 0 && !selectedRinkId) {
      setSelectedRinkId(data[0].id)
    }
  }, [profile?.facility_id, supabase, toast, selectedRinkId])

  // Fetch points, thresholds, and readings for selected rink
  const fetchRinkData = useCallback(async () => {
    if (!selectedRinkId || !profile?.facility_id) return

    setDataLoading(true)

    try {
      // Fetch points
      const { data: pointsData } = await supabase
        .from('ice_depth_points')
        .select('id, point_number, x_percent, y_percent')
        .eq('rink_id', selectedRinkId)
        .order('point_number', { ascending: true })

      // Fetch thresholds
      const { data: thresholdsData } = await supabase
        .from('ice_depth_thresholds')
        .select('green_min, green_max, yellow_min, yellow_max, red_min, red_max')
        .eq('facility_id', profile.facility_id)
        .single()

      // Fetch today's readings (latest per point)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data: readingsData } = await supabase
        .from('ice_depth_readings')
        .select('id, point_id, reading_inches, reading_source, measured_at, measured_by, profiles(full_name)')
        .eq('rink_id', selectedRinkId)
        .eq('facility_id', profile.facility_id)
        .gte('measured_at', todayStart.toISOString())
        .order('measured_at', { ascending: false })

      setPoints(pointsData ?? [])
      setThresholds(thresholdsData ?? null)

      // Build readings map (latest reading per point)
      const readingsMap: ReadingMap = {}
      if (readingsData) {
        for (const reading of readingsData as unknown as ReadingRecord[]) {
          if (!readingsMap[reading.point_id]) {
            readingsMap[reading.point_id] = {
              reading_inches: reading.reading_inches,
              measured_at: reading.measured_at,
              measured_by_name: reading.profiles?.full_name ?? 'Unknown',
            }
          }
        }
      }
      setReadings(readingsMap)
    } catch {
      toast({ title: 'Failed to load rink data', variant: 'destructive' })
    } finally {
      setDataLoading(false)
    }
  }, [selectedRinkId, profile?.facility_id, supabase, toast])

  // Initial load
  useEffect(() => {
    if (!authLoading && profile) {
      fetchRinks().then(() => setLoading(false))
    }
  }, [authLoading, profile, fetchRinks])

  // Load rink data when rink changes
  useEffect(() => {
    if (selectedRinkId) {
      fetchRinkData()
    }
  }, [selectedRinkId, fetchRinkData])

  // Handle point click
  const handlePointClick = useCallback((pointId: string, pointNumber: number) => {
    setSelectedPointId(pointId)
    setSelectedPointNumber(pointNumber)
    setMeasurementValue('')
    setSheetOpen(true)
  }, [])

  // Handle save reading
  const handleSave = useCallback(async () => {
    if (!selectedPointId || !selectedRinkId || !measurementValue) return

    const value = parseFloat(measurementValue)
    if (isNaN(value) || value < 0 || value > 10) {
      toast({ title: 'Please enter a valid measurement between 0 and 10 inches', variant: 'destructive' })
      return
    }

    setSaving(true)
    const result = await saveIceDepthReading({
      point_id: selectedPointId,
      rink_id: selectedRinkId,
      reading_inches: value,
      reading_source: bluetooth.isConnected ? 'bluetooth' : 'manual',
    })

    if (result.success) {
      toast({ title: 'Reading saved successfully', variant: 'success' })
      setSheetOpen(false)
      setMeasurementValue('')
      // Refresh data
      await fetchRinkData()
    } else {
      toast({ title: result.error ?? 'Failed to save reading', variant: 'destructive' })
    }
    setSaving(false)
  }, [selectedPointId, selectedRinkId, measurementValue, bluetooth.isConnected, toast, fetchRinkData])

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalPoints = points.length
    const measuredToday = Object.keys(readings).length
    let greenCount = 0
    let yellowCount = 0
    let redCount = 0

    if (thresholds) {
      Object.values(readings).forEach(({ reading_inches }) => {
        if (reading_inches >= thresholds.green_min && reading_inches <= thresholds.green_max) {
          greenCount++
        } else if (reading_inches >= thresholds.yellow_min && reading_inches <= thresholds.yellow_max) {
          yellowCount++
        } else {
          redCount++
        }
      })
    }

    return { totalPoints, measuredToday, greenCount, yellowCount, redCount }
  }, [points, readings, thresholds])

  // Selected point reading for sheet
  const selectedPointReading = selectedPointId ? readings[selectedPointId] : null

  // Loading state
  if (authLoading || loading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            Ice Depth Management
          </h1>
          <p className="mt-1 text-sm text-wolf-grey-dark dark:text-wolf-grey">
            Measure and track ice thickness across your rink
          </p>
        </div>
        <div className="flex items-center gap-3">
          {bluetooth.isSupported && (
            <Button
              variant={bluetooth.isConnected ? 'default' : 'outline'}
              size="sm"
              onClick={bluetooth.isConnected ? bluetooth.disconnect : bluetooth.connect}
              disabled={bluetooth.isConnecting}
              className={cn(
                bluetooth.isConnected && 'bg-action-green hover:bg-action-green-hover text-white'
              )}
            >
              {bluetooth.isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bluetooth className="h-4 w-4" />
              )}
              {bluetooth.isConnected ? 'Caliper Connected' : 'Connect Caliper'}
            </Button>
          )}
          <Link href="/ice-depth/history">
            <Button variant="outline" size="sm">
              <History className="h-4 w-4" />
              History
            </Button>
          </Link>
        </div>
      </div>

      {/* Rink Selector */}
      {rinks.length > 1 && (
        <div className="w-full max-w-xs">
          <Label htmlFor="rink-select" className="mb-2 block text-sm font-medium">
            Select Rink
          </Label>
          <Select
            value={selectedRinkId ?? undefined}
            onValueChange={(value) => setSelectedRinkId(value)}
          >
            <SelectTrigger id="rink-select">
              <SelectValue placeholder="Choose a rink" />
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
      )}

      {/* No rinks state */}
      {rinks.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Ruler className="h-12 w-12 text-wolf-grey dark:text-wolf-grey-dark" />
            <h3 className="mt-4 text-lg font-semibold text-navy dark:text-white">
              No Rinks Configured
            </h3>
            <p className="mt-2 text-sm text-wolf-grey-dark dark:text-wolf-grey">
              Ask your facility administrator to configure rinks in the Admin settings.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rink Diagram */}
      {selectedRinkId && (
        <div className={cn(dataLoading && 'opacity-50 pointer-events-none transition-opacity')}>
          {dataLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-navy dark:text-wolf-grey" />
              <span className="ml-2 text-sm text-wolf-grey-dark dark:text-wolf-grey">
                Loading rink data...
              </span>
            </div>
          )}

          {points.length > 0 ? (
            <IceRinkDiagram
              rinkName={rinks.find((r) => r.id === selectedRinkId)?.name ?? 'Rink'}
              points={points}
              readings={readings}
              thresholds={thresholds}
              onPointClick={handlePointClick}
              logoUrl={facility?.logo_url}
            />
          ) : (
            !dataLoading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Ruler className="h-12 w-12 text-wolf-grey dark:text-wolf-grey-dark" />
                  <h3 className="mt-4 text-lg font-semibold text-navy dark:text-white">
                    No Measurement Points
                  </h3>
                  <p className="mt-2 text-sm text-wolf-grey-dark dark:text-wolf-grey">
                    Measurement points need to be configured for this rink in Admin settings.
                  </p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* Summary Bar */}
      {selectedRinkId && points.length > 0 && (
        <Card className="border-wolf-grey-light dark:border-wolf-grey-dark">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-sm font-medium text-navy dark:text-white">
                Today&apos;s Progress:
                <span className="ml-2 font-bold">
                  {summaryStats.measuredToday}/{summaryStats.totalPoints} points measured
                </span>
              </div>
              <Separator orientation="vertical" className="hidden h-6 sm:block" />
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-action-green text-white border-transparent">
                  {summaryStats.greenCount} Green
                </Badge>
                <Badge variant="warning">
                  {summaryStats.yellowCount} Yellow
                </Badge>
                <Badge className="bg-alert-red text-white border-transparent">
                  {summaryStats.redCount} Red
                </Badge>
                <Badge variant="secondary">
                  {summaryStats.totalPoints - summaryStats.measuredToday} Unmeasured
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Measurement Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-navy dark:text-white">
              Point #{selectedPointNumber}
            </SheetTitle>
            <SheetDescription>
              Record ice depth measurement for this point
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Last Reading Info */}
            {selectedPointReading && (
              <div className="rounded-lg border border-wolf-grey-light bg-wolf-grey-light/30 p-4 dark:border-wolf-grey-dark dark:bg-navy-dark/50">
                <h4 className="mb-3 text-sm font-semibold text-navy dark:text-white">
                  Last Reading
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-wolf-grey-dark dark:text-wolf-grey">
                    <Ruler className="h-4 w-4" />
                    <span>{selectedPointReading.reading_inches.toFixed(2)}&quot;</span>
                  </div>
                  <div className="flex items-center gap-2 text-wolf-grey-dark dark:text-wolf-grey">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(selectedPointReading.measured_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-wolf-grey-dark dark:text-wolf-grey">
                    <User className="h-4 w-4" />
                    <span>{selectedPointReading.measured_by_name}</span>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Measurement Input */}
            <div className="space-y-3">
              <Label htmlFor="measurement-input" className="text-sm font-medium">
                Measurement (inches)
              </Label>
              <Input
                id="measurement-input"
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 1.25"
                value={measurementValue}
                onChange={(e) => setMeasurementValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSave()
                  }
                }}
                className="text-lg"
                autoFocus
              />
              {bluetooth.isConnected && (
                <p className="flex items-center gap-1.5 text-xs text-action-green">
                  <Bluetooth className="h-3 w-3" />
                  Reading will be saved as Bluetooth source
                </p>
              )}
            </div>
          </div>

          <SheetFooter className="mt-8">
            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSheetOpen(false)
                  setMeasurementValue('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-action-green text-white hover:bg-action-green-hover"
                onClick={handleSave}
                disabled={saving || !measurementValue}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Reading'
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
