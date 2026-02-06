"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/actions";
import type {
  Facility,
  Profile,
  ModuleSetting,
  Equipment,
  Threshold,
  TabConfiguration,
  ChecklistItem,
  ShiftType,
  Rink,
  RinkZone,
  UserRole,
  EquipmentType,
  EquipmentStatus,
  ModuleType,
  ChecklistFieldType,
} from "@/lib/types/database";

// ============================================================
// HELPERS
// ============================================================

async function getAuthenticatedAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, facility_id")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !["super_admin", "facility_admin"].includes(profile.role)
  ) {
    return {
      supabase,
      user,
      profile: null,
      error: "Insufficient permissions",
    };
  }

  return { supabase, user, profile, error: null };
}

// ============================================================
// FACILITY SETTINGS
// ============================================================

export async function getFacility(): Promise<ActionResult<Facility>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data, error: dbError } = await supabase
    .from("facilities")
    .select("*")
    .eq("id", profile.facility_id)
    .single();

  if (dbError || !data) {
    return { success: false, error: dbError?.message ?? "Facility not found" };
  }

  return { success: true, data: data as Facility };
}

export async function updateFacility(
  _facilityId: string,
  payload: Record<string, unknown>
): Promise<ActionResult<Facility>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const name = (payload.name as string)?.trim();
  if (!name) {
    return { success: false, error: "Facility name is required" };
  }

  const updates: Record<string, unknown> = {
    name,
    short_name: (payload.short_name as string)?.trim() || null,
    address_line1: (payload.address_line1 as string)?.trim() || null,
    address_line2: (payload.address_line2 as string)?.trim() || null,
    city: (payload.city as string)?.trim() || null,
    state_province: (payload.state_province as string)?.trim() || null,
    postal_code: (payload.postal_code as string)?.trim() || null,
    country: (payload.country as string)?.trim() || "US",
    timezone: (payload.timezone as string)?.trim() || "America/New_York",
    phone: (payload.phone as string)?.trim() || null,
    email: (payload.email as string)?.trim() || null,
    website: (payload.website as string)?.trim() || null,
    logo_url: (payload.logo_url as string)?.trim() || null,
    session_duration_hours: parseInt(
      String(payload.session_duration_hours ?? "10"),
      10
    ),
    number_of_rinks: parseInt(
      String(payload.number_of_rinks ?? "1"),
      10
    ),
  };

  const { data, error: dbError } = await supabase
    .from("facilities")
    .update(updates)
    .eq("id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to update facility",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as Facility };
}

// ============================================================
// USER MANAGEMENT
// ============================================================

export async function getUsers(): Promise<ActionResult<Profile[]>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data, error: dbError } = await supabase
    .from("profiles")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("full_name", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as Profile[] };
}

export async function inviteUser(
  _facilityId: string,
  payload: Record<string, unknown>
): Promise<ActionResult<Profile>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const email = (payload.email as string)?.trim();
  const fullName = (payload.full_name as string)?.trim();
  const role = (payload.role as string)?.trim() as UserRole;
  const phone = (payload.phone as string)?.trim() || null;

  if (!email) {
    return { success: false, error: "Email is required" };
  }
  if (!fullName) {
    return { success: false, error: "Full name is required" };
  }
  if (!role) {
    return { success: false, error: "Role is required" };
  }

  // Facility admins cannot create super_admin users
  if (role === "super_admin" && profile.role !== "super_admin") {
    return {
      success: false,
      error: "Only super admins can create super admin users",
    };
  }

  // Use admin client (service role) to create the auth user
  const adminClient = createAdminClient();

  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (authError) {
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return { success: false, error: "Failed to create user" };
  }

  // Insert profile record using admin client to bypass RLS
  const { data: profileData, error: profileError } = await adminClient
    .from("profiles")
    .insert({
      id: authData.user.id,
      facility_id: profile.facility_id,
      email,
      full_name: fullName,
      role,
      phone,
      is_active: true,
    })
    .select()
    .single();

  if (profileError) {
    // Clean up: remove the auth user if profile creation fails
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: profileError.message };
  }

  // Send password reset email so the invited user can set their password
  await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  revalidatePath("/admin");
  return { success: true, data: profileData as Profile };
}

