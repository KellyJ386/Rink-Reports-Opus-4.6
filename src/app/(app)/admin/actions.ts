'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// Helper: authenticate user and get facility_id
// ============================================
async function getAuthenticatedFacility() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, profile: null, error: 'Not authenticated' as const }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.facility_id) {
    return { supabase, user, profile: null, error: 'No facility assigned' as const }
  }

  return { supabase, user, profile, error: null }
}

// ============================================
// Facility Settings
// ============================================
const FacilitySettingsSchema = z.object({
  name: z.string().min(1, 'Facility name is required'),
  address: z.string().optional(),
  time_zone: z.string().min(1, 'Time zone is required'),
  seasonal_operation: z.boolean(),
  open_months: z.array(z.number().min(1).max(12)).optional(),
  session_duration_hours: z.number().min(1).max(24),
})

export async function updateFacilitySettings(
  data: z.infer<typeof FacilitySettingsSchema>
) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  const parsed = FacilitySettingsSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('facilities')
    .update({
      name: parsed.data.name,
      address: parsed.data.address ?? null,
      time_zone: parsed.data.time_zone,
      seasonal_operation: parsed.data.seasonal_operation,
      open_months: parsed.data.open_months ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      session_duration_hours: parsed.data.session_duration_hours,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile!.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/facility')
  return { success: true }
}

// ============================================
// Operating Hours
// ============================================
const OperatingHoursItemSchema = z.object({
  day_of_week: z.enum([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]),
  open_time: z.string().nullable(),
  close_time: z.string().nullable(),
  is_closed: z.boolean(),
})

const OperatingHoursSchema = z.array(OperatingHoursItemSchema).min(1).max(7)

export async function updateOperatingHours(
  hours: z.infer<typeof OperatingHoursSchema>
) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  const parsed = OperatingHoursSchema.safeParse(hours)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const facilityId = profile!.facility_id

  // Upsert each day's operating hours
  const upsertRows = parsed.data.map((row) => ({
    facility_id: facilityId,
    day_of_week: row.day_of_week,
    open_time: row.is_closed ? null : row.open_time,
    close_time: row.is_closed ? null : row.close_time,
    is_closed: row.is_closed,
  }))

  const { error } = await supabase
    .from('operating_hours')
    .upsert(upsertRows, { onConflict: 'facility_id,day_of_week' })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/facility')
  return { success: true }
}

// ============================================
// Rink Management
// ============================================
const CreateRinkSchema = z.object({
  name: z.string().min(1, 'Rink name is required'),
  length_ft: z.number().min(1, 'Length must be positive'),
  width_ft: z.number().min(1, 'Width must be positive'),
})

