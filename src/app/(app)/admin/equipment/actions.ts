'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// Schemas
// ============================================

const machineSchema = z.object({
  name: z.string().min(1, 'Machine name is required').max(100),
  fuel_type: z.enum(['gas', 'electric']),
})

const circleCheckItemSchema = z.object({
  machine_id: z.string().uuid('Invalid machine ID'),
  item_text: z.string().min(1, 'Item text is required').max(500),
})

const reorderItemSchema = z.object({
  id: z.string().uuid(),
  sort_order: z.number().int().min(0),
})

const reorderSchema = z.array(reorderItemSchema).min(1)

const equipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required').max(100),
  equipment_type: z.string().min(1, 'Equipment type is required').max(100),
})

const readingTypeSchema = z.object({
  equipment_id: z.string().uuid('Invalid equipment ID'),
  name: z.string().min(1, 'Reading type name is required').max(100),
  unit: z.string().min(1, 'Unit is required').max(50),
  min_threshold: z.number().nullable().optional(),
  max_threshold: z.number().nullable().optional(),
  is_oil_level: z.boolean().default(false),
})

const shiftTypeSchema = z.object({
  name: z.string().min(1, 'Shift type name is required').max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code'),
})

const incidentLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(200),
})

const airQualityMetricSchema = z.object({
  name: z.string().min(1, 'Metric name is required').max(100),
  unit: z.string().min(1, 'Unit is required').max(50),
  min_threshold: z.number().nullable().optional(),
  max_threshold: z.number().nullable().optional(),
})

const airQualityLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(200),
})

// ============================================
// Helper: Get authenticated user profile
// ============================================

async function getAuthenticatedProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, profile: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return { supabase, profile: null, error: 'Profile not found' }
  if (profile.role !== 'facility_admin' && profile.role !== 'super_admin') {
    return { supabase, profile: null, error: 'Insufficient permissions' }
  }

  return { supabase, profile, error: null }
}

// ============================================
// Machine Actions
// ============================================

