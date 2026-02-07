/**
 * SMS Notification Service (Stub)
 *
 * This is a placeholder for future Twilio integration.
 * Currently logs intent to console for development purposes.
 */
export async function sendSmsNotification(
  phone: string,
  message: string
): Promise<{ success: boolean }> {
  console.log(`[SMS Stub] To: ${phone}, Message: ${message}`)
  return { success: true }
}
