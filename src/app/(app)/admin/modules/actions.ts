'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// Schemas
// ============================================

const moduleIdSchema = z.enum([
  'daily_reports', 'ice_depth', 'ice_operations', 'scheduling',
  'incidents', 'refrigeration', 'air_quality', 'admin',
])

const roleSchema = z.enum([
  'facility_admin', 'manager', 'supervisor', 'staff', 'read_only',
])

const moduleRolesSchema = z.array(roleSchema).min(1, 'At least one role must be selected')

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

export async function toggleModule(module: string, isEnabled: boolean) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsedModule = moduleIdSchema.safeParse(module)
  if (!parsedModule.success) return { success: false, error: 'Invalid module identifier' }

  const parsedEnabled = z.boolean().safeParse(isEnabled)
  if (!parsedEnabled.success) return { success: false, error: 'Invalid isEnabled value' }

  const { error } = await supabase
    .from('module_settings')
    .update({ is_enabled: parsedEnabled.data })
    .eq('facility_id', profile.facility_id)
    .eq('module', parsedModule.data)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/modules')
  return { success: true }
}

export async function updateModuleRoles(module: string, allowedRoles: string[]) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsedModule = moduleIdSchema.safeParse(module)
  if (!parsedModule.success) return { success: false, error: 'Invalid module identifier' }

  const parsedRoles = moduleRolesSchema.safeParse(allowedRoles)
  if (!parsedRoles.success) {
    return { success: false, error: parsedRoles.error.flatten().formErrors }
  }

  const { error } = await supabase
    .from('module_settings')
    .update({ allowed_roles: parsedRoles.data })
    .eq('facility_id', profile.facility_id)
    .eq('module', parsedModule.data)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/modules')
  return { success: true }
}
