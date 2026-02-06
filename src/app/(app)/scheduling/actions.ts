"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/actions";
import type {
  Schedule,
  ScheduleEntry,
  EmployeeAvailability,
  ShiftSwapRequest,
  TimeOffRequest,
  ShiftStatus,
  SwapStatus,
  TimeOffStatus,
  Profile,
} from "@/lib/types/database";

// ============================================================
// HELPERS
// ============================================================

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, facility_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.facility_id) {
    return {
      supabase,
      user,
      profile: null,
      error: "Profile not found or no facility assigned",
    };
  }

  return { supabase, user, profile, error: null };
}

function isManagerOrAbove(role: string): boolean {
  return ["super_admin", "facility_admin", "manager", "supervisor"].includes(
    role
  );
}

// ============================================================
// SCHEDULES
// ============================================================

export async function getSchedules(): Promise<ActionResult<Schedule[]>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const { data, error: dbError } = await supabase
    .from("schedules")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("week_start", { ascending: false });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as Schedule[] };
}

export async function getSchedule(
  id: string
): Promise<ActionResult<Schedule>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!id) {
    return { success: false, error: "Schedule ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Schedule not found",
    };
  }

  return { success: true, data: data as Schedule };
}

export async function createSchedule(
  formData: FormData
): Promise<ActionResult<Schedule>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!isManagerOrAbove(profile.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  const weekStart = (formData.get("week_start") as string)?.trim();
  if (!weekStart) {
    return { success: false, error: "Week start date is required" };
  }

  const notes = (formData.get("notes") as string)?.trim() || null;

  const { data, error: dbError } = await supabase
    .from("schedules")
    .insert({
      facility_id: profile.facility_id,
      week_start: weekStart,
      status: "draft" as ShiftStatus,
      notes,
      created_by: profile.id,
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create schedule",
    };
  }

  revalidatePath("/scheduling");
  return { success: true, data: data as Schedule };
}

export async function publishSchedule(
  id: string
): Promise<ActionResult<Schedule>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!isManagerOrAbove(profile.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Schedule ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("schedules")
    .update({
      status: "published" as ShiftStatus,
      published_by: profile.id,
      published_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to publish schedule",
    };
  }

  revalidatePath("/scheduling");
  return { success: true, data: data as Schedule };
}

// ============================================================
// SCHEDULE ENTRIES
// ============================================================

export type ScheduleEntryWithDetails = ScheduleEntry & {
  employee?: Pick<Profile, "id" | "full_name" | "email">;
  shift_type?: { id: string; name: string; color: string } | null;
};

export async function getScheduleEntries(
  scheduleId: string
): Promise<ActionResult<ScheduleEntryWithDetails[]>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!scheduleId) {
    return { success: false, error: "Schedule ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("schedule_entries")
    .select(
      "*, employee:profiles!schedule_entries_employee_id_fkey(id, full_name, email), shift_type:shift_types(id, name, color)"
    )
    .eq("schedule_id", scheduleId)
    .eq("facility_id", profile.facility_id)
    .order("shift_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return {
    success: true,
    data: (data ?? []) as ScheduleEntryWithDetails[],
  };
}

export async function createScheduleEntry(
  formData: FormData
): Promise<ActionResult<ScheduleEntry>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!isManagerOrAbove(profile.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  const scheduleId = (formData.get("schedule_id") as string)?.trim();
  const employeeId = (formData.get("employee_id") as string)?.trim();
  const shiftDate = (formData.get("shift_date") as string)?.trim();
  const startTime = (formData.get("start_time") as string)?.trim();
  const endTime = (formData.get("end_time") as string)?.trim();
  const shiftTypeId =
    (formData.get("shift_type_id") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!scheduleId) {
    return { success: false, error: "Schedule ID is required" };
  }
  if (!employeeId) {
    return { success: false, error: "Employee is required" };
  }
  if (!shiftDate) {
    return { success: false, error: "Shift date is required" };
  }
  if (!startTime) {
    return { success: false, error: "Start time is required" };
  }
  if (!endTime) {
    return { success: false, error: "End time is required" };
  }

  const { data, error: dbError } = await supabase
    .from("schedule_entries")
    .insert({
      facility_id: profile.facility_id,
      schedule_id: scheduleId,
      employee_id: employeeId,
      shift_type_id: shiftTypeId,
      shift_date: shiftDate,
      start_time: startTime,
      end_time: endTime,
      notes,
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create schedule entry",
    };
  }

  revalidatePath("/scheduling");
  return { success: true, data: data as ScheduleEntry };
}

export async function updateScheduleEntry(
  id: string,
  formData: FormData
): Promise<ActionResult<ScheduleEntry>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!isManagerOrAbove(profile.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Entry ID is required" };
  }

  const employeeId = (formData.get("employee_id") as string)?.trim();
  const shiftDate = (formData.get("shift_date") as string)?.trim();
  const startTime = (formData.get("start_time") as string)?.trim();
  const endTime = (formData.get("end_time") as string)?.trim();
  const shiftTypeId =
    (formData.get("shift_type_id") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!employeeId) {
    return { success: false, error: "Employee is required" };
  }
  if (!shiftDate) {
    return { success: false, error: "Shift date is required" };
  }
  if (!startTime) {
    return { success: false, error: "Start time is required" };
  }
  if (!endTime) {
    return { success: false, error: "End time is required" };
  }

  const { data, error: dbError } = await supabase
    .from("schedule_entries")
    .update({
      employee_id: employeeId,
      shift_type_id: shiftTypeId,
      shift_date: shiftDate,
      start_time: startTime,
      end_time: endTime,
      notes,
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to update schedule entry",
    };
  }

  revalidatePath("/scheduling");
  return { success: true, data: data as ScheduleEntry };
}

