"use server"

import { createClient } from "@/lib/supabase/server"
import { notifyRefrigerationOutOfRange } from "@/lib/services/notify"

/* ---------- Types ---------- */

export interface RefrigerationReading {
  equipmentId: string
  values: Record<string, number | string>
  notes?: string
  timestamp: string
}

/* ---------- Submit a reading ---------- */

export async function submitReading(reading: RefrigerationReading) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase.from("refrigeration_readings").insert({
    equipment_id: reading.equipmentId,
    values: reading.values,
    notes: reading.notes ?? null,
    recorded_at: reading.timestamp,
    recorded_by: user.id,
  })

  if (error) {
    return { error: error.message }
  }

  // Check thresholds and notify if out of range
  const { data: profile } = await supabase
    .from("profiles")
    .select("facility_id")
    .eq("id", user.id)
    .single()

  if (profile?.facility_id) {
    // Fetch equipment info and reading types with thresholds
    const { data: equipment } = await supabase
      .from("equipment")
      .select("name")
      .eq("id", reading.equipmentId)
      .single()

    const { data: readingTypes } = await supabase
      .from("equipment_reading_types")
      .select("key, label, min_value, max_value")
      .eq("equipment_id", reading.equipmentId)

    for (const rt of readingTypes ?? []) {
      const val = reading.values[rt.key]
      if (typeof val === "number") {
        if ((rt.max_value !== null && val > rt.max_value) ||
            (rt.min_value !== null && val < rt.min_value)) {
          notifyRefrigerationOutOfRange({
            facilityId: profile.facility_id,
            equipmentId: reading.equipmentId,
            equipmentName: equipment?.name ?? "Equipment",
            metric: rt.label,
            value: val,
            threshold: rt.max_value !== null && val > rt.max_value ? rt.max_value : rt.min_value!,
          })
        }
      }
    }
  }

  return { success: true }
}

/* ---------- Fetch readings ---------- */

export async function fetchReadings(filters?: {
  equipmentId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from("refrigeration_readings")
    .select("*")
    .order("recorded_at", { ascending: false })

  if (filters?.equipmentId) {
    query = query.eq("equipment_id", filters.equipmentId)
  }
  if (filters?.dateFrom) {
    query = query.gte("recorded_at", filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte("recorded_at", filters.dateTo)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: data ?? [] }
}

/* ---------- Fetch latest reading per equipment ---------- */

export async function fetchLatestReadings() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("refrigeration_readings")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(20)

  if (error) {
    return { error: error.message, data: [] }
  }

  // Group by equipment, keep only latest
  const latest = new Map<string, (typeof data)[number]>()
  for (const row of data ?? []) {
    if (!latest.has(row.equipment_id)) {
      latest.set(row.equipment_id, row)
    }
  }

  return { data: Array.from(latest.values()) }
}
