/**
 * SMS Notification Service - Stub
 *
 * This module provides a stub for SMS notifications.
 * When ready to integrate, replace the implementation with a
 * real provider such as Twilio, AWS SNS, or similar.
 */

/* ---------- Types ---------- */

interface SmsResult {
  success: boolean
  messageId?: string
  error?: string
}

/* ---------- Send SMS ---------- */

export async function sendSmsNotification(
  to: string,
  message: string
): Promise<SmsResult> {
  // Validate phone number format (basic E.164 check)
  const e164 = /^\+[1-9]\d{1,14}$/
  if (!e164.test(to)) {
    console.warn("[sms] Invalid phone number format:", to)
    return { success: false, error: "Invalid phone number format. Expected E.164 (e.g. +15551234567)." }
  }

  // Stub: log the message instead of sending
  console.info(`[sms] STUB - Would send to ${to}: "${message.slice(0, 60)}..."`)

  // Simulate a small delay
  await new Promise((resolve) => setTimeout(resolve, 100))

  return {
    success: true,
    messageId: `stub-${Date.now()}`,
  }
}

/* ---------- Send batch SMS ---------- */

export async function sendBatchSmsNotification(
  recipients: { to: string; message: string }[]
): Promise<{ succeeded: number; failed: number; total: number }> {
  const results = await Promise.allSettled(
    recipients.map((r) => sendSmsNotification(r.to, r.message))
  )

  const succeeded = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length
  const failed = results.length - succeeded

  return { succeeded, failed, total: recipients.length }
}