export async function updateUserRole(
  userId: string,
  role: string
): Promise<ActionResult<Profile>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!userId || !role) {
    return { success: false, error: "User ID and role are required" };
  }

  // Validate role value
  const validRoles: UserRole[] = [
    "super_admin",
    "facility_admin",
    "manager",
    "supervisor",
    "staff",
    "read_only",
  ];
  if (!validRoles.includes(role as UserRole)) {
    return { success: false, error: "Invalid role" };
  }

  // Facility admins cannot assign super_admin role
  if (role === "super_admin" && profile.role !== "super_admin") {
    return {
      success: false,
      error: "Only super admins can assign the super admin role",
    };
  }

  // Verify the target user belongs to the same facility
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("facility_id")
    .eq("id", userId)
    .single();

  if (!targetUser || targetUser.facility_id !== profile.facility_id) {
    return { success: false, error: "User not found in your facility" };
  }

  const { data, error: dbError } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to update user role",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as Profile };
}

export async function toggleUserActive(
  userId: string
): Promise<ActionResult<Profile>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!userId) {
    return { success: false, error: "User ID is required" };
  }

  // Get the current user state
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("is_active, facility_id")
    .eq("id", userId)
    .single();

  if (!targetUser || targetUser.facility_id !== profile.facility_id) {
    return { success: false, error: "User not found in your facility" };
  }

  const { data, error: dbError } = await supabase
    .from("profiles")
    .update({ is_active: !targetUser.is_active })
    .eq("id", userId)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to toggle user status",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as Profile };
}

// ============================================================
// MODULE SETTINGS
// ============================================================

export async function getModuleSettings(): Promise<
  ActionResult<ModuleSetting[]>
> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data, error: dbError } = await supabase
    .from("module_settings")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("module", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as ModuleSetting[] };
}

export async function toggleModule(
  moduleId: string
): Promise<ActionResult<ModuleSetting>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!moduleId) {
    return { success: false, error: "Module ID is required" };
  }

  // Get the current module state
  const { data: currentModule } = await supabase
    .from("module_settings")
    .select("is_enabled, facility_id")
    .eq("id", moduleId)
    .single();

  if (!currentModule || currentModule.facility_id !== profile.facility_id) {
    return { success: false, error: "Module setting not found" };
  }

  const { data, error: dbError } = await supabase
    .from("module_settings")
    .update({ is_enabled: !currentModule.is_enabled })
    .eq("id", moduleId)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to toggle module",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as ModuleSetting };
}

// ============================================================
// EQUIPMENT
// ============================================================

export async function getEquipment(): Promise<ActionResult<Equipment[]>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data, error: dbError } = await supabase
    .from("equipment")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("name", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as Equipment[] };
}

