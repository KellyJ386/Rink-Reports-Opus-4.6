import { createClient } from "@/lib/supabase/server"

/* ---------- Types ---------- */

interface NotificationPayload {
  facilityId: string
  recipientIds: string[]
  title: string
  body: string
  link?: string
  triggerType: string
}

/* ---------- Send in-app notification ---------- */

export async function sendNotification(payload: NotificationPayload) {
  const supabase = await createClient()

  const insertRows = payload.recipientIds.map((recipientId) => ({
    facility_id: payload.facilityId,
    recipient_id: recipientId,
    title: payload.title,
    body: payload.body,
    link: payload.link ?? null,
    trigger_type: payload.triggerType,
    read: false,
  }))

  const { error } = await supabase.from("notifications").insert(insertRows)

  if (error) {
    console.error("[notifications] Failed to insert:", error.message)
    return { error: error.message }
  }

  return { success: true, count: insertRows.length }
}

/* ---------- Mark notifications as read ---------- */

export async function markNotificationsRead(notificationIds: string[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .in("id", notificationIds)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/* ---------- Mark all read for a user ---------- */

export async function markAllNotificationsRead(recipientId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("recipient_id", recipientId)
    .eq("read", false)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/* ---------- Fetch unread count ---------- */

export async function getUnreadCount(recipientId: string) {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", recipientId)
    .eq("read", false)

  if (error) {
    return { error: error.message, count: 0 }
  }

  return { count: count ?? 0 }
}

/* ---------- Fetch notifications for user ---------- */

export async function getNotifications(recipientId: string, limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: data ?? [] }
}
