'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// Schemas
// ============================================

const toggleSchema = z.object({
  checklistItemId: z.string().uuid('Invalid checklist item ID'),
  completedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  isCompleted: z.boolean(),
})

const noteSchema = z.object({
  tabId: z.string().uuid('Invalid tab ID'),
  checklistType: z.enum(['opening', 'closing', 'daily_operations']),
  noteDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  notes: z.string().max(5000, 'Notes must be 5000 characters or less'),
})

// ============================================
// Helper: Get authenticated user profile
// ============================================

async function getAuthProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, profile: null, userId: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return { supabase, profile: null, userId: null, error: 'Profile not found' }

  return { supabase, profile, userId: user.id, error: null }
}

// ============================================
// Toggle Checklist Completion
// ============================================

/**
 * Toggles a checklist item's completion state for a given date.
 *
 * If isCompleted is true, upserts a completion record.
 * If isCompleted is false, deletes the completion record.
 */
export async function toggleChecklistCompletion(
  checklistItemId: string,
  completedDate: string,
  isCompleted: boolean
): Promise<{ success: boolean; error?: string }> {
  const { supabase, profile, userId, error: authError } = await getAuthProfile()
  if (authError || !profile || !userId) {
    return { success: false, error: authError ?? 'Authentication failed' }
  }

  // Read-only users cannot modify data
  if (profile.role === 'read_only') {
    return { success: false, error: 'Read-only users cannot modify checklist items' }
  }

  const parsed = toggleSchema.safeParse({ checklistItemId, completedDate, isCompleted })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') }
  }

  // Verify checklist item exists and belongs to a tab within this facility
  const { data: item } = await supabase
    .from('checklist_items')
    .select('id, tab:daily_report_tabs!inner(facility_id)')
    .eq('id', parsed.data.checklistItemId)
    .single()

  if (!item) {
    return { success: false, error: 'Checklist item not found' }
  }

  const tabData = item.tab as unknown as { facility_id: string }
  if (tabData.facility_id !== profile.facility_id) {
    return { success: false, error: 'Access denied' }
  }

  if (parsed.data.isCompleted) {
    // Upsert completion record
    const { error } = await supabase
      .from('checklist_completions')
      .upsert(
        {
          checklist_item_id: parsed.data.checklistItemId,
          facility_id: profile.facility_id,
          completed_date: parsed.data.completedDate,
          is_completed: true,
          completed_by: userId,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: 'checklist_item_id,completed_date',
        }
      )

    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    // Delete the completion record for this item + date
    const { error } = await supabase
      .from('checklist_completions')
      .delete()
      .eq('checklist_item_id', parsed.data.checklistItemId)
      .eq('completed_date', parsed.data.completedDate)
      .eq('facility_id', profile.facility_id)

    if (error) {
      return { success: false, error: error.message }
    }
  }

  revalidatePath('/daily-reports')
  return { success: true }
}

// ============================================
// Save Daily Report Note
// ============================================

/**
 * Upserts a note for a given tab, checklist type, and date.
 * Uses the unique constraint on (tab_id, checklist_type, note_date) for upsert.
 */
export async function saveDailyReportNote(
  tabId: string,
  checklistType: string,
  noteDate: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase, profile, userId, error: authError } = await getAuthProfile()
  if (authError || !profile || !userId) {
    return { success: false, error: authError ?? 'Authentication failed' }
  }

  if (profile.role === 'read_only') {
    return { success: false, error: 'Read-only users cannot save notes' }
  }

  const parsed = noteSchema.safeParse({ tabId, checklistType, noteDate, notes })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') }
  }

  // Verify the tab belongs to this facility
  const { data: tab } = await supabase
    .from('daily_report_tabs')
    .select('id')
    .eq('id', parsed.data.tabId)
    .eq('facility_id', profile.facility_id)
    .single()

  if (!tab) {
    return { success: false, error: 'Tab not found or access denied' }
  }

  const { error } = await supabase
    .from('daily_report_notes')
    .upsert(
      {
        facility_id: profile.facility_id,
        tab_id: parsed.data.tabId,
        checklist_type: parsed.data.checklistType,
        note_date: parsed.data.noteDate,
        notes: parsed.data.notes,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'tab_id,checklist_type,note_date',
      }
    )

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/daily-reports')
  return { success: true }
}
