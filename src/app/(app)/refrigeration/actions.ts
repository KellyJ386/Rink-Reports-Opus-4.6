"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/actions";
import type {
  RefrigerationReading,
  RefrigerationMaintenance,
  Equipment,
  Threshold,
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
// REFRIGERATION READINGS
// ============================================================

export async function getRefrigerationReadings(
  equipmentId?: string
): Promise<ActionResult<RefrigerationReading[]>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  let query = supabase
    .from("refrigeration_readings")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("event_time", { ascending: false })
    .limit(100);

  if (equipmentId) {
    query = query.eq("equipment_id", equipmentId);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as RefrigerationReading[] };
}

export async function createReading(
  formData: FormData
): Promise<ActionResult<RefrigerationReading>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const equipmentId =
    (formData.get("equipment_id") as string)?.trim() || null;
  const eventTime =
    (formData.get("event_time") as string)?.trim() ||
    new Date().toISOString();

  const parseNumericField = (field: string): number | null => {
    const value = formData.get(field) as string;
    if (!value?.trim()) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const suctionPressure = parseNumericField("suction_pressure_psi");
  const dischargePressure = parseNumericField("discharge_pressure_psi");
  const suctionTemp = parseNumericField("suction_temperature_f");
  const dischargeTemp = parseNumericField("discharge_temperature_f");
  const oilPressure = parseNumericField("oil_pressure_psi");
  const oilTemp = parseNumericField("oil_temperature_f");
  const condenserPressure = parseNumericField("condenser_pressure_psi");
  const condenserTemp = parseNumericField("condenser_temperature_f");
  const brineSupplyTemp = parseNumericField("brine_supply_temperature_f");
  const brineReturnTemp = parseNumericField("brine_return_temperature_f");
  const slabTemp = parseNumericField("slab_temperature_f");
  const roomTemp = parseNumericField("room_temperature_f");
  const roomHumidity = parseNumericField("room_humidity_percent");

  // At least one reading should be provided
  const hasValues =
    suctionPressure !== null ||
    dischargePressure !== null ||
    suctionTemp !== null ||
    dischargeTemp !== null ||
    oilPressure !== null ||
    oilTemp !== null ||
    condenserPressure !== null ||
    condenserTemp !== null ||
    brineSupplyTemp !== null ||
    brineReturnTemp !== null ||
    slabTemp !== null ||
    roomTemp !== null ||
    roomHumidity !== null;

  if (!hasValues) {
    return {
      success: false,
      error: "At least one reading value is required",
    };
  }

  const isFlagged = formData.get("is_flagged") === "true";
  const notes = (formData.get("notes") as string)?.trim() || null;

  const { data, error: dbError } = await supabase
    .from("refrigeration_readings")
    .insert({
      facility_id: profile.facility_id,
      equipment_id: equipmentId,
      suction_pressure_psi: suctionPressure,
      discharge_pressure_psi: dischargePressure,
      suction_temperature_f: suctionTemp,
      discharge_temperature_f: dischargeTemp,
      oil_pressure_psi: oilPressure,
      oil_temperature_f: oilTemp,
      condenser_pressure_psi: condenserPressure,
      condenser_temperature_f: condenserTemp,
      brine_supply_temperature_f: brineSupplyTemp,
      brine_return_temperature_f: brineReturnTemp,
      slab_temperature_f: slabTemp,
      room_temperature_f: roomTemp,
      room_humidity_percent: roomHumidity,
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

  revalidatePath("/refrigeration");
  return { success: true, data: data as RefrigerationReading };
}

export async function getReading(
  id: string
): Promise<ActionResult<RefrigerationReading>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  if (!id) {
    return { success: false, error: "Reading ID is required" };
  }

  const { data, error: dbError } = await supabase
    .from("refrigeration_readings")
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

  return { success: true, data: data as RefrigerationReading };
}

// ============================================================
// REFRIGERATION MAINTENANCE
// ============================================================

export async function getRefrigerationMaintenance(
  equipmentId?: string
): Promise<ActionResult<RefrigerationMaintenance[]>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  let query = supabase
    .from("refrigeration_maintenance")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .order("event_time", { ascending: false })
    .limit(100);

  if (equipmentId) {
    query = query.eq("equipment_id", equipmentId);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as RefrigerationMaintenance[] };
}

export async function createMaintenance(
  formData: FormData
): Promise<ActionResult<RefrigerationMaintenance>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const equipmentId = (formData.get("equipment_id") as string)?.trim();
  const maintenanceType = (
    formData.get("maintenance_type") as string
  )?.trim();

  if (!equipmentId) {
    return { success: false, error: "Equipment is required" };
  }
  if (!maintenanceType) {
    return { success: false, error: "Maintenance type is required" };
  }

  const description =
    (formData.get("description") as string)?.trim() || null;
  const partsReplaced =
    (formData.get("parts_replaced") as string)?.trim() || null;
  const vendor = (formData.get("vendor") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const eventTime =
    (formData.get("event_time") as string)?.trim() ||
    new Date().toISOString();
  const nextDueAt =
    (formData.get("next_due_at") as string)?.trim() || null;

  const parseNumericField = (field: string): number | null => {
    const value = formData.get(field) as string;
    if (!value?.trim()) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const coolantAddedLbs = parseNumericField("coolant_added_lbs");
  const cost = parseNumericField("cost");

  const { data, error: dbError } = await supabase
    .from("refrigeration_maintenance")
    .insert({
      facility_id: profile.facility_id,
      equipment_id: equipmentId,
      maintenance_type: maintenanceType,
      description,
      parts_replaced: partsReplaced,
      coolant_added_lbs: coolantAddedLbs,
      cost,
      performed_by: profile.id,
      vendor,
      event_time: eventTime,
      next_due_at: nextDueAt,
    })
    .select()
    .single();

  if (dbError || !data) {
    return {
      success: false,
      error: dbError?.message ?? "Failed to create maintenance record",
    };
  }

  revalidatePath("/refrigeration");
  return { success: true, data: data as RefrigerationMaintenance };
}

// ============================================================
// COMPRESSORS (EQUIPMENT)
// ============================================================

export async function getCompressors(): Promise<ActionResult<Equipment[]>> {
  const { supabase, profile, error } = await getAuthenticatedUser();
  if (error || !profile) {
    return { success: false, error: error ?? "Not authenticated" };
  }

  const { data, error: dbError } = await supabase
    .from("equipment")
    .select("*")
    .eq("facility_id", profile.facility_id)
    .eq("type", "compressor")
    .order("name", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as Equipment[] };
}

// ============================================================
// THRESHOLDS
// ============================================================

export async function getRefrigerationThresholds(): Promise<
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
    .eq("module", "refrigeration")
    .eq("is_active", true)
    .order("metric_name", { ascending: true });

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true, data: (data ?? []) as Threshold[] };
}
