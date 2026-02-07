import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generatePdfReport } from '@/lib/reports/pdf'
import { format, subDays } from 'date-fns'

// Column definitions for each report type (reused from the main report actions)
const REPORT_COLUMNS: Record<string, { key: string; label: string; width?: number }[]> = {
  checklist_summary: [
    { key: 'date', label: 'Date', width: 25 },
    { key: 'tab_name', label: 'Tab', width: 30 },
    { key: 'item_label', label: 'Checklist Item', width: 50 },
    { key: 'is_completed', label: 'Completed', width: 20 },
    { key: 'completed_by', label: 'Completed By', width: 30 },
  ],
  measurement_history: [
    { key: 'date', label: 'Date', width: 25 },
    { key: 'rink_name', label: 'Rink', width: 30 },
    { key: 'point_label', label: 'Point', width: 25 },
    { key: 'depth_mm', label: 'Depth (mm)', width: 22 },
    { key: 'measured_by', label: 'Measured By', width: 30 },
  ],
  ice_makes_log: [
    { key: 'date', label: 'Date', width: 25 },
    { key: 'rink_name', label: 'Rink', width: 30 },
    { key: 'machine_name', label: 'Machine', width: 25 },
    { key: 'operator', label: 'Operator', width: 30 },
  ],
  hours_by_employee: [
    { key: 'employee_name', label: 'Employee', width: 35 },
    { key: 'date', label: 'Date', width: 25 },
    { key: 'shift_type', label: 'Shift Type', width: 25 },
    { key: 'hours', label: 'Hours', width: 15 },
  ],
  incident_log: [
    { key: 'date', label: 'Date', width: 25 },
    { key: 'type', label: 'Type', width: 22 },
    { key: 'severity', label: 'Severity', width: 18 },
    { key: 'location', label: 'Location', width: 25 },
    { key: 'description', label: 'Description', width: 50 },
  ],
  reading_history: [
    { key: 'date', label: 'Date', width: 25 },
    { key: 'equipment_name', label: 'Equipment', width: 30 },
    { key: 'metric', label: 'Metric', width: 25 },
    { key: 'value', label: 'Value', width: 20 },
    { key: 'unit', label: 'Unit', width: 15 },
  ],
  compliance_report: [
    { key: 'date', label: 'Date', width: 25 },
    { key: 'location', label: 'Location', width: 25 },
    { key: 'metric_name', label: 'Metric', width: 25 },
    { key: 'value', label: 'Value', width: 18 },
    { key: 'status', label: 'Status', width: 18 },
  ],
}

// Report type to human-readable title
const REPORT_TITLES: Record<string, string> = {
  checklist_summary: 'Daily Reports - Checklist Summary',
  measurement_history: 'Ice Depth - Measurement History',
  ice_makes_log: 'Ice Operations - Ice Makes Log',
  hours_by_employee: 'Scheduling - Hours by Employee',
  incident_log: 'Incidents - Incident Log',
  reading_history: 'Refrigeration - Reading History',
  compliance_report: 'Air Quality - Compliance Report',
}

// Map report_type to the module used for data fetching
const REPORT_TYPE_TO_MODULE: Record<string, string> = {
  checklist_summary: 'daily_reports',
  measurement_history: 'ice_depth',
  ice_makes_log: 'ice_operations',
  hours_by_employee: 'scheduling',
  incident_log: 'incidents',
  reading_history: 'refrigeration',
  compliance_report: 'air_quality',
}

interface ScheduledReportSetting {
  id: string
  facility_id: string
  report_type: string
  is_enabled: boolean
  recipients: string[]
  delivery_hour: number
  created_at: string
  updated_at: string
}