export async function createEquipment(
  _facilityId: string,
  payload: Record<string, unknown>
): Promise<ActionResult<Equipment>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const name = (payload.name as string)?.trim();
  const type = (payload.type as string)?.trim() as EquipmentType;

  if (!name) {
    return { success: false, error: "Equipment name is required" };
  }
  if (!type) {
    return { success: false, error: "Equipment type is required" };
  }

  const maintenanceIntervalDays = String(payload.maintenance_interval_days ?? "");

  const { data, error: dbError } = await supabase
    .from("equipment")
    .insert({
      facility_id: profile.facility_id,
      name,
      type,
      make: (payload.make as string)?.trim() || null,
      model: (payload.model as string)?.trim() || null,
      serial_number: (payload.serial_number as string)?.trim() || null,
      year: payload.year
        ? parseInt(String(payload.year), 10)
        : null,
      status:
        ((payload.status as string)?.trim() as EquipmentStatus) ||
        "active",
      notes: (payload.notes as string)?.trim() || null,
      maintenance_interval_days: maintenanceIntervalDays
        ? parseInt(maintenanceIntervalDays, 10)
        : null,
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create equipment",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as Equipment };
}

export async function updateEquipment(
  id: string,
  payload: Record<string, unknown>
): Promise<ActionResult<Equipment>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Equipment ID is required" };
  }

  const name = (payload.name as string)?.trim();
  const type = (payload.type as string)?.trim() as EquipmentType;

  if (!name) {
    return { success: false, error: "Equipment name is required" };
  }
  if (!type) {
    return { success: false, error: "Equipment type is required" };
  }

  const maintenanceIntervalDays = String(payload.maintenance_interval_days ?? "");

  const { data, error: dbError } = await supabase
    .from("equipment")
    .update({
      name,
      type,
      make: (payload.make as string)?.trim() || null,
      model: (payload.model as string)?.trim() || null,
      serial_number: (payload.serial_number as string)?.trim() || null,
      year: payload.year
        ? parseInt(String(payload.year), 10)
        : null,
      status:
        ((payload.status as string)?.trim() as EquipmentStatus) ||
        "active",
      notes: (payload.notes as string)?.trim() || null,
      maintenance_interval_days: maintenanceIntervalDays
        ? parseInt(maintenanceIntervalDays, 10)
        : null,
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to update equipment",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as Equipment };
}

export async function deleteEquipment(
  id: string
): Promise<ActionResult<null>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Equipment ID is required" };
  }

  const { error: dbError } = await supabase
    .from("equipment")
    .delete()
    .eq("id", id)
    .eq("facility_id", profile.facility_id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: null };
}

// ============================================================
// THRESHOLDS
// ============================================================

export async function getThresholds(): Promise<ActionResult<Threshold[]>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data, error: dbError } = await supabase
    .from("thresholds")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("module", { ascending: true })
    .order("metric_name", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as Threshold[] };
}

export async function upsertThreshold(
  formData: FormData
): Promise<ActionResult<Threshold>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const module = (formData.get("module") as string)?.trim() as ModuleType;
  const metricName = (formData.get("metric_name") as string)?.trim();
  const metricLabel = (formData.get("metric_label") as string)?.trim();

  if (!module) {
    return { success: false, error: "Module is required" };
  }
  if (!metricName) {
    return { success: false, error: "Metric name is required" };
  }
  if (!metricLabel) {
    return { success: false, error: "Metric label is required" };
  }

  const parseNumericField = (field: string): number | null => {
    const value = formData.get(field) as string;
    if (!value?.trim()) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const thresholdData = {
    facility_id: profile.facility_id,
    module,
    metric_name: metricName,
    metric_label: metricLabel,
    unit: (formData.get("unit") as string)?.trim() || null,
    warning_low: parseNumericField("warning_low"),
    warning_high: parseNumericField("warning_high"),
    critical_low: parseNumericField("critical_low"),
    critical_high: parseNumericField("critical_high"),
    is_active: formData.get("is_active") !== "false",
  };

  // Check if a threshold with this facility_id + module + metric_name exists
  const existingId = (formData.get("id") as string)?.trim();

  let data;
  let dbError;

  if (existingId) {
    // Update existing threshold
    const result = await supabase
      .from("thresholds")
      .update(thresholdData)
      .eq("id", existingId)
      .eq("facility_id", profile.facility_id)
      .select()
      .single();
    data = result.data;
    dbError = result.error;
  } else {
    // Insert new threshold
    const result = await supabase
      .from("thresholds")
      .insert(thresholdData)
      .select()
      .single();
    data = result.data;
    dbError = result.error;
  }

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to save threshold",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as Threshold };
}

export async function deleteThreshold(
  id: string
): Promise<ActionResult<null>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Threshold ID is required" };
  }

  const { error: dbError } = await supabase
    .from("thresholds")
    .delete()
    .eq("id", id)
    .eq("facility_id", profile.facility_id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: null };
}

// ============================================================
// TAB CONFIGURATIONS
// ============================================================

export async function getTabConfigurations(): Promise<
  ActionResult<TabConfiguration[]>
> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data, error: dbError } = await supabase
    .from("tab_configurations")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as TabConfiguration[] };
}