export async function createMachine(formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = machineSchema.safeParse({
    name: formData.get('name'),
    fuel_type: formData.get('fuel_type'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('machines')
    .insert({
      facility_id: profile.facility_id,
      name: parsed.data.name,
      fuel_type: parsed.data.fuel_type,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function updateMachine(id: string, formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid machine ID' }

  const parsed = machineSchema.safeParse({
    name: formData.get('name'),
    fuel_type: formData.get('fuel_type'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('machines')
    .update({
      name: parsed.data.name,
      fuel_type: parsed.data.fuel_type,
    })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function toggleMachineActive(id: string, isActive: boolean) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid machine ID' }

  const parsed = z.boolean().safeParse(isActive)
  if (!parsed.success) return { success: false, error: 'Invalid isActive value' }

  const { error } = await supabase
    .from('machines')
    .update({ is_active: parsed.data })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

// ============================================
// Circle Check Item Actions
// ============================================

export async function createCircleCheckItem(formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = circleCheckItemSchema.safeParse({
    machine_id: formData.get('machine_id'),
    item_text: formData.get('item_text'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  // Verify the machine belongs to this facility
  const { data: machine } = await supabase
    .from('machines')
    .select('id')
    .eq('id', parsed.data.machine_id)
    .eq('facility_id', profile.facility_id)
    .single()

  if (!machine) return { success: false, error: 'Machine not found or access denied' }

  const { error } = await supabase
    .from('circle_check_items')
    .insert({
      machine_id: parsed.data.machine_id,
      item_text: parsed.data.item_text,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function updateCircleCheckItem(id: string, formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid circle check item ID' }

  const itemText = z.string().min(1, 'Item text is required').max(500).safeParse(formData.get('item_text'))
  if (!itemText.success) {
    return { success: false, error: itemText.error.flatten().formErrors }
  }

  // Verify the circle check item belongs to a machine in this facility
  const { data: item } = await supabase
    .from('circle_check_items')
    .select('id, machine:machines!inner(facility_id)')
    .eq('id', id)
    .single()

  if (!item) return { success: false, error: 'Circle check item not found' }

  const machineData = item.machine as unknown as { facility_id: string }
  if (machineData.facility_id !== profile.facility_id) {
    return { success: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('circle_check_items')
    .update({ item_text: itemText.data })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function deleteCircleCheckItem(id: string) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid circle check item ID' }

  // Verify the circle check item belongs to a machine in this facility
  const { data: item } = await supabase
    .from('circle_check_items')
    .select('id, machine:machines!inner(facility_id)')
    .eq('id', id)
    .single()

  if (!item) return { success: false, error: 'Circle check item not found' }

  const machineData = item.machine as unknown as { facility_id: string }
  if (machineData.facility_id !== profile.facility_id) {
    return { success: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('circle_check_items')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function reorderCircleCheckItems(
  items: { id: string; sort_order: number }[]
) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = reorderSchema.safeParse(items)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const updates = parsed.data.map((item) =>
    supabase
      .from('circle_check_items')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { success: false, error: failed.error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

// ============================================
// Equipment (Refrigeration) Actions
// ============================================

export async function createEquipment(formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = equipmentSchema.safeParse({
    name: formData.get('name'),
    equipment_type: formData.get('equipment_type'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('equipment')
    .insert({
      facility_id: profile.facility_id,
      name: parsed.data.name,
      equipment_type: parsed.data.equipment_type,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function updateEquipment(id: string, formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid equipment ID' }

  const parsed = equipmentSchema.safeParse({
    name: formData.get('name'),
    equipment_type: formData.get('equipment_type'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('equipment')
    .update({
      name: parsed.data.name,
      equipment_type: parsed.data.equipment_type,
    })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function toggleEquipmentActive(id: string, isActive: boolean) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid equipment ID' }

  const parsed = z.boolean().safeParse(isActive)
  if (!parsed.success) return { success: false, error: 'Invalid isActive value' }

  const { error } = await supabase
    .from('equipment')
    .update({ is_active: parsed.data })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

// ============================================
// Equipment Reading Type Actions
// ============================================

export async function createReadingType(formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const minThreshold = formData.get('min_threshold')
  const maxThreshold = formData.get('max_threshold')

  const parsed = readingTypeSchema.safeParse({
    equipment_id: formData.get('equipment_id'),
    name: formData.get('name'),
    unit: formData.get('unit'),
    min_threshold: minThreshold ? Number(minThreshold) : null,
    max_threshold: maxThreshold ? Number(maxThreshold) : null,
    is_oil_level: formData.get('is_oil_level') === 'true',
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  // Verify the equipment belongs to this facility
  const { data: equip } = await supabase
    .from('equipment')
    .select('id')
    .eq('id', parsed.data.equipment_id)
    .eq('facility_id', profile.facility_id)
    .single()

  if (!equip) return { success: false, error: 'Equipment not found or access denied' }

  const { error } = await supabase
    .from('equipment_reading_types')
    .insert({
      equipment_id: parsed.data.equipment_id,
      name: parsed.data.name,
      unit: parsed.data.unit,
      min_threshold: parsed.data.min_threshold ?? null,
      max_threshold: parsed.data.max_threshold ?? null,
      is_oil_level: parsed.data.is_oil_level,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function updateReadingType(id: string, formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid reading type ID' }

  const minThreshold = formData.get('min_threshold')
  const maxThreshold = formData.get('max_threshold')

  const parsed = readingTypeSchema.safeParse({
    equipment_id: formData.get('equipment_id'),
    name: formData.get('name'),
    unit: formData.get('unit'),
    min_threshold: minThreshold ? Number(minThreshold) : null,
    max_threshold: maxThreshold ? Number(maxThreshold) : null,
    is_oil_level: formData.get('is_oil_level') === 'true',
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  // Verify the equipment belongs to this facility
  const { data: equip } = await supabase
    .from('equipment')
    .select('id')
    .eq('id', parsed.data.equipment_id)
    .eq('facility_id', profile.facility_id)
    .single()

  if (!equip) return { success: false, error: 'Equipment not found or access denied' }

  const { error } = await supabase
    .from('equipment_reading_types')
    .update({
      name: parsed.data.name,
      unit: parsed.data.unit,
      min_threshold: parsed.data.min_threshold ?? null,
      max_threshold: parsed.data.max_threshold ?? null,
      is_oil_level: parsed.data.is_oil_level,
    })
    .eq('id', id)
    .eq('equipment_id', parsed.data.equipment_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function deleteReadingType(id: string) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid reading type ID' }

  // Verify the reading type belongs to equipment in this facility
  const { data: readingType } = await supabase
    .from('equipment_reading_types')
    .select('id, equipment:equipment!inner(facility_id)')
    .eq('id', id)
    .single()

  if (!readingType) return { success: false, error: 'Reading type not found' }

  const equipData = readingType.equipment as unknown as { facility_id: string }
  if (equipData.facility_id !== profile.facility_id) {
    return { success: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('equipment_reading_types')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

// ============================================
// Shift Type Actions
// ============================================

export async function createShiftType(formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = shiftTypeSchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('shift_types')
    .insert({
      facility_id: profile.facility_id,
      name: parsed.data.name,
      color: parsed.data.color,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function updateShiftType(id: string, formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid shift type ID' }

  const parsed = shiftTypeSchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('shift_types')
    .update({
      name: parsed.data.name,
      color: parsed.data.color,
    })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function toggleShiftTypeActive(id: string, isActive: boolean) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid shift type ID' }

  const parsed = z.boolean().safeParse(isActive)
  if (!parsed.success) return { success: false, error: 'Invalid isActive value' }

  const { error } = await supabase
    .from('shift_types')
    .update({ is_active: parsed.data })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

// ============================================
// Incident Location Actions
// ============================================

export async function createIncidentLocation(formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = incidentLocationSchema.safeParse({
    name: formData.get('name'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('incident_locations')
    .insert({
      facility_id: profile.facility_id,
      name: parsed.data.name,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function updateIncidentLocation(id: string, formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid incident location ID' }

  const parsed = incidentLocationSchema.safeParse({
    name: formData.get('name'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('incident_locations')
    .update({ name: parsed.data.name })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function deleteIncidentLocation(id: string) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid incident location ID' }

  const { error } = await supabase
    .from('incident_locations')
    .delete()
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

// ============================================
// Air Quality Metric Actions
// ============================================

export async function createAirQualityMetric(formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const minThreshold = formData.get('min_threshold')
  const maxThreshold = formData.get('max_threshold')

  const parsed = airQualityMetricSchema.safeParse({
    name: formData.get('name'),
    unit: formData.get('unit'),
    min_threshold: minThreshold ? Number(minThreshold) : null,
    max_threshold: maxThreshold ? Number(maxThreshold) : null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('air_quality_metrics')
    .insert({
      facility_id: profile.facility_id,
      name: parsed.data.name,
      unit: parsed.data.unit,
      min_threshold: parsed.data.min_threshold ?? null,
      max_threshold: parsed.data.max_threshold ?? null,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function updateAirQualityMetric(id: string, formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid air quality metric ID' }

  const minThreshold = formData.get('min_threshold')
  const maxThreshold = formData.get('max_threshold')

  const parsed = airQualityMetricSchema.safeParse({
    name: formData.get('name'),
    unit: formData.get('unit'),
    min_threshold: minThreshold ? Number(minThreshold) : null,
    max_threshold: maxThreshold ? Number(maxThreshold) : null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('air_quality_metrics')
    .update({
      name: parsed.data.name,
      unit: parsed.data.unit,
      min_threshold: parsed.data.min_threshold ?? null,
      max_threshold: parsed.data.max_threshold ?? null,
    })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function deleteAirQualityMetric(id: string) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid air quality metric ID' }

  const { error } = await supabase
    .from('air_quality_metrics')
    .delete()
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

// ============================================
// Air Quality Location Actions
// ============================================

export async function createAirQualityLocation(formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = airQualityLocationSchema.safeParse({
    name: formData.get('name'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('air_quality_locations')
    .insert({
      facility_id: profile.facility_id,
      name: parsed.data.name,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function updateAirQualityLocation(id: string, formData: FormData) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid air quality location ID' }

  const parsed = airQualityLocationSchema.safeParse({
    name: formData.get('name'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('air_quality_locations')
    .update({ name: parsed.data.name })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function deleteAirQualityLocation(id: string) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid air quality location ID' }

  const { error } = await supabase
    .from('air_quality_locations')
    .delete()
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}
