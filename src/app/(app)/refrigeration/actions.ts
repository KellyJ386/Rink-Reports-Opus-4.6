'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendNotification, getManagerRecipients } from '@/lib/services/notifications'

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
  reading_type_id: z.string().uuid(),
  numeric_value: z.number().nullable().optional(),
  oil_level_value: z.enum(['ok', 'low', 'add']).nullable().optional(),
})

const refrigerationReadingSchema = z.object({
  equipment_id: z.string().uuid(),
  recorded_at: z.string(),
  notes: z.string().optional(),
  values: z.array(readingValueSchema).min(1),
})

export async function saveRefrigerationReading(data: {
  equipment_id: string
  recorded_at: string
  notes?: string
  values: Array<{
    reading_type_id: string
    numeric_value?: number | null
    oil_level_value?: string | null
  }>
}) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = refrigerationReadingSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid reading data' }

  // Insert the main reading record
  const { data: reading, error: readingError } = await supabase
    .from('refrigeration_readings')
    .insert({
      facility_id: profile.facility_id,
      equipment_id: parsed.data.equipment_id,
      recorded_by: userId,
      recorded_at: parsed.data.recorded_at,
      notes: parsed.data.notes || null,
    })
    .select('id')
    .single()

  if (readingError || !reading) {
    return { success: false, error: readingError?.message ?? 'Failed to create reading' }
  }

  // Fetch thresholds for all reading types in one query
  const readingTypeIds = parsed.data.values.map((v) => v.reading_type_id)
  const { data: readingTypes } = await supabase
    .from('equipment_reading_types')
    .select('id, min_threshold, max_threshold, is_oil_level')
    .in('id', readingTypeIds)

  const thresholdMap = new Map<string, { min: number | null; max: number | null; is_oil_level: boolean }>()
  if (readingTypes) {
    for (const rt of readingTypes) {
      thresholdMap.set(rt.id, {
        min: rt.min_threshold,
        max: rt.max_threshold,
        is_oil_level: rt.is_oil_level,
      })
    }
  }

  // Build reading values with out-of-range detection
  let hasOutOfRange = false
  const readingValues = parsed.data.values.map((v) => {
    const thresholds = thresholdMap.get(v.reading_type_id)
    let isOutOfRange = false

    if (thresholds && !thresholds.is_oil_level && v.numeric_value != null) {
      if (thresholds.min != null && v.numeric_value < thresholds.min) {
        isOutOfRange = true
      }
      if (thresholds.max != null && v.numeric_value > thresholds.max) {
        isOutOfRange = true
      }
    }

    // Oil level: "low" and "add" are considered out of range
    if (thresholds?.is_oil_level && v.oil_level_value && v.oil_level_value !== 'ok') {
      isOutOfRange = true
    }

    if (isOutOfRange) hasOutOfRange = true

    return {
      reading_id: reading.id,
      reading_type_id: v.reading_type_id,
      numeric_value: v.numeric_value ?? null,
      oil_level_value: v.oil_level_value ?? null,
      is_out_of_range: isOutOfRange,
    }
  })

  // Insert all reading values
  const { error: valuesError } = await supabase
    .from('refrigeration_reading_values')
    .insert(readingValues)

  if (valuesError) {
    return { success: false, error: valuesError.message }
  }

  // Create alert if any out-of-range values
  if (hasOutOfRange) {
    await supabase.from('active_alerts').insert({
      facility_id: profile.facility_id,
      module: 'refrigeration',
      alert_type: 'out_of_range',
      reference_id: reading.id,
      message: 'Refrigeration reading has out-of-range values',
      is_acknowledged: false,
    })

    // Notify managers about out-of-range reading
    getManagerRecipients(profile.facility_id).then((managers) => {
      if (managers.length > 0) {
        sendNotification({
          facilityId: profile.facility_id,
          recipientIds: managers,
          title: 'Refrigeration: Out-of-Range Reading',
          body: 'A refrigeration reading has values outside the configured thresholds. Immediate attention may be required.',
          link: '/refrigeration/history',
          triggerType: 'out_of_range',
        }).catch(() => {})
      }
    })
  }

  revalidatePath('/refrigeration')
  return { success: true }
}
