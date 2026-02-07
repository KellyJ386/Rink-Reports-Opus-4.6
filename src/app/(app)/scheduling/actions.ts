'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/* ------------------------------------------------------------------ */
/*  Schemas                                                            */
/* ------------------------------------------------------------------ */

const ShiftSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  position: z.enum(['zamboni', 'front_desk', 'skate_rental', 'maintenance']),
  assignedTo: z.string().nullable().optional(),
  notes: z.string().optional(),
});

const AvailabilitySchema = z.object({
  employeeId: z.string().min(1),
  weekStartDate: z.string().min(1),
  availability: z.array(
    z.object({
      day: z.number().min(0).max(6),
      available: z.boolean(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    })
  ),
});

const SwapRequestSchema = z.object({
  shiftId: z.string().min(1),
  requestingEmployeeId: z.string().min(1),
  targetEmployeeId: z.string().min(1),
  reason: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

export async function createShift(data: {
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  assignedTo?: string | null;
  notes?: string;
}) {
  const parsed = ShiftSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data: shift, error } = await supabase
    .from('shifts')
    .insert({
      date: parsed.data.date,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      position: parsed.data.position,
      assigned_to: parsed.data.assignedTo ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath('/scheduling');
  return { data: shift };
}

export async function updateShift(
  id: string,
  data: {
    date?: string;
    startTime?: string;
    endTime?: string;
    position?: string;
    assignedTo?: string | null;
    notes?: string;
  }
) {
  const supabase = await createClient();

  const updatePayload: Record<string, unknown> = {};
  if (data.date !== undefined) updatePayload.date = data.date;
  if (data.startTime !== undefined) updatePayload.start_time = data.startTime;
  if (data.endTime !== undefined) updatePayload.end_time = data.endTime;
  if (data.position !== undefined) updatePayload.position = data.position;
  if (data.assignedTo !== undefined) updatePayload.assigned_to = data.assignedTo;
  if (data.notes !== undefined) updatePayload.notes = data.notes;

  const { data: shift, error } = await supabase
    .from('shifts')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath('/scheduling');
  return { data: shift };
}

export async function deleteShift(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('shifts').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/scheduling');
  return { success: true };
}

export async function submitAvailability(data: {
  employeeId: string;
  weekStartDate: string;
  availability: {
    day: number;
    available: boolean;
    startTime?: string;
    endTime?: string;
  }[];
}) {
  const parsed = AvailabilitySchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.from('employee_availability').upsert(
    parsed.data.availability.map((entry) => ({
      employee_id: parsed.data.employeeId,
      week_start_date: parsed.data.weekStartDate,
      day_of_week: entry.day,
      is_available: entry.available,
      start_time: entry.startTime ?? null,
      end_time: entry.endTime ?? null,
    })),
    { onConflict: 'employee_id,week_start_date,day_of_week' }
  );

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath('/scheduling');
  return { success: true };
}

export async function requestSwap(data: {
  shiftId: string;
  requestingEmployeeId: string;
  targetEmployeeId: string;
  reason?: string;
}) {
  const parsed = SwapRequestSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data: swap, error } = await supabase
    .from('shift_swap_requests')
    .insert({
      shift_id: parsed.data.shiftId,
      requesting_employee_id: parsed.data.requestingEmployeeId,
      target_employee_id: parsed.data.targetEmployeeId,
      reason: parsed.data.reason ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath('/scheduling');
  return { data: swap };
}

export async function reviewSwap(id: string, approved: boolean, note?: string) {
  const supabase = await createClient();

  const { data: swap, error } = await supabase
    .from('shift_swap_requests')
    .update({
      status: approved ? 'approved' : 'denied',
      reviewer_note: note ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: { _form: [error.message] } };
  }

  // If approved, actually perform the swap on the shift
  if (approved && swap) {
    await supabase
      .from('shifts')
      .update({ assigned_to: swap.target_employee_id })
      .eq('id', swap.shift_id);
  }

  revalidatePath('/scheduling');
  return { data: swap };
}

export async function pickUpShift(shiftId: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data: shift, error } = await supabase
    .from('shifts')
    .update({ assigned_to: user.id })
    .eq('id', shiftId)
    .is('assigned_to', null) // Only pick up if still unassigned
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  if (!shift) {
    return { error: 'Shift is no longer available' };
  }

  revalidatePath('/scheduling');
  return { data: shift };
}