export async function createRink(data: z.infer<typeof CreateRinkSchema>) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  const parsed = CreateRinkSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  // Get current max sort_order for this facility
  const { data: existingRinks } = await supabase
    .from('rinks')
    .select('sort_order')
    .eq('facility_id', profile!.facility_id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existingRinks && existingRinks.length > 0
    ? (existingRinks[0].sort_order ?? 0) + 1
    : 0

  const { error } = await supabase.from('rinks').insert({
    facility_id: profile!.facility_id,
    name: parsed.data.name,
    length_ft: parsed.data.length_ft,
    width_ft: parsed.data.width_ft,
    sort_order: nextSortOrder,
    is_active: true,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/rinks')
  return { success: true }
}

const UpdateRinkSchema = z.object({
  name: z.string().min(1, 'Rink name is required'),
  length_ft: z.number().min(1, 'Length must be positive'),
  width_ft: z.number().min(1, 'Width must be positive'),
  is_active: z.boolean(),
})

export async function updateRink(
  id: string,
  data: z.infer<typeof UpdateRinkSchema>
) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  if (!z.string().uuid().safeParse(id).success) {
    return { success: false, error: 'Invalid rink ID' }
  }

  const parsed = UpdateRinkSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('rinks')
    .update({
      name: parsed.data.name,
      length_ft: parsed.data.length_ft,
      width_ft: parsed.data.width_ft,
      is_active: parsed.data.is_active,
    })
    .eq('id', id)
    .eq('facility_id', profile!.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/rinks')
  return { success: true }
}

// ============================================
// Module Settings
// ============================================
const ModuleSettingsSchema = z.object({
  is_enabled: z.boolean(),
  allowed_roles: z.array(
    z.enum([
      'facility_admin',
      'manager',
      'supervisor',
      'staff',
      'read_only',
    ])
  ),
})

export async function updateModuleSettings(
  moduleId: string,
  data: z.infer<typeof ModuleSettingsSchema>
) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  const validModules = [
    'daily_reports',
    'ice_depth',
    'ice_operations',
    'scheduling',
    'incidents',
    'refrigeration',
    'air_quality',
    'admin',
  ]
  if (!validModules.includes(moduleId)) {
    return { success: false, error: 'Invalid module ID' }
  }

  const parsed = ModuleSettingsSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('module_settings')
    .upsert(
      {
        facility_id: profile!.facility_id,
        module: moduleId,
        is_enabled: parsed.data.is_enabled,
        allowed_roles: parsed.data.allowed_roles,
      },
      { onConflict: 'facility_id,module' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/modules')
  return { success: true }
}

// ============================================
// Daily Report Tabs
// ============================================
const CreateTabSchema = z.object({
  name: z.string().min(1, 'Tab name is required').max(100),
})

export async function createTab(data: z.infer<typeof CreateTabSchema>) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  const parsed = CreateTabSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const facilityId = profile!.facility_id

  // Check the 30-tab limit
  const { count } = await supabase
    .from('daily_report_tabs')
    .select('id', { count: 'exact', head: true })
    .eq('facility_id', facilityId)

  if (count !== null && count >= 30) {
    return { success: false, error: 'Maximum of 30 tabs allowed per facility' }
  }

  // Get next sort_order
  const { data: existingTabs } = await supabase
    .from('daily_report_tabs')
    .select('sort_order')
    .eq('facility_id', facilityId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existingTabs && existingTabs.length > 0
    ? (existingTabs[0].sort_order ?? 0) + 1
    : 0

  const { error } = await supabase.from('daily_report_tabs').insert({
    facility_id: facilityId,
    name: parsed.data.name,
    sort_order: nextSortOrder,
    is_active: true,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/daily-reports')
  return { success: true }
}

const UpdateTabSchema = z.object({
  name: z.string().min(1, 'Tab name is required').max(100),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
})

export async function updateTab(
  id: string,
  data: z.infer<typeof UpdateTabSchema>
) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  if (!z.string().uuid().safeParse(id).success) {
    return { success: false, error: 'Invalid tab ID' }
  }

  const parsed = UpdateTabSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  // Verify tab belongs to this facility
  const { data: tab } = await supabase
    .from('daily_report_tabs')
    .select('facility_id')
    .eq('id', id)
    .single()

  if (!tab || tab.facility_id !== profile!.facility_id) {
    return { success: false, error: 'Tab not found' }
  }

  const { error } = await supabase
    .from('daily_report_tabs')
    .update({
      name: parsed.data.name,
      sort_order: parsed.data.sort_order,
      is_active: parsed.data.is_active,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/daily-reports')
  return { success: true }
}

export async function deleteTab(id: string) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  if (!z.string().uuid().safeParse(id).success) {
    return { success: false, error: 'Invalid tab ID' }
  }

  // Verify tab belongs to this facility
  const { data: tab } = await supabase
    .from('daily_report_tabs')
    .select('facility_id')
    .eq('id', id)
    .single()

  if (!tab || tab.facility_id !== profile!.facility_id) {
    return { success: false, error: 'Tab not found' }
  }

  // Cascade delete will remove associated checklist_items
  const { error } = await supabase
    .from('daily_report_tabs')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/daily-reports')
  return { success: true }
}

// ============================================
// Checklist Items
// ============================================
const CreateChecklistItemSchema = z.object({
  tab_id: z.string().uuid('Invalid tab ID'),
  checklist_type: z.enum(['opening', 'closing', 'daily_operations']),
  item_text: z.string().min(1, 'Item text is required').max(500),
  recurrence: z.enum(['daily', 'weekly', 'monthly', 'seasonal']),
})

export async function createChecklistItem(
  data: z.infer<typeof CreateChecklistItemSchema>
) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  const parsed = CreateChecklistItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  // Verify the tab belongs to this facility
  const { data: tab } = await supabase
    .from('daily_report_tabs')
    .select('facility_id')
    .eq('id', parsed.data.tab_id)
    .single()

  if (!tab || tab.facility_id !== profile!.facility_id) {
    return { success: false, error: 'Tab not found' }
  }

  // Get next sort_order within this tab and type
  const { data: existingItems } = await supabase
    .from('checklist_items')
    .select('sort_order')
    .eq('tab_id', parsed.data.tab_id)
    .eq('checklist_type', parsed.data.checklist_type)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existingItems && existingItems.length > 0
    ? (existingItems[0].sort_order ?? 0) + 1
    : 0

  const { error } = await supabase.from('checklist_items').insert({
    tab_id: parsed.data.tab_id,
    checklist_type: parsed.data.checklist_type,
    item_text: parsed.data.item_text,
    recurrence: parsed.data.recurrence,
    sort_order: nextSortOrder,
    is_active: true,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/daily-reports')
  return { success: true }
}

const UpdateChecklistItemSchema = z.object({
  item_text: z.string().min(1, 'Item text is required').max(500),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
})

export async function updateChecklistItem(
  id: string,
  data: z.infer<typeof UpdateChecklistItemSchema>
) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  if (!z.string().uuid().safeParse(id).success) {
    return { success: false, error: 'Invalid checklist item ID' }
  }

  const parsed = UpdateChecklistItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  // Verify item belongs to this facility via tab -> facility
  const { data: item } = await supabase
    .from('checklist_items')
    .select('tab_id, daily_report_tabs!inner(facility_id)')
    .eq('id', id)
    .single()

  const tabData = item?.daily_report_tabs as unknown as { facility_id: string } | null
  if (!item || !tabData || tabData.facility_id !== profile!.facility_id) {
    return { success: false, error: 'Checklist item not found' }
  }

  const { error } = await supabase
    .from('checklist_items')
    .update({
      item_text: parsed.data.item_text,
      sort_order: parsed.data.sort_order,
      is_active: parsed.data.is_active,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/daily-reports')
  return { success: true }
}

export async function deleteChecklistItem(id: string) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  if (!z.string().uuid().safeParse(id).success) {
    return { success: false, error: 'Invalid checklist item ID' }
  }

  // Verify item belongs to this facility via tab -> facility
  const { data: item } = await supabase
    .from('checklist_items')
    .select('tab_id, daily_report_tabs!inner(facility_id)')
    .eq('id', id)
    .single()

  const tabData = item?.daily_report_tabs as unknown as { facility_id: string } | null
  if (!item || !tabData || tabData.facility_id !== profile!.facility_id) {
    return { success: false, error: 'Checklist item not found' }
  }

  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/daily-reports')
  return { success: true }
}

// ============================================
// Equipment / Machines
// ============================================
const CreateMachineSchema = z.object({
  name: z.string().min(1, 'Machine name is required').max(200),
  fuel_type: z.enum(['gas', 'electric']),
})

export async function createMachine(data: z.infer<typeof CreateMachineSchema>) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  const parsed = CreateMachineSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const facilityId = profile!.facility_id

  // Get next sort_order
  const { data: existingMachines } = await supabase
    .from('machines')
    .select('sort_order')
    .eq('facility_id', facilityId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existingMachines && existingMachines.length > 0
    ? (existingMachines[0].sort_order ?? 0) + 1
    : 0

  const { error } = await supabase.from('machines').insert({
    facility_id: facilityId,
    name: parsed.data.name,
    fuel_type: parsed.data.fuel_type,
    sort_order: nextSortOrder,
    is_active: true,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/machines')
  return { success: true }
}

const CreateEquipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required').max(200),
  equipment_type: z.string().min(1, 'Equipment type is required').max(100),
})

export async function createEquipment(
  data: z.infer<typeof CreateEquipmentSchema>
) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  const parsed = CreateEquipmentSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const facilityId = profile!.facility_id

  // Get next sort_order
  const { data: existingEquipment } = await supabase
    .from('equipment')
    .select('sort_order')
    .eq('facility_id', facilityId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existingEquipment && existingEquipment.length > 0
    ? (existingEquipment[0].sort_order ?? 0) + 1
    : 0

  const { error } = await supabase.from('equipment').insert({
    facility_id: facilityId,
    name: parsed.data.name,
    equipment_type: parsed.data.equipment_type,
    sort_order: nextSortOrder,
    is_active: true,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

// ============================================
// Ice Depth Thresholds
// ============================================
const IceDepthThresholdsSchema = z.object({
  green_min: z.number().min(0),
  green_max: z.number().min(0),
  yellow_min: z.number().min(0),
  yellow_max: z.number().min(0),
  red_min: z.number().min(0),
  red_max: z.number().min(0),
}).refine(
  (d) => d.green_min <= d.green_max,
  { message: 'Green min must be <= green max', path: ['green_min'] }
).refine(
  (d) => d.yellow_min <= d.yellow_max,
  { message: 'Yellow min must be <= yellow max', path: ['yellow_min'] }
).refine(
  (d) => d.red_min <= d.red_max,
  { message: 'Red min must be <= red max', path: ['red_min'] }
)

export async function updateIceDepthThresholds(
  data: z.infer<typeof IceDepthThresholdsSchema>
) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  const parsed = IceDepthThresholdsSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const facilityId = profile!.facility_id

  const { error } = await supabase
    .from('ice_depth_thresholds')
    .upsert(
      {
        facility_id: facilityId,
        green_min: parsed.data.green_min,
        green_max: parsed.data.green_max,
        yellow_min: parsed.data.yellow_min,
        yellow_max: parsed.data.yellow_max,
        red_min: parsed.data.red_min,
        red_max: parsed.data.red_max,
      },
      { onConflict: 'facility_id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/ice-depth')
  return { success: true }
}

// ============================================
// Data Retention
// ============================================
const DataRetentionSchema = z.object({
  data_retention_years: z.number().int().min(1).max(10),
  incident_retention_years: z.number().int().min(1).max(25),
  archive_mode: z.boolean(),
})

export async function updateDataRetention(
  data: z.infer<typeof DataRetentionSchema>
) {
  const { supabase, profile, error: authError } = await getAuthenticatedFacility()
  if (authError) return { success: false, error: authError }

  const parsed = DataRetentionSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('facilities')
    .update({
      data_retention_years: parsed.data.data_retention_years,
      incident_retention_years: parsed.data.incident_retention_years,
      archive_mode: parsed.data.archive_mode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile!.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/data-retention')
  return { success: true }
}
