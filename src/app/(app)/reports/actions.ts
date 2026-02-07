'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { generatePdfReport, type ReportColumn } from '@/lib/reports/pdf'
import { generateCsvReport } from '@/lib/reports/csv'
import { generateExcelReport } from '@/lib/reports/excel'
import { format, parseISO } from 'date-fns'

// ── Auth helper ──

async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, profile: null, error: 'Not authenticated' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id, role, full_name')
    .eq('id', user.id)
    .single()
  if (!profile) return { supabase, profile: null, error: 'Profile not found' }
  return { supabase, profile, error: null, userId: user.id }
}

// ── Validation schema ──

const ReportParamsSchema = z.object({
  module: z.enum([
    'daily_reports',
    'ice_depth',
    'ice_operations',
    'scheduling',
    'incidents',
    'refrigeration',
    'air_quality',
  ]),
  reportType: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  format: z.enum(['pdf', 'csv', 'excel']),
  filters: z.record(z.string(), z.string()).optional(),
})

type ReportParams = z.infer<typeof ReportParamsSchema>

// ── Report result type ──

interface ReportResult {
  success: boolean
  error?: string
  data?: string // base64 encoded
  filename?: string
  contentType?: string
}

// ── Column definitions per report type ──

function getColumns(module: string, reportType: string): ReportColumn[] {
  switch (`${module}:${reportType}`) {
    case 'daily_reports:checklist_summary':
      return [
        { key: 'date', label: 'Date', width: 25 },
        { key: 'tab_name', label: 'Tab', width: 30 },
        { key: 'item_label', label: 'Checklist Item', width: 50 },
        { key: 'is_completed', label: 'Completed', width: 20 },
        { key: 'completed_by', label: 'Completed By', width: 30 },
        { key: 'notes', label: 'Notes', width: 40 },
      ]
    case 'ice_depth:measurement_history':
      return [
        { key: 'date', label: 'Date', width: 25 },
        { key: 'rink_name', label: 'Rink', width: 30 },
        { key: 'point_label', label: 'Point', width: 25 },
        { key: 'depth_mm', label: 'Depth (mm)', width: 22 },
        { key: 'measured_by', label: 'Measured By', width: 30 },
        { key: 'status', label: 'Status', width: 20 },
      ]
    case 'ice_operations:ice_makes_log':
      return [
        { key: 'date', label: 'Date', width: 25 },
        { key: 'rink_name', label: 'Rink', width: 30 },
        { key: 'machine_name', label: 'Machine', width: 25 },
        { key: 'operator', label: 'Operator', width: 30 },
        { key: 'water_temp', label: 'Water Temp', width: 22 },
        { key: 'notes', label: 'Notes', width: 40 },
      ]
    case 'scheduling:hours_by_employee':
      return [
        { key: 'employee_name', label: 'Employee', width: 35 },
        { key: 'date', label: 'Date', width: 25 },
        { key: 'shift_type', label: 'Shift Type', width: 25 },
        { key: 'start_time', label: 'Start', width: 20 },
        { key: 'end_time', label: 'End', width: 20 },
        { key: 'hours', label: 'Hours', width: 15 },
      ]
    case 'incidents:incident_log':
      return [
        { key: 'date', label: 'Date', width: 25 },
        { key: 'type', label: 'Type', width: 22 },
        { key: 'severity', label: 'Severity', width: 18 },
        { key: 'location', label: 'Location', width: 25 },
        { key: 'description', label: 'Description', width: 50 },
        { key: 'reported_by', label: 'Reported By', width: 30 },
        { key: 'status', label: 'Status', width: 18 },
      ]
    case 'refrigeration:reading_history':
      return [
        { key: 'date', label: 'Date', width: 25 },
        { key: 'equipment_name', label: 'Equipment', width: 30 },
        { key: 'metric', label: 'Metric', width: 25 },
        { key: 'value', label: 'Value', width: 20 },
        { key: 'unit', label: 'Unit', width: 15 },
        { key: 'recorded_by', label: 'Recorded By', width: 30 },
      ]
    case 'air_quality:compliance_report':
      return [
        { key: 'date', label: 'Date', width: 25 },
        { key: 'location', label: 'Location', width: 25 },
        { key: 'metric_name', label: 'Metric', width: 25 },
        { key: 'value', label: 'Value', width: 18 },
        { key: 'unit', label: 'Unit', width: 15 },
        { key: 'threshold', label: 'Threshold', width: 18 },
        { key: 'status', label: 'Status', width: 18 },
        { key: 'recorded_by', label: 'Recorded By', width: 28 },
      ]
    default:
      return [
        { key: 'id', label: 'ID', width: 30 },
        { key: 'date', label: 'Date', width: 25 },
        { key: 'details', label: 'Details', width: 80 },
      ]
  }
}

