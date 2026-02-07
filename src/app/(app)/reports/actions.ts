"use server"

import { createClient } from "@/lib/supabase/server"
import { generatePdfReport } from "@/lib/reports/pdf"
import { generateCsvReport } from "@/lib/reports/csv"
import { generateExcelReport } from "@/lib/reports/excel"

/* ---------- Types ---------- */

export type ExportFormat = "pdf" | "csv" | "excel"

export interface GenerateReportInput {
  reportId: string
  dateFrom: string
  dateTo: string
  format: ExportFormat
  filter?: string
}

interface ReportOutput {
  data?: string       // base64-encoded file content
  filename?: string
  mimeType?: string
  error?: string
}

/* ---------- Report data fetchers ---------- */

async function fetchRefrigerationData(dateFrom: string, dateTo: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("refrigeration_readings")
    .select("*")
    .gte("recorded_at", dateFrom)
    .lte("recorded_at", dateTo)
    .order("recorded_at", { ascending: false })

  if (error) throw new Error(error.message)

  const columns = ["Date/Time", "Equipment", "Head PSI", "Suction PSI", "Oil PSI", "Oil Level", "Discharge F", "Flow GPM", "Inlet F", "Outlet F"]
  const rows = (data ?? []).map((r) => {
    const v = r.values as Record<string, string | number | null> | null
    return [
      new Date(r.recorded_at).toLocaleString(),
      r.equipment_id,
      String(v?.headPressure ?? ""),
      String(v?.suctionPressure ?? ""),
      String(v?.oilPressure ?? ""),
      String(v?.oilLevel ?? ""),
      String(v?.dischargeTemp ?? ""),
      String(v?.flowRate ?? ""),
      String(v?.inletTemp ?? ""),
      String(v?.outletTemp ?? ""),
    ]
  })

  return { columns, rows }
}

async function fetchAirQualityData(dateFrom: string, dateTo: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("air_quality_readings")
    .select("*")
    .gte("recorded_at", dateFrom)
    .lte("recorded_at", dateTo)
    .order("recorded_at", { ascending: false })

  if (error) throw new Error(error.message)

  const columns = ["Date/Time", "Location", "CO (PPM)", "CO2 (PPM)", "NO2 (PPM)", "Humidity (%)", "Temp (F)"]
  const rows = (data ?? []).map((r) => [
    new Date(r.recorded_at).toLocaleString(),
    r.location,
    String(r.co_ppm ?? ""),
    String(r.co2_ppm ?? ""),
    String(r.no2_ppm ?? ""),
    String(r.humidity_pct ?? ""),
    String(r.temperature_f ?? ""),
  ])

  return { columns, rows }
}

async function fetchGenericData(_reportId: string, dateFrom: string, dateTo: string) {
  // Placeholder for modules that aren't yet connected to real data
  return {
    columns: ["Date", "Description", "Status"],
    rows: [
      [dateFrom, "Sample record 1", "Complete"],
      [dateTo, "Sample record 2", "Pending"],
    ],
  }
}

/* ---------- Data router ---------- */

async function fetchReportData(reportId: string, dateFrom: string, dateTo: string) {
  switch (reportId) {
    case "refrigeration-history":
    case "refrigeration-oor":
      return fetchRefrigerationData(dateFrom, dateTo)
    case "air-quality-compliance":
      return fetchAirQualityData(dateFrom, dateTo)
    default:
      return fetchGenericData(reportId, dateFrom, dateTo)
  }
}

/* ---------- Report title map ---------- */

const REPORT_TITLES: Record<string, string> = {
  "checklist-completion": "Checklist Completion Summary",
  "ice-depth-history": "Ice Depth Measurement History",
  "ice-makes-log": "Ice Makes Log",
  "machine-hours": "Machine Hours Summary",
  "schedule-by-date": "Schedule by Date Range",
  "hours-by-employee": "Hours by Employee",
  "incident-log": "Incident Log",
  "incident-compliance": "Incident Compliance Report",
  "refrigeration-history": "Refrigeration Reading History",
  "refrigeration-oor": "Refrigeration Out-of-Range Events",
  "air-quality-compliance": "Air Quality Compliance Report",
}

/* ---------- Generate report ---------- */

export async function generateReport(input: GenerateReportInput): Promise<ReportOutput> {
  try {
    const { reportId, dateFrom, dateTo, format } = input

    const title = REPORT_TITLES[reportId] ?? "Report"
    const dateRange = `${dateFrom} to ${dateTo}`
    const facilityName = "Max Facility"

    const { columns, rows } = await fetchReportData(reportId, dateFrom, dateTo)

    let fileBytes: ArrayBuffer | Uint8Array | null = null
    let filename = ""
    let mimeType = ""

    switch (format) {
      case "pdf": {
        fileBytes = generatePdfReport(title, facilityName, dateRange, columns, rows)
        filename = `${reportId}-${dateFrom}-to-${dateTo}.pdf`
        mimeType = "application/pdf"
        break
      }
      case "csv": {
        const csvString = generateCsvReport(columns, rows)
        const encoder = new TextEncoder()
        fileBytes = encoder.encode(csvString)
        filename = `${reportId}-${dateFrom}-to-${dateTo}.csv`
        mimeType = "text/csv"
        break
      }
      case "excel": {
        const rowObjects = rows.map((row) => {
          const obj: Record<string, unknown> = {}
          columns.forEach((col, i) => {
            obj[col] = row[i] ?? ""
          })
          return obj
        })
        fileBytes = generateExcelReport(title, columns, rowObjects)
        filename = `${reportId}-${dateFrom}-to-${dateTo}.xlsx`
        mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        break
      }
    }

    if (!fileBytes) {
      return { error: "Failed to generate report bytes." }
    }

    // Convert to base64 for transport over server action boundary
    const uint8 = new Uint8Array(fileBytes)
    const base64 = Buffer.from(uint8).toString("base64")

    return { data: base64, filename, mimeType }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error generating report"
    console.error("[reports] Error:", message)
    return { error: message }
  }
}
