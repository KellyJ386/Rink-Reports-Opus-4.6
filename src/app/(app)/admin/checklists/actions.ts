'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// Schemas
// ============================================

const tabSchema = z.object({
  name: z.string().min(1, 'Tab name is required').max(100),
  sort_order: z.number().int().min(0).default(0),
})

const checklistItemCreateSchema = z.object({
  tab_id: z.string().uuid('Invalid tab ID'),
  checklist_type: z.enum(['opening', 'closing', 'daily_operations']),
  item_text: z.string().min(1, 'Item text is required').max(500),
  recurrence: z.enum(['daily', 'weekly', 'monthly', 'seasonal']).default('daily'),
})

const checklistItemUpdateSchema = z.object({
  item_text: z.string().min(1, 'Item text is required').max(500),
  recurrence: z.enum(['daily', 'weekly', 'monthly', 'seasonal']).default('daily'),
})

const MAX_TABS = 30

// ============================================
// Helper: Format Zod errors as a single string
// ============================================

function formatZodError(error: z.ZodError): string {
  return error.issues.map((e) => e.message).join(', ')
}

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
// Tab Actions
// ============================================

export async function createTab(input: FormData | string) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const parsed = tabSchema.safeParse(
    typeof input === 'string'
      ? { name: input, sort_order: 0 }
      : { name: input.get('name'), sort_order: Number(input.get('sort_order') ?? 0) }
  )

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) }
  }

  // Enforce max 30 tabs per facility
  const { count } = await supabase
    .from('daily_report_tabs')
    .select('id', { count: 'exact', head: true })
    .eq('facility_id', profile.facility_id)

  if (count !== null && count >= MAX_TABS) {
    return { success: false, error: `Maximum of ${MAX_TABS} tabs allowed per facility` }
  }

  const { error } = await supabase
    .from('daily_report_tabs')
    .insert({
      facility_id: profile.facility_id,
      name: parsed.data.name,
      sort_order: parsed.data.sort_order,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/checklists')
  return { success: true }
}

export async function updateTab(id: string, input: FormData | string) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid tab ID' }

  const parsed = tabSchema.safeParse(
    typeof input === 'string'
      ? { name: input, sort_order: 0 }
      : { name: input.get('name'), sort_order: Number(input.get('sort_order') ?? 0) }
  )

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) }
  }

  const { error } = await supabase
    .from('daily_report_tabs')
    .update({ name: parsed.data.name, sort_order: parsed.data.sort_order })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/checklists')
  return { success: true }
}

export async function toggleTabActive(id: string, isActive: boolean) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid tab ID' }

  const parsed = z.boolean().safeParse(isActive)
  if (!parsed.success) return { success: false, error: 'Invalid isActive value' }

  const { error } = await supabase
    .from('daily_report_tabs')
    .update({ is_active: parsed.data })
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/checklists')
  return { success: true }
}

export async function deleteTab(id: string) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid tab ID' }

  // Cascade delete handled by DB foreign key (checklist_items reference tab_id ON DELETE CASCADE)
  const { error } = await supabase
    .from('daily_report_tabs')
    .delete()
    .eq('id', id)
    .eq('facility_id', profile.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/checklists')
  return { success: true }
}

// ============================================
// Checklist Item Actions
// ============================================

/**
 * Create a checklist item. Supports two calling patterns:
 * 1. createChecklistItem(formData: FormData) — with tab_id, checklist_type, item_text, recurrence fields
 * 2. createChecklistItem(tabId, checklistType, itemText, recurrence) — positional args
 */
