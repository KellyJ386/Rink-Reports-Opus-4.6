'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

async function getAuthProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, profile: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) return { supabase, profile: null, error: 'Profile not found' }

  return { supabase, profile, error: null, userId: user.id }
}

const readingValueSchema = z.object({
  metric_id: z.string().uuid(),
  value: z.number(),
})

const airQualityReadingSchema = z.object({
  location_id: z.string().uuid().nullable(),
  recorded_at: z.string(),
  notes: z.string().optional(),
  values: z.array(readingValueSchema).min(1),
})

export async function saveAirQualityReading(data: {
  location_id: string | null
  recorded_at: string
  notes?: string
  values: Array<{ metric_id: string; value: number }>
}) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = airQualityReadingSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid reading data' }

  // Insert the main reading record
  const { data: reading, error: readingError } = await supabase
    .from('air_quality_readings')
    .insert({
      facility_id: profile.facility_id,
      location_id: parsed.data.location_id,
      recorded_by: userId,
      recorded_at: parsed.data.recorded_at,
      notes: parsed.data.notes || null,
    })
    .select('id')
    .single()

  if (readingError || !reading) {
    return { success: false, error: readingError?.message ?? 'Failed to create reading' }
  }

  // Fetch thresholds for all metrics in one query
  const metricIds = parsed.data.values.map((v) => v.metric_id)
  const { data: metrics } = await supabase
    .from('air_quality_metrics')
    .select('id, min_threshold, max_threshold')
    .in('id', metricIds)

  const thresholdMap = new Map<string, { min: number | null; max: number | null }>()
  if (metrics) {
    for (const m of metrics) {
      thresholdMap.set(m.id, {
        min: m.min_threshold,
        max: m.max_threshold,
      })
    }
  }

  // Build reading values with out-of-range detection
  let hasOutOfRange = false
  const readingValues = parsed.data.values.map((v) => {
    const thresholds = thresholdMap.get(v.metric_id)
    let isOutOfRange = false

    if (thresholds) {
      if (thresholds.min != null && v.value < thresholds.min) {
        isOutOfRange = true
      }
      if (thresholds.max != null && v.value > thresholds.max) {
        isOutOfRange = true
      }
    }

    if (isOutOfRange) hasOutOfRange = true

    return {
      reading_id: reading.id,
      metric_id: v.metric_id,
      value: v.value,
      is_out_of_range: isOutOfRange,
    }
  })

  // Insert all reading values
  const { error: valuesError } = await supabase
    .from('air_quality_reading_values')
    .insert(readingValues)

  if (valuesError) {
    return { success: false, error: valuesError.message }
  }

  // Create alert if any out-of-range values
  if (hasOutOfRange) {
    await supabase.from('active_alerts').insert({
      facility_id: profile.facility_id,
      module: 'air_quality',
      alert_type: 'out_of_range',
      reference_id: reading.id,
      message: 'Air quality reading has out-of-range values',
      is_acknowledged: false,
    })
  }

  revalidatePath('/air-quality')
  return { success: true }
}

const complianceReportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
})

export async function generateComplianceReport(data: {
  start_date: string
  end_date: string
}): Promise<{ success: boolean; csv?: string; totalReadings?: number; exceedances?: number; error?: string }> {
  const { supabase, profile, error: authError } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError ?? 'Not authenticated' }

  const parsed = complianceReportSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid date range' }

  // Fetch all metrics for headers
  const { data: metrics } = await supabase
    .from('air_quality_metrics')
    .select('id, name, unit')
    .eq('facility_id', profile.facility_id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (!metrics || metrics.length === 0) {
    return { success: false, error: 'No metrics configured' }
  }

  // Fetch locations
  const { data: locations } = await supabase
    .from('air_quality_locations')
    .select('id, name')
    .eq('facility_id', profile.facility_id)

  const locationMap = new Map<string, string>()
  for (const loc of locations ?? []) {
    locationMap.set(loc.id, loc.name)
  }

  // Fetch readings in date range
  const { data: readings } = await supabase
    .from('air_quality_readings')
    .select('id, location_id, recorded_at, recorded_by, notes, profiles(full_name)')
    .eq('facility_id', profile.facility_id)
    .gte('recorded_at', `${parsed.data.start_date}T00:00:00`)
    .lte('recorded_at', `${parsed.data.end_date}T23:59:59`)
    .order('recorded_at', { ascending: true })

  if (!readings || readings.length === 0) {
    return { success: true, csv: '', totalReadings: 0, exceedances: 0 }
  }

  // Fetch all values for these readings
  const readingIds = readings.map((r) => r.id)
  const { data: allValues } = await supabase
    .from('air_quality_reading_values')
    .select('reading_id, metric_id, value, is_out_of_range')
    .in('reading_id', readingIds)

  // Build CSV
  const headers = [
    'Date/Time',
    'Location',
    'Recorded By',
    ...metrics.map((m) => `${m.name} (${m.unit})`),
    'Out of Range',
    'Notes',
  ]

  let totalExceedances = 0
  const rows: string[][] = []

  for (const r of readings as unknown as Array<{
    id: string
    location_id: string | null
    recorded_at: string
    recorded_by: string
    notes: string | null
    profiles: { full_name: string } | null
  }>) {
    const rowValues = (allValues ?? []).filter((v) => v.reading_id === r.id)
    const oorValues = rowValues.filter((v) => v.is_out_of_range)
    if (oorValues.length > 0) totalExceedances += oorValues.length

    const row: string[] = [
      format(new Date(r.recorded_at), 'yyyy-MM-dd HH:mm'),
      r.location_id ? (locationMap.get(r.location_id) ?? 'Unknown') : 'N/A',
      r.profiles?.full_name ?? 'Unknown',
      ...metrics.map((m) => {
        const val = rowValues.find((v) => v.metric_id === m.id)
        return val ? val.value.toString() : ''
      }),
      oorValues.length > 0 ? 'Yes' : 'No',
      r.notes ? `"${r.notes.replace(/"/g, '""')}"` : '',
    ]

    rows.push(row)
  }

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  return {
    success: true,
    csv: csvContent,
    totalReadings: readings.length,
    exceedances: totalExceedances,
  }
}

// Helper to format dates in server action (date-fns not available server-side in the same way)
function format(date: Date, formatStr: string): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  if (formatStr === 'yyyy-MM-dd HH:mm') {
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  return `${year}-${month}-${day}`
}
