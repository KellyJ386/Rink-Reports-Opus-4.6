'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Helpers ────────────────────────────────────────────────────────────────────
async function getAuthContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const, supabase, user: null, facilityId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found' as const, supabase, user, facilityId: null }

  return { error: null, supabase, user, facilityId: profile.facility_id as string }
}

// ── Schemas ────────────────────────────────────────────────────────────────────
const iceMakeSchema = z.object({
  timestamp: z.string().min(1, 'Timestamp is required'),
  rink_id: z.string().min(1, 'Rink is required'),
  machine_id: z.string().min(1, 'Machine is required'),
  machine_hours: z.number().optional(),
  ice_taken: z.string().optional(),
  water_used: z.string().optional(),
  notes: z.string().optional(),
})

const bladeChangeSchema = z.object({
  timestamp: z.string().min(1, 'Timestamp is required'),
  machine_id: z.string().min(1, 'Machine is required'),
  notes: z.string().optional(),
})

const edgingLogSchema = z.object({
  timestamp: z.string().min(1, 'Timestamp is required'),
  rink_id: z.string().min(1, 'Rink is required'),
  notes: z.string().optional(),
})

const circleCheckSchema = z.object({
  machine_id: z.string().min(1, 'Machine is required'),
  items: z.array(
    z.object({
      item_id: z.string(),
      label: z.string(),
      passed: z.boolean(),
      notes: z.string().optional(),
    }),
  ),
})

// ── Actions ────────────────────────────────────────────────────────────────────

export async function createIceMake(data: z.infer<typeof iceMakeSchema>) {
  const parsed = iceMakeSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const ctx = await getAuthContext()
  if (ctx.error) return { error: ctx.error }

  const { error } = await ctx.supabase.from('ice_makes').insert({
    ...parsed.data,
    facility_id: ctx.facilityId,
    operator_id: ctx.user!.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/ice-operations')
  return { success: true }
}

export async function createBladeChange(data: z.infer<typeof bladeChangeSchema>) {
  const parsed = bladeChangeSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const ctx = await getAuthContext()
  if (ctx.error) return { error: ctx.error }

  const { error } = await ctx.supabase.from('blade_changes').insert({
    ...parsed.data,
    facility_id: ctx.facilityId,
    operator_id: ctx.user!.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/ice-operations')
  return { success: true }
}

export async function createEdgingLog(data: z.infer<typeof edgingLogSchema>) {
  const parsed = edgingLogSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const ctx = await getAuthContext()
  if (ctx.error) return { error: ctx.error }

  const { error } = await ctx.supabase.from('edging_logs').insert({
    ...parsed.data,
    facility_id: ctx.facilityId,
    operator_id: ctx.user!.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/ice-operations')
  return { success: true }
}

export async function createCircleCheck(data: z.infer<typeof circleCheckSchema>) {
  const parsed = circleCheckSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const ctx = await getAuthContext()
  if (ctx.error) return { error: ctx.error }

  // Validate failed items have notes
  const failedWithoutNotes = parsed.data.items.filter(
    (item) => !item.passed && (!item.notes || !item.notes.trim()),
  )
  if (failedWithoutNotes.length > 0) {
    return { error: 'All failed items must include notes explaining the issue.' }
  }

  const { error } = await ctx.supabase.from('circle_checks').insert({
    machine_id: parsed.data.machine_id,
    items: parsed.data.items,
    facility_id: ctx.facilityId,
    operator_id: ctx.user!.id,
    passed_count: parsed.data.items.filter((i) => i.passed).length,
    failed_count: parsed.data.items.filter((i) => !i.passed).length,
  })

  if (error) return { error: error.message }
  revalidatePath('/ice-operations')
  return { success: true }
}
