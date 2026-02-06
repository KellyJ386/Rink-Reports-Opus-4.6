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

export async function getReportArchives() {
  const auth = await getAuthUser();
  if (!auth) return [];
  const { data } = await auth.supabase
    .from("report_archives")
    .select("*")
    .eq("facility_id", auth.facility_id)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function generateReport(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const reportType = formData.get("report_type") as string;
  const title = formData.get("title") as string;
  const fileFormat = formData.get("file_format") as string;
  const dateRangeStart = formData.get("date_range_start") as string;
  const dateRangeEnd = formData.get("date_range_end") as string;

  if (!reportType || !title || !fileFormat) {
    return { success: false, error: "Missing required fields" };
  }

  // In a real implementation, this would generate the actual file
  // For now, we create the archive record
  const { data, error } = await auth.supabase
    .from("report_archives")
    .insert({
      facility_id: auth.facility_id,
      report_type: reportType,
      title,
      file_format: fileFormat,
      date_range_start: dateRangeStart || null,
      date_range_end: dateRangeEnd || null,
      generated_by: auth.id,
      metadata: {},
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/reports");
  return { success: true, data: { id: data.id } };
}

export async function deleteReport(id: string): Promise<ActionResult<null>> {
  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const { error } = await auth.supabase
    .from("report_archives")
    .delete()
    .eq("id", id)
    .eq("facility_id", auth.facility_id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/reports");
  return { success: true, data: null };
}

export async function getScheduledReports() {
  const auth = await getAuthUser();
  if (!auth) return [];
  const { data } = await auth.supabase
    .from("scheduled_reports")
    .select("*")
    .eq("facility_id", auth.facility_id)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function createScheduledReport(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  if (!["super_admin", "facility_admin", "manager"].includes(auth.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  const reportType = formData.get("report_type") as string;
  const title = formData.get("title") as string;
  const frequency = formData.get("frequency") as string;
  const fileFormat = formData.get("file_format") as string;

  if (!reportType || !title || !frequency || !fileFormat) {
    return { success: false, error: "Missing required fields" };
  }

  const { data, error } = await auth.supabase
    .from("scheduled_reports")
    .insert({
      facility_id: auth.facility_id,
      report_type: reportType,
      title,
      frequency,
      file_format: fileFormat,
      created_by: auth.id,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/reports");
  return { success: true, data: { id: data.id } };
}

export async function toggleScheduledReport(
  id: string
): Promise<ActionResult<null>> {
  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const { data: existing } = await auth.supabase
    .from("scheduled_reports")
    .select("is_active")
    .eq("id", id)
    .eq("facility_id", auth.facility_id)
    .single();

  if (!existing) return { success: false, error: "Report not found" };

  const { error } = await auth.supabase
    .from("scheduled_reports")
    .update({ is_active: !existing.is_active })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/reports");
  return { success: true, data: null };
}

export async function deleteScheduledReport(
  id: string
): Promise<ActionResult<null>> {
  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const { error } = await auth.supabase
    .from("scheduled_reports")
    .delete()
    .eq("id", id)
    .eq("facility_id", auth.facility_id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/reports");
  return { success: true, data: null };
}
