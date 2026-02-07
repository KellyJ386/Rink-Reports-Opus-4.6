import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format, addMinutes } from 'date-fns'

/**
 * GET /api/shift-reminders
 *
 * Called by a Vercel Cron job every 15 minutes.
 * Queries upcoming shifts starting within the next 60 minutes
 * and sends reminder notifications to assigned employees.
 *
 * Security: Vercel Cron requests include the CRON_SECRET header.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()
  const now = new Date()
  const reminderWindow = addMinutes(now, 60)

  const todayStr = format(now, 'yyyy-MM-dd')
  const nowTime = format(now, 'HH:mm:ss')
  const windowTime = format(reminderWindow, 'HH:mm:ss')

  // Find shifts starting within the next 60 minutes that have an assigned employee
  const { data: upcomingShifts, error: shiftError } = await supabase
    .from('shifts')
    .select('id, assigned_to, shift_date, start_time, shift_types(name), profiles(full_name)')
    .eq('shift_date', todayStr)
    .gte('start_time', nowTime)
    .lte('start_time', windowTime)
    .not('assigned_to', 'is', null)

  if (shiftError) {
    console.error('[Shift Reminders] Error fetching shifts:', shiftError.message)
    return NextResponse.json({ error: shiftError.message }, { status: 500 })
  }

  if (!upcomingShifts || upcomingShifts.length === 0) {
    return NextResponse.json({ message: 'No upcoming shifts to remind', sent: 0 })
  }

  // Check which reminders have already been sent (avoid duplicates)
  const shiftIds = upcomingShifts.map((s) => s.id)
  const { data: existingNotifications } = await supabase
    .from('notifications')
    .select('reference_id')
    .eq('trigger_type', 'shift_reminder')
    .in('reference_id', shiftIds)

  const alreadySent = new Set((existingNotifications ?? []).map((n) => n.reference_id))

  let sentCount = 0

  for (const shift of upcomingShifts) {
    if (alreadySent.has(shift.id)) continue
    if (!shift.assigned_to) continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shiftTyped = shift as any
    const shiftTypeName = shiftTyped.shift_types?.name ?? 'Shift'

    // Insert notification directly (bypassing preference check since this runs as admin)
    const { error: notifError } = await supabase.from('notifications').insert({
      recipient_id: shift.assigned_to,
      title: `Shift Reminder: ${shiftTypeName}`,
      body: `Your ${shiftTypeName} shift starts at ${shift.start_time} today.`,
      link: '/scheduling',
      trigger_type: 'shift_reminder',
      channel: 'in_app',
      reference_id: shift.id,
      is_read: false,
    })

    if (notifError) {
      console.error(`[Shift Reminders] Failed to send reminder for shift ${shift.id}:`, notifError.message)
    } else {
      sentCount++
    }
  }

  console.log(`[Shift Reminders] Sent ${sentCount} reminders out of ${upcomingShifts.length} upcoming shifts`)

  return NextResponse.json({
    message: 'Shift reminders processed',
    upcoming: upcomingShifts.length,
    sent: sentCount,
    skipped: upcomingShifts.length - sentCount,
  })
}
