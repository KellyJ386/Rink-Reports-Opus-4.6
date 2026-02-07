'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const CreateShiftSchema = z.object({
  shift_type_id: z.string().uuid(),
  assigned_to: z.string().uuid().nullable().optional(),
  shift_date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  is_open: z.boolean().optional().default(false),
  is_broadcast: z.boolean().optional().default(false),
  notes: z.string().optional().default(''),
})

const UpdateShiftSchema = z.object({
  shift_type_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  shift_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  is_open: z.boolean().optional(),
  is_broadcast: z.boolean().optional(),
  notes: z.string().optional(),
})

const AvailabilitySchema = z.object({
  available_date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  is_recurring: z.boolean().optional().default(false),
  recurring_day: z.string().optional().nullable(),
})

const SwapRequestSchema = z.object({
  shift_id: z.string().uuid(),
  target_id: z.string().uuid(),
})

const ReviewSwapSchema = z.object({
  approved: z.boolean(),
  review_note: z.string().optional().default(''),
})

// ---------------------------------------------------------------------------
// createShift
// ---------------------------------------------------------------------------
export async function createShift(data: {
  shift_type_id: string
  assigned_to?: string | null
  shift_date: string
  start_time: string
  end_time: string
  is_open?: boolean
  is_broadcast?: boolean
  notes?: string
}) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError ?? 'Unauthorized' }

  const parsed = CreateShiftSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

  const { error } = await supabase.from('shifts').insert({
    ...parsed.data,
    facility_id: profile.facility_id,
    created_by: userId,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/scheduling')
  return { success: true }
}

// ---------------------------------------------------------------------------
// updateShift
// ---------------------------------------------------------------------------
export async function updateShift(id: string, data: Record<string, unknown>) {
  const { supabase, profile, error: authError } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError ?? 'Unauthorized' }

  const parsed = UpdateShiftSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

  const { error } = await supabase
    .from('shifts')
    .update(parsed.data)
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/scheduling')
  return { success: true }
}

// ---------------------------------------------------------------------------
// deleteShift  (managers+ only)
// ---------------------------------------------------------------------------
export async function deleteShift(id: string) {
  const { supabase, profile, error: authError } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError ?? 'Unauthorized' }

  const managerRoles = ['super_admin', 'facility_admin', 'manager']
  if (!managerRoles.includes(profile.role)) {
    return { success: false, error: 'Insufficient permissions' }
  }

  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/scheduling')
  return { success: true }
}

// ---------------------------------------------------------------------------
// submitAvailability
// ---------------------------------------------------------------------------
export async function submitAvailability(data: {
  available_date: string
  start_time: string
  end_time: string
  is_recurring?: boolean
  recurring_day?: string | null
}) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError ?? 'Unauthorized' }

  const parsed = AvailabilitySchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

  const { error } = await supabase.from('employee_availability').insert({
    ...parsed.data,
    facility_id: profile.facility_id,
    employee_id: userId,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/scheduling/availability')
  return { success: true }
}

// ---------------------------------------------------------------------------
// deleteAvailability (own only)
// ---------------------------------------------------------------------------
export async function deleteAvailability(id: string) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError ?? 'Unauthorized' }

  const { error } = await supabase
    .from('employee_availability')
    .delete()
    .eq('id', id)
    .eq('employee_id', userId)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/scheduling/availability')
  return { success: true }
}

// ---------------------------------------------------------------------------
// requestSwap
// ---------------------------------------------------------------------------
export async function requestSwap(data: { shift_id: string; target_id: string }) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError ?? 'Unauthorized' }

  const parsed = SwapRequestSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

  const { error } = await supabase.from('shift_swap_requests').insert({
    shift_id: parsed.data.shift_id,
    requester_id: userId,
    target_id: parsed.data.target_id,
    facility_id: profile.facility_id,
    status: 'pending',
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/scheduling/swaps')
  return { success: true }
}

// ---------------------------------------------------------------------------
// reviewSwap (managers+ only)
// ---------------------------------------------------------------------------
export async function reviewSwap(id: string, approved: boolean, note?: string) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError ?? 'Unauthorized' }

  const managerRoles = ['super_admin', 'facility_admin', 'manager']
  if (!managerRoles.includes(profile.role)) {
    return { success: false, error: 'Insufficient permissions' }
  }

  const parsed = ReviewSwapSchema.safeParse({ approved, review_note: note })
  if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

  // Fetch the swap request to get shift details
  const { data: swapRequest, error: fetchError } = await supabase
    .from('shift_swap_requests')
    .select('shift_id, requester_id, target_id')
    .eq('id', id)
    .eq('facility_id', profile.facility_id)
    .single()

  if (fetchError || !swapRequest) {
    return { success: false, error: fetchError?.message ?? 'Swap request not found' }
  }

  // Update the swap request status
  const { error: updateError } = await supabase
    .from('shift_swap_requests')
    .update({
      status: approved ? 'approved' : 'denied',
      reviewed_by: userId,
      review_note: parsed.data.review_note,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (updateError) return { success: false, error: updateError.message }

  // If approved, reassign the shift to the target employee
  if (approved) {
    const { error: shiftError } = await supabase
      .from('shifts')
      .update({ assigned_to: swapRequest.target_id })
      .eq('id', swapRequest.shift_id)
      .eq('facility_id', profile.facility_id)

    if (shiftError) return { success: false, error: shiftError.message }
  }

  revalidatePath('/scheduling/swaps')
  revalidatePath('/scheduling')
  return { success: true }
}

// ---------------------------------------------------------------------------
// pickUpShift — assign current user to an open shift
// ---------------------------------------------------------------------------
export async function pickUpShift(shiftId: string) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError ?? 'Unauthorized' }

  // Verify the shift is actually open and belongs to this facility
  const { data: shift, error: fetchError } = await supabase
    .from('shifts')
    .select('id, is_open')
    .eq('id', shiftId)
    .eq('facility_id', profile.facility_id)
    .single()

  if (fetchError || !shift) {
    return { success: false, error: 'Shift not found' }
  }

  if (!shift.is_open) {
    return { success: false, error: 'This shift is no longer open' }
  }

  const { error } = await supabase
    .from('shifts')
    .update({ assigned_to: userId, is_open: false })
    .eq('id', shiftId)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/scheduling/open-shifts')
  revalidatePath('/scheduling')
  return { success: true }
}

// ---------------------------------------------------------------------------
// broadcastShift  (managers+ only)
// ---------------------------------------------------------------------------
export async function broadcastShift(shiftId: string) {
  const { supabase, profile, error: authError } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError ?? 'Unauthorized' }

  const managerRoles = ['super_admin', 'facility_admin', 'manager']
  if (!managerRoles.includes(profile.role)) {
    return { success: false, error: 'Insufficient permissions' }
  }

  const { error } = await supabase
    .from('shifts')
    .update({ is_broadcast: true })
    .eq('id', shiftId)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/scheduling/open-shifts')
  revalidatePath('/scheduling')
  return { success: true }
}