// ── Report title mapping ──

function getReportTitle(module: string, reportType: string): string {
  const titles: Record<string, string> = {
    'daily_reports:checklist_summary': 'Daily Reports - Checklist Summary',
    'ice_depth:measurement_history': 'Ice Depth - Measurement History',
    'ice_operations:ice_makes_log': 'Ice Operations - Ice Makes Log',
    'scheduling:hours_by_employee': 'Scheduling - Hours by Employee',
    'incidents:incident_log': 'Incidents - Incident Log',
    'refrigeration:reading_history': 'Refrigeration - Reading History',
    'air_quality:compliance_report': 'Air Quality - Compliance Report',
  }
  return titles[`${module}:${reportType}`] ?? 'Report'
}

// ── Data fetching per module ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

async function fetchDailyReportsData(
  supabase: SupabaseClient,
  facilityId: string,
  startDate: string,
  endDate: string,
  filters?: Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>[]> {
  let query = supabase
    .from('checklist_completions')
    .select(`
      id,
      completed_at,
      is_completed,
      notes,
      checklist_items!inner (
        id,
        label,
        daily_report_tabs!inner (
          id,
          name,
          facility_id
        )
      ),
      profiles (
        full_name
      )
    `)
    .gte('completed_at', startDate)
    .lte('completed_at', endDate + 'T23:59:59')
    .eq('checklist_items.daily_report_tabs.facility_id', facilityId)
    .order('completed_at', { ascending: false })

  if (filters?.tabId) {
    query = query.eq('checklist_items.daily_report_tabs.id', filters.tabId)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    date: format(parseISO(row.completed_at), 'MM/dd/yyyy HH:mm'),
    tab_name: row.checklist_items?.daily_report_tabs?.name ?? '',
    item_label: row.checklist_items?.label ?? '',
    is_completed: row.is_completed ? 'Yes' : 'No',
    completed_by: row.profiles?.full_name ?? 'Unknown',
    notes: row.notes ?? '',
  }))
}