export async function createChecklistItem(
  inputOrTabId: FormData | string,
  checklistType?: string,
  itemText?: string,
  recurrence?: string,
) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  let rawData: Record<string, unknown>

  if (inputOrTabId instanceof FormData) {
    rawData = {
      tab_id: inputOrTabId.get('tab_id'),
      checklist_type: inputOrTabId.get('checklist_type'),
      item_text: inputOrTabId.get('item_text'),
      recurrence: inputOrTabId.get('recurrence') || 'daily',
    }
  } else {
    rawData = {
      tab_id: inputOrTabId,
      checklist_type: checklistType,
      item_text: itemText,
      recurrence: recurrence || 'daily',
    }
  }

  const parsed = checklistItemCreateSchema.safeParse(rawData)

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) }
  }

  // Verify the tab belongs to this facility
  const { data: tab } = await supabase
    .from('daily_report_tabs')
    .select('id')
    .eq('id', parsed.data.tab_id)
    .eq('facility_id', profile.facility_id)
    .single()

  if (!tab) return { success: false, error: 'Tab not found or access denied' }

  const { error } = await supabase
    .from('checklist_items')
    .insert({
      tab_id: parsed.data.tab_id,
      checklist_type: parsed.data.checklist_type,
      item_text: parsed.data.item_text,
      recurrence: parsed.data.recurrence,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/checklists')
  return { success: true }
}

/**
 * Update a checklist item. Supports two calling patterns:
 * 1. updateChecklistItem(id, formData: FormData) — with item_text, recurrence fields
 * 2. updateChecklistItem(id, itemText, recurrence) — positional args
 */
export async function updateChecklistItem(
  id: string,
  inputOrText: FormData | string,
  recurrence?: string,
) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid item ID' }

  let rawData: Record<string, unknown>

  if (inputOrText instanceof FormData) {
    rawData = {
      item_text: inputOrText.get('item_text'),
      recurrence: inputOrText.get('recurrence') || 'daily',
    }
  } else {
    rawData = {
      item_text: inputOrText,
      recurrence: recurrence || 'daily',
    }
  }

  const parsed = checklistItemUpdateSchema.safeParse(rawData)

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) }
  }

  // Verify the item belongs to a tab in this facility via join
  const { data: item } = await supabase
    .from('checklist_items')
    .select('id, tab:daily_report_tabs!inner(facility_id)')
    .eq('id', id)
    .single()

  if (!item) return { success: false, error: 'Item not found' }

  const tabData = item.tab as unknown as { facility_id: string }
  if (tabData.facility_id !== profile.facility_id) {
    return { success: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('checklist_items')
    .update({
      item_text: parsed.data.item_text,
      recurrence: parsed.data.recurrence,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/checklists')
  return { success: true }
}

export async function toggleChecklistItemActive(id: string, isActive: boolean) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid item ID' }

  const parsed = z.boolean().safeParse(isActive)
  if (!parsed.success) return { success: false, error: 'Invalid isActive value' }

  // Verify the item belongs to a tab in this facility via join
  const { data: item } = await supabase
    .from('checklist_items')
    .select('id, tab:daily_report_tabs!inner(facility_id)')
    .eq('id', id)
    .single()

  if (!item) return { success: false, error: 'Item not found' }

  const tabData = item.tab as unknown as { facility_id: string }
  if (tabData.facility_id !== profile.facility_id) {
    return { success: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('checklist_items')
    .update({ is_active: parsed.data })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/checklists')
  return { success: true }
}

export async function deleteChecklistItem(id: string) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  const idResult = z.string().uuid().safeParse(id)
  if (!idResult.success) return { success: false, error: 'Invalid item ID' }

  // Verify the item belongs to a tab in this facility via join
  const { data: item } = await supabase
    .from('checklist_items')
    .select('id, tab:daily_report_tabs!inner(facility_id)')
    .eq('id', id)
    .single()

  if (!item) return { success: false, error: 'Item not found' }

  const tabData = item.tab as unknown as { facility_id: string }
  if (tabData.facility_id !== profile.facility_id) {
    return { success: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/checklists')
  return { success: true }
}

/**
 * Reorder checklist items. Supports two calling patterns:
 * 1. reorderChecklistItems([{ id, sort_order }, ...]) — explicit sort orders
 * 2. reorderChecklistItems(['id1', 'id2', ...]) — IDs in desired order (sort_order derived from index)
 */
export async function reorderChecklistItems(
  items: { id: string; sort_order: number }[] | string[]
) {
  const { supabase, profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { success: false, error: authError }

  // Normalize input: if string array, convert to { id, sort_order } objects
  let normalizedItems: { id: string; sort_order: number }[]

  if (items.length === 0) {
    return { success: false, error: 'No items to reorder' }
  }

  if (typeof items[0] === 'string') {
    normalizedItems = (items as string[]).map((id, index) => ({
      id,
      sort_order: index + 1,
    }))
  } else {
    normalizedItems = items as { id: string; sort_order: number }[]
  }

  // Validate each item
  const itemSchema = z.object({
    id: z.string().uuid(),
    sort_order: z.number().int().min(0),
  })
  for (const item of normalizedItems) {
    const result = itemSchema.safeParse(item)
    if (!result.success) {
      return { success: false, error: formatZodError(result.error) }
    }
  }

  // Batch update sort_order for each item
  const updates = normalizedItems.map((item) =>
    supabase
      .from('checklist_items')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { success: false, error: failed.error.message }

  revalidatePath('/admin/checklists')
  return { success: true }
}
