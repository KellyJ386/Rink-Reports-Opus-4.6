'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  updateIceDepthThresholds,
  updateReadingTypeThresholds,
  updateAirQualityThresholds,
} from './actions'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Gauge, Thermometer, Wind, Snowflake, Loader2 } from 'lucide-react'

// ============================================
// Types
// ============================================

interface DepthThresholds {
  green_min: number
  green_max: number
  yellow_min: number
  yellow_max: number
  red_min: number
  red_max: number
}

interface ReadingType {
  id: string
  name: string
  unit: string
  min_threshold: number | null
  max_threshold: number | null
}

interface Equipment {
  id: string
  name: string
  reading_types: ReadingType[]
}

interface AirQualityMetric {
  id: string
  name: string
  unit: string
  min_threshold: number | null
  max_threshold: number | null
}

const DEFAULT_THRESHOLDS: DepthThresholds = {
  green_min: 1.0,
  green_max: 1.74,
  yellow_min: 1.75,
  yellow_max: 3.5,
  red_min: 0.0,
  red_max: 0.99,
}

// ============================================
// Component
// ============================================

export default function ThresholdsPage() {
  const { toast } = useToast()
  const supabase = createClient()

  // Data state
  const [depthThresholds, setDepthThresholds] = useState<DepthThresholds>(DEFAULT_THRESHOLDS)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [airMetrics, setAirMetrics] = useState<AirQualityMetric[]>([])
  const [loading, setLoading] = useState(true)

  // Saving state
  const [savingDepth, setSavingDepth] = useState(false)
  const [savingEquipmentId, setSavingEquipmentId] = useState<string | null>(null)
  const [savingAir, setSavingAir] = useState(false)

  // ============================================
  // Fetch data
  // ============================================

  async function fetchData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('facility_id')
        .eq('id', user.id)
        .single()

      if (!profile?.facility_id) return

      // Fetch ice depth thresholds
      const { data: depthData } = await supabase
        .from('ice_depth_thresholds')
        .select('green_min, green_max, yellow_min, yellow_max, red_min, red_max')
        .eq('facility_id', profile.facility_id)
        .single()

      if (depthData) {
        setDepthThresholds(depthData)
      }

      // Fetch equipment with reading types
      const { data: equipData } = await supabase
        .from('equipment')
        .select(`
          id,
          name,
          equipment_reading_types (
            id,
            name,
            unit,
            min_threshold,
            max_threshold
          )
        `)
        .eq('facility_id', profile.facility_id)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (equipData) {
        const mapped: Equipment[] = equipData.map((e) => ({
          id: e.id,
          name: e.name,
          reading_types: (e.equipment_reading_types as ReadingType[]) || [],
        }))
        setEquipment(mapped)
      }

      // Fetch air quality metrics
      const { data: airData } = await supabase
        .from('air_quality_metrics')
        .select('id, name, unit, min_threshold, max_threshold')
        .eq('facility_id', profile.facility_id)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (airData) {
        setAirMetrics(airData)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load threshold data.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============================================
  // Ice Depth Threshold handlers
  // ============================================

  function updateDepthField(field: keyof DepthThresholds, value: string) {
    const num = parseFloat(value)
    if (!isNaN(num) || value === '') {
      setDepthThresholds((prev) => ({
        ...prev,
        [field]: value === '' ? 0 : num,
      }))
    }
  }

  async function handleSaveDepthThresholds() {
    setSavingDepth(true)
    try {
      const formData = new FormData()
      formData.set('green_min', String(depthThresholds.green_min))
      formData.set('green_max', String(depthThresholds.green_max))
      formData.set('yellow_min', String(depthThresholds.yellow_min))
      formData.set('yellow_max', String(depthThresholds.yellow_max))
      formData.set('red_min', String(depthThresholds.red_min))
      formData.set('red_max', String(depthThresholds.red_max))

      const result = await updateIceDepthThresholds(formData)

      if (result.success) {
        toast({ title: 'Saved', description: 'Ice depth thresholds updated.', variant: 'success' })
      } else {
        const errorMsg = typeof result.error === 'string' ? result.error : 'Validation failed.'
        toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' })
    } finally {
      setSavingDepth(false)
    }
  }

  // ============================================
  // Refrigeration threshold handlers
  // ============================================

  function updateReadingType(
    equipmentId: string,
    readingTypeId: string,
    field: 'min_threshold' | 'max_threshold',
    value: string
  ) {
    setEquipment((prev) =>
      prev.map((e) => {
        if (e.id !== equipmentId) return e
        return {
          ...e,
          reading_types: e.reading_types.map((rt) => {
            if (rt.id !== readingTypeId) return rt
            const num = parseFloat(value)
            return {
              ...rt,
              [field]: value === '' ? null : isNaN(num) ? rt[field] : num,
            }
          }),
        }
      })
    )
  }

  async function handleSaveEquipmentThresholds(equip: Equipment) {
    setSavingEquipmentId(equip.id)
    try {
      // Save each reading type individually using the server action
      for (const rt of equip.reading_types) {
        const formData = new FormData()
        formData.set('min_threshold', rt.min_threshold !== null ? String(rt.min_threshold) : '')
        formData.set('max_threshold', rt.max_threshold !== null ? String(rt.max_threshold) : '')

        const result = await updateReadingTypeThresholds(rt.id, formData)
        if (!result.success) {
          const errorMsg = typeof result.error === 'string' ? result.error : 'Save failed.'
          toast({ title: 'Error', description: `Failed to save ${rt.name}: ${errorMsg}`, variant: 'destructive' })
          setSavingEquipmentId(null)
          return
        }
      }

      toast({
        title: 'Saved',
        description: `Thresholds for "${equip.name}" updated.`,
        variant: 'success',
      })
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' })
    } finally {
      setSavingEquipmentId(null)
    }
  }

  // ============================================
  // Air Quality threshold handlers
  // ============================================

  function updateAirMetric(
    metricId: string,
    field: 'min_threshold' | 'max_threshold',
    value: string
  ) {
    setAirMetrics((prev) =>
      prev.map((m) => {
        if (m.id !== metricId) return m
        const num = parseFloat(value)
        return {
          ...m,
          [field]: value === '' ? null : isNaN(num) ? m[field] : num,
        }
      })
    )
  }

  async function handleSaveAirThresholds() {
    setSavingAir(true)
    try {
      for (const metric of airMetrics) {
        const formData = new FormData()
        formData.set('min_threshold', metric.min_threshold !== null ? String(metric.min_threshold) : '')
        formData.set('max_threshold', metric.max_threshold !== null ? String(metric.max_threshold) : '')

        const result = await updateAirQualityThresholds(metric.id, formData)
        if (!result.success) {
          const errorMsg = typeof result.error === 'string' ? result.error : 'Save failed.'
          toast({ title: 'Error', description: `Failed to save ${metric.name}: ${errorMsg}`, variant: 'destructive' })
          setSavingAir(false)
          return
        }
      }

      toast({ title: 'Saved', description: 'Air quality thresholds updated.', variant: 'success' })
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' })
    } finally {
      setSavingAir(false)
    }
  }

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-navy dark:text-action-green" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Threshold Configuration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set acceptable ranges and alert thresholds for all monitored readings.
        </p>
      </div>

      {/* ============================================ */}
      {/* Section 1: Ice Depth Thresholds */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-navy dark:text-white">
            <Snowflake className="h-5 w-5" />
            Ice Depth Thresholds
          </CardTitle>
          <CardDescription>
            Define acceptable ice depth ranges (in inches) for measurement readings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Green - Good */}
          <div className="rounded-lg border-l-4 border-l-action-green bg-action-green/5 p-4 dark:bg-action-green/10">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-action-green" />
              <span className="font-medium text-navy dark:text-white">Green (Good)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="depth-green-min" className="text-xs text-muted-foreground">Min (inches)</Label>
                <Input
                  id="depth-green-min"
                  type="number"
                  step="0.01"
                  min="0"
                  value={depthThresholds.green_min}
                  onChange={(e) => updateDepthField('green_min', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="depth-green-max" className="text-xs text-muted-foreground">Max (inches)</Label>
                <Input
                  id="depth-green-max"
                  type="number"
                  step="0.01"
                  min="0"
                  value={depthThresholds.green_max}
                  onChange={(e) => updateDepthField('green_max', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Yellow - Caution */}
          <div className="rounded-lg border-l-4 border-l-alert-yellow bg-alert-yellow/5 p-4 dark:bg-alert-yellow/10">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-alert-yellow" />
              <span className="font-medium text-navy dark:text-white">Yellow (Caution)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="depth-yellow-min" className="text-xs text-muted-foreground">Min (inches)</Label>
                <Input
                  id="depth-yellow-min"
                  type="number"
                  step="0.01"
                  min="0"
                  value={depthThresholds.yellow_min}
                  onChange={(e) => updateDepthField('yellow_min', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="depth-yellow-max" className="text-xs text-muted-foreground">Max (inches)</Label>
                <Input
                  id="depth-yellow-max"
                  type="number"
                  step="0.01"
                  min="0"
                  value={depthThresholds.yellow_max}
                  onChange={(e) => updateDepthField('yellow_max', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Red - Critical */}
          <div className="rounded-lg border-l-4 border-l-alert-red bg-alert-red/5 p-4 dark:bg-alert-red/10">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-alert-red" />
              <span className="font-medium text-navy dark:text-white">Red (Critical)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="depth-red-min" className="text-xs text-muted-foreground">Min (inches)</Label>
                <Input
                  id="depth-red-min"
                  type="number"
                  step="0.01"
                  min="0"
                  value={depthThresholds.red_min}
                  onChange={(e) => updateDepthField('red_min', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="depth-red-max" className="text-xs text-muted-foreground">Max (inches)</Label>
                <Input
                  id="depth-red-max"
                  type="number"
                  step="0.01"
                  min="0"
                  value={depthThresholds.red_max}
                  onChange={(e) => updateDepthField('red_max', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveDepthThresholds}
            disabled={savingDepth}
            className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]"
          >
            {savingDepth && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Ice Depth Thresholds
          </Button>
        </CardFooter>
      </Card>

      <Separator />

      {/* ============================================ */}
      {/* Section 2: Refrigeration Thresholds */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-navy dark:text-white">
            <Thermometer className="h-5 w-5" />
            Refrigeration Thresholds
          </CardTitle>
          <CardDescription>
            Set min/max threshold ranges for each equipment reading type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {equipment.length === 0 ? (
            <div className="rounded-lg border border-dashed border-wolf-grey p-6 text-center">
              <Thermometer className="mx-auto h-10 w-10 text-wolf-grey" />
              <p className="mt-3 text-sm text-muted-foreground">
                No equipment configured. Add equipment in the Equipment Setup page first.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {equipment.map((equip, equipIdx) => (
                <div key={equip.id}>
                  {equipIdx > 0 && <Separator className="mb-6" />}
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold text-navy dark:text-white">{equip.name}</h3>
                    <Button
                      size="sm"
                      onClick={() => handleSaveEquipmentThresholds(equip)}
                      disabled={savingEquipmentId === equip.id || equip.reading_types.length === 0}
                      className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px] sm:min-h-0"
                    >
                      {savingEquipmentId === equip.id && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save
                    </Button>
                  </div>

                  {equip.reading_types.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No reading types defined for this equipment.
                    </p>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Reading Type</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead>Min Threshold</TableHead>
                              <TableHead>Max Threshold</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {equip.reading_types.map((rt) => (
                              <TableRow key={rt.id}>
                                <TableCell className="font-medium">{rt.name}</TableCell>
                                <TableCell className="text-muted-foreground">{rt.unit}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    className="w-28"
                                    value={rt.min_threshold ?? ''}
                                    placeholder="--"
                                    onChange={(e) =>
                                      updateReadingType(equip.id, rt.id, 'min_threshold', e.target.value)
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    className="w-28"
                                    value={rt.max_threshold ?? ''}
                                    placeholder="--"
                                    onChange={(e) =>
                                      updateReadingType(equip.id, rt.id, 'max_threshold', e.target.value)
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="flex flex-col gap-3 md:hidden">
                        {equip.reading_types.map((rt) => (
                          <Card key={rt.id} className="p-4">
                            <div className="mb-3">
                              <p className="font-medium text-navy dark:text-white">{rt.name}</p>
                              <p className="text-xs text-muted-foreground">{rt.unit}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Min</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={rt.min_threshold ?? ''}
                                  placeholder="--"
                                  onChange={(e) =>
                                    updateReadingType(equip.id, rt.id, 'min_threshold', e.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Max</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={rt.max_threshold ?? ''}
                                  placeholder="--"
                                  onChange={(e) =>
                                    updateReadingType(equip.id, rt.id, 'max_threshold', e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* ============================================ */}
      {/* Section 3: Air Quality Thresholds */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-navy dark:text-white">
            <Wind className="h-5 w-5" />
            Air Quality Thresholds
          </CardTitle>
          <CardDescription>
            Set min/max threshold ranges for air quality monitoring metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {airMetrics.length === 0 ? (
            <div className="rounded-lg border border-dashed border-wolf-grey p-6 text-center">
              <Wind className="mx-auto h-10 w-10 text-wolf-grey" />
              <p className="mt-3 text-sm text-muted-foreground">
                No metrics configured. Add air quality metrics in the module settings first.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Min Threshold</TableHead>
                      <TableHead>Max Threshold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {airMetrics.map((metric) => (
                      <TableRow key={metric.id}>
                        <TableCell className="font-medium">{metric.name}</TableCell>
                        <TableCell className="text-muted-foreground">{metric.unit}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            className="w-28"
                            value={metric.min_threshold ?? ''}
                            placeholder="--"
                            onChange={(e) =>
                              updateAirMetric(metric.id, 'min_threshold', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            className="w-28"
                            value={metric.max_threshold ?? ''}
                            placeholder="--"
                            onChange={(e) =>
                              updateAirMetric(metric.id, 'max_threshold', e.target.value)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {airMetrics.map((metric) => (
                  <Card key={metric.id} className="p-4">
                    <div className="mb-3">
                      <p className="font-medium text-navy dark:text-white">{metric.name}</p>
                      <p className="text-xs text-muted-foreground">{metric.unit}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={metric.min_threshold ?? ''}
                          placeholder="--"
                          onChange={(e) =>
                            updateAirMetric(metric.id, 'min_threshold', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={metric.max_threshold ?? ''}
                          placeholder="--"
                          onChange={(e) =>
                            updateAirMetric(metric.id, 'max_threshold', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
        {airMetrics.length > 0 && (
          <CardFooter>
            <Button
              onClick={handleSaveAirThresholds}
              disabled={savingAir}
              className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]"
            >
              {savingAir && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Air Quality Thresholds
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