export async function createTab(
  formData: FormData
): Promise<ActionResult<TabConfiguration>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const name = (formData.get("name") as string)?.trim();
  const label = (formData.get("label") as string)?.trim();

  if (!name) {
    return { success: false, error: "Tab name is required" };
  }
  if (!label) {
    return { success: false, error: "Tab label is required" };
  }

  const sortOrderStr = formData.get("sort_order") as string;

  const { data, error: dbError } = await supabase
    .from("tab_configurations")
    .insert({
      facility_id: profile.facility_id,
      module:
        ((formData.get("module") as string)?.trim() as ModuleType) ||
        "daily_reports",
      name,
      label,
      description: (formData.get("description") as string)?.trim() || null,
      sort_order: sortOrderStr ? parseInt(sortOrderStr, 10) : 0,
      is_active: formData.get("is_active") !== "false",
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create tab",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as TabConfiguration };
}

export async function updateTab(
  id: string,
  formData: FormData
): Promise<ActionResult<TabConfiguration>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Tab ID is required" };
  }

  const name = (formData.get("name") as string)?.trim();
  const label = (formData.get("label") as string)?.trim();

  if (!name) {
    return { success: false, error: "Tab name is required" };
  }
  if (!label) {
    return { success: false, error: "Tab label is required" };
  }

  const sortOrderStr = formData.get("sort_order") as string;

  const { data, error: dbError } = await supabase
    .from("tab_configurations")
    .update({
      module:
        ((formData.get("module") as string)?.trim() as ModuleType) ||
        "daily_reports",
      name,
      label,
      description: (formData.get("description") as string)?.trim() || null,
      sort_order: sortOrderStr ? parseInt(sortOrderStr, 10) : 0,
      is_active: formData.get("is_active") !== "false",
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to update tab",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as TabConfiguration };
}

export async function deleteTab(id: string): Promise<ActionResult<null>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Tab ID is required" };
  }

  // Deleting a tab will cascade delete its checklist_items (ON DELETE CASCADE)
  const { error: dbError } = await supabase
    .from("tab_configurations")
    .delete()
    .eq("id", id)
    .eq("facility_id", profile.facility_id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: null };
}

// ============================================================
// CHECKLIST ITEMS
// ============================================================

export async function getChecklistItems(
  tabId: string
): Promise<ActionResult<ChecklistItem[]>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!tabId) {
    return { success: false, error: "Tab ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("tab_id", tabId)
    .eq("facility_id", profile.facility_id)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as ChecklistItem[] };
}

