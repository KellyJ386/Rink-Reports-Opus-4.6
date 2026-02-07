'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// Helper: Get authenticated user profile
// ============================================

async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, profile: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) return { supabase, profile: null, error: 'Profile not found' }

  return { supabase, profile, error: null, userId: user.id }
}

// ============================================
// Schemas
// ============================================

const iceMakeSchema = z.object({
  rink_id: z.string().uuid('Invalid rink'),
  machine_id: z.string().uuid('Invalid machine'),
  event_time: z.string().min(1, 'Event time is required'),
  machine_hours: z.number().min(0, 'Machine hours must be 0 or greater').nullable().optional(),
  ice_taken: z.number().min(0, 'Ice taken must be 0 or greater').nullable().optional(),
  water_used: z.number().min(0, 'Water used must be 0 or greater').nullable().optional(),
  notes: z.string().max(2000).optional(),
})

const bladeChangeSchema = z.object({
  machine_id: z.string().uuid('Invalid machine'),
  event_time: z.string().min(1, 'Event time is required'),
  notes: z.string().max(2000).optional(),
})

const edgingLogSchema = z.object({
  rink_id: z.string().uuid('Invalid rink'),
  event_time: z.string().min(1, 'Event time is required'),
  notes: z.string().max(2000).optional(),
})

const circleCheckResultSchema = z.object({
  check_item_id: z.string().uuid('Invalid check item'),
  passed: z.boolean(),
  fail_notes: z.string().max(2000).optional().nullable(),
})

const circleCheckSchema = z.object({
  machine_id: z.string().uuid('Invalid machine'),
  event_time: z.string().min(1, 'Event time is required'),
  notes: z.string().max(2000).optional(),
  results: z.array(circleCheckResultSchema).min(1, 'At least one check item is required'),
})

// ============================================
// Ice Make Action
// ============================================

export async function createIceMake(data: {
  rink_id: string
  machine_id: string
  event_time: string
  machine_hours: number | null
  ice_taken: number | null
  water_used: number | null
  notes?: string
}) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile || !userId) return { success: false, error: authError }

  const parsed = iceMakeSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('ice_makes')
    .insert({
      facility_id: profile.facility_id,
      rink_id: parsed.data.rink_id,
      machine_id: parsed.data.machine_id,
      operator_id: userId,
      event_time: parsed.data.event_time,
      machine_hours: parsed.data.machine_hours ?? null,
      ice_taken: parsed.data.ice_taken ?? null,
      water_used: parsed.data.water_used ?? null,
      notes: parsed.data.notes || null,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/ice-operations')
  return { success: true }
}

// ============================================
// Blade Change Action
// ============================================

export async function createBladeChange(data: {
  machine_id: string
  event_time: string
  notes?: string
}) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile || !userId) return { success: false, error: authError }

  const parsed = bladeChangeSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('blade_changes')
    .insert({
      facility_id: profile.facility_id,
      machine_id: parsed.data.machine_id,
      operator_id: userId,
      event_time: parsed.data.event_time,
      notes: parsed.data.notes || null,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/ice-operations')
  return { success: true }
}

// ============================================
// Edging Log Action
// ============================================

export async function createEdgingLog(data: {
  rink_id: string
  event_time: string
  notes?: string
}) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile || !userId) return { success: false, error: authError }

  const parsed = edgingLogSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('edging_logs')
    .insert({
      facility_id: profile.facility_id,
      rink_id: parsed.data.rink_id,
      operator_id: userId,
      event_time: parsed.data.event_time,
      notes: parsed.data.notes || null,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/ice-operations')
  return { success: true }
}

// ============================================
// Circle Check Action
// ============================================

export async function createCircleCheck(data: {
  machine_id: string
  event_time: string
  notes?: string
  results: Array<{ check_item_id: string; passed: boolean; fail_notes?: string | null }>
}) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile || !userId) return { success: false, error: authError }

  const parsed = circleCheckSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  // Validate: any failed item must have fail_notes
  for (const result of parsed.data.results) {
    if (!result.passed && (!result.fail_notes || result.fail_notes.trim() === '')) {
      return { success: false, error: 'All failed items must have notes explaining the failure.' }
    }
  }

  // Insert the circle check record
  const { data: circleCheck, error: checkError } = await supabase
    .from('circle_checks')
    .insert({
      facility_id: profile.facility_id,
      machine_id: parsed.data.machine_id,
      operator_id: userId,
      event_time: parsed.data.event_time,
      notes: parsed.data.notes || null,
    })
    .select('id')
    .single()

  if (checkError || !circleCheck) {
    return { success: false, error: checkError?.message || 'Failed to create circle check' }
  }

  // Insert all circle check results
  const resultRows = parsed.data.results.map((r) => ({
    circle_check_id: circleCheck.id,
    check_item_id: r.check_item_id,
    passed: r.passed,
    fail_notes: r.passed ? null : (r.fail_notes || null),
  }))

  const { error: resultsError } = await supabase
    .from('circle_check_results')
    .insert(resultRows)

  if (resultsError) {
    return { success: false, error: resultsError.message }
  }

  revalidatePath('/ice-operations')
  return { success: true }
}
