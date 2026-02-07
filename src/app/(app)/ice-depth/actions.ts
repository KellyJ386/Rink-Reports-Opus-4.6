'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Save a single ice depth reading ───────────────────────────────────────────
export async function saveIceDepthReading(data: {
  point_id: string
  rink_id: string
  reading_inches: number
  reading_source: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabase.from('ice_depth_readings').insert({
    ...data,
    facility_id: profile.facility_id,
    measured_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/ice-depth')
  return { success: true }
}

// ── Fetch readings for a rink on a given date ─────────────────────────────────
export async function getIceDepthReadings(rinkId: string, date?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', data: [] }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found', data: [] }

  let query = supabase
    .from('ice_depth_readings')
    .select('*')
    .eq('facility_id', profile.facility_id)
    .eq('rink_id', rinkId)
    .order('created_at', { ascending: false })

  if (date) {
    query = query.gte('created_at', `${date}T00:00:00`).lte('created_at', `${date}T23:59:59`)
  }

  const { data: readings, error } = await query

  if (error) return { error: error.message, data: [] }
  return { data: readings ?? [] }
}

// ── Fetch history with date range ─────────────────────────────────────────────
export async function getIceDepthHistory(params: {
  rinkId?: string
  startDate?: string
  endDate?: string
  limit?: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', data: [] }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found', data: [] }

  let query = supabase
    .from('ice_depth_readings')
    .select('*, profiles!measured_by(full_name)')
    .eq('facility_id', profile.facility_id)
    .order('created_at', { ascending: false })

  if (params.rinkId) {
    query = query.eq('rink_id', params.rinkId)
  }
  if (params.startDate) {
    query = query.gte('created_at', `${params.startDate}T00:00:00`)
  }
  if (params.endDate) {
    query = query.lte('created_at', `${params.endDate}T23:59:59`)
  }
  if (params.limit) {
    query = query.limit(params.limit)
  }

  const { data: readings, error } = await query
  if (error) return { error: error.message, data: [] }
  return { data: readings ?? [] }
}