/**
 * Fetch report data for a given module and facility using the admin client.
 * This bypasses RLS since cron jobs run without user session.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchReportDataForScheduled(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  module: string,
  facilityId: string,
  startDate: string,
  endDate: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>[]> {
  const endDateTime = endDate + 'T23:59:59'

  switch (module) {
    case 'daily_reports': {
      const { data } = await supabase
        .from('checklist_completions')
        .select(`
          id, completed_at, is_completed, notes,
          checklist_items!inner ( label, daily_report_tabs!inner ( name, facility_id ) ),
          profiles ( full_name )
        `)
        .gte('completed_at', startDate)
        .lte('completed_at', endDateTime)
        .eq('checklist_items.daily_report_tabs.facility_id', facilityId)
        .order('completed_at', { ascending: false })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) => ({
        date: row.completed_at ? format(new Date(row.completed_at), 'MM/dd/yyyy HH:mm') : '',
        tab_name: row.checklist_items?.daily_report_tabs?.name ?? '',
        item_label: row.checklist_items?.label ?? '',
        is_completed: row.is_completed ? 'Yes' : 'No',
        completed_by: row.profiles?.full_name ?? 'Unknown',
      }))
    }
    case 'ice_depth': {
      const { data } = await supabase
        .from('ice_depth_readings')
        .select(`
          id, measured_at, depth_mm,
          ice_depth_points!inner ( label, rinks!inner ( name, facility_id ) ),
          profiles ( full_name )
        `)
        .gte('measured_at', startDate)
        .lte('measured_at', endDateTime)
        .eq('ice_depth_points.rinks.facility_id', facilityId)
        .order('measured_at', { ascending: false })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) => ({
        date: row.measured_at ? format(new Date(row.measured_at), 'MM/dd/yyyy HH:mm') : '',
        rink_name: row.ice_depth_points?.rinks?.name ?? '',
        point_label: row.ice_depth_points?.label ?? '',
        depth_mm: row.depth_mm ?? '',
        measured_by: row.profiles?.full_name ?? 'Unknown',
      }))
    }
    case 'ice_operations': {
      const { data } = await supabase
        .from('ice_makes')
        .select(`
          id, created_at,
          rinks!inner ( name, facility_id ),
          machines ( name ),
          profiles ( full_name )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDateTime)
        .eq('rinks.facility_id', facilityId)
        .order('created_at', { ascending: false })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) => ({
        date: row.created_at ? format(new Date(row.created_at), 'MM/dd/yyyy HH:mm') : '',
        rink_name: row.rinks?.name ?? '',
        machine_name: row.machines?.name ?? '',
        operator: row.profiles?.full_name ?? 'Unknown',
      }))
    }
    case 'scheduling': {
      const { data } = await supabase
        .from('shifts')
        .select(`
          id, date, start_time, end_time,
          profiles!inner ( full_name, facility_id ),
          shift_types ( name )
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('profiles.facility_id', facilityId)
        .order('date', { ascending: false })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) => {
        let hours = ''
        if (row.start_time && row.end_time) {
          const [sh, sm] = row.start_time.split(':').map(Number)
          const [eh, em] = row.end_time.split(':').map(Number)
          let diff = (eh * 60 + em) - (sh * 60 + sm)
          if (diff < 0) diff += 24 * 60
          hours = (diff / 60).toFixed(1)
        }
        return {
          employee_name: row.profiles?.full_name ?? 'Unknown',
          date: row.date ?? '',
          shift_type: row.shift_types?.name ?? '',
          hours,
        }
      })
    }
    case 'incidents': {
      const { data } = await supabase
        .from('incident_reports')
        .select(`
          id, occurred_at, type, severity, description, status,
          incident_locations ( name ),
          profiles ( full_name )
        `)
        .gte('occurred_at', startDate)
        .lte('occurred_at', endDateTime)
        .eq('facility_id', facilityId)
        .order('occurred_at', { ascending: false })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) => ({
        date: row.occurred_at ? format(new Date(row.occurred_at), 'MM/dd/yyyy HH:mm') : '',
        type: row.type ?? '',
        severity: row.severity ?? '',
        location: row.incident_locations?.name ?? '',
        description: row.description ?? '',
      }))
    }
    case 'refrigeration': {
      const { data } = await supabase
        .from('refrigeration_readings')
        .select(`
          id, recorded_at,
          equipment!inner ( name, facility_id ),
          profiles ( full_name ),
          refrigeration_reading_values ( value, equipment_reading_types ( name, unit ) )
        `)
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDateTime)
        .eq('equipment.facility_id', facilityId)
        .order('recorded_at', { ascending: false })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: Record<string, any>[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(data ?? []).forEach((reading: any) => {
        const baseDate = reading.recorded_at ? format(new Date(reading.recorded_at), 'MM/dd/yyyy HH:mm') : ''
        if (reading.refrigeration_reading_values?.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reading.refrigeration_reading_values.forEach((rv: any) => {
            rows.push({
              date: baseDate,
              equipment_name: reading.equipment?.name ?? '',
              metric: rv.equipment_reading_types?.name ?? '',
              value: rv.value ?? '',
              unit: rv.equipment_reading_types?.unit ?? '',
            })
          })
        }
      })
      return rows
    }
    case 'air_quality': {
      const { data } = await supabase
        .from('air_quality_readings')
        .select(`
          id, recorded_at,
          air_quality_locations!inner ( name, facility_id ),
          profiles ( full_name ),
          air_quality_reading_values ( value, air_quality_metrics ( name, unit, max_threshold ) )
        `)
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDateTime)
        .eq('air_quality_locations.facility_id', facilityId)
        .order('recorded_at', { ascending: false })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: Record<string, any>[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(data ?? []).forEach((reading: any) => {
        const baseDate = reading.recorded_at ? format(new Date(reading.recorded_at), 'MM/dd/yyyy HH:mm') : ''
        if (reading.air_quality_reading_values?.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reading.air_quality_reading_values.forEach((rv: any) => {
            const threshold = rv.air_quality_metrics?.max_threshold
            let status = 'Normal'
            if (threshold != null && rv.value != null) {
              status = Number(rv.value) > Number(threshold) ? 'Exceeds Limit' : 'Normal'
            }
            rows.push({
              date: baseDate,
              location: reading.air_quality_locations?.name ?? '',
              metric_name: rv.air_quality_metrics?.name ?? '',
              value: rv.value ?? '',
              status,
            })
          })
        }
      })
      return rows
    }
    default:
      return []
  }
}

/**
 * GET /api/scheduled-reports
 *
 * Called by a Vercel Cron job. Checks all enabled scheduled_report_settings,
 * determines which reports need to be generated for the current hour,
 * generates a PDF, and sends it to the configured recipients via email.
 *
 * Cron schedule (vercel.json): e.g. "0 * * * *" (every hour)
 *
 * Security: Vercel Cron requests include the CRON_SECRET header.
 * In production, validate this header to prevent unauthorized access.
 */
