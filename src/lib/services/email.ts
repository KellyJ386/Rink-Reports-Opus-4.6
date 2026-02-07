import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = "Max Facility <notifications@maxfacility.com>"

/* ---------- Send email notification ---------- */

export async function sendEmailNotification(
  to: string,
  subject: string,
  html: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    })

    if (error) {
      console.error("[email] Resend error:", error.message)
      return { error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error"
    console.error("[email] Exception:", message)
    return { error: message }
  }
}

/* ---------- Send batch emails ---------- */

export async function sendBatchEmailNotification(
  recipients: { to: string; subject: string; html: string }[]
) {
  const results = await Promise.allSettled(
    recipients.map((r) => sendEmailNotification(r.to, r.subject, r.html))
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  return { succeeded, failed, total: recipients.length }
}
