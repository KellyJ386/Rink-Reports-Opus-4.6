"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/actions";
import type {
  IceMake,
  IceMaintenanceLog,
  Equipment,
  Rink,
} from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Local type for ice operation events (matches user-specified schema)
// ---------------------------------------------------------------------------
export interface IceOperationEvent {
  id: string;
  facility_id: string;
  rink_id: string;
  event_type: "resurfacing" | "flood" | "scrape" | "edge" | "maintenance";
  equipment_id: string | null;
  operator_id: string;
  water_temperature: number | null;
  ice_temperature: number | null;
  humidity: number | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

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
// GET: Ice events with rink name joined
// ---------------------------------------------------------------------------
export async function getIceEvents(
  eventTypeFilter?: string
): Promise<
  ActionResult<
    (IceOperationEvent & {
      rink_name?: string;
      equipment_name?: string;
      operator_name?: string;
    })[]
  >
> {
  const { supabase, profile } = await getAuthenticatedUser();

  if (!profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  let query = supabase
    .from("ice_events")
    .select(`
      *,
      rink:rinks!ice_events_rink_id_fkey(name),
      equipment:equipment!ice_events_equipment_id_fkey(name),
      operator:profiles!ice_events_operator_id_fkey(full_name)
    `)
    .eq("facility_id", profile.facility_id)
    .order("created_at", { ascending: false });

  if (eventTypeFilter && eventTypeFilter !== "all") {
    query = query.eq("event_type", eventTypeFilter);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    return { success: false, error: error.message };
  }

  const events = (data ?? []).map((row: Record<string, unknown>) => {
    const rink = row.rink as { name: string } | null;
    const equipment = row.equipment as { name: string } | null;
    const operator = row.operator as { full_name: string } | null;
    return {
      ...row,
      rink_name: rink?.name ?? undefined,
      equipment_name: equipment?.name ?? undefined,
      operator_name: operator?.full_name ?? undefined,
      rink: undefined,
      equipment: undefined,
      operator: undefined,
    };
  }) as unknown as (IceOperationEvent & {
    rink_name?: string;
    equipment_name?: string;
    operator_name?: string;
  })[];

  return { success: true, data: events };
}

// ---------------------------------------------------------------------------
// GET: Single ice event by ID with rink name
// ---------------------------------------------------------------------------
export async function getIceEvent(
  id: string
): Promise<
  ActionResult<
    IceOperationEvent & {
      rink_name?: string;
      equipment_name?: string;
      operator_name?: string;
    }
  >
> {
  const { supabase, profile } = await getAuthenticatedUser();

  if (!profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  if (!id) {
    return { success: false, error: "Event ID is required" };
  }

  const { data, error } = await supabase
    .from("ice_events")
    .select(`
      *,
      rink:rinks!ice_events_rink_id_fkey(name),
      equipment:equipment!ice_events_equipment_id_fkey(name),
      operator:profiles!ice_events_operator_id_fkey(full_name)
    `)
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Ice event not found",
    };
  }

  const row = data as Record<string, unknown>;
  const rink = row.rink as { name: string } | null;
  const equipment = row.equipment as { name: string } | null;
  const operator = row.operator as { full_name: string } | null;

  const event = {
    ...row,
    rink_name: rink?.name ?? undefined,
    equipment_name: equipment?.name ?? undefined,
    operator_name: operator?.full_name ?? undefined,
    rink: undefined,
    equipment: undefined,
    operator: undefined,
  } as unknown as IceOperationEvent & {
    rink_name?: string;
    equipment_name?: string;
    operator_name?: string;
  };

  return { success: true, data: event };
}

// ---------------------------------------------------------------------------
// CREATE: New ice event (resurfacing, flood, scrape, edge, maintenance)
// ---------------------------------------------------------------------------
export async function createIceEvent(
  formData: FormData
): Promise<ActionResult<IceOperationEvent>> {
  const { supabase, user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const rinkId = formData.get("rink_id") as string;
  const eventType = formData.get("event_type") as string;
  const equipmentId = (formData.get("equipment_id") as string) || null;
  const waterTempStr = formData.get("water_temperature") as string | null;
  const iceTempStr = formData.get("ice_temperature") as string | null;
  const humidityStr = formData.get("humidity") as string | null;
  const durationStr = formData.get("duration_minutes") as string | null;
  const notes = formData.get("notes") as string | null;

  if (!rinkId || !eventType) {
    return { success: false, error: "Rink and event type are required" };
  }

  const validTypes = ["resurfacing", "flood", "scrape", "edge", "maintenance"];
  if (!validTypes.includes(eventType)) {
    return { success: false, error: "Invalid event type" };
  }

  const { data, error } = await supabase
    .from("ice_events")
    .insert({
      facility_id: profile.facility_id,
      rink_id: rinkId,
      event_type: eventType,
      equipment_id: equipmentId,
      operator_id: user.id,
      water_temperature: waterTempStr ? parseFloat(waterTempStr) : null,
      ice_temperature: iceTempStr ? parseFloat(iceTempStr) : null,
      humidity: humidityStr ? parseFloat(humidityStr) : null,
      duration_minutes: durationStr ? parseInt(durationStr, 10) : null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ice-operations");
  return { success: true, data: data as IceOperationEvent };
}

// ---------------------------------------------------------------------------
// GET: Ice makes (resurfacing events), optionally filtered by rink
// ---------------------------------------------------------------------------
export async function getIceMakes(
  rinkId?: string
): Promise<
  ActionResult<
    (IceMake & {
      rink_name?: string;
      equipment_name?: string;
      operator_name?: string;
    })[]
  >
> {
  const { supabase, profile } = await getAuthenticatedUser();

  if (!profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  let query = supabase
    .from("ice_makes")
    .select(`
      *,
      rink:rinks!ice_makes_rink_id_fkey(name),
      equipment:equipment!ice_makes_equipment_id_fkey(name),
      operator:profiles!ice_makes_operator_id_fkey(full_name)
    `)
    .eq("facility_id", profile.facility_id)
    .order("event_time", { ascending: false });

  if (rinkId) {
    query = query.eq("rink_id", rinkId);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return { success: false, error: error.message };
  }

  const iceMakes = (data ?? []).map((row: Record<string, unknown>) => {
    const rink = row.rink as { name: string } | null;
    const equipment = row.equipment as { name: string } | null;
    const operator = row.operator as { full_name: string } | null;
    return {
      ...row,
      rink_name: rink?.name ?? undefined,
      equipment_name: equipment?.name ?? undefined,
      operator_name: operator?.full_name ?? undefined,
      rink: undefined,
      equipment: undefined,
      operator: undefined,
    };
  }) as unknown as (IceMake & {
    rink_name?: string;
    equipment_name?: string;
    operator_name?: string;
  })[];

  return { success: true, data: iceMakes };
}

// ---------------------------------------------------------------------------
// CREATE: New ice make (resurfacing event)
// ---------------------------------------------------------------------------
export async function createIceMake(
  formData: FormData
): Promise<ActionResult<IceMake>> {
  const { supabase, user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const rinkId = formData.get("rink_id") as string;
  const equipmentId = (formData.get("equipment_id") as string) || null;
  const resurfaceType = formData.get("resurface_type") as string;
  const waterTempStr = formData.get("water_temperature_f") as string | null;
  const iceTempStr = formData.get("ice_temperature_f") as string | null;
  const waterUsageStr = formData.get("water_usage_gallons") as string | null;
  const durationStr = formData.get("duration_minutes") as string | null;
  const bladeCondition = (formData.get("blade_condition") as string) || null;
  const notes = formData.get("notes") as string | null;
  const eventTime = (formData.get("event_time") as string) || new Date().toISOString();

  if (!rinkId || !resurfaceType) {
    return { success: false, error: "Rink and resurface type are required" };
  }

  const validTypes = ["full", "half", "spot", "dry_cut"];
  if (!validTypes.includes(resurfaceType)) {
    return { success: false, error: "Invalid resurface type" };
  }

  const validBladeConditions = ["new", "good", "fair", "poor"];
  if (bladeCondition && !validBladeConditions.includes(bladeCondition)) {
    return { success: false, error: "Invalid blade condition" };
  }

  const { data, error } = await supabase
    .from("ice_makes")
    .insert({
      facility_id: profile.facility_id,
      rink_id: rinkId,
      equipment_id: equipmentId,
      resurface_type: resurfaceType as IceMake["resurface_type"],
      water_temperature_f: waterTempStr ? parseFloat(waterTempStr) : null,
      ice_temperature_f: iceTempStr ? parseFloat(iceTempStr) : null,
      water_usage_gallons: waterUsageStr ? parseFloat(waterUsageStr) : null,
      duration_minutes: durationStr ? parseInt(durationStr, 10) : null,
      blade_condition: bladeCondition as IceMake["blade_condition"],
      notes: notes || null,
      operator_id: user.id,
      event_time: eventTime,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ice-operations");
  return { success: true, data: data as IceMake };
}

// ---------------------------------------------------------------------------
// GET: Maintenance logs, optionally filtered by equipment
// ---------------------------------------------------------------------------
export async function getMaintenanceLogs(
  equipmentId?: string
): Promise<
  ActionResult<
    (IceMaintenanceLog & {
      equipment_name?: string;
      performed_by_name?: string;
    })[]
  >
> {
  const { supabase, profile } = await getAuthenticatedUser();

  if (!profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  let query = supabase
    .from("ice_maintenance_logs")
    .select(`
      *,
      equipment:equipment!ice_maintenance_logs_equipment_id_fkey(name),
      performed_by_profile:profiles!ice_maintenance_logs_performed_by_fkey(full_name)
    `)
    .eq("facility_id", profile.facility_id)
    .order("event_time", { ascending: false });

  if (equipmentId) {
    query = query.eq("equipment_id", equipmentId);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return { success: false, error: error.message };
  }

  const logs = (data ?? []).map((row: Record<string, unknown>) => {
    const equipment = row.equipment as { name: string } | null;
    const performedByProfile = row.performed_by_profile as { full_name: string } | null;
    return {
      ...row,
      equipment_name: equipment?.name ?? undefined,
      performed_by_name: performedByProfile?.full_name ?? undefined,
      equipment: undefined,
      performed_by_profile: undefined,
    };
  }) as unknown as (IceMaintenanceLog & {
    equipment_name?: string;
    performed_by_name?: string;
  })[];

  return { success: true, data: logs };
}

// ---------------------------------------------------------------------------
// CREATE: New maintenance log
// ---------------------------------------------------------------------------
export async function createMaintenanceLog(
  formData: FormData
): Promise<ActionResult<IceMaintenanceLog>> {
  const { supabase, user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const equipmentId = formData.get("equipment_id") as string;
  const maintenanceType = formData.get("maintenance_type") as string;
  const description = formData.get("description") as string | null;
  const partsUsed = formData.get("parts_used") as string | null;
  const costStr = formData.get("cost") as string | null;
  const notes = formData.get("notes") as string | null;
  const nextDueAt = formData.get("next_due_at") as string | null;
  const eventTime = (formData.get("event_time") as string) || new Date().toISOString();

  if (!equipmentId || !maintenanceType) {
    return { success: false, error: "Equipment and maintenance type are required" };
  }

  const { data, error } = await supabase
    .from("ice_maintenance_logs")
    .insert({
      facility_id: profile.facility_id,
      equipment_id: equipmentId,
      maintenance_type: maintenanceType,
      description: description || null,
      parts_used: partsUsed || null,
      cost: costStr ? parseFloat(costStr) : null,
      performed_by: user.id,
      event_time: eventTime,
      next_due_at: nextDueAt || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Update the equipment's last_maintenance_at
  await supabase
    .from("equipment")
    .update({
      last_maintenance_at: eventTime,
      next_maintenance_at: nextDueAt || null,
    })
    .eq("id", equipmentId)
    .eq("facility_id", profile.facility_id);

  revalidatePath("/ice-operations");
  return { success: true, data: data as IceMaintenanceLog };
}

// ---------------------------------------------------------------------------
// GET: Equipment list for the current facility (ice-related)
// ---------------------------------------------------------------------------
export async function getEquipmentList(): Promise<ActionResult<Equipment[]>> {
  const { supabase, profile } = await getAuthenticatedUser();

  if (!profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .in("type", ["zamboni", "edger", "other"])
    .order("name");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data ?? []) as Equipment[] };
}

// ---------------------------------------------------------------------------
// GET: Rinks for the current facility
// ---------------------------------------------------------------------------
export async function getRinks(): Promise<ActionResult<Rink[]>> {
  const { supabase, profile } = await getAuthenticatedUser();

  if (!profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const { data, error } = await supabase
    .from("rinks")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data ?? []) as Rink[] };
}

// ---------------------------------------------------------------------------
// Alias: getIceMaintenanceLogs (maps to getMaintenanceLogs)
// ---------------------------------------------------------------------------
export { getMaintenanceLogs as getIceMaintenanceLogs };