export async function GET(request: Request) {
  // ── Verify cron secret (if configured) ──
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()
  const now = new Date()
  const currentHour = now.getUTCHours()

  // ── 1. Fetch all enabled scheduled report settings for this hour ──
  const { data: settings, error: settingsError } = await supabase
    .from('scheduled_report_settings')
    .select('*')
    .eq('is_enabled', true)
    .eq('delivery_hour', currentHour)

  if (settingsError) {
    console.error('[Scheduled Reports] Error fetching settings:', settingsError.message)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled report settings', details: settingsError.message },
      { status: 500 }
    )
  }

  if (!settings || settings.length === 0) {
    return NextResponse.json({
      message: 'No scheduled reports to process for this hour',
      hour: currentHour,
      processed: 0,
    })
  }

  console.log(`[Scheduled Reports] Found ${settings.length} reports to process at hour ${currentHour}`)

  // ── 2. Process each scheduled report ──
  const results: {
    settingId: string
    facilityId: string
    reportType: string
    status: 'success' | 'error' | 'no_data'
    recipientCount: number
    error?: string
  }[] = []

  for (const setting of settings as ScheduledReportSetting[]) {
    const { id: settingId, facility_id: facilityId, report_type: reportType, recipients } = setting

    try {
      // Get facility name
      const { data: facility } = await supabase
        .from('facilities')
        .select('name')
        .eq('id', facilityId)
        .single()

      const facilityName = facility?.name ?? 'Unknown Facility'

      // Determine date range (previous day)
      const yesterday = subDays(now, 1)
      const startDate = format(yesterday, 'yyyy-MM-dd')
      const endDate = format(yesterday, 'yyyy-MM-dd')

      // Determine the module from report type
      const module = REPORT_TYPE_TO_MODULE[reportType]
      if (!module) {
        console.error(`[Scheduled Reports] Unknown report type: ${reportType} for setting ${settingId}`)
        results.push({
          settingId,
          facilityId,
          reportType,
          status: 'error',
          recipientCount: 0,
          error: `Unknown report type: ${reportType}`,
        })
        continue
      }

      // Fetch data
      const reportData = await fetchReportDataForScheduled(
        supabase,
        module,
        facilityId,
        startDate,
        endDate
      )

      if (reportData.length === 0) {
        console.log(
          `[Scheduled Reports] No data for ${reportType} at facility ${facilityId} on ${startDate}`
        )
        results.push({
          settingId,
          facilityId,
          reportType,
          status: 'no_data',
          recipientCount: 0,
        })
        continue
      }

      // Generate PDF
      const columns = REPORT_COLUMNS[reportType] ?? []
      const title = REPORT_TITLES[reportType] ?? 'Scheduled Report'

      const pdfBytes = generatePdfReport({
        title,
        facilityName,
        dateRange: {
          start: format(yesterday, 'MMM d, yyyy'),
          end: format(yesterday, 'MMM d, yyyy'),
        },
        columns,
        data: reportData,
      })

      // Resolve recipient emails from UUIDs
      const recipientIds = recipients ?? []
      let recipientEmails: string[] = []

      if (recipientIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', recipientIds)

        recipientEmails = (profiles ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((p: any) => p.email)
          .filter((e: string | null): e is string => !!e)
      }

      if (recipientEmails.length === 0) {
        console.log(
          `[Scheduled Reports] No valid recipient emails for setting ${settingId}`
        )
        results.push({
          settingId,
          facilityId,
          reportType,
          status: 'error',
          recipientCount: 0,
          error: 'No valid recipient emails found',
        })
        continue
      }

      // Send email with PDF attachment
      // Uses the Resend API if RESEND_API_KEY is configured
      const resendApiKey = process.env.RESEND_API_KEY
      if (resendApiKey) {
        const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${startDate}.pdf`
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'Max Facility Reports <reports@maxfacility.com>',
              to: recipientEmails,
              subject: `${title} - ${facilityName} - ${format(yesterday, 'MMM d, yyyy')}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                  <div style="background: #002244; padding: 20px; color: white;">
                    <h1 style="margin: 0; font-size: 20px;">Max Facility Rink Reports</h1>
                    <p style="margin: 4px 0 0 0; opacity: 0.8;">${facilityName}</p>
                  </div>
                  <div style="padding: 20px;">
                    <h2 style="color: #002244; margin-top: 0;">${title}</h2>
                    <p>Your scheduled report for <strong>${format(yesterday, 'MMMM d, yyyy')}</strong> is attached.</p>
                    <p style="color: #6B7280; font-size: 14px;">
                      This report contains ${reportData.length} record${reportData.length === 1 ? '' : 's'}.
                    </p>
                    <hr style="border: none; border-top: 1px solid #D1D5D8; margin: 20px 0;" />
                    <p style="color: #A5ACAF; font-size: 12px;">
                      This is an automated report from Max Facility Rink Reports.
                      To manage your scheduled reports, visit the Admin settings.
                    </p>
                  </div>
                </div>
              `,
              attachments: [
                {
                  filename,
                  content: pdfBase64,
                  type: 'application/pdf',
                },
              ],
            }),
          })

          if (!response.ok) {
            const errorBody = await response.text()
            console.error(`[Scheduled Reports] Email send failed for setting ${settingId}:`, errorBody)
            results.push({
              settingId,
              facilityId,
              reportType,
              status: 'error',
              recipientCount: recipientEmails.length,
              error: `Email send failed: ${response.status}`,
            })
            continue
          }

          console.log(
            `[Scheduled Reports] Successfully sent ${reportType} to ${recipientEmails.length} recipients for facility ${facilityId}`
          )
        } catch (emailErr) {
          console.error(`[Scheduled Reports] Email error for setting ${settingId}:`, emailErr)
          results.push({
            settingId,
            facilityId,
            reportType,
            status: 'error',
            recipientCount: recipientEmails.length,
            error: emailErr instanceof Error ? emailErr.message : 'Email send error',
          })
          continue
        }
      } else {
        console.log(
          `[Scheduled Reports] RESEND_API_KEY not configured. Skipping email delivery for setting ${settingId}. ` +
          `Would send ${reportType} report (${reportData.length} records) to ${recipientEmails.length} recipients.`
        )
      }

      results.push({
        settingId,
        facilityId,
        reportType,
        status: 'success',
        recipientCount: recipientEmails.length,
      })
    } catch (err) {
      console.error(`[Scheduled Reports] Error processing setting ${settingId}:`, err)
      results.push({
        settingId,
        facilityId,
        reportType,
        status: 'error',
        recipientCount: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  // ── 3. Return summary ──
  const successCount = results.filter((r) => r.status === 'success').length
  const errorCount = results.filter((r) => r.status === 'error').length
  const noDataCount = results.filter((r) => r.status === 'no_data').length

  console.log(
    `[Scheduled Reports] Completed: ${successCount} sent, ${noDataCount} no data, ${errorCount} errors`
  )

  return NextResponse.json({
    message: 'Scheduled reports processed',
    hour: currentHour,
    processed: settings.length,
    summary: { success: successCount, no_data: noDataCount, errors: errorCount },
    results,
  })
}
