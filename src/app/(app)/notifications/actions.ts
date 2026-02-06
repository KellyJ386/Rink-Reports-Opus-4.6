"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/actions";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, facility_id, role")
    .eq("id", user.id)
    .single();
  return profile ? { ...profile, supabase } : null;
}

export async function getNotifications() {
  const auth = await getAuthUser();
  if (!auth) return [];
  const { data } = await auth.supabase
    .from("notifications")
    .select("*")
    .eq("user_id", auth.id)
    .order("created_at", { ascending: false })
    .limit(100);
  return data || [];
}

export async function markAsRead(
  notificationId: string
): Promise<ActionResult<null>> {
  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const { error } = await auth.supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", auth.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/notifications");
  return { success: true, data: null };
}

export async function markAllAsRead(): Promise<ActionResult<null>> {
  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const { error } = await auth.supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", auth.id)
    .eq("is_read", false);

  if (error) return { success: false, error: error.message };
  revalidatePath("/notifications");
  return { success: true, data: null };
}

export async function deleteNotification(
  notificationId: string
): Promise<ActionResult<null>> {
  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const { error } = await auth.supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", auth.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/notifications");
  return { success: true, data: null };
}

export async function getNotificationPreferences() {
  const auth = await getAuthUser();
  if (!auth) return [];
  const { data } = await auth.supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", auth.id);
  return data || [];
}

export async function updateNotificationPreference(
  notificationType: string,
  channel: "in_app" | "email" | "sms",
  enabled: boolean
): Promise<ActionResult<null>> {
  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const { data: existing } = await auth.supabase
    .from("notification_preferences")
    .select("id")
    .eq("user_id", auth.id)
    .eq("facility_id", auth.facility_id)
    .eq("notification_type", notificationType)
    .single();

  if (existing) {
    const { error } = await auth.supabase
      .from("notification_preferences")
      .update({ [channel]: enabled })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await auth.supabase
      .from("notification_preferences")
      .insert({
        user_id: auth.id,
        facility_id: auth.facility_id,
        notification_type: notificationType,
        in_app: channel === "in_app" ? enabled : true,
        email: channel === "email" ? enabled : true,
        sms: channel === "sms" ? enabled : false,
      });
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/notifications");
  return { success: true, data: null };
}

// Server-side utility to create a notification (called from other server actions)
export async function createNotification(params: {
  facilityId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .insert({
      facility_id: params.facilityId,
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
      channels: ["in_app"],
    });
  return !error;
}
