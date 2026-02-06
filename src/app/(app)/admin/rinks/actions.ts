'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// Schemas
// ============================================

const rinkSchema = z.object({
  name: z.string().min(1, 'Rink name is required').max(100),
  length_ft: z.number().positive('Length must be positive').max(500),
  width_ft: z.number().positive('Width must be positive').max(300),
  sort_order: z.number().int().min(0).default(0),
})

const depthPointSchema = z.object({
  point_number: z.number().int().positive(),
  x_percent: z.number().min(0).max(100),
  y_percent: z.number().min(0).max(100),
})

const depthPointsSchema = z.array(depthPointSchema).min(1, 'At least one depth point is required')

const depthThresholdsSchema = z.object({
  green_min: z.number().min(0),
  green_max: z.number().min(0),
  yellow_min: z.number().min(0),
  yellow_max: z.number().min(0),
  red_min: z.number().min(0),
  red_max: z.number().min(0),
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

export async function createRink(formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = rinkSchema.safeParse({
    name: formData.get('name'),
    length_ft: Number(formData.get('length_ft')),
    width_ft: Number(formData.get('width_ft')),
    sort_order: Number(formData.get('sort_order') ?? 0),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('rinks')
    .insert({
      facility_id: profile.facility_id,
      name: parsed.data.name,
      length_ft: parsed.data.length_ft,
      width_ft: parsed.data.width_ft,
      sort_order: parsed.data.sort_order,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/rinks')
  return { success: true }
}

export async function updateRink(id: string, formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idSchema = z.string().uuid()
  const idResult = idSchema.safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid rink ID' }

  const parsed = rinkSchema.safeParse({
    name: formData.get('name'),
    length_ft: Number(formData.get('length_ft')),
    width_ft: Number(formData.get('width_ft')),
    sort_order: Number(formData.get('sort_order') ?? 0),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('rinks')
    .update({
      name: parsed.data.name,
      length_ft: parsed.data.length_ft,
      width_ft: parsed.data.width_ft,
      sort_order: parsed.data.sort_order,
    })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/rinks')
  return { success: true }
}

export async function toggleRinkActive(id: string, isActive: boolean) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idSchema = z.string().uuid()
  const idResult = idSchema.safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid rink ID' }

  const parsed = z.boolean().safeParse(isActive)
  if (!parsed.success) return { success: false, error: 'Invalid isActive value' }

  const { error } = await supabase
    .from('rinks')
    .update({ is_active: parsed.data })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/rinks')
  return { success: true }
}

export async function saveDepthPoints(
  rinkId: string,
  points: { point_number: number; x_percent: number; y_percent: number }[]
) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idSchema = z.string().uuid()
  const idResult = idSchema.safeParse(rinkId)
  if (!idResult.success) return { success: false, error: 'Invalid rink ID' }

  const parsed = depthPointsSchema.safeParse(points)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  // Verify the rink belongs to this facility
  const { data: rink } = await supabase
    .from('rinks')
    .select('id')
    .eq('id', rinkId)
    .eq('facility_id', profile.facility_id)
    .single()

  if (!rink) return { success: false, error: 'Rink not found or access denied' }

  // Delete existing points for this rink
  const { error: deleteError } = await supabase
    .from('ice_depth_points')
    .delete()
    .eq('rink_id', rinkId)

  if (deleteError) return { success: false, error: deleteError.message }

  // Insert new points
  const insertData = parsed.data.map((point) => ({
    rink_id: rinkId,
    point_number: point.point_number,
    x_percent: point.x_percent,
    y_percent: point.y_percent,
  }))

  const { error: insertError } = await supabase
    .from('ice_depth_points')
    .insert(insertData)

  if (insertError) return { success: false, error: insertError.message }

  revalidatePath('/admin/rinks')
  return { success: true }
}

export async function saveDepthThresholds(data: {
  green_min: number
  green_max: number
  yellow_min: number
  yellow_max: number
  red_min: number
  red_max: number
}) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = depthThresholdsSchema.safeParse(data)
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

  revalidatePath('/admin/rinks')
  return { success: true }
}