export async function deleteScheduleEntry(
  id: string
): Promise<ActionResult<null>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!isManagerOrAbove(profile.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Entry ID is required" };
  }

  const { error: dbError } = await supabase
    .from("schedule_entries")
    .delete()
    .eq("id", id)
    .eq("facility_id", profile.facility_id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/scheduling");
  return { success: true, data: null };
}

// ============================================================
// EMPLOYEE AVAILABILITY
// ============================================================

export async function getEmployeeAvailability(
  employeeId: string
): Promise<ActionResult<EmployeeAvailability[]>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!employeeId) {
    return { success: false, error: "Employee ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("employee_availability")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("facility_id", profile.facility_id)
    .order("day_of_week", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as EmployeeAvailability[] };
}

// ============================================================
// SHIFT SWAP REQUESTS
// ============================================================

export async function getShiftSwapRequests(): Promise<
  ActionResult<ShiftSwapRequest[]>
> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const { data, error: dbError } = await supabase
    .from("shift_swap_requests")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("created_at", { ascending: false });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as ShiftSwapRequest[] };
}

export async function createShiftSwapRequest(
  formData: FormData
): Promise<ActionResult<ShiftSwapRequest>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const requesterEntryId = (
    formData.get("requester_entry_id") as string
  )?.trim();
  const targetEntryId =
    (formData.get("target_entry_id") as string)?.trim() || null;
  const targetEmployeeId =
    (formData.get("target_employee_id") as string)?.trim() || null;
  const reason = (formData.get("reason") as string)?.trim() || null;

  if (!requesterEntryId) {
    return { success: false, error: "Your shift entry is required" };
  }

  const { data, error: dbError } = await supabase
    .from("shift_swap_requests")
    .insert({
      facility_id: profile.facility_id,
      requester_entry_id: requesterEntryId,
      target_entry_id: targetEntryId,
      target_employee_id: targetEmployeeId,
      status: "pending" as SwapStatus,
      reason,
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create swap request",
    };
  }

  revalidatePath("/scheduling");
  return { success: true, data: data as ShiftSwapRequest };
}

export async function approveShiftSwap(
  id: string
): Promise<ActionResult<ShiftSwapRequest>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!isManagerOrAbove(profile.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Swap request ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("shift_swap_requests")
    .update({
      status: "approved" as SwapStatus,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to approve swap request",
    };
  }

  revalidatePath("/scheduling");
  return { success: true, data: data as ShiftSwapRequest };
}

export async function denyShiftSwap(
  id: string
): Promise<ActionResult<ShiftSwapRequest>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!isManagerOrAbove(profile.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Swap request ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("shift_swap_requests")
    .update({
      status: "denied" as SwapStatus,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to deny swap request",
    };
  }

  revalidatePath("/scheduling");
  return { success: true, data: data as ShiftSwapRequest };
}

// ============================================================
// TIME OFF REQUESTS
// ============================================================

export async function getTimeOffRequests(): Promise<
  ActionResult<TimeOffRequest[]>
> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const { data, error: dbError } = await supabase
    .from("time_off_requests")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("start_date", { ascending: false });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as TimeOffRequest[] };
}

export async function createTimeOffRequest(
  formData: FormData
): Promise<ActionResult<TimeOffRequest>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const startDate = (formData.get("start_date") as string)?.trim();
  const endDate = (formData.get("end_date") as string)?.trim();
  const reason = (formData.get("reason") as string)?.trim() || null;

  if (!startDate) {
    return { success: false, error: "Start date is required" };
  }
  if (!endDate) {
    return { success: false, error: "End date is required" };
  }

  const { data, error: dbError } = await supabase
    .from("time_off_requests")
    .insert({
      facility_id: profile.facility_id,
      employee_id: profile.id,
      start_date: startDate,
      end_date: endDate,
      reason,
      status: "pending" as TimeOffStatus,
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create time off request",
    };
  }

  revalidatePath("/scheduling");
  return { success: true, data: data as TimeOffRequest };
}

export async function approveTimeOff(
  id: string
): Promise<ActionResult<TimeOffRequest>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!isManagerOrAbove(profile.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Time off request ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("time_off_requests")
    .update({
      status: "approved" as TimeOffStatus,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to approve time off request",
    };
  }

  revalidatePath("/scheduling");
  return { success: true, data: data as TimeOffRequest };
}

export async function denyTimeOff(
  id: string
): Promise<ActionResult<TimeOffRequest>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!isManagerOrAbove(profile.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Time off request ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("time_off_requests")
    .update({
      status: "denied" as TimeOffStatus,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to deny time off request",
    };
  }

  revalidatePath("/scheduling");
  return { success: true, data: data as TimeOffRequest };
}

// ============================================================
// HELPERS FOR PAGE DATA
// ============================================================

export async function getEmployees(): Promise<ActionResult<Profile[]>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const { data, error: dbError } = await supabase
    .from("profiles")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as Profile[] };
}