export async function createChecklistItem(
  _facilityId: string,
  payload: Record<string, unknown>
): Promise<ActionResult<ChecklistItem>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const tabId = (payload.tab_id as string)?.trim();
  const label = (payload.label as string)?.trim();
  const fieldType = (payload.field_type as string)?.trim() as ChecklistFieldType;

  if (!tabId) {
    return { success: false, error: "Tab ID is required" };
  }
  if (!label) {
    return { success: false, error: "Label is required" };
  }
  if (!fieldType) {
    return { success: false, error: "Field type is required" };
  }

  // Verify the tab belongs to this facility
  const { data: tab } = await supabase
    .from("tab_configurations")
    .select("id, facility_id")
    .eq("id", tabId)
    .eq("facility_id", profile.facility_id)
    .single();

  if (!tab) {
    return { success: false, error: "Tab not found in your facility" };
  }

  // Parse options (JSON array string)
  let options: string[] | null = null;
  const optionsStr = (payload.options as string)?.trim();
  if (optionsStr) {
    try {
      options = JSON.parse(optionsStr);
    } catch {
      return { success: false, error: "Invalid options format (expected JSON array)" };
    }
  }

  const parseNumericField = (field: string): number | null => {
    const value = String(payload[field] ?? "");
    if (!value?.trim()) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const sortOrderStr = String(payload.sort_order ?? "");

  const { data, error: dbError } = await supabase
    .from("checklist_items")
    .insert({
      facility_id: profile.facility_id,
      tab_id: tabId,
      label,
      description: (payload.description as string)?.trim() || null,
      field_type: fieldType,
      options,
      default_value: (payload.default_value as string)?.trim() || null,
      unit: (payload.unit as string)?.trim() || null,
      min_value: parseNumericField("min_value"),
      max_value: parseNumericField("max_value"),
      is_required: payload.is_required === "true",
      sort_order: sortOrderStr ? parseInt(sortOrderStr, 10) : 0,
      is_active: payload.is_active !== "false",
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create checklist item",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as ChecklistItem };
}

export async function updateChecklistItem(
  id: string,
  payload: Record<string, unknown>
): Promise<ActionResult<ChecklistItem>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Checklist item ID is required" };
  }

  const label = (payload.label as string)?.trim();
  const fieldType = (payload.field_type as string)?.trim() as ChecklistFieldType;

  if (!label) {
    return { success: false, error: "Label is required" };
  }
  if (!fieldType) {
    return { success: false, error: "Field type is required" };
  }

  // Parse options (JSON array string)
  let options: string[] | null = null;
  const optionsStr = (payload.options as string)?.trim();
  if (optionsStr) {
    try {
      options = JSON.parse(optionsStr);
    } catch {
      return { success: false, error: "Invalid options format (expected JSON array)" };
    }
  }

  const parseNumericField = (field: string): number | null => {
    const value = String(payload[field] ?? "");
    if (!value?.trim()) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const sortOrderStr = String(payload.sort_order ?? "");

  const { data, error: dbError } = await supabase
    .from("checklist_items")
    .update({
      label,
      description: (payload.description as string)?.trim() || null,
      field_type: fieldType,
      options,
      default_value: (payload.default_value as string)?.trim() || null,
      unit: (payload.unit as string)?.trim() || null,
      min_value: parseNumericField("min_value"),
      max_value: parseNumericField("max_value"),
      is_required: payload.is_required === "true",
      sort_order: sortOrderStr ? parseInt(sortOrderStr, 10) : 0,
      is_active: payload.is_active !== "false",
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to update checklist item",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as ChecklistItem };
}

export async function deleteChecklistItem(
  id: string
): Promise<ActionResult<null>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Checklist item ID is required" };
  }

  const { error: dbError } = await supabase
    .from("checklist_items")
    .delete()
    .eq("id", id)
    .eq("facility_id", profile.facility_id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: null };
}

// ============================================================
// SHIFT TYPES
// ============================================================

export async function getShiftTypes(): Promise<ActionResult<ShiftType[]>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data, error: dbError } = await supabase
    .from("shift_types")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("name", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as ShiftType[] };
}

export async function createShiftType(
  _facilityId: string,
  payload: Record<string, unknown>
): Promise<ActionResult<ShiftType>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const name = (payload.name as string)?.trim();

  if (!name) {
    return { success: false, error: "Shift type name is required" };
  }

  const { data, error: dbError } = await supabase
    .from("shift_types")
    .insert({
      facility_id: profile.facility_id,
      name,
      color: (payload.color as string)?.trim() || "#002244",
      start_time: (payload.start_time as string)?.trim() || null,
      end_time: (payload.end_time as string)?.trim() || null,
      is_active: payload.is_active !== "false",
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create shift type",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as ShiftType };
}

export async function updateShiftType(
  id: string,
  payload: Record<string, unknown>
): Promise<ActionResult<ShiftType>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Shift type ID is required" };
  }

  const name = (payload.name as string)?.trim();

  if (!name) {
    return { success: false, error: "Shift type name is required" };
  }

  const { data, error: dbError } = await supabase
    .from("shift_types")
    .update({
      name,
      color: (payload.color as string)?.trim() || "#002244",
      start_time: (payload.start_time as string)?.trim() || null,
      end_time: (payload.end_time as string)?.trim() || null,
      is_active: payload.is_active !== "false",
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to update shift type",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as ShiftType };
}

export async function deleteShiftType(
  id: string
): Promise<ActionResult<null>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Shift type ID is required" };
  }

  const { error: dbError } = await supabase
    .from("shift_types")
    .delete()
    .eq("id", id)
    .eq("facility_id", profile.facility_id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: null };
}

// ============================================================
// RINKS
// ============================================================

export type RinkWithZones = Rink & { rink_zones: RinkZone[] };

