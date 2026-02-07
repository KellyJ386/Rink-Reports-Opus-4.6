"use server"

import { createClient } from "@/lib/supabase/server"

/* ---------- Types ---------- */

export interface AirQualityReading {
  location: string
  co: number
  co2: number
  no2: number
  humidity: number
  temperature: number
  notes?: string
  timestamp: string
}

/* ---------- Submit a reading ---------- */

export async function submitAirQualityReading(reading: AirQualityReading) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase.from("air_quality_readings").insert({
    location: reading.location,
    co_ppm: reading.co,
    co2_ppm: reading.co2,
    no2_ppm: reading.no2,
    humidity_pct: reading.humidity,
    temperature_f: reading.temperature,
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

export async function fetchAirQualityReadings(filters?: {
  location?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from("air_quality_readings")
    .select("*")
    .order("recorded_at", { ascending: false })

  if (filters?.location) {
    query = query.eq("location", filters.location)
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

/* ---------- Check compliance ---------- */

const THRESHOLDS = {
  co_ppm: { max: 25, label: "CO" },
  co2_ppm: { max: 1000, label: "CO2" },
  no2_ppm: { max: 0.1, label: "NO2" },
} as const

export async function checkAirQualityCompliance(facilityId?: string) {
  const supabase = await createClient()

  // Get the latest reading per location
  const { data, error } = await supabase
    .from("air_quality_readings")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(50)

  if (error) {
    return { error: error.message, violations: [] }
  }

  const violations: { location: string; metric: string; value: number; threshold: number }[] = []

  for (const row of data ?? []) {
    for (const [col, threshold] of Object.entries(THRESHOLDS)) {
      const val = row[col] as number | null
      if (val !== null && val > threshold.max) {
        violations.push({
          location: row.location,
          metric: threshold.label,
          value: val,
          threshold: threshold.max,
        })
      }
    }
  }

  return { violations }
}
