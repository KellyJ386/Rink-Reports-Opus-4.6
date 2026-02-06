"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/actions";
import type {
  IncidentReport,
  IncidentFollowUp,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
  Profile,
  Rink,
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
// INCIDENTS
// ============================================================

export async function getIncidents(): Promise<ActionResult<IncidentReport[]>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const { data, error: dbError } = await supabase
    .from("incident_reports")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("created_at", { ascending: false });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as IncidentReport[] };
}

export async function getIncident(
  id: string
): Promise<ActionResult<IncidentReport>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!id) {
    return { success: false, error: "Incident ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("incident_reports")
    .select("*")
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Incident not found",
    };
  }

  return { success: true, data: data as IncidentReport };
}

export async function createIncident(
  formData: FormData
): Promise<ActionResult<IncidentReport>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const type = (formData.get("type") as string)?.trim() as IncidentType;
  const severity = (formData.get("severity") as string)
    ?.trim() as IncidentSeverity;

  if (!title) {
    return { success: false, error: "Title is required" };
  }
  if (!description) {
    return { success: false, error: "Description is required" };
  }
  if (!type) {
    return { success: false, error: "Incident type is required" };
  }
  if (!severity) {
    return { success: false, error: "Severity is required" };
  }

  const rinkId = (formData.get("rink_id") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const injuredPartyName =
    (formData.get("injured_party_name") as string)?.trim() || null;
  const injuredPartyContact =
    (formData.get("injured_party_contact") as string)?.trim() || null;
  const witnesses = (formData.get("witnesses") as string)?.trim() || null;
  const immediateAction =
    (formData.get("immediate_action") as string)?.trim() || null;
  const eventTime =
    (formData.get("event_time") as string)?.trim() ||
    new Date().toISOString();

  const { data, error: dbError } = await supabase
    .from("incident_reports")
    .insert({
      facility_id: profile.facility_id,
      rink_id: rinkId,
      type,
      severity,
      status: "open" as IncidentStatus,
      title,
      description,
      location,
      injured_party_name: injuredPartyName,
      injured_party_contact: injuredPartyContact,
      witnesses,
      immediate_action: immediateAction,
      reported_by: profile.id,
      event_time: eventTime,
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create incident",
    };
  }

  revalidatePath("/incidents");
  return { success: true, data: data as IncidentReport };
}

export async function updateIncident(
  id: string,
  formData: FormData
): Promise<ActionResult<IncidentReport>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!id) {
    return { success: false, error: "Incident ID is required" };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const type = (formData.get("type") as string)?.trim() as IncidentType;
  const severity = (formData.get("severity") as string)
    ?.trim() as IncidentSeverity;

  if (!title) {
    return { success: false, error: "Title is required" };
  }
  if (!description) {
    return { success: false, error: "Description is required" };
  }

  const updates: Record<string, unknown> = {
    title,
    description,
    location: (formData.get("location") as string)?.trim() || null,
    injured_party_name:
      (formData.get("injured_party_name") as string)?.trim() || null,
    injured_party_contact:
      (formData.get("injured_party_contact") as string)?.trim() || null,
    witnesses: (formData.get("witnesses") as string)?.trim() || null,
    immediate_action:
      (formData.get("immediate_action") as string)?.trim() || null,
    root_cause: (formData.get("root_cause") as string)?.trim() || null,
    assigned_to: (formData.get("assigned_to") as string)?.trim() || null,
  };

  if (type) updates.type = type;
  if (severity) updates.severity = severity;

  const status = (formData.get("status") as string)?.trim();
  if (status) updates.status = status;

  const { data, error: dbError } = await supabase
    .from("incident_reports")
    .update(updates)
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to update incident",
    };
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
  return { success: true, data: data as IncidentReport };
}

export async function resolveIncident(
  id: string,
  formData: FormData
): Promise<ActionResult<IncidentReport>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!isManagerOrAbove(profile.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Incident ID is required" };
  }

  const rootCause = (formData.get("root_cause") as string)?.trim() || null;

  const { data, error: dbError } = await supabase
    .from("incident_reports")
    .update({
      status: "resolved" as IncidentStatus,
      root_cause: rootCause,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to resolve incident",
    };
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
  return { success: true, data: data as IncidentReport };
}

export async function closeIncident(
  id: string
): Promise<ActionResult<IncidentReport>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!isManagerOrAbove(profile.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  if (!id) {
    return { success: false, error: "Incident ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("incident_reports")
    .update({
      status: "closed" as IncidentStatus,
      closed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to close incident",
    };
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
  return { success: true, data: data as IncidentReport };
}

// ============================================================
// FOLLOW-UPS
// ============================================================

export async function getFollowUps(
  incidentId: string
): Promise<ActionResult<IncidentFollowUp[]>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!incidentId) {
    return { success: false, error: "Incident ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("incident_follow_ups")
    .select("*")
    .eq("incident_id", incidentId)
    .eq("facility_id", profile.facility_id)
    .order("follow_up_date", { ascending: false });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as IncidentFollowUp[] };
}

export async function createFollowUp(
  formData: FormData
): Promise<ActionResult<IncidentFollowUp>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const incidentId = (formData.get("incident_id") as string)?.trim();
  const actionTaken = (formData.get("action_taken") as string)?.trim();

  if (!incidentId) {
    return { success: false, error: "Incident ID is required" };
  }
  if (!actionTaken) {
    return { success: false, error: "Action taken is required" };
  }

  const notes = (formData.get("notes") as string)?.trim() || null;
  const followUpDate =
    (formData.get("follow_up_date") as string)?.trim() ||
    new Date().toISOString().split("T")[0];

  const { data, error: dbError } = await supabase
    .from("incident_follow_ups")
    .insert({
      facility_id: profile.facility_id,
      incident_id: incidentId,
      action_taken: actionTaken,
      notes,
      follow_up_by: profile.id,
      follow_up_date: followUpDate,
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create follow-up",
    };
  }

  revalidatePath(`/incidents/${incidentId}`);
  return { success: true, data: data as IncidentFollowUp };
}

// ============================================================
// HELPERS FOR PAGE DATA
// ============================================================

export async function getRinks(): Promise<ActionResult<Rink[]>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const { data, error: dbError } = await supabase
    .from("rinks")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as Rink[] };
}

export async function getEmployees(): Promise<ActionResult<Profile[]>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const { data, error: dbError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("facility_id", profile.facility_id)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as Profile[] };
}