export async function getRinks(): Promise<ActionResult<RinkWithZones[]>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data, error: dbError } = await supabase
    .from("rinks")
    .select("*, rink_zones(*)")
    .eq("facility_id", profile.facility_id)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as RinkWithZones[] };
}

export async function createRink(
  _facilityId: string,
  payload: Record<string, unknown>
): Promise<ActionResult<Rink>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const name = (payload.name as string)?.trim();

  if (!name) {
    return { success: false, error: "Rink name is required" };
  }

  const parseNumericField = (field: string): number | null => {
    const value = String(payload[field] ?? "");
    if (!value?.trim()) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const sortOrderStr = String(payload.sort_order ?? "");

  const { data, error: dbError } = await supabase
    .from("rinks")
    .insert({
      facility_id: profile.facility_id,
      name,
      dimensions_length: parseNumericField("dimensions_length"),
      dimensions_width: parseNumericField("dimensions_width"),
      surface_type:
        (payload.surface_type as string)?.trim() || "ice",
      is_active: payload.is_active !== "false",
      sort_order: sortOrderStr ? parseInt(sortOrderStr, 10) : 0,
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create rink",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as Rink };
}

export async function updateRink(
  id: string,
  payload: Record<string, unknown>
): Promise<ActionResult<Rink>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Rink ID is required" };
  }

  const name = (payload.name as string)?.trim();

  if (!name) {
    return { success: false, error: "Rink name is required" };
  }

  const parseNumericField = (field: string): number | null => {
    const value = String(payload[field] ?? "");
    if (!value?.trim()) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const sortOrderStr = String(payload.sort_order ?? "");

  const { data, error: dbError } = await supabase
    .from("rinks")
    .update({
      name,
      dimensions_length: parseNumericField("dimensions_length"),
      dimensions_width: parseNumericField("dimensions_width"),
      surface_type:
        (payload.surface_type as string)?.trim() || "ice",
      is_active: payload.is_active !== "false",
      sort_order: sortOrderStr ? parseInt(sortOrderStr, 10) : 0,
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to update rink",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as Rink };
}

export async function deleteRink(id: string): Promise<ActionResult<null>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Rink ID is required" };
  }

  // Deleting a rink will cascade delete its rink_zones (ON DELETE CASCADE)
  const { error: dbError } = await supabase
    .from("rinks")
    .delete()
    .eq("id", id)
    .eq("facility_id", profile.facility_id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: null };
}

// ============================================================
// RINK ZONES
// ============================================================

export async function createRinkZone(
  _facilityId: string,
  payload: Record<string, unknown>
): Promise<ActionResult<RinkZone>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const rinkId = (payload.rink_id as string)?.trim();
  const name = (payload.name as string)?.trim();
  const label = (payload.label as string)?.trim();

  if (!rinkId) {
    return { success: false, error: "Rink ID is required" };
  }
  if (!name) {
    return { success: false, error: "Zone name is required" };
  }
  if (!label) {
    return { success: false, error: "Zone label is required" };
  }

  // Verify the rink belongs to this facility
  const { data: rink } = await supabase
    .from("rinks")
    .select("id, facility_id")
    .eq("id", rinkId)
    .eq("facility_id", profile.facility_id)
    .single();

  if (!rink) {
    return { success: false, error: "Rink not found in your facility" };
  }

  const parseNumericField = (field: string): number | null => {
    const value = String(payload[field] ?? "");
    if (!value?.trim()) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const sortOrderStr = String(payload.sort_order ?? "");

  const { data, error: dbError } = await supabase
    .from("rink_zones")
    .insert({
      rink_id: rinkId,
      facility_id: profile.facility_id,
      name,
      label,
      x_position: parseNumericField("x_position"),
      y_position: parseNumericField("y_position"),
      sort_order: sortOrderStr ? parseInt(sortOrderStr, 10) : 0,
      is_active: payload.is_active !== "false",
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create rink zone",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as RinkZone };
}

export async function updateRinkZone(
  id: string,
  payload: Record<string, unknown>
): Promise<ActionResult<RinkZone>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Rink zone ID is required" };
  }

  const name = (payload.name as string)?.trim();
  const label = (payload.label as string)?.trim();

  if (!name) {
    return { success: false, error: "Zone name is required" };
  }
  if (!label) {
    return { success: false, error: "Zone label is required" };
  }

  const parseNumericField = (field: string): number | null => {
    const value = String(payload[field] ?? "");
    if (!value?.trim()) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const sortOrderStr = String(payload.sort_order ?? "");

  const { data, error: dbError } = await supabase
    .from("rink_zones")
    .update({
      name,
      label,
      x_position: parseNumericField("x_position"),
      y_position: parseNumericField("y_position"),
      sort_order: sortOrderStr ? parseInt(sortOrderStr, 10) : 0,
      is_active: payload.is_active !== "false",
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to update rink zone",
    };
  }

  revalidatePath("/admin");
  return { success: true, data: data as RinkZone };
}

export async function deleteRinkZone(
  id: string
): Promise<ActionResult<null>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Rink zone ID is required" };
  }

  const { error: dbError } = await supabase
    .from("rink_zones")
    .delete()
    .eq("id", id)
    .eq("facility_id", profile.facility_id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: null };
}

