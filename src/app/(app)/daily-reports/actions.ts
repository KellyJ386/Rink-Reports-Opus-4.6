"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/actions";
import type {
  DailyReport,
  ChecklistResponse,
  ChecklistItem,
  TabConfiguration,
} from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Helper: get authenticated user + profile with facility_id
// ---------------------------------------------------------------------------
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile };
}

// ---------------------------------------------------------------------------
// GET: List daily reports for the current facility
// ---------------------------------------------------------------------------
export async function getDailyReports(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ActionResult<(DailyReport & { submitted_by_name?: string; created_by_name?: string })[]>> {
  const { supabase, profile } = await getAuthenticatedUser();

  if (!profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  let query = supabase
    .from("daily_reports")
    .select(`
      *,
      submitted_by_profile:profiles!daily_reports_submitted_by_fkey(full_name),
      created_by_profile:profiles!daily_reports_created_by_fkey(full_name)
    `)
    .eq("facility_id", profile.facility_id)
    .order("report_date", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.startDate) {
    query = query.gte("report_date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("report_date", filters.endDate);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return { success: false, error: error.message };
  }

  // Flatten the joined profile names
  const reports = (data ?? []).map((row: Record<string, unknown>) => {
    const submittedProfile = row.submitted_by_profile as { full_name: string } | null;
    const createdProfile = row.created_by_profile as { full_name: string } | null;
    return {
      ...row,
      submitted_by_name: submittedProfile?.full_name ?? undefined,
      created_by_name: createdProfile?.full_name ?? undefined,
      submitted_by_profile: undefined,
      created_by_profile: undefined,
    };
  }) as unknown as (DailyReport & { submitted_by_name?: string; created_by_name?: string })[];

  return { success: true, data: reports };
}

// ---------------------------------------------------------------------------
// GET: Single daily report by ID
// ---------------------------------------------------------------------------
export async function getDailyReport(
  id: string
): Promise<ActionResult<DailyReport & { submitted_by_name?: string; reviewed_by_name?: string; created_by_name?: string }>> {
  const { supabase, profile } = await getAuthenticatedUser();

  if (!profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const { data, error } = await supabase
    .from("daily_reports")
    .select(`
      *,
      submitted_by_profile:profiles!daily_reports_submitted_by_fkey(full_name),
      reviewed_by_profile:profiles!daily_reports_reviewed_by_fkey(full_name),
      created_by_profile:profiles!daily_reports_created_by_fkey(full_name)
    `)
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Report not found" };
  }

  const row = data as Record<string, unknown>;
  const submittedProfile = row.submitted_by_profile as { full_name: string } | null;
  const reviewedProfile = row.reviewed_by_profile as { full_name: string } | null;
  const createdProfile = row.created_by_profile as { full_name: string } | null;

  const report = {
    ...data,
    submitted_by_name: submittedProfile?.full_name ?? undefined,
    reviewed_by_name: reviewedProfile?.full_name ?? undefined,
    created_by_name: createdProfile?.full_name ?? undefined,
    submitted_by_profile: undefined,
    reviewed_by_profile: undefined,
    created_by_profile: undefined,
  } as unknown as DailyReport & { submitted_by_name?: string; reviewed_by_name?: string; created_by_name?: string };

  return { success: true, data: report };
}

// ---------------------------------------------------------------------------
// CREATE: New daily report
// ---------------------------------------------------------------------------
export async function createDailyReport(
  formData: FormData
): Promise<ActionResult<DailyReport>> {
  const { supabase, user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const reportDate = formData.get("report_date") as string;

  if (!reportDate) {
    return { success: false, error: "Report date is required" };
  }

  // Check for duplicate report on same date
  const { data: existing } = await supabase
    .from("daily_reports")
    .select("id")
    .eq("facility_id", profile.facility_id)
    .eq("report_date", reportDate)
    .limit(1);

  if (existing && existing.length > 0) {
    return {
      success: false,
      error: `A daily report already exists for ${reportDate}`,
    };
  }

  const { data, error } = await supabase
    .from("daily_reports")
    .insert({
      facility_id: profile.facility_id,
      report_date: reportDate,
      status: "draft",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/daily-reports");
  return { success: true, data: data as DailyReport };
}

// ---------------------------------------------------------------------------
// UPDATE: Update a daily report (draft only)
// ---------------------------------------------------------------------------
export async function updateDailyReport(
  id: string,
  formData: FormData
): Promise<ActionResult<DailyReport>> {
  const { supabase, profile } = await getAuthenticatedUser();

  if (!profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  // Only allow updates to draft reports
  const { data: existing } = await supabase
    .from("daily_reports")
    .select("status")
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .single();

  if (!existing) {
    return { success: false, error: "Report not found" };
  }

  if (existing.status !== "draft") {
    return {
      success: false,
      error: "Only draft reports can be edited",
    };
  }

  const reportDate = formData.get("report_date") as string;
  const updatePayload: Record<string, unknown> = {};

  if (reportDate) {
    updatePayload.report_date = reportDate;
  }

  const { data, error } = await supabase
    .from("daily_reports")
    .update(updatePayload)
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/daily-reports");
  revalidatePath(`/daily-reports/${id}`);
  return { success: true, data: data as DailyReport };
}

// ---------------------------------------------------------------------------
// SUBMIT: Submit a daily report for review
// ---------------------------------------------------------------------------
export async function submitDailyReport(
  id: string
): Promise<ActionResult<DailyReport>> {
  const { supabase, user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const { data: existing } = await supabase
    .from("daily_reports")
    .select("status")
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .single();

  if (!existing) {
    return { success: false, error: "Report not found" };
  }

  if (existing.status !== "draft") {
    return {
      success: false,
      error: "Only draft reports can be submitted",
    };
  }

  const { data, error } = await supabase
    .from("daily_reports")
    .update({
      status: "submitted",
      submitted_by: user.id,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/daily-reports");
  revalidatePath(`/daily-reports/${id}`);
  return { success: true, data: data as DailyReport };
}

// ---------------------------------------------------------------------------
// APPROVE: Approve a submitted daily report
// ---------------------------------------------------------------------------
export async function approveDailyReport(
  id: string,
  formData: FormData
): Promise<ActionResult<DailyReport>> {
  const { supabase, user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  // Only managers+ can approve
  const allowedRoles = ["super_admin", "facility_admin", "manager"];
  if (!allowedRoles.includes(profile.role)) {
    return { success: false, error: "Insufficient permissions to approve reports" };
  }

  const reviewerNotes = formData.get("reviewer_notes") as string | null;

  const { data, error } = await supabase
    .from("daily_reports")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes || null,
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .eq("status", "submitted")
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Report not found or not in submitted status" };
  }

  revalidatePath("/daily-reports");
  revalidatePath(`/daily-reports/${id}`);
  return { success: true, data: data as DailyReport };
}

// ---------------------------------------------------------------------------
// REJECT: Reject a submitted daily report
// ---------------------------------------------------------------------------
export async function rejectDailyReport(
  id: string,
  formData: FormData
): Promise<ActionResult<DailyReport>> {
  const { supabase, user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const allowedRoles = ["super_admin", "facility_admin", "manager"];
  if (!allowedRoles.includes(profile.role)) {
    return { success: false, error: "Insufficient permissions to reject reports" };
  }

  const reviewerNotes = formData.get("reviewer_notes") as string;

  if (!reviewerNotes) {
    return { success: false, error: "Rejection reason is required" };
  }

  const { data, error } = await supabase
    .from("daily_reports")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes,
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .eq("status", "submitted")
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Report not found or not in submitted status" };
  }

  revalidatePath("/daily-reports");
  revalidatePath(`/daily-reports/${id}`);
  return { success: true, data: data as DailyReport };
}

// ---------------------------------------------------------------------------
// GET: Checklist items for a specific report (via tabs for the facility)
// ---------------------------------------------------------------------------
export async function getChecklistItemsForReport(
  reportId: string
): Promise<
  ActionResult<{
    tabs: (TabConfiguration & { checklist_items: ChecklistItem[] })[];
    responses: ChecklistResponse[];
  }>
> {
  const { supabase, profile } = await getAuthenticatedUser();

  if (!profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  // Verify report belongs to facility
  const { data: report } = await supabase
    .from("daily_reports")
    .select("id")
    .eq("id", reportId)
    .eq("facility_id", profile.facility_id)
    .single();

  if (!report) {
    return { success: false, error: "Report not found" };
  }

  // Get tabs for daily_reports module
  const { data: tabs, error: tabsError } = await supabase
    .from("tab_configurations")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .eq("module", "daily_reports")
    .eq("is_active", true)
    .order("sort_order");

  if (tabsError) {
    return { success: false, error: tabsError.message };
  }

  // Get checklist items for all tabs
  const tabIds = (tabs ?? []).map((t: TabConfiguration) => t.id);
  const { data: checklistItems, error: itemsError } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .in("tab_id", tabIds.length > 0 ? tabIds : ["__none__"])
    .eq("is_active", true)
    .order("sort_order");

  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  // Get existing responses for this report
  const { data: responses, error: responsesError } = await supabase
    .from("checklist_responses")
    .select("*")
    .eq("daily_report_id", reportId)
    .eq("facility_id", profile.facility_id);

  if (responsesError) {
    return { success: false, error: responsesError.message };
  }

  // Group checklist items by tab
  const tabsWithItems = (tabs ?? []).map((tab: TabConfiguration) => ({
    ...tab,
    checklist_items: (checklistItems ?? []).filter(
      (item: ChecklistItem) => item.tab_id === tab.id
    ),
  }));

  return {
    success: true,
    data: {
      tabs: tabsWithItems,
      responses: (responses ?? []) as ChecklistResponse[],
    },
  };
}

// ---------------------------------------------------------------------------
// SAVE: Save a checklist response (upsert)
// ---------------------------------------------------------------------------
export async function saveChecklistResponse(
  formData: FormData
): Promise<ActionResult<ChecklistResponse>> {
  const { supabase, user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const dailyReportId = formData.get("daily_report_id") as string;
  const checklistItemId = formData.get("checklist_item_id") as string;
  const tabId = formData.get("tab_id") as string;
  const value = formData.get("value") as string | null;
  const numericValueStr = formData.get("numeric_value") as string | null;
  const isFlagged = formData.get("is_flagged") === "true";
  const notes = formData.get("notes") as string | null;

  if (!dailyReportId || !checklistItemId || !tabId) {
    return { success: false, error: "Report ID, checklist item ID, and tab ID are required" };
  }

  // Verify report is still in draft status
  const { data: report } = await supabase
    .from("daily_reports")
    .select("status")
    .eq("id", dailyReportId)
    .eq("facility_id", profile.facility_id)
    .single();

  if (!report) {
    return { success: false, error: "Report not found" };
  }

  if (report.status !== "draft") {
    return { success: false, error: "Can only save responses for draft reports" };
  }

  const numericValue = numericValueStr ? parseFloat(numericValueStr) : null;

  // Check if a response already exists for this item in this report
  const { data: existingResponse } = await supabase
    .from("checklist_responses")
    .select("id")
    .eq("daily_report_id", dailyReportId)
    .eq("checklist_item_id", checklistItemId)
    .eq("facility_id", profile.facility_id)
    .limit(1);

  let data;
  let error;

  if (existingResponse && existingResponse.length > 0) {
    // Update existing
    const result = await supabase
      .from("checklist_responses")
      .update({
        value,
        numeric_value: numericValue,
        is_flagged: isFlagged,
        notes,
        recorded_by: user.id,
        event_time: new Date().toISOString(),
      })
      .eq("id", existingResponse[0].id)
      .select()
      .single();
    data = result.data;
    error = result.error;
  } else {
    // Insert new
    const result = await supabase
      .from("checklist_responses")
      .insert({
        facility_id: profile.facility_id,
        daily_report_id: dailyReportId,
        checklist_item_id: checklistItemId,
        tab_id: tabId,
        value,
        numeric_value: numericValue,
        is_flagged: isFlagged,
        notes,
        recorded_by: user.id,
        event_time: new Date().toISOString(),
      })
      .select()
      .single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/daily-reports/${dailyReportId}`);
  return { success: true, data: data as ChecklistResponse };
}
