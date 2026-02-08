'use server'

export async function saveNotificationPreferences(
  preferences: Record<string, Record<string, boolean>>
) {
  // In production: save to notification_preferences table
  // For now, just return success
  console.info('[notification-prefs] Would save:', JSON.stringify(preferences))
  return { success: true }
}

export async function getNotificationPreferences() {
  // In production: fetch from notification_preferences table
  return { data: {} }
}
