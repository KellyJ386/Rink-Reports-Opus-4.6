"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/actions";
import type {
  AirQualityReading,
  Threshold,
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

// ============================================================
// AIR QUALITY READINGS
// ============================================================

export async function getAirQualityReadings(
  rinkId?: string
): Promise<ActionResult<AirQualityReading[]>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  let query = supabase
    .from("air_quality_readings")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("event_time", { ascending: false })
    .limit(100);

  if (rinkId) {
    query = query.eq("rink_id", rinkId);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as AirQualityReading[] };
}

export async function getAirQualityReading(
  id: string
): Promise<ActionResult<AirQualityReading>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!id) {
    return { success: false, error: "Reading ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("air_quality_readings")
    .select("*")
    .eq("id", id)
    .eq("facility_id", profile.facility_id)
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Reading not found",
    };
  }

  return { success: true, data: data as AirQualityReading };
}

export async function createReading(
  formData: FormData
): Promise<ActionResult<AirQualityReading>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const rinkId = (formData.get("rink_id") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const eventTime =
    (formData.get("event_time") as string)?.trim() ||
    new Date().toISOString();

  const parseNumericField = (field: string): number | null => {
    const value = formData.get(field) as string;
    if (!value?.trim()) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const coPpm = parseNumericField("co_ppm");
  const no2Ppm = parseNumericField("no2_ppm");
  const humidityPercent = parseNumericField("humidity_percent");
  const temperatureF = parseNumericField("temperature_f");

  // At least one reading should be provided
  const hasValues =
    coPpm !== null ||
    no2Ppm !== null ||
    humidityPercent !== null ||
    temperatureF !== null;

  if (!hasValues) {
    return {
      success: false,
      error: "At least one reading value is required",
    };
  }

  const isFlagged = formData.get("is_flagged") === "true";
  const notes = (formData.get("notes") as string)?.trim() || null;

  const { data, error: dbError } = await supabase
    .from("air_quality_readings")
    .insert({
      facility_id: profile.facility_id,
      rink_id: rinkId,
      co_ppm: coPpm,
      no2_ppm: no2Ppm,
      humidity_percent: humidityPercent,
      temperature_f: temperatureF,
      location,
      is_flagged: isFlagged,
      notes,
      recorded_by: profile.id,
      event_time: eventTime,
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create reading",
    };
  }

  revalidatePath("/air-quality");
  return { success: true, data: data as AirQualityReading };
}

// ============================================================
// THRESHOLDS
// ============================================================

export async function getThresholdsForModule(): Promise<
  ActionResult<Threshold[]>
> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const { data, error: dbError } = await supabase
    .from("thresholds")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .eq("module", "air_quality")
    .eq("is_active", true)
    .order("metric_name", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as Threshold[] };
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
