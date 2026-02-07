'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  ArrowLeft,
  Loader2,
  Thermometer,
  AlertTriangle,
  Save,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { saveRefrigerationReading } from '../actions'

// ============================================
// Types
// ============================================

interface EquipmentInfo {
  id: string
  name: string
  equipment_type: string
}

interface ReadingType {
  id: string
  name: string
  unit: string
  min_threshold: number | null
  max_threshold: number | null
  sort_order: number
  is_oil_level: boolean
}

interface ReadingValue {
  reading_type_id: string
  numeric_value: number | null
  oil_level_value: string | null
}

// ============================================
// Skeleton Component
// ============================================

function PageSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-8 w-48 rounded bg-wolf-grey-light dark:bg-navy-light" />
      <div className="h-6 w-32 rounded bg-wolf-grey-light dark:bg-navy-light" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 w-full rounded-lg bg-wolf-grey-light dark:bg-navy-light" />
        ))}
      </div>
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

export default function EquipmentReadingPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>
}) {
  const { equipmentId } = use(params)
  const { profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [equipmentInfo, setEquipmentInfo] = useState<EquipmentInfo | null>(null)
  const [readingTypes, setReadingTypes] = useState<ReadingType[]>([])
  const [values, setValues] = useState<Map<string, ReadingValue>>(new Map())
  const [recordedAt, setRecordedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Set default timestamp to now
  useEffect(() => {
    const now = new Date()
    const localISO = format(now, "yyyy-MM-dd'T'HH:mm")
    setRecordedAt(localISO)
  }, [])

  const fetchData = useCallback(async () => {
    if (!profile?.facility_id) return

    try {
      // Fetch equipment info
      const { data: eqData, error: eqError } = await supabase
        .from('equipment')
        .select('id, name, equipment_type')
        .eq('id', equipmentId)
        .eq('facility_id', profile.facility_id)
        .single()

      if (eqError || !eqData) {
        toast({ title: 'Equipment not found', variant: 'destructive' })
        setLoading(false)
        return
      }

      setEquipmentInfo(eqData)

      // Fetch reading types for this equipment
      const { data: typesData, error: typesError } = await supabase
        .from('equipment_reading_types')
        .select('id, name, unit, min_threshold, max_threshold, sort_order, is_oil_level')
        .eq('equipment_id', equipmentId)
        .order('sort_order', { ascending: true })

      if (typesError) {
        toast({ title: 'Failed to load reading types', variant: 'destructive' })
        setLoading(false)
        return
      }

      setReadingTypes(typesData ?? [])

      // Initialize values map
      const initialValues = new Map<string, ReadingValue>()
      for (const rt of typesData ?? []) {
        initialValues.set(rt.id, {
          reading_type_id: rt.id,
          numeric_value: null,
          oil_level_value: null,
        })
      }
      setValues(initialValues)
    } catch {
      toast({ title: 'Failed to load equipment data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [profile?.facility_id, equipmentId, supabase, toast])

  useEffect(() => {
    if (!authLoading && profile) {
      fetchData()
    }
  }, [authLoading, profile, fetchData])

  // Handle numeric value change
  const handleNumericChange = useCallback(
    (readingTypeId: string, rawValue: string) => {
      setValues((prev) => {
        const updated = new Map(prev)
        const existing = updated.get(readingTypeId)
        if (existing) {
          updated.set(readingTypeId, {
            ...existing,
            numeric_value: rawValue === '' ? null : parseFloat(rawValue),
          })
        }
        return updated
      })
    },
    []
  )

  // Handle oil level change
  const handleOilLevelChange = useCallback(
    (readingTypeId: string, level: string) => {
      setValues((prev) => {
        const updated = new Map(prev)
        const existing = updated.get(readingTypeId)
        if (existing) {
          updated.set(readingTypeId, {
            ...existing,
            oil_level_value: level,
          })
        }
        return updated
      })
    },
    []
  )

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!equipmentInfo || !recordedAt) return

    // Validate that at least one value is provided
    const filledValues = Array.from(values.values()).filter(
      (v) => v.numeric_value != null || v.oil_level_value != null
    )

    if (filledValues.length === 0) {
      toast({ title: 'Please enter at least one reading value', variant: 'destructive' })
      return
    }

    setSaving(true)

    const result = await saveRefrigerationReading({
      equipment_id: equipmentInfo.id,
      recorded_at: new Date(recordedAt).toISOString(),
      notes: notes || undefined,
      values: filledValues.map((v) => ({
        reading_type_id: v.reading_type_id,
        numeric_value: v.numeric_value,
        oil_level_value: v.oil_level_value,
      })),
    })

    if (result.success) {
      toast({ title: 'Reading saved successfully', variant: 'success' })
      // Reset form
      const resetValues = new Map<string, ReadingValue>()
      for (const rt of readingTypes) {
        resetValues.set(rt.id, {
          reading_type_id: rt.id,
          numeric_value: null,
          oil_level_value: null,
        })
      }
      setValues(resetValues)
      setNotes('')
      const now = new Date()
      setRecordedAt(format(now, "yyyy-MM-dd'T'HH:mm"))
    } else {
      toast({ title: result.error ?? 'Failed to save reading', variant: 'destructive' })
    }

    setSaving(false)
  }, [equipmentInfo, recordedAt, notes, values, readingTypes, toast])

  if (authLoading || loading) {
    return <PageSkeleton />
  }

  if (!equipmentInfo) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <Link
          href="/refrigeration"
          className="inline-flex items-center gap-2 text-sm text-wolf-grey-dark hover:text-navy dark:text-wolf-grey dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Equipment
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Thermometer className="h-12 w-12 text-wolf-grey dark:text-wolf-grey-dark" />
            <h3 className="mt-4 text-lg font-semibold text-navy dark:text-white">
              Equipment Not Found
            </h3>
            <p className="mt-2 text-sm text-wolf-grey-dark dark:text-wolf-grey">
              This equipment may have been removed or you do not have access.
            </p>
          </CardContent>
        </Card>
      </div>
    )
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            {equipmentInfo.name}
          </h1>
          <Badge variant="secondary">{equipmentInfo.equipment_type}</Badge>
        </div>
        <p className="mt-1 text-sm text-wolf-grey-dark dark:text-wolf-grey">
          Record new equipment readings
        </p>
      </div>

      {/* Reading Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-navy dark:text-white">
            New Reading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {/* Reading Type Fields */}
          {readingTypes.length === 0 ? (
            <p className="text-sm text-wolf-grey-dark dark:text-wolf-grey italic">
              No reading types configured for this equipment. Ask your administrator to add them.
            </p>
          ) : (
            <div className="space-y-5">
              {readingTypes.map((rt) => {
                const currentValue = values.get(rt.id)
                const numericVal = currentValue?.numeric_value
                const oilVal = currentValue?.oil_level_value
                const outOfRange =
                  !rt.is_oil_level && isValueOutOfRange(numericVal ?? null, rt.min_threshold, rt.max_threshold)
                const oilOutOfRange = rt.is_oil_level && oilVal != null && oilVal !== 'ok'

                return (
                  <div key={rt.id} className="space-y-2">
                    <Label
                      htmlFor={`reading-${rt.id}`}
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      {rt.name}
                      <span className="text-wolf-grey-dark dark:text-wolf-grey font-normal">
                        ({rt.unit})
                      </span>
                      {rt.min_threshold != null && rt.max_threshold != null && !rt.is_oil_level && (
                        <span className="text-xs text-wolf-grey dark:text-wolf-grey-dark font-normal">
                          Range: {rt.min_threshold} - {rt.max_threshold}
                        </span>
                      )}
                    </Label>

                    {rt.is_oil_level ? (
                      <div className="max-w-xs">
                        <Select
                          value={oilVal ?? ''}
                          onValueChange={(v) => handleOilLevelChange(rt.id, v)}
                        >
                          <SelectTrigger
                            id={`reading-${rt.id}`}
                            className={cn(
                              oilOutOfRange && 'border-alert-red focus:ring-alert-red'
                            )}
                          >
                            <SelectValue placeholder="Select oil level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ok">OK</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="add">Add</SelectItem>
                          </SelectContent>
                        </Select>
                        {oilOutOfRange && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-alert-red font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            Oil level requires attention
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="max-w-xs">
                        <Input
                          id={`reading-${rt.id}`}
                          type="number"
                          step="any"
                          placeholder={`Enter ${rt.name.toLowerCase()}`}
                          value={numericVal != null ? numericVal : ''}
                          onChange={(e) => handleNumericChange(rt.id, e.target.value)}
                          className={cn(
                            outOfRange && 'border-alert-red focus-visible:ring-alert-red'
                          )}
                        />
                        {outOfRange && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-alert-red font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            Value is out of acceptable range
                            {rt.min_threshold != null && rt.max_threshold != null && (
                              <span className="font-normal">
                                ({rt.min_threshold} - {rt.max_threshold} {rt.unit})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    )}
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
              disabled={saving || readingTypes.length === 0}
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
