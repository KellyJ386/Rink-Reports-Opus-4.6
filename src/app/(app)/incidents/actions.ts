'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendNotification, getManagerRecipients } from '@/lib/services/notifications'

// ============================================
// Validation Schema
// ============================================

const IncidentReportSchema = z.object({
  incident_type: z.enum(['incident', 'accident']),
  event_time: z.string().min(1, 'Event time is required'),
  location_id: z.string().nullable().optional(),
  location_text: z.string().optional().default(''),
  description: z.string().min(1, 'Description is required'),
  injured_party_name: z.string().optional().default(''),
  injured_party_type: z.enum(['patron', 'staff']).nullable().optional(),
  body_diagram_regions: z.array(z.string()).optional().default([]),
  witnesses: z.string().optional().default(''),
})

// ============================================
// Server Actions
// ============================================

export async function createIncidentReport(data: {
  incident_type: 'incident' | 'accident'
  event_time: string
  location_id: string | null
  location_text: string
  description: string
  injured_party_name: string
  injured_party_type: 'patron' | 'staff' | null
  body_diagram_regions: string[]
  witnesses: string
}) {
  const supabase = await createClient()

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  // Get user profile for facility_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id')
    .eq('id', user.id)
    .single()

  if (!profile?.facility_id) {
    return { success: false as const, error: 'No facility assigned' }
  }

  // Validate
  const parsed = IncidentReportSchema.safeParse(data)
  if (!parsed.success) {
    const errors = parsed.error.flatten()
    const firstError =
      Object.values(errors.fieldErrors).flat()[0] ?? 'Validation failed'
    return { success: false as const, error: firstError }
  }

  const validated = parsed.data

  // Insert incident report
  const { data: report, error: insertError } = await supabase
    .from('incident_reports')
    .insert({
      facility_id: profile.facility_id,
      incident_type: validated.incident_type,
      event_time: validated.event_time,
      location_id: validated.location_id || null,
      location_text: validated.location_text || '',
      description: validated.description,
      injured_party_name: validated.injured_party_name || '',
      injured_party_type: validated.injured_party_type || null,
      body_diagram_regions: validated.body_diagram_regions,
      witnesses: validated.witnesses || '',
      submitted_by: user.id,
    })
    .select('id')
    .single()

  if (insertError) {
    return { success: false as const, error: insertError.message }
  }

  // Insert active alert
  const typeLabel =
    validated.incident_type === 'accident' ? 'accident' : 'incident'
  await supabase.from('active_alerts').insert({
    facility_id: profile.facility_id,
    module: 'incidents',
    alert_type: 'new_incident',
    reference_id: report.id,
    message: `New ${typeLabel} reported`,
    is_acknowledged: false,
  })

  // Notify managers about the new incident
  getManagerRecipients(profile.facility_id).then((managers) => {
    if (managers.length > 0) {
      sendNotification({
        facilityId: profile.facility_id,
        recipientIds: managers,
        title: `New ${typeLabel} report submitted`,
        body: validated.description.slice(0, 200),
        link: `/incidents/${report.id}`,
        triggerType: 'new_incident',
      }).catch(() => {})
    }
  })

  revalidatePath('/incidents')

  return { success: true as const, id: report.id }
}
