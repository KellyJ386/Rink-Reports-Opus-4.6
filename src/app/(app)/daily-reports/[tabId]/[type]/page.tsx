'use client'

import { use, useEffect, useState, useCallback, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { toggleChecklistCompletion, saveDailyReportNote } from '../../actions'
import { shouldShowItem } from '@/lib/utils/recurrence'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { format, parseISO, isAfter, startOfDay } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Loader2,
  Save,
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface ChecklistItem {
  id: string
  item_text: string
  recurrence: string
  sort_order: number
}

interface CompletionRecord {
  id: string
  checklist_item_id: string
  is_completed: boolean
  completed_at: string | null
  completed_by: string | null
  completedByName?: string
}

interface ItemWithCompletion extends ChecklistItem {
  isCompleted: boolean
  completedAt: string | null
  completedByName: string | null
}

const TYPE_LABELS: Record<string, string> = {
  opening: 'Opening',
  closing: 'Closing',
  daily_operations: 'Daily Operations',
}

// ============================================
// Main Component
// ============================================

export default function ChecklistPage({
  params,
}: {
  params: Promise<{ tabId: string; type: string }>
}) {
  const { tabId, type } = use(params)
  const router = useRouter()
  const { profile, loading: authLoading, isReadOnly } = useAuth()
  const { toast } = useToast()

  const [tabName, setTabName] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [items, setItems] = useState<ItemWithCompletion[]>([])
  const [notes, setNotes] = useState<string>('')
  const [savedNotes, setSavedNotes] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [savingNote, setSavingNote] = useState(false)
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set())

  const noteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typeLabel = TYPE_LABELS[type] ?? type

  // ============================================
  // Data Fetching
  // ============================================

  const fetchData = useCallback(async () => {
    if (!profile?.facility_id) return

    const supabase = createClient()

    // Fetch tab name
    const { data: tab } = await supabase
      .from('daily_report_tabs')
      .select('name')
      .eq('id', tabId)
      .eq('facility_id', profile.facility_id)
      .single()

    if (tab) {
      setTabName(tab.name)
    }

    // Fetch active checklist items for this tab + type
    const { data: checklistItems } = await supabase
      .from('checklist_items')
      .select('id, item_text, recurrence, sort_order')
      .eq('tab_id', tabId)
      .eq('checklist_type', type)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (!checklistItems) {
      setItems([])
      setLoading(false)
      return
    }

    // Filter items by recurrence for the selected date
    const dateObj = parseISO(selectedDate)
    const visibleItems = checklistItems.filter((item) =>
      shouldShowItem(item.recurrence, dateObj)
    )

    if (visibleItems.length === 0) {
      setItems([])
      setLoading(false)
      return
    }

    // Fetch completions for visible items on the selected date
    const itemIds = visibleItems.map((i) => i.id)
    const { data: completions } = await supabase
      .from('checklist_completions')
      .select('id, checklist_item_id, is_completed, completed_at, completed_by')
      .eq('facility_id', profile.facility_id)
      .eq('completed_date', selectedDate)
      .in('checklist_item_id', itemIds)

    // Fetch names of users who completed items
    const completedByIds = [
      ...new Set(
        (completions ?? [])
          .filter((c) => c.completed_by)
          .map((c) => c.completed_by as string)
      ),
    ]

    let profileMap: Record<string, string> = {}
    if (completedByIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', completedByIds)

      if (profiles) {
        profileMap = Object.fromEntries(
          profiles.map((p) => [p.id, p.full_name])
        )
      }
    }

    // Build completion lookup
    const completionMap = new Map<string, CompletionRecord>()
    ;(completions ?? []).forEach((c) => {
      completionMap.set(c.checklist_item_id, {
        ...c,
        completedByName: c.completed_by ? profileMap[c.completed_by] : undefined,
      })
    })

    // Merge items with completions
    const mergedItems: ItemWithCompletion[] = visibleItems.map((item) => {
      const completion = completionMap.get(item.id)
      return {
        ...item,
        isCompleted: completion?.is_completed ?? false,
        completedAt: completion?.completed_at ?? null,
        completedByName: completion?.completedByName ?? null,
      }
    })

    setItems(mergedItems)

    // Fetch notes for this tab + type + date
    const { data: noteData } = await supabase
      .from('daily_report_notes')
      .select('notes')
      .eq('tab_id', tabId)
      .eq('checklist_type', type)
      .eq('note_date', selectedDate)
      .single()

    const currentNotes = noteData?.notes ?? ''
    setNotes(currentNotes)
    setSavedNotes(currentNotes)
    setLoading(false)
  }, [tabId, type, selectedDate, profile?.facility_id])

  useEffect(() => {
    if (!authLoading && profile?.facility_id) {
      setLoading(true)
      fetchData()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading, profile?.facility_id, fetchData])

  // ============================================
  // Handlers
  // ============================================

  const handleToggle = async (itemId: string, currentState: boolean) => {
    if (isReadOnly) {
      toast({ title: 'Read-only users cannot modify checklist items', variant: 'destructive' })
      return
    }

    const newState = !currentState

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              isCompleted: newState,
              completedAt: newState ? new Date().toISOString() : null,
              completedByName: newState ? (profile?.full_name ?? 'You') : null,
            }
          : item
      )
    )

    setPendingToggles((prev) => new Set(prev).add(itemId))

    const result = await toggleChecklistCompletion(itemId, selectedDate, newState)

    setPendingToggles((prev) => {
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })

    if (!result.success) {
      // Revert optimistic update on error
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                isCompleted: currentState,
                completedAt: currentState ? item.completedAt : null,
                completedByName: currentState ? item.completedByName : null,
              }
            : item
        )
      )
      toast({ title: result.error ?? 'Failed to update checklist item', variant: 'destructive' })
    }
  }

  const handleNoteSave = async () => {
    if (isReadOnly) return
    if (notes === savedNotes) return

    setSavingNote(true)
    const result = await saveDailyReportNote(tabId, type, selectedDate, notes)
    setSavingNote(false)

    if (result.success) {
      setSavedNotes(notes)
      toast({ title: 'Notes saved', variant: 'success' })
    } else {
      toast({ title: result.error ?? 'Failed to save notes', variant: 'destructive' })
    }
  }

  const handleNoteBlur = () => {
    // Auto-save on blur after a short delay
    if (noteTimeoutRef.current) {
      clearTimeout(noteTimeoutRef.current)
    }
    noteTimeoutRef.current = setTimeout(() => {
      handleNoteSave()
    }, 300)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    // Prevent selecting future dates
    const today = format(new Date(), 'yyyy-MM-dd')
    if (newDate > today) {
      toast({ title: 'Cannot select a future date', variant: 'destructive' })
      return
    }
    setSelectedDate(newDate)
  }

  // ============================================
  // Computed
  // ============================================

  const completedCount = items.filter((i) => i.isCompleted).length
  const totalCount = items.length
  const allComplete = totalCount > 0 && completedCount === totalCount
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const isToday = selectedDate === todayStr
  const hasUnsavedNotes = notes !== savedNotes

  // ============================================
  // Render
  // ============================================

  if (loading || authLoading) {
    return <ChecklistSkeleton />
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 text-wolf-grey-dark hover:text-navy dark:text-wolf-grey dark:hover:text-white"
          onClick={() => router.push(`/daily-reports/${tabId}`)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to {tabName || 'Report'}
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-white">
              {typeLabel} Checklist
            </h1>
            <p className="mt-0.5 text-sm text-wolf-grey-dark dark:text-wolf-grey">
              {tabName}
            </p>
          </div>

          {/* Completion badge */}
          {totalCount > 0 && (
            <Badge
              className={cn(
                'self-start text-sm',
                allComplete
                  ? 'bg-action-green text-white hover:bg-action-green-hover'
                  : 'bg-wolf-grey-light text-navy dark:bg-navy-light dark:text-white'
              )}
            >
              {allComplete ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  All Complete
                </span>
              ) : (
                `${completedCount}/${totalCount} complete`
              )}
            </Badge>
          )}
        </div>
      </div>

      {/* Date Selector */}
      <Card className="mb-6 dark:bg-navy dark:border-navy-light">
        <CardContent className="flex items-center gap-3 p-4">
          <Calendar className="h-5 w-5 shrink-0 text-navy dark:text-action-green" />
          <div className="flex flex-1 items-center gap-3">
            <Label htmlFor="date-select" className="shrink-0 text-sm font-medium text-navy dark:text-white">
              Date:
            </Label>
            <Input
              id="date-select"
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={handleDateChange}
              className="max-w-[200px] dark:bg-navy-dark dark:border-navy-light dark:text-white"
            />
            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(todayStr)}
                className="shrink-0 dark:border-navy-light dark:text-white dark:hover:bg-navy-light"
              >
                Today
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      {items.length === 0 ? (
        <Card className="dark:bg-navy dark:border-navy-light">
          <CardContent className="py-12 text-center">
            <p className="text-wolf-grey-dark dark:text-wolf-grey">
              No checklist items to display for this date.
            </p>
            <p className="mt-1 text-sm text-wolf-grey dark:text-wolf-grey-dark">
              Items may be filtered by their recurrence schedule (weekly, monthly, seasonal).
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 dark:bg-navy dark:border-navy-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-navy dark:text-white">
              {typeLabel} Items
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-wolf-grey-light dark:divide-navy-light">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-start gap-4 py-4 first:pt-2 last:pb-2',
                  'transition-colors'
                )}
              >
                {/* Checkbox with large touch target */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={item.isCompleted}
                    disabled={isReadOnly || pendingToggles.has(item.id)}
                    onCheckedChange={() => handleToggle(item.id, item.isCompleted)}
                    className={cn(
                      'h-6 w-6 rounded-md border-2',
                      item.isCompleted
                        ? 'border-action-green bg-action-green data-[state=checked]:bg-action-green data-[state=checked]:border-action-green'
                        : 'border-wolf-grey dark:border-wolf-grey-dark'
                    )}
                  />
                </div>

                {/* Item content */}
                <div className="flex-1 pt-1">
                  <label
                    htmlFor={`item-${item.id}`}
                    className={cn(
                      'block cursor-pointer text-sm font-medium leading-tight',
                      item.isCompleted
                        ? 'text-wolf-grey-dark line-through dark:text-wolf-grey'
                        : 'text-navy dark:text-white'
                    )}
                  >
                    {item.item_text}
                  </label>

                  {/* Recurrence badge */}
                  {item.recurrence !== 'daily' && (
                    <Badge
                      variant="outline"
                      className="mt-1 text-xs capitalize dark:border-navy-light dark:text-wolf-grey"
                    >
                      {item.recurrence}
                    </Badge>
                  )}

                  {/* Completion metadata */}
                  {item.isCompleted && (item.completedAt || item.completedByName) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-wolf-grey-dark dark:text-wolf-grey">
                      {item.completedByName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.completedByName}
                        </span>
                      )}
                      {item.completedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(item.completedAt), 'h:mm a')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Loading indicator for pending toggle */}
                {pendingToggles.has(item.id) && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-wolf-grey" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Notes Section */}
      <Card className="dark:bg-navy dark:border-navy-light">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-navy dark:text-white">Notes</CardTitle>
            {hasUnsavedNotes && (
              <span className="text-xs text-alert-yellow">Unsaved changes</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder={
              isReadOnly
                ? 'No notes for this date'
                : 'Add notes for this checklist...'
            }
            disabled={isReadOnly}
            className="min-h-[100px] resize-y dark:bg-navy-dark dark:border-navy-light dark:text-white dark:placeholder:text-wolf-grey-dark"
            maxLength={5000}
          />
          {!isReadOnly && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-wolf-grey-dark dark:text-wolf-grey">
                {notes.length}/5000 characters
              </span>
              <Button
                size="sm"
                onClick={handleNoteSave}
                disabled={savingNote || notes === savedNotes}
                className="bg-action-green text-white hover:bg-action-green-hover"
              >
                {savingNote ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1 h-4 w-4" />
                )}
                Save Notes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// Skeleton Loading State
// ============================================

function ChecklistSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <div className="mb-2 h-8 w-32 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="h-8 w-56 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="mt-1 h-5 w-40 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
      </div>

      {/* Date selector skeleton */}
      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm dark:border-navy-light dark:bg-navy">
        <div className="h-10 w-48 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
      </div>

      {/* Items skeleton */}
      <div className="mb-6 rounded-lg border bg-white shadow-sm dark:border-navy-light dark:bg-navy">
        <div className="p-6 pb-2">
          <div className="h-6 w-32 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
        </div>
        <div className="divide-y divide-wolf-grey-light p-6 pt-2 dark:divide-navy-light">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 py-4">
              <div className="h-6 w-6 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
              <div className="flex-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
                <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes skeleton */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-navy-light dark:bg-navy">
        <div className="p-6 pb-2">
          <div className="h-6 w-16 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
        </div>
        <div className="p-6 pt-2">
          <div className="h-24 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
        </div>
      </div>
    </div>
  )
}
