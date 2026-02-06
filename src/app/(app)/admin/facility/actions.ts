'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// Schemas
// ============================================

const facilitySettingsSchema = z.object({
  name: z.string().min(1, 'Facility name is required').max(200),
  address: z.string().max(500).optional().nullable(),
  time_zone: z.string().min(1, 'Time zone is required'),
  seasonal_operation: z.boolean(),
  open_months: z.array(z.number().int().min(1).max(12)),
  session_duration_hours: z.number().int().min(1).max(24),
})

const DAY_OF_WEEK_MAP = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const

const operatingHourSchema = z.object({
  day_of_week: z.union([
    z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    z.number().int().min(0).max(6),
  ]),
  open_time: z.string().nullable(),
  close_time: z.string().nullable(),
  is_closed: z.boolean(),
})

const operatingHoursSchema = z.array(operatingHourSchema).length(7)

// ============================================
// Helper: Format Zod errors as a single string
// ============================================

function formatZodError(error: z.ZodError): string {
  return error.issues.map((e) => e.message).join(', ')
}

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

type FacilitySettingsInput = {
  name: string
  address?: string | null
  time_zone: string
  seasonal_operation: boolean
  open_months: number[]
  session_duration_hours: number
}

export async function updateFacilitySettings(input: FormData | FacilitySettingsInput) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  let rawData: Record<string, unknown>

  if (input instanceof FormData) {
    const rawOpenMonths = input.get('open_months')
    let openMonths: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    if (rawOpenMonths && typeof rawOpenMonths === 'string') {
      try {
        openMonths = JSON.parse(rawOpenMonths)
      } catch {
        return { success: false, error: 'Invalid open_months format' }
      }
    }
    rawData = {
      name: input.get('name'),
      address: input.get('address') || null,
      time_zone: input.get('time_zone'),
      seasonal_operation: input.get('seasonal_operation') === 'true',
      open_months: openMonths,
      session_duration_hours: Number(input.get('session_duration_hours')),
    }
  } else {
    rawData = {
      name: input.name,
      address: input.address ?? null,
      time_zone: input.time_zone,
      seasonal_operation: input.seasonal_operation,
      open_months: input.open_months,
      session_duration_hours: input.session_duration_hours,
    }
  }

  const parsed = facilitySettingsSchema.safeParse(rawData)

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) }
  }

  const { error } = await supabase
    .from('facilities')
    .update({
      name: parsed.data.name,
      address: parsed.data.address,
      time_zone: parsed.data.time_zone,
      seasonal_operation: parsed.data.seasonal_operation,
      open_months: parsed.data.open_months,
      session_duration_hours: parsed.data.session_duration_hours,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/facility')
  return { success: true }
}

export async function updateOperatingHours(
  data: { day_of_week: string | number; open_time: string | null; close_time: string | null; is_closed: boolean }[]
) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = operatingHoursSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) }
  }

  // Upsert all 7 days of operating hours, converting number indices to enum strings
  const upsertData = parsed.data.map((day) => {
    const dayStr = typeof day.day_of_week === 'number'
      ? DAY_OF_WEEK_MAP[day.day_of_week]
      : day.day_of_week

    return {
      facility_id: profile.facility_id,
      day_of_week: dayStr,
      open_time: day.is_closed ? null : day.open_time,
      close_time: day.is_closed ? null : day.close_time,
      is_closed: day.is_closed,
    }
  })

  const { error } = await supabase
    .from('operating_hours')
    .upsert(upsertData, { onConflict: 'facility_id,day_of_week' })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/facility')
  return { success: true }
}
