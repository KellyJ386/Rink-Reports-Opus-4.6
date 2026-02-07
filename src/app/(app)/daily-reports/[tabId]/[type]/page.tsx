'use client'

import { use, useState, useCallback, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// Mock tab name lookup
const TAB_NAMES: Record<string, string> = {
  'front-desk': 'Front Desk',
  'zamboni-log': 'Zamboni Log',
  'skate-rental': 'Skate Rental',
  concessions: 'Concessions',
  janitorial: 'Janitorial',
}

const TYPE_LABELS: Record<string, string> = {
  opening: 'Opening',
  closing: 'Closing',
  daily_operations: 'Daily Operations',
}

interface MockChecklistItem {
  id: string
  text: string
  isCompleted: boolean
  completedAt: string | null
  completedBy: string | null
}

function getMockItems(type: string): MockChecklistItem[] {
  switch (type) {
    case 'opening':
      return [
        { id: '1', text: 'Unlock all exterior doors', isCompleted: false, completedAt: null, completedBy: null },
        { id: '2', text: 'Turn on rink lights and lobby lights', isCompleted: false, completedAt: null, completedBy: null },
        { id: '3', text: 'Check ice surface for debris or damage', isCompleted: false, completedAt: null, completedBy: null },
        { id: '4', text: 'Power on POS systems and verify connectivity', isCompleted: false, completedAt: null, completedBy: null },
        { id: '5', text: 'Review schedule board for today', isCompleted: false, completedAt: null, completedBy: null },
      ]
    case 'closing':
      return [
        { id: '6', text: 'Clear all patrons from rink area', isCompleted: false, completedAt: null, completedBy: null },
        { id: '7', text: 'Run final ice resurface', isCompleted: false, completedAt: null, completedBy: null },
        { id: '8', text: 'Shut down POS systems and close registers', isCompleted: false, completedAt: null, completedBy: null },
        { id: '9', text: 'Lock all exterior doors and arm alarm', isCompleted: false, completedAt: null, completedBy: null },
      ]
    case 'daily_operations':
      return [
        { id: '10', text: 'Inspect boards and glass for damage', isCompleted: false, completedAt: null, completedBy: null },
        { id: '11', text: 'Check first aid supplies are stocked', isCompleted: false, completedAt: null, completedBy: null },
        { id: '12', text: 'Empty trash bins in public areas', isCompleted: false, completedAt: null, completedBy: null },
      ]
    default:
      return []
  }
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

export default function ChecklistPage({
  params,
}: {
  params: Promise<{ tabId: string; type: string }>
}) {
  const { tabId, type } = use(params)
  const tabName = TAB_NAMES[tabId] ?? tabId
  const typeLabel = TYPE_LABELS[type] ?? type

  const [selectedDate, setSelectedDate] = useState(todayString)
  const [items, setItems] = useState<MockChecklistItem[]>(() => getMockItems(type))
  const [notes, setNotes] = useState('')
  const [isSavingNotes, startSavingNotes] = useTransition()

  const completedCount = items.filter((i) => i.isCompleted).length
  const totalCount = items.length

  const handleToggle = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const nowCompleted = !item.isCompleted
        return {
          ...item,
          isCompleted: nowCompleted,
          completedAt: nowCompleted ? new Date().toISOString() : null,
          completedBy: nowCompleted ? 'You' : null,
        }
      })
    )
  }, [])

  const handleSaveNotes = useCallback(() => {
    startSavingNotes(async () => {
      // In production this would call saveDailyReportNotes(tabId, type, selectedDate, notes)
      await new Promise((resolve) => setTimeout(resolve, 500))
    })
  }, [])

  return (
    <div className="p-6 md:p-8">
      {/* Back button + header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href={`/daily-reports/${tabId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to {tabName}
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {tabName} &mdash; {typeLabel}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {completedCount}/{totalCount} items completed
            </p>
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Checklist items */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Checklist Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {items.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No checklist items configured for this type.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 px-6 py-3 transition-colors',
                    item.isCompleted && 'bg-green-50/50'
                  )}
                >
                  <Checkbox
                    checked={item.isCompleted}
                    onCheckedChange={() => handleToggle(item.id)}
                    className="h-5 w-5"
                  />
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      item.isCompleted && 'text-muted-foreground line-through'
                    )}
                  >
                    {item.text}
                  </span>
                  {item.isCompleted && item.completedAt && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatTime(item.completedAt)} &middot; {item.completedBy}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Notes section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Add any notes for this checklist..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              size="sm"
            >
              {isSavingNotes && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Notes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
