/**
 * Notification trigger helper — fire-and-forget pattern.
 *
 * Called from server actions after successful mutations.
 * Looks up managers/admins for the facility and sends
 * in-app notifications. Email/SMS dispatching is queued
 * but non-blocking so the user's action is not slowed down.
 */

import { createClient } from "@/lib/supabase/server"
import { sendNotification } from "@/lib/services/notifications"

/* ---------- Helper: get manager + admin IDs for a facility ---------- */

async function getManagerAndAdminIds(facilityId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("facility_id", facilityId)
    .eq("is_active", true)
    .in("role", ["super_admin", "facility_admin", "manager"])

  return (data ?? []).map((p) => p.id)
}

/* ---------- Triggers ---------- */

export async function notifyIncidentCreated(params: {
  facilityId: string
  incidentId: string
  type: "incident" | "accident"
}) {
  const recipients = await getManagerAndAdminIds(params.facilityId)
  if (recipients.length === 0) return

  const label = params.type === "accident" ? "Accident" : "Incident"

  await sendNotification({
    facilityId: params.facilityId,
    recipientIds: recipients,
    title: `New ${label} Report Filed`,
    body: `A new ${label.toLowerCase()} report has been submitted and requires review.`,
    link: `/incidents/${params.incidentId}`,
    triggerType: "incident_created",
  }).catch((err) => console.error("[notify] incident_created failed:", err))
}

export async function notifyRefrigerationOutOfRange(params: {
  facilityId: string
  equipmentId: string
  equipmentName: string
  metric: string
  value: number
  threshold: number
}) {
  const recipients = await getManagerAndAdminIds(params.facilityId)
  if (recipients.length === 0) return

  await sendNotification({
    facilityId: params.facilityId,
    recipientIds: recipients,
    title: `${params.equipmentName} Out of Range`,
    body: `${params.metric} reading of ${params.value} exceeds the ${params.threshold} threshold.`,
    link: `/refrigeration/${params.equipmentId}`,
    triggerType: "refrigeration_out_of_range",
  }).catch((err) => console.error("[notify] refrig_out_of_range failed:", err))
}

export async function notifyAirQualityOutOfRange(params: {
  facilityId: string
  location: string
  metric: string
  value: number
  threshold: number
}) {
  const recipients = await getManagerAndAdminIds(params.facilityId)
  if (recipients.length === 0) return

  await sendNotification({
    facilityId: params.facilityId,
    recipientIds: recipients,
    title: `Air Quality Alert — ${params.location}`,
    body: `${params.metric} level at ${params.value} exceeds the ${params.threshold} safe limit.`,
    link: "/air-quality/history",
    triggerType: "air_quality_out_of_range",
  }).catch((err) => console.error("[notify] aq_out_of_range failed:", err))
}

export async function notifyShiftSwapRequested(params: {
  facilityId: string
  targetEmployeeId: string
  requestingEmployeeName: string
}) {
  const managers = await getManagerAndAdminIds(params.facilityId)
  const recipients = [...new Set([params.targetEmployeeId, ...managers])]

  await sendNotification({
    facilityId: params.facilityId,
    recipientIds: recipients,
    title: "Shift Swap Request",
    body: `${params.requestingEmployeeName} has requested a shift swap with you.`,
    link: "/scheduling",
    triggerType: "shift_swap_requested",
  }).catch((err) => console.error("[notify] swap_requested failed:", err))
}

export async function notifySwapReviewed(params: {
  facilityId: string
  requestingEmployeeId: string
  targetEmployeeId: string
  approved: boolean
}) {
  const recipients = [params.requestingEmployeeId, params.targetEmployeeId]

  await sendNotification({
    facilityId: params.facilityId,
    recipientIds: recipients,
    title: `Shift Swap ${params.approved ? "Approved" : "Denied"}`,
    body: `Your shift swap request has been ${params.approved ? "approved" : "denied"}.`,
    link: "/scheduling",
    triggerType: "shift_swap_reviewed",
  }).catch((err) => console.error("[notify] swap_reviewed failed:", err))
}