async function fetchIceDepthData(
  supabase: SupabaseClient,
  facilityId: string,
  startDate: string,
  endDate: string,
  filters?: Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>[]> {
  let query = supabase
    .from('ice_depth_readings')
    .select(`
      id,
      measured_at,
      depth_mm,
      ice_depth_points!inner (
        label,
        rinks!inner (
          id,
          name,
          facility_id
        )
      ),
      profiles (
        full_name
      )
    `)
    .gte('measured_at', startDate)
    .lte('measured_at', endDate + 'T23:59:59')
    .eq('ice_depth_points.rinks.facility_id', facilityId)
    .order('measured_at', { ascending: false })

  if (filters?.rinkId) {
    query = query.eq('ice_depth_points.rinks.id', filters.rinkId)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // Fetch thresholds for status determination
  const { data: thresholds } = await supabase
    .from('ice_depth_thresholds')
    .select('min_depth_mm, max_depth_mm, rink_id')
    .eq('facility_id', facilityId)

  const thresholdMap = new Map<string, { min: number; max: number }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(thresholds ?? []).forEach((t: any) => {
    thresholdMap.set(t.rink_id, { min: t.min_depth_mm, max: t.max_depth_mm })
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    const rinkId = row.ice_depth_points?.rinks?.id
    const threshold = rinkId ? thresholdMap.get(rinkId) : null
    let status = 'Normal'
    if (threshold && row.depth_mm !== null) {
      if (row.depth_mm < threshold.min) status = 'Below Min'
      else if (row.depth_mm > threshold.max) status = 'Above Max'
    }

    return {
      date: format(parseISO(row.measured_at), 'MM/dd/yyyy HH:mm'),
      rink_name: row.ice_depth_points?.rinks?.name ?? '',
      point_label: row.ice_depth_points?.label ?? '',
      depth_mm: row.depth_mm ?? '',
      measured_by: row.profiles?.full_name ?? 'Unknown',
      status,
    }
  })
}

async function fetchIceOperationsData(
  supabase: SupabaseClient,
  facilityId: string,
  startDate: string,
  endDate: string,
  filters?: Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>[]> {
  let query = supabase
    .from('ice_makes')
    .select(`
      id,
      created_at,
      water_temp,
      notes,
      rinks!inner (
        id,
        name,
        facility_id
      ),
      machines (
        name
      ),
      profiles (
        full_name
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .eq('rinks.facility_id', facilityId)
    .order('created_at', { ascending: false })

  if (filters?.rinkId) {
    query = query.eq('rinks.id', filters.rinkId)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    date: format(parseISO(row.created_at), 'MM/dd/yyyy HH:mm'),
    rink_name: row.rinks?.name ?? '',
    machine_name: row.machines?.name ?? '',
    operator: row.profiles?.full_name ?? 'Unknown',
    water_temp: row.water_temp ?? '',
    notes: row.notes ?? '',
  }))
}

async function fetchSchedulingData(
  supabase: SupabaseClient,
  facilityId: string,
  startDate: string,
  endDate: string,
  filters?: Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>[]> {
  let query = supabase
    .from('shifts')
    .select(`
      id,
      date,
      start_time,
      end_time,
      profiles!inner (
        id,
        full_name,
        facility_id
      ),
      shift_types (
        name
      )
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('profiles.facility_id', facilityId)
    .order('date', { ascending: false })

  if (filters?.employeeId) {
    query = query.eq('profiles.id', filters.employeeId)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    // Calculate hours from start_time and end_time
    let hours = ''
    if (row.start_time && row.end_time) {
      const [sh, sm] = row.start_time.split(':').map(Number)
      const [eh, em] = row.end_time.split(':').map(Number)
      const startMinutes = sh * 60 + sm
      let endMinutes = eh * 60 + em
      if (endMinutes < startMinutes) endMinutes += 24 * 60 // overnight shift
      const diff = (endMinutes - startMinutes) / 60
      hours = diff.toFixed(1)
    }

    return {
      employee_name: row.profiles?.full_name ?? 'Unknown',
      date: row.date ?? '',
      shift_type: row.shift_types?.name ?? '',
      start_time: row.start_time ?? '',
      end_time: row.end_time ?? '',
      hours,
    }
  })
}

async function fetchIncidentsData(
  supabase: SupabaseClient,
  facilityId: string,
  startDate: string,
  endDate: string,
  filters?: Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>[]> {
  let query = supabase
    .from('incident_reports')
    .select(`
      id,
      occurred_at,
      type,
      severity,
      description,
      status,
      incident_locations (
        name
      ),
      profiles (
        full_name
      )
    `)
    .gte('occurred_at', startDate)
    .lte('occurred_at', endDate + 'T23:59:59')
    .eq('facility_id', facilityId)
    .order('occurred_at', { ascending: false })

  if (filters?.locationId) {
    query = query.eq('location_id', filters.locationId)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    date: format(parseISO(row.occurred_at), 'MM/dd/yyyy HH:mm'),
    type: row.type ?? '',
    severity: row.severity ?? '',
    location: row.incident_locations?.name ?? '',
    description: row.description ?? '',
    reported_by: row.profiles?.full_name ?? 'Unknown',
    status: row.status ?? '',
  }))
}

async function fetchRefrigerationData(
  supabase: SupabaseClient,
  facilityId: string,
  startDate: string,
  endDate: string,
  filters?: Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>[]> {
  let query = supabase
    .from('refrigeration_readings')
    .select(`
      id,
      recorded_at,
      equipment!inner (
        id,
        name,
        facility_id
      ),
      profiles (
        full_name
      ),
      refrigeration_reading_values (
        value,
        equipment_reading_types (
          name,
          unit
        )
      )
    `)
    .gte('recorded_at', startDate)
    .lte('recorded_at', endDate + 'T23:59:59')
    .eq('equipment.facility_id', facilityId)
    .order('recorded_at', { ascending: false })

  if (filters?.equipmentId) {
    query = query.eq('equipment.id', filters.equipmentId)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // Flatten the reading values into individual rows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: Record<string, any>[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(data ?? []).forEach((reading: any) => {
    const baseDate = format(parseISO(reading.recorded_at), 'MM/dd/yyyy HH:mm')
    const equipmentName = reading.equipment?.name ?? ''
    const recordedBy = reading.profiles?.full_name ?? 'Unknown'

    if (reading.refrigeration_reading_values?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reading.refrigeration_reading_values.forEach((rv: any) => {
        rows.push({
          date: baseDate,
          equipment_name: equipmentName,
          metric: rv.equipment_reading_types?.name ?? '',
          value: rv.value ?? '',
          unit: rv.equipment_reading_types?.unit ?? '',
          recorded_by: recordedBy,
        })
      })
    } else {
      rows.push({
        date: baseDate,
        equipment_name: equipmentName,
        metric: '',
        value: '',
        unit: '',
        recorded_by: recordedBy,
      })
    }
  })

  return rows
}

async function fetchAirQualityData(
  supabase: SupabaseClient,
  facilityId: string,
  startDate: string,
  endDate: string,
  filters?: Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>[]> {
  let query = supabase
    .from('air_quality_readings')
    .select(`
      id,
      recorded_at,
      air_quality_locations!inner (
        id,
        name,
        facility_id
      ),
      profiles (
        full_name
      ),
      air_quality_reading_values (
        value,
        air_quality_metrics (
          name,
          unit,
          max_threshold
        )
      )
    `)
    .gte('recorded_at', startDate)
    .lte('recorded_at', endDate + 'T23:59:59')
    .eq('air_quality_locations.facility_id', facilityId)
    .order('recorded_at', { ascending: false })

  if (filters?.locationId) {
    query = query.eq('air_quality_locations.id', filters.locationId)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // Flatten reading values into individual rows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: Record<string, any>[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(data ?? []).forEach((reading: any) => {
    const baseDate = format(parseISO(reading.recorded_at), 'MM/dd/yyyy HH:mm')
    const locationName = reading.air_quality_locations?.name ?? ''
    const recordedBy = reading.profiles?.full_name ?? 'Unknown'

    if (reading.air_quality_reading_values?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reading.air_quality_reading_values.forEach((rv: any) => {
        const threshold = rv.air_quality_metrics?.max_threshold
        let status = 'Normal'
        if (threshold !== null && threshold !== undefined && rv.value !== null) {
          status = Number(rv.value) > Number(threshold) ? 'Exceeds Limit' : 'Normal'
        }

        rows.push({
          date: baseDate,
          location: locationName,
          metric_name: rv.air_quality_metrics?.name ?? '',
          value: rv.value ?? '',
          unit: rv.air_quality_metrics?.unit ?? '',
          threshold: threshold ?? 'N/A',
          status,
          recorded_by: recordedBy,
        })
      })
    } else {
      rows.push({
        date: baseDate,
        location: locationName,
        metric_name: '',
        value: '',
        unit: '',
        threshold: '',
        status: '',
        recorded_by: recordedBy,
      })
    }
  })

  return rows
}

// ── Main generateReport action ──

export async function generateReport(params: {
  module: string
  reportType: string
  startDate: string
  endDate: string
  format: string
  filters?: Record<string, string>
}): Promise<ReportResult> {
  const { supabase, profile, error: authError } = await getAuthProfile()

  if (authError || !profile) {
    return { success: false, error: authError ?? 'Not authenticated' }
  }

  const facilityId = profile.facility_id
  if (!facilityId) {
    return { success: false, error: 'No facility assigned to your account' }
  }

  // Validate params
  const parsed = ReportParamsSchema.safeParse(params)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = Object.values(fieldErrors).flat()[0]
    return { success: false, error: firstError ?? 'Invalid report parameters' }
  }

  const { module, reportType, startDate, endDate, format: reportFormat, filters } = parsed.data

  // Get facility name
  const { data: facility } = await supabase
    .from('facilities')
    .select('name')
    .eq('id', facilityId)
    .single()

  const facilityName = facility?.name ?? 'Unknown Facility'

  // Fetch data based on module
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reportData: Record<string, any>[]
  try {
    switch (module) {
      case 'daily_reports':
        reportData = await fetchDailyReportsData(supabase, facilityId, startDate, endDate, filters)
        break
      case 'ice_depth':
        reportData = await fetchIceDepthData(supabase, facilityId, startDate, endDate, filters)
        break
      case 'ice_operations':
        reportData = await fetchIceOperationsData(supabase, facilityId, startDate, endDate, filters)
        break
      case 'scheduling':
        reportData = await fetchSchedulingData(supabase, facilityId, startDate, endDate, filters)
        break
      case 'incidents':
        reportData = await fetchIncidentsData(supabase, facilityId, startDate, endDate, filters)
        break
      case 'refrigeration':
        reportData = await fetchRefrigerationData(supabase, facilityId, startDate, endDate, filters)
        break
      case 'air_quality':
        reportData = await fetchAirQualityData(supabase, facilityId, startDate, endDate, filters)
        break
      default:
        return { success: false, error: 'Unknown module' }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch report data',
    }
  }

  if (reportData.length === 0) {
    return { success: false, error: 'No data found for the selected date range and filters' }
  }

  // Get columns and title
  const columns = getColumns(module, reportType)
  const title = getReportTitle(module, reportType)
  const dateLabel = `${startDate}_${endDate}`
  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_')

  // Generate the report in the requested format
  let fileData: Uint8Array | string
  let filename: string
  let contentType: string

  switch (reportFormat) {
    case 'pdf': {
      fileData = generatePdfReport({
        title,
        facilityName,
        dateRange: {
          start: format(parseISO(startDate), 'MMM d, yyyy'),
          end: format(parseISO(endDate), 'MMM d, yyyy'),
        },
        columns,
        data: reportData,
      })
      filename = `${safeTitle}_${dateLabel}.pdf`
      contentType = 'application/pdf'
      break
    }
    case 'csv': {
      fileData = generateCsvReport({ columns, data: reportData })
      filename = `${safeTitle}_${dateLabel}.csv`
      contentType = 'text/csv'
      break
    }
    case 'excel': {
      fileData = generateExcelReport({
        title,
        columns,
        data: reportData,
      })
      filename = `${safeTitle}_${dateLabel}.xlsx`
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      break
    }
    default:
      return { success: false, error: 'Unsupported format' }
  }

  // Encode to base64 for transport
  let base64: string
  if (typeof fileData === 'string') {
    // CSV string — encode to base64
    base64 = Buffer.from(fileData, 'utf-8').toString('base64')
  } else {
    // Uint8Array — encode to base64
    base64 = Buffer.from(fileData).toString('base64')
  }

  return {
    success: true,
    data: base64,
    filename,
    contentType,
  }
}

// ── Filter options loaders ──

export async function getFilterOptions(module: string) {
  const { supabase, profile, error: authError } = await getAuthProfile()

  if (authError || !profile) {
    return { success: false, error: authError ?? 'Not authenticated', options: {} }
  }

  const facilityId = profile.facility_id
  if (!facilityId) {
    return { success: false, error: 'No facility assigned', options: {} }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: Record<string, { id: string; name: string }[]> = {}

  try {
    switch (module) {
      case 'daily_reports': {
        const { data: tabs } = await supabase
          .from('daily_report_tabs')
          .select('id, name')
          .eq('facility_id', facilityId)
          .eq('is_active', true)
          .order('sort_order')
        options.tabs = (tabs ?? []).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }))
        break
      }
      case 'ice_depth':
      case 'ice_operations': {
        const { data: rinks } = await supabase
          .from('rinks')
          .select('id, name')
          .eq('facility_id', facilityId)
          .eq('is_active', true)
          .order('name')
        options.rinks = (rinks ?? []).map((r: { id: string; name: string }) => ({ id: r.id, name: r.name }))
        break
      }
      case 'scheduling': {
        const { data: employees } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('facility_id', facilityId)
          .eq('is_active', true)
          .order('full_name')
        options.employees = (employees ?? []).map((e: { id: string; full_name: string }) => ({ id: e.id, name: e.full_name }))
        break
      }
      case 'incidents': {
        const { data: locations } = await supabase
          .from('incident_locations')
          .select('id, name')
          .eq('facility_id', facilityId)
          .order('name')
        options.locations = (locations ?? []).map((l: { id: string; name: string }) => ({ id: l.id, name: l.name }))
        break
      }
      case 'refrigeration': {
        const { data: equipment } = await supabase
          .from('equipment')
          .select('id, name')
          .eq('facility_id', facilityId)
          .eq('is_active', true)
          .order('name')
        options.equipment = (equipment ?? []).map((e: { id: string; name: string }) => ({ id: e.id, name: e.name }))
        break
      }
      case 'air_quality': {
        const { data: locations } = await supabase
          .from('air_quality_locations')
          .select('id, name')
          .eq('facility_id', facilityId)
          .order('name')
        options.locations = (locations ?? []).map((l: { id: string; name: string }) => ({ id: l.id, name: l.name }))
        break
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to load filter options',
      options: {},
    }
  }

  return { success: true, error: null, options }
}