// ============================================================
// WRAPPER / ALIAS EXPORTS
// Bridge component-expected API with actual implementations
// ============================================================

export async function updateUser(
  userId: string,
  payload: { full_name?: string; role?: string }
): Promise<ActionResult<Profile>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const updates: Record<string, unknown> = {};
  if (payload.full_name) updates.full_name = payload.full_name;
  if (payload.role) updates.role = payload.role;

  const { data, error: dbError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: data as Profile };
}

export async function deactivateUser(
  userId: string,
  isActive: boolean
): Promise<ActionResult<Profile>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data, error: dbError } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: data as Profile };
}

export async function updateModuleSetting(
  _facilityId: string,
  moduleType: string,
  enabled: boolean
): Promise<ActionResult<ModuleSetting>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data: existing } = await supabase
    .from("module_settings")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .eq("module", moduleType)
    .single();

  if (!existing) {
    return { success: false, error: "Module setting not found" };
  }

  const { data, error: dbError } = await supabase
    .from("module_settings")
    .update({ is_enabled: enabled })
    .eq("id", existing.id)
    .select()
    .single();

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: data as ModuleSetting };
}

export async function createThreshold(
  _facilityId: string,
  payload: Record<string, unknown>
): Promise<ActionResult<Threshold>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data, error: dbError } = await supabase
    .from("thresholds")
    .insert({ facility_id: profile.facility_id, ...payload })
    .select()
    .single();

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: data as Threshold };
}

export async function updateThreshold(
  id: string,
  payload: Record<string, unknown>
): Promise<ActionResult<Threshold>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { facility_id: _fid, id: _id, created_at: _ca, updated_at: _ua, ...safePayload } = payload;

  const { data, error: dbError } = await supabase
    .from("thresholds")
    .update(safePayload)
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: data as Threshold };
}

export async function createTabConfiguration(
  _facilityId: string,
  payload: Record<string, unknown>
): Promise<ActionResult<TabConfiguration>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data, error: dbError } = await supabase
    .from("tab_configurations")
    .insert({ facility_id: profile.facility_id, ...payload })
    .select()
    .single();

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: data as TabConfiguration };
}

export async function updateTabConfiguration(
  id: string,
  payload: Record<string, unknown>
): Promise<ActionResult<TabConfiguration>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { facility_id: _fid, id: _id, created_at: _ca, updated_at: _ua, ...safePayload } = payload;

  const { data, error: dbError } = await supabase
    .from("tab_configurations")
    .update(safePayload)
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true, data: data as TabConfiguration };
}

export async function deleteTabConfiguration(
  id: string
): Promise<ActionResult<null>> {
  return deleteTab(id);
}

export async function getRinkZones(): Promise<ActionResult<RinkZone[]>> {
  const { supabase, profile, error } = await getAuthenticatedAdmin();
  if (error || !profile) {
    return { success: false, error: error ?? "Insufficient permissions" };
  }

  const { data, error: dbError } = await supabase
    .from("rink_zones")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("sort_order");

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as RinkZone[] };
}
