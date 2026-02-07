'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

async function getAuthProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, profile: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) return { supabase, profile: null, error: 'Profile not found' }

  return { supabase, profile, error: null, userId: user.id }
}

const readingSchema = z.object({
  point_id: z.string().uuid(),
  rink_id: z.string().uuid(),
  reading_inches: z.number().min(0).max(10),
  reading_source: z.enum(['manual', 'bluetooth']),
})

export async function saveIceDepthReading(data: {
  point_id: string
  rink_id: string
  reading_inches: number
  reading_source: 'manual' | 'bluetooth'
}) {
  const { supabase, profile, error: authError, userId } = await getAuthProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = readingSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid reading data' }

  const { error } = await supabase.from('ice_depth_readings').insert({
    point_id: parsed.data.point_id,
    facility_id: profile.facility_id,
    rink_id: parsed.data.rink_id,
    reading_inches: parsed.data.reading_inches,
    reading_source: parsed.data.reading_source,
    measured_by: userId,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/ice-depth')
  return { success: true }
}
