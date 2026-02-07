'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// --- Types ---

export interface NotificationPreference {
  id: string
  profile_id: string
  trigger_type: string
  channel: 'in_app' | 'email' | 'sms'
  is_enabled: boolean
}

// --- Validation Schemas ---

const updatePreferenceSchema = z.object({
  triggerType: z.string().min(1),
  channel: z.enum(['in_app', 'email', 'sms']),
  isEnabled: z.boolean(),
})

// --- Actions ---

/**
 * Fetch all notification preferences for the current authenticated user.
 */
export async function getNotificationPreferences(): Promise<{
  success: boolean
  data?: NotificationPreference[]
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('profile_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as NotificationPreference[] }
}

/**
 * Upsert a single notification preference.
 * Uses the UNIQUE(profile_id, trigger_type, channel) constraint for upsert.
 */
export async function updateNotificationPreference(
  triggerType: string,
  channel: string,
  isEnabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const parsed = updatePreferenceSchema.safeParse({
    triggerType,
    channel,
    isEnabled,
  })

  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase.from('notification_preferences').upsert(
    {
      profile_id: user.id,
      trigger_type: parsed.data.triggerType,
      channel: parsed.data.channel,
      is_enabled: parsed.data.isEnabled,
    },
    {
      onConflict: 'profile_id,trigger_type,channel',
    }
  )

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/notifications')
  return { success: true }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!id) {
    return { success: false, error: 'Notification ID required' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('recipient_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Mark all unread notifications as read for the current user.
 */
export async function markAllNotificationsRead(): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
