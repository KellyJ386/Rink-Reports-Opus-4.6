'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Wind,
  Loader2,
  AlertTriangle,
  Save,
  History,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { saveAirQualityReading } from './actions'

// ============================================
// Types
// ============================================

interface AirQualityLocation {
  id: string
  name: string
  sort_order: number
}

interface AirQualityMetric {
  id: string
  name: string
  unit: string
  min_threshold: number | null
  max_threshold: number | null
  sort_order: number
}

interface MetricValue {
  metric_id: string
  value: string // stored as string in input, parsed to number on submit
}

// ============================================
// Skeleton Component
// ============================================

function PageSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded bg-wolf-grey-light dark:bg-navy-light" />
          <div className="h-10 w-28 rounded bg-wolf-grey-light dark:bg-navy-light" />
        </div>
      </div>
      <div className="h-64 w-full rounded-lg bg-wolf-grey-light dark:bg-navy-light" />
    </div>
  )
}

// ============================================
// Helper: check out of range
// ============================================

function isValueOutOfRange(
  value: number | null,
  min: number | null,
  max: number | null
): boolean {
  if (value == null) return false
  if (min != null && value < min) return true
  if (max != null && value > max) return true
  return false
}

// ============================================
// Main Page Component
// ============================================

export default function AirQualityPage() {
  const { profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [locations, setLocations] = useState<AirQualityLocation[]>([])
  const [metrics, setMetrics] = useState<AirQualityMetric[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [metricValues, setMetricValues] = useState<Map<string, string>>(new Map())
  const [recordedAt, setRecordedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Set default timestamp
  useEffect(() => {
    const now = new Date()
    setRecordedAt(format(now, "yyyy-MM-dd'T'HH:mm"))
  }, [])

  const fetchData = useCallback(async () => {
    if (!profile?.facility_id) return

    try {
      // Fetch locations
      const { data: locData, error: locError } = await supabase
        .from('air_quality_locations')
        .select('id, name, sort_order')
        .eq('facility_id', profile.facility_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (locError) {
        toast({ title: 'Failed to load locations', variant: 'destructive' })
        return
      }

      setLocations(locData ?? [])

      // Fetch active metrics
      const { data: metricData, error: metricError } = await supabase
        .from('air_quality_metrics')
        .select('id, name, unit, min_threshold, max_threshold, sort_order')
        .eq('facility_id', profile.facility_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (metricError) {
        toast({ title: 'Failed to load metrics', variant: 'destructive' })
        return
      }

      setMetrics(metricData ?? [])

      // Initialize metric values
      const initialValues = new Map<string, string>()
      for (const m of metricData ?? []) {
        initialValues.set(m.id, '')
      }
      setMetricValues(initialValues)
    } catch {
      toast({ title: 'Failed to load data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [profile?.facility_id, supabase, toast])

  useEffect(() => {
    if (!authLoading && profile) {
      fetchData()
    }
  }, [authLoading, profile, fetchData])

  // Handle metric value change
  const handleMetricChange = useCallback((metricId: string, rawValue: string) => {
    setMetricValues((prev) => {
      const updated = new Map(prev)
      updated.set(metricId, rawValue)
      return updated
    })
  }, [])

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!recordedAt) return

    // Build values array (only include non-empty values)
    const filledValues: Array<{ metric_id: string; value: number }> = []
    for (const [metricId, rawValue] of metricValues) {
      if (rawValue !== '' && rawValue != null) {
        const parsed = parseFloat(rawValue)
        if (isNaN(parsed)) {
          const metric = metrics.find((m) => m.id === metricId)
          toast({
            title: `Invalid value for ${metric?.name ?? 'metric'}`,
            variant: 'destructive',
          })
          return
        }
        filledValues.push({ metric_id: metricId, value: parsed })
      }
    }

    if (filledValues.length === 0) {
      toast({ title: 'Please enter at least one metric value', variant: 'destructive' })
      return
    }

    setSaving(true)

    const result = await saveAirQualityReading({
      location_id: selectedLocationId || null,
      recorded_at: new Date(recordedAt).toISOString(),
      notes: notes || undefined,
      values: filledValues,
    })

    if (result.success) {
      toast({ title: 'Reading saved successfully', variant: 'success' })
      // Reset form
      const resetValues = new Map<string, string>()
      for (const m of metrics) {
        resetValues.set(m.id, '')
      }
      setMetricValues(resetValues)
      setNotes('')
      setSelectedLocationId('')
      const now = new Date()
      setRecordedAt(format(now, "yyyy-MM-dd'T'HH:mm"))
    } else {
      toast({ title: result.error ?? 'Failed to save reading', variant: 'destructive' })
    }

    setSaving(false)
  }, [recordedAt, selectedLocationId, notes, metricValues, metrics, toast])

  if (authLoading || loading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            Air Quality Monitoring
          </h1>
          <p className="mt-1 text-sm text-wolf-grey-dark dark:text-wolf-grey">
            Record air quality measurements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/air-quality/history">
            <Button variant="outline" size="sm">
              <History className="h-4 w-4" />
              History
            </Button>
          </Link>
          <Link href="/air-quality/reports">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4" />
              Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-navy dark:text-white">
            New Reading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location-select" className="text-sm font-medium">
              Location
            </Label>
            {locations.length > 0 ? (
              <Select
                value={selectedLocationId}
                onValueChange={setSelectedLocationId}
              >
                <SelectTrigger id="location-select" className="max-w-xs">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-wolf-grey-dark dark:text-wolf-grey italic">
                No locations configured. Ask your administrator to add them.
              </p>
            )}
          </div>

          {/* Timestamp */}
          <div className="space-y-2">
            <Label htmlFor="recorded-at" className="text-sm font-medium">
              Date / Time
            </Label>
            <Input
              id="recorded-at"
              type="datetime-local"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Separator />

          {/* Metric Fields */}
          {metrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Wind className="h-12 w-12 text-wolf-grey dark:text-wolf-grey-dark" />
              <h3 className="mt-4 text-lg font-semibold text-navy dark:text-white">
                No Metrics Configured
              </h3>
              <p className="mt-2 text-sm text-wolf-grey-dark dark:text-wolf-grey">
                Ask your facility administrator to configure air quality metrics in Admin settings.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {metrics.map((metric) => {
                const rawValue = metricValues.get(metric.id) ?? ''
                const numericValue = rawValue === '' ? null : parseFloat(rawValue)
                const outOfRange = isValueOutOfRange(
                  numericValue,
                  metric.min_threshold,
                  metric.max_threshold
                )

                return (
                  <div key={metric.id} className="space-y-2">
                    <Label
                      htmlFor={`metric-${metric.id}`}
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      {metric.name}
                      <span className="text-wolf-grey-dark dark:text-wolf-grey font-normal">
                        &mdash; {metric.unit}
                      </span>
                      {metric.min_threshold != null && metric.max_threshold != null && (
                        <span className="text-xs text-wolf-grey dark:text-wolf-grey-dark font-normal">
                          Range: {metric.min_threshold} - {metric.max_threshold}
                        </span>
                      )}
                    </Label>
                    <div className="max-w-xs">
                      <Input
                        id={`metric-${metric.id}`}
                        type="number"
                        step="any"
                        placeholder={`Enter ${metric.name.toLowerCase()}`}
                        value={rawValue}
                        onChange={(e) => handleMetricChange(metric.id, e.target.value)}
                        className={cn(
                          outOfRange && 'border-alert-red focus-visible:ring-alert-red'
                        )}
                      />
                      {outOfRange && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-alert-red font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          Value is out of acceptable range
                          {metric.min_threshold != null && metric.max_threshold != null && (
                            <span className="font-normal">
                              ({metric.min_threshold} - {metric.max_threshold} {metric.unit})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes <span className="font-normal text-wolf-grey-dark dark:text-wolf-grey">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this reading..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={saving || metrics.length === 0}
              className="bg-action-green text-white hover:bg-action-green-hover min-w-[160px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Reading
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
