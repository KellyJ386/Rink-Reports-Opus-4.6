'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Auth helper
async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, profile: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return { supabase, profile: null, error: 'Profile not found' }
  return { supabase, profile, error: null, userId: user.id }
}

// Validation schemas
const ReportTypeSchema = z.enum([
  'checklist_summary',
  'measurement_history',
  'ice_makes_log',
  'hours_by_employee',
  'incident_log',
  'reading_history',
  'compliance_report'
])

const UpsertSettingSchema = z.object({
  id: z.string().uuid().optional(),
  report_type: ReportTypeSchema,
  is_enabled: z.boolean(),
  recipients: z.array(z.string().uuid()),
  delivery_hour: z.number().int().min(0).max(23)
})

type UpsertSettingInput = z.infer<typeof UpsertSettingSchema>

/**
 * Fetch all scheduled report settings for the user's facility
 */
export async function getScheduledReportSettings() {
  const { supabase, profile, error } = await getAuthProfile()
  if (error || !profile) {
    return { success: false, error: error || 'Unauthorized', data: null }
  }

  const { data, error: fetchError } = await supabase
    .from('scheduled_report_settings')
    .select('*')
    .eq('facility_id', profile.facility_id)
    .order('report_type')

  if (fetchError) {
    return { success: false, error: fetchError.message, data: null }
  }

  return { success: true, data, error: null }
}

/**
 * Create or update a scheduled report setting
 */
export async function upsertScheduledReportSetting(input: UpsertSettingInput) {
  const { supabase, profile, error } = await getAuthProfile()
  if (error || !profile) {
    return { success: false, error: error || 'Unauthorized' }
  }

  // Validate input
  const parsed = UpsertSettingSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid input',
      details: parsed.error.flatten()
    }
  }

  const { id, ...settingData } = parsed.data

  // If ID is provided, update; otherwise, insert
  if (id) {
    const { error: updateError } = await supabase
      .from('scheduled_report_settings')
      .update({
        ...settingData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('facility_id', profile.facility_id) // Ensure facility isolation

    if (updateError) {
      return { success: false, error: updateError.message }
    }
  } else {
    // Use upsert to handle the unique constraint on (facility_id, report_type)
    const { error: upsertError } = await supabase
      .from('scheduled_report_settings')
      .upsert({
        facility_id: profile.facility_id,
        ...settingData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'facility_id,report_type'
      })

    if (upsertError) {
      return { success: false, error: upsertError.message }
    }
  }

  revalidatePath('/admin/scheduled-reports')
  return { success: true, error: null }
}

/**
 * Toggle a scheduled report on/off
 */
export async function toggleScheduledReport(id: string, isEnabled: boolean) {
  const { supabase, profile, error } = await getAuthProfile()
  if (error || !profile) {
    return { success: false, error: error || 'Unauthorized' }
  }

  // Validate ID
  const idSchema = z.string().uuid()
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return { success: false, error: 'Invalid report ID' }
  }

  const { error: updateError } = await supabase
    .from('scheduled_report_settings')
    .update({
      is_enabled: isEnabled,
      updated_at: new Date().toISOString()
    })
    .eq('id', parsedId.data)
    .eq('facility_id', profile.facility_id) // Ensure facility isolation

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath('/admin/scheduled-reports')
  return { success: true, error: null }
}

/**
 * Get all profiles in the facility for recipient selection
 */
export async function getFacilityProfiles() {
  const { supabase, profile, error } = await getAuthProfile()
  if (error || !profile) {
    return { success: false, error: error || 'Unauthorized', data: null }
  }

  const { data, error: fetchError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, is_active')
    .eq('facility_id', profile.facility_id)
    .eq('is_active', true)
    .order('last_name', { ascending: true })

  if (fetchError) {
    return { success: false, error: fetchError.message, data: null }
  }

  return { success: true, data, error: null }
}
