'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// Schemas
// ============================================

const iceDepthThresholdsSchema = z.object({
  green_min: z.number().min(0, 'Must be >= 0'),
  green_max: z.number().min(0, 'Must be >= 0'),
  yellow_min: z.number().min(0, 'Must be >= 0'),
  yellow_max: z.number().min(0, 'Must be >= 0'),
  red_min: z.number().min(0, 'Must be >= 0'),
  red_max: z.number().min(0, 'Must be >= 0'),
})

const readingTypeThresholdsSchema = z.object({
  min_threshold: z.number().nullable(),
  max_threshold: z.number().nullable(),
})

const airQualityThresholdsSchema = z.object({
  min_threshold: z.number().nullable(),
  max_threshold: z.number().nullable(),
})

// ============================================
// Helper: Get authenticated user profile
// ============================================

async function getAuthenticatedProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, profile: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return { supabase, profile: null, error: 'Profile not found' }
  if (profile.role !== 'facility_admin' && profile.role !== 'super_admin') {
    return { supabase, profile: null, error: 'Insufficient permissions' }
  }

  return { supabase, profile, error: null }
}

// ============================================
// Actions
// ============================================

export async function updateIceDepthThresholds(formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = iceDepthThresholdsSchema.safeParse({
    green_min: Number(formData.get('green_min')),
    green_max: Number(formData.get('green_max')),
    yellow_min: Number(formData.get('yellow_min')),
    yellow_max: Number(formData.get('yellow_max')),
    red_min: Number(formData.get('red_min')),
    red_max: Number(formData.get('red_max')),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('ice_depth_thresholds')
    .upsert(
      {
        facility_id: profile.facility_id,
        green_min: parsed.data.green_min,
        green_max: parsed.data.green_max,
        yellow_min: parsed.data.yellow_min,
        yellow_max: parsed.data.yellow_max,
        red_min: parsed.data.red_min,
        red_max: parsed.data.red_max,
      },
      { onConflict: 'facility_id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/thresholds')
  return { success: true }
}

export async function updateReadingTypeThresholds(id: string, formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid reading type ID' }

  const minVal = formData.get('min_threshold')
  const maxVal = formData.get('max_threshold')

  const parsed = readingTypeThresholdsSchema.safeParse({
    min_threshold: minVal !== null && minVal !== '' ? Number(minVal) : null,
    max_threshold: maxVal !== null && maxVal !== '' ? Number(maxVal) : null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  // Verify the reading type belongs to equipment in this facility
  const { data: readingType } = await supabase
    .from('equipment_reading_types')
    .select('id, equipment:equipment!inner(facility_id)')
    .eq('id', id)
    .single()

  if (!readingType) return { success: false, error: 'Reading type not found' }

  const equipData = readingType.equipment as unknown as { facility_id: string }
  if (equipData.facility_id !== profile.facility_id) {
    return { success: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('equipment_reading_types')
    .update({
      min_threshold: parsed.data.min_threshold,
      max_threshold: parsed.data.max_threshold,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/thresholds')
  return { success: true }
}

export async function updateAirQualityThresholds(id: string, formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid air quality metric ID' }

  const minVal = formData.get('min_threshold')
  const maxVal = formData.get('max_threshold')

  const parsed = airQualityThresholdsSchema.safeParse({
    min_threshold: minVal !== null && minVal !== '' ? Number(minVal) : null,
    max_threshold: maxVal !== null && maxVal !== '' ? Number(maxVal) : null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('air_quality_metrics')
    .update({
      min_threshold: parsed.data.min_threshold,
      max_threshold: parsed.data.max_threshold,
    })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/thresholds')
  return { success: true }
}
