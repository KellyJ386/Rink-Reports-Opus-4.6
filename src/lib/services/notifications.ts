import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailNotification } from '@/lib/services/email'
import { sendSmsNotification } from '@/lib/services/sms'

export interface NotificationPayload {
  facilityId: string
  recipientIds: string[]
  title: string
  body: string
  link?: string
  triggerType: string
}

interface NotificationPreference {
  profile_id: string
  trigger_type: string
  channel: string
  is_enabled: boolean
}

interface RecipientProfile {
  id: string
  email: string
  full_name: string
  phone: string | null
}

/**
 * Send notifications to a list of recipients, respecting their channel preferences.
 *
 * For each recipient:
 *   1. Check notification_preferences for (profile_id, trigger_type, channel)
 *   2. If in_app is enabled (or no preference row exists, defaulting to enabled): insert notification record
 *   3. If email is enabled: send email notification
 *   4. If sms is enabled and phone exists: send SMS notification
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<{ success: boolean; sent: number }> {
  const supabase = createAdminClient()
  let sent = 0

  try {
    // Fetch preferences for all recipients in batch
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('profile_id, trigger_type, channel, is_enabled')
      .in('profile_id', payload.recipientIds)
      .eq('trigger_type', payload.triggerType)

    // Fetch recipient profiles for email/sms delivery
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone')
      .in('id', payload.recipientIds)

    const prefsMap = buildPreferencesMap(
      (preferences as NotificationPreference[] | null) || []
    )
    const profilesMap = new Map(
      ((profiles as RecipientProfile[] | null) || []).map((p) => [p.id, p])
    )

    // Process each recipient
    const insertRows: Array<{
      facility_id: string
      recipient_id: string
      title: string
      body: string
      link: string | null
      is_read: boolean
    }> = []

    for (const recipientId of payload.recipientIds) {
      const recipientProfile = profilesMap.get(recipientId)
      if (!recipientProfile) continue

      // In-App notification
      const inAppEnabled = isChannelEnabled(
        prefsMap,
        recipientId,
        payload.triggerType,
        'in_app'
      )
      if (inAppEnabled) {
        insertRows.push({
          facility_id: payload.facilityId,
          recipient_id: recipientId,
          title: payload.title,
          body: payload.body,
          link: payload.link || null,
          is_read: false,
        })
        sent++
      }

      // Email notification
      const emailEnabled = isChannelEnabled(
        prefsMap,
        recipientId,
        payload.triggerType,
        'email'
      )
      if (emailEnabled && recipientProfile.email) {
        await sendEmailNotification(
          recipientProfile.email,
          payload.title,
          payload.body,
          payload.link
        )
      }

      // SMS notification
      const smsEnabled = isChannelEnabled(
        prefsMap,
        recipientId,
        payload.triggerType,
        'sms'
      )
      if (smsEnabled && recipientProfile.phone) {
        await sendSmsNotification(
          recipientProfile.phone,
          `${payload.title}: ${payload.body}`
        )
      }
    }

    // Batch insert all in-app notifications
    if (insertRows.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(insertRows)

      if (insertError) {
        console.error(
          '[Notifications] Failed to insert notifications:',
          insertError.message
        )
        return { success: false, sent: 0 }
      }
    }

    return { success: true, sent }
  } catch (error) {
    console.error('[Notifications] Unexpected error:', error)
    return { success: false, sent: 0 }
  }
}

/**
 * Get all manager-level and above recipients for a given facility.
 * Returns profile IDs of users with roles: facility_admin, manager, super_admin.
 */
export async function getManagerRecipients(
  facilityId: string
): Promise<string[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('facility_id', facilityId)
    .in('role', ['facility_admin', 'manager', 'super_admin'])
    .eq('is_active', true)

  if (error) {
    console.error(
      '[Notifications] Failed to fetch manager recipients:',
      error.message
    )
    return []
  }

  return (data || []).map((profile: { id: string }) => profile.id)
}

/**
 * Get all active user IDs for a given facility.
 */
export async function getFacilityRecipients(
  facilityId: string
): Promise<string[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('facility_id', facilityId)
    .eq('is_active', true)

  if (error) {
    console.error(
      '[Notifications] Failed to fetch facility recipients:',
      error.message
    )
    return []
  }

  return (data || []).map((profile: { id: string }) => profile.id)
}

/**
 * Get recipients for a facility by specific roles.
 */
export async function getRecipientsByRoles(
  facilityId: string,
  roles: string[]
): Promise<string[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('facility_id', facilityId)
    .in('role', roles)
    .eq('is_active', true)

  if (error) {
    console.error(
      '[Notifications] Failed to fetch recipients by roles:',
      error.message
    )
    return []
  }

  return (data || []).map((profile: { id: string }) => profile.id)
}

// --- Internal helpers ---

type PrefsMapKey = string // `${profileId}:${triggerType}:${channel}`

function buildPreferencesMap(
  preferences: NotificationPreference[]
): Map<PrefsMapKey, boolean> {
  const map = new Map<PrefsMapKey, boolean>()
  for (const pref of preferences) {
    const key = `${pref.profile_id}:${pref.trigger_type}:${pref.channel}`
    map.set(key, pref.is_enabled)
  }
  return map
}

/**
 * Check if a notification channel is enabled for a recipient.
 * If no explicit preference exists, defaults to:
 *   - in_app: enabled
 *   - email: disabled
 *   - sms: disabled
 */
function isChannelEnabled(
  prefsMap: Map<PrefsMapKey, boolean>,
  profileId: string,
  triggerType: string,
  channel: string
): boolean {
  const key = `${profileId}:${triggerType}:${channel}`
  const explicit = prefsMap.get(key)

  if (explicit !== undefined) {
    return explicit
  }

  // Default: in_app is enabled, email/sms are disabled (opt-in)
  return channel === 'in_app'
}
