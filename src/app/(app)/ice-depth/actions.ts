"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/actions";
import type {
  IceDepthMeasurement,
  IceEvent,
  Rink,
  RinkZone,
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
// GET: Ice depth measurements, optionally filtered by rink
// ---------------------------------------------------------------------------
export async function getIceDepthMeasurements(
  rinkId?: string
): Promise<
  ActionResult<
    (IceDepthMeasurement & {
      rink_name?: string;
      zone_name?: string;
      measured_by_name?: string;
    })[]
  >
> {
  const { supabase, profile } = await getAuthenticatedUser();

  if (!profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  let query = supabase
    .from("ice_depth_measurements")
    .select(`
      *,
      rink:rinks!ice_depth_measurements_rink_id_fkey(name),
      zone:rink_zones!ice_depth_measurements_zone_id_fkey(name),
      measured_by_profile:profiles!ice_depth_measurements_measured_by_fkey(full_name)
    `)
    .eq("facility_id", profile.facility_id)
    .order("event_time", { ascending: false });

  if (rinkId) {
    query = query.eq("rink_id", rinkId);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    return { success: false, error: error.message };
  }

  const measurements = (data ?? []).map((row: Record<string, unknown>) => {
    const rink = row.rink as { name: string } | null;
    const zone = row.zone as { name: string } | null;
    const measuredByProfile = row.measured_by_profile as { full_name: string } | null;
    return {
      ...row,
      rink_name: rink?.name ?? undefined,
      zone_name: zone?.name ?? undefined,
      measured_by_name: measuredByProfile?.full_name ?? undefined,
      rink: undefined,
      zone: undefined,
      measured_by_profile: undefined,
    };
  }) as unknown as (IceDepthMeasurement & {
    rink_name?: string;
    zone_name?: string;
    measured_by_name?: string;
  })[];

  return { success: true, data: measurements };
}

// ---------------------------------------------------------------------------
// CREATE: New ice depth measurement
// ---------------------------------------------------------------------------
export async function createMeasurement(
  formData: FormData
): Promise<ActionResult<IceDepthMeasurement>> {
  const { supabase, user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const rinkId = formData.get("rink_id") as string;
  const zoneId = formData.get("zone_id") as string;
  const depthInchesStr = formData.get("depth_inches") as string;
  const measurementMethod = (formData.get("measurement_method") as string) || "manual";
  const notes = formData.get("notes") as string | null;
  const eventTime = (formData.get("event_time") as string) || new Date().toISOString();

  if (!rinkId || !zoneId || !depthInchesStr) {
    return { success: false, error: "Rink, zone, and depth are required" };
  }

  const depthInches = parseFloat(depthInchesStr);
  if (isNaN(depthInches) || depthInches < 0) {
    return { success: false, error: "Depth must be a positive number" };
  }

  // Check if the measurement should be flagged based on thresholds
  const { data: thresholds } = await supabase
    .from("thresholds")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .eq("module", "ice_depth")
    .eq("metric_name", "ice_depth_inches")
    .eq("is_active", true)
    .limit(1);

  let isFlagged = false;
  if (thresholds && thresholds.length > 0) {
    const t = thresholds[0];
    if (
      (t.critical_low !== null && depthInches <= t.critical_low) ||
      (t.critical_high !== null && depthInches >= t.critical_high) ||
      (t.warning_low !== null && depthInches <= t.warning_low) ||
      (t.warning_high !== null && depthInches >= t.warning_high)
    ) {
      isFlagged = true;
    }
  }

  const { data, error } = await supabase
    .from("ice_depth_measurements")
    .insert({
      facility_id: profile.facility_id,
      rink_id: rinkId,
      zone_id: zoneId,
      depth_inches: depthInches,
      measurement_method: measurementMethod,
      is_flagged: isFlagged,
      notes: notes || null,
      measured_by: user.id,
      event_time: eventTime,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ice-depth");
  return { success: true, data: data as IceDepthMeasurement };
}

// ---------------------------------------------------------------------------
// GET: Ice events (cuts, floods, resurfaces), optionally filtered by rink
// ---------------------------------------------------------------------------
export async function getIceEvents(
  rinkId?: string
): Promise<
  ActionResult<
    (IceEvent & { rink_name?: string; performed_by_name?: string })[]
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
      performed_by_profile:profiles!ice_events_performed_by_fkey(full_name)
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

  const events = (data ?? []).map((row: Record<string, unknown>) => {
    const rink = row.rink as { name: string } | null;
    const performedByProfile = row.performed_by_profile as { full_name: string } | null;
    return {
      ...row,
      rink_name: rink?.name ?? undefined,
      performed_by_name: performedByProfile?.full_name ?? undefined,
      rink: undefined,
      performed_by_profile: undefined,
    };
  }) as unknown as (IceEvent & { rink_name?: string; performed_by_name?: string })[];

  return { success: true, data: events };
}

// ---------------------------------------------------------------------------
// CREATE: New ice event (cut, flood, resurface, patch)
// ---------------------------------------------------------------------------
export async function createIceEvent(
  formData: FormData
): Promise<ActionResult<IceEvent>> {
  const { supabase, user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const rinkId = formData.get("rink_id") as string;
  const eventType = formData.get("event_type") as string;
  const depthRemovedStr = formData.get("depth_removed_inches") as string | null;
  const depthAddedStr = formData.get("depth_added_inches") as string | null;
  const waterTempStr = formData.get("water_temperature_f") as string | null;
  const notes = formData.get("notes") as string | null;
  const eventTime = (formData.get("event_time") as string) || new Date().toISOString();

  if (!rinkId || !eventType) {
    return { success: false, error: "Rink and event type are required" };
  }

  const validTypes = ["cut", "flood", "full_resurface", "patch"];
  if (!validTypes.includes(eventType)) {
    return { success: false, error: "Invalid event type" };
  }

  const { data, error } = await supabase
    .from("ice_events")
    .insert({
      facility_id: profile.facility_id,
      rink_id: rinkId,
      event_type: eventType as IceEvent["event_type"],
      depth_removed_inches: depthRemovedStr ? parseFloat(depthRemovedStr) : null,
      depth_added_inches: depthAddedStr ? parseFloat(depthAddedStr) : null,
      water_temperature_f: waterTempStr ? parseFloat(waterTempStr) : null,
      notes: notes || null,
      performed_by: user.id,
      event_time: eventTime,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ice-depth");
  return { success: true, data: data as IceEvent };
}

// ---------------------------------------------------------------------------
// GET: Rinks with their zones for the current facility
// ---------------------------------------------------------------------------
export async function getRinksWithZones(): Promise<
  ActionResult<(Rink & { zones: RinkZone[] })[]>
> {
  const { supabase, profile } = await getAuthenticatedUser();

  if (!profile?.facility_id) {
    return { success: false, error: "Not authenticated or no facility assigned" };
  }

  const { data: rinks, error: rinksError } = await supabase
    .from("rinks")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .eq("is_active", true)
    .order("sort_order");

  if (rinksError) {
    return { success: false, error: rinksError.message };
  }

  const rinkIds = (rinks ?? []).map((r: Rink) => r.id);

  const { data: zones, error: zonesError } = await supabase
    .from("rink_zones")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .in("rink_id", rinkIds.length > 0 ? rinkIds : ["__none__"])
    .eq("is_active", true)
    .order("sort_order");

  if (zonesError) {
    return { success: false, error: zonesError.message };
  }

  const rinksWithZones = (rinks ?? []).map((rink: Rink) => ({
    ...rink,
    zones: (zones ?? []).filter((z: RinkZone) => z.rink_id === rink.id),
  }));

  return { success: true, data: rinksWithZones };
}
