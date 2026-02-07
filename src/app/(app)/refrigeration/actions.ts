"use server"

import { createClient } from "@/lib/supabase/server"

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
