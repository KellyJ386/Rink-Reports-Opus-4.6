'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { notifyIncidentCreated } from '@/lib/services/notify';

/* ------------------------------------------------------------------ */
/*  Schemas                                                            */
/* ------------------------------------------------------------------ */

const IncidentReportSchema = z.object({
  type: z.enum(['incident', 'accident']),
  dateTime: z.string().min(1, 'Date and time are required'),
  location: z.string().min(1, 'Location is required'),
  locationOther: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  witnesses: z.string().optional(),
  // Accident-specific fields
  injuredPartyName: z.string().optional(),
  injuredPartyType: z.enum(['patron', 'staff']).optional(),
  bodyRegions: z.array(z.string()).optional(),
});

const FilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['all', 'incident', 'accident']).optional(),
  search: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

export async function createIncidentReport(data: {
  type: 'incident' | 'accident';
  dateTime: string;
  location: string;
  locationOther?: string;
  description: string;
  witnesses?: string;
  injuredPartyName?: string;
  injuredPartyType?: 'patron' | 'staff';
  bodyRegions?: string[];
}) {
  const parsed = IncidentReportSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedLocation =
    parsed.data.location === 'other'
      ? parsed.data.locationOther ?? 'Other'
      : parsed.data.location;

  const { data: report, error } = await supabase
    .from('incident_reports')
    .insert({
      type: parsed.data.type,
      date_time: parsed.data.dateTime,
      location: resolvedLocation,
      description: parsed.data.description,
      witnesses: parsed.data.witnesses ?? null,
      injured_party_name:
        parsed.data.type === 'accident' ? (parsed.data.injuredPartyName ?? null) : null,
      injured_party_type:
        parsed.data.type === 'accident' ? (parsed.data.injuredPartyType ?? null) : null,
      body_regions:
        parsed.data.type === 'accident' ? (parsed.data.bodyRegions ?? []) : [],
      submitted_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath('/incidents');

  // Fire-and-forget notification to managers/admins
  if (report) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('facility_id')
      .eq('id', user?.id ?? '')
      .single();

    if (profile?.facility_id) {
      notifyIncidentCreated({
        facilityId: profile.facility_id,
        incidentId: report.id,
        type: parsed.data.type,
      });
    }
  }

  return { data: report };
}

export async function getIncidentReports(filters?: {
  startDate?: string;
  endDate?: string;
  type?: 'all' | 'incident' | 'accident';
  search?: string;
}) {
  const parsed = FilterSchema.safeParse(filters ?? {});
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors, data: [] };
  }

  const supabase = await createClient();

  let query = supabase
    .from('incident_reports')
    .select('*')
    .order('date_time', { ascending: false });

  if (parsed.data.type && parsed.data.type !== 'all') {
    query = query.eq('type', parsed.data.type);
  }

  if (parsed.data.startDate) {
    query = query.gte('date_time', parsed.data.startDate);
  }

  if (parsed.data.endDate) {
    query = query.lte('date_time', parsed.data.endDate);
  }

  if (parsed.data.search) {
    query = query.ilike('description', `%${parsed.data.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { error: { _form: [error.message] }, data: [] };
  }

  return { data: data ?? [] };
}

export async function getIncidentReport(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('incident_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data };
}
