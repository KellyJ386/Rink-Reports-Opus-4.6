'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// Schemas
// ============================================

const dataRetentionSchema = z.object({
  data_retention_years: z.number().int().min(1, 'Must be at least 1 year').max(10, 'Maximum 10 years'),
  incident_retention_years: z.number().int().min(1, 'Must be at least 1 year').max(20, 'Maximum 20 years'),
  archive_mode: z.boolean(),
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

type DataRetentionInput = {
  data_retention_years: number
  incident_retention_years: number
  archive_mode: boolean
}

export async function updateDataRetention(input: FormData | DataRetentionInput) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const rawData = input instanceof FormData
    ? {
        data_retention_years: Number(input.get('data_retention_years')),
        incident_retention_years: Number(input.get('incident_retention_years')),
        archive_mode: input.get('archive_mode') === 'true',
      }
    : {
        data_retention_years: input.data_retention_years,
        incident_retention_years: input.incident_retention_years,
        archive_mode: input.archive_mode,
      }

  const parsed = dataRetentionSchema.safeParse(rawData)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') }
  }

  const { error } = await supabase
    .from('facilities')
    .update({
      data_retention_years: parsed.data.data_retention_years,
      incident_retention_years: parsed.data.incident_retention_years,
      archive_mode: parsed.data.archive_mode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/data-retention')
  return { success: true }
}
