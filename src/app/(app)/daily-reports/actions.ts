'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Toggle a single checklist item's completion status for a given date.
 */
export async function toggleChecklistItem(
  checklistItemId: string,
  date: string,
  isCompleted: boolean
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }

  if (isCompleted) {
    const { error } = await supabase.from('checklist_completions').upsert(
      {
        checklist_item_id: checklistItemId,
        facility_id: profile.facility_id,
        completed_date: date,
        is_completed: true,
        completed_by: user.id,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'checklist_item_id,completed_date' }
    )
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('checklist_completions')
      .update({ is_completed: false })
      .match({ checklist_item_id: checklistItemId, completed_date: date })
    if (error) return { error: error.message }
  }

  revalidatePath('/daily-reports')
  return { success: true }
}

/**
 * Save or update notes for a specific tab, checklist type, and date.
 */
export async function saveDailyReportNotes(
  tabId: string,
  checklistType: string,
  date: string,
  notes: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabase.from('daily_report_notes').upsert(
    {
      facility_id: profile.facility_id,
      tab_id: tabId,
      checklist_type: checklistType,
      note_date: date,
      notes,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tab_id,checklist_type,note_date' }
  )

  if (error) return { error: error.message }

  revalidatePath('/daily-reports')
  return { success: true }
}

/**
 * Fetch all daily report tabs for the user's facility with today's completion stats.
 */
export async function getTabsWithCompletion() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated', data: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found', data: null }

  const today = new Date().toISOString().split('T')[0]

  // Fetch tabs for this facility
  const { data: tabs, error: tabsError } = await supabase
    .from('daily_report_tabs')
    .select('id, name, sort_order, is_active')
    .eq('facility_id', profile.facility_id)
    .eq('is_active', true)
    .order('sort_order')

  if (tabsError) return { error: tabsError.message, data: null }

  // For each tab, count total items and completed items for today
  const tabsWithCompletion = await Promise.all(
    (tabs ?? []).map(async (tab) => {
      const { count: totalItems } = await supabase
        .from('checklist_items')
        .select('*', { count: 'exact', head: true })
        .eq('tab_id', tab.id)
        .eq('is_active', true)

      const { count: completedItems } = await supabase
        .from('checklist_completions')
        .select('*, checklist_items!inner(tab_id)', {
          count: 'exact',
          head: true,
        })
        .eq('checklist_items.tab_id', tab.id)
        .eq('completed_date', today)
        .eq('is_completed', true)

      return {
        ...tab,
        totalItems: totalItems ?? 0,
        completedItems: completedItems ?? 0,
      }
    })
  )

  return { data: tabsWithCompletion, error: null }
}
