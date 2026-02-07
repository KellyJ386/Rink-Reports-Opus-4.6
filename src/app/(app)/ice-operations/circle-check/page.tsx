'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { createCircleCheck } from '../actions'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Snowflake,
  Wrench,
  Ruler,
  ClipboardCheck,
  Loader2,
  User,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

// ============================================
// Tab Navigation (shared across sub-pages)
// ============================================

const tabs = [
  { label: 'Ice Makes', href: '/ice-operations/ice-makes', icon: Snowflake },
  { label: 'Blade Change', href: '/ice-operations/blade-change', icon: Wrench },
  { label: 'Edging', href: '/ice-operations/edging', icon: Ruler },
  { label: 'Circle Check', href: '/ice-operations/circle-check', icon: ClipboardCheck },
]

function TabNav() {
  const pathname = usePathname()
  return (
    <nav className="border-b border-wolf-grey-light dark:border-navy-light">
      <div className="-mb-px flex gap-0 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors min-h-[48px]',
                isActive
                  ? 'border-action-green text-action-green'
                  : 'border-transparent text-muted-foreground hover:border-wolf-grey hover:text-navy dark:hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ============================================
// Types
// ============================================

interface Machine {
  id: string
  name: string
  fuel_type: string
}

interface CheckItem {
  id: string
  item_text: string
  sort_order: number
}

interface CheckItemState {
  check_item_id: string
  item_text: string
  passed: boolean
  fail_notes: string
}

interface RecentCircleCheck {
  id: string
  event_time: string
  notes: string | null
  machine: { name: string } | null
  operator: { full_name: string } | null
  circle_check_results: Array<{ passed: boolean }>
}

// ============================================
// Helpers
// ============================================

function nowLocalString() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function formatDisplayTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ============================================
// Component
// ============================================

export default function CircleCheckPage() {
  const { toast } = useToast()
  const { profile, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Data
  const [machines, setMachines] = useState<Machine[]>([])
  const [recentChecks, setRecentChecks] = useState<RecentCircleCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)

  // Form state
  const [machineId, setMachineId] = useState('')
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [checkItems, setCheckItems] = useState<CheckItemState[]>([])
  const [notes, setNotes] = useState('')
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())

  // ============================================
  // Fetch machines and recent checks
  // ============================================

  const fetchData = useCallback(async () => {
    if (!profile?.facility_id) return
    setLoading(true)
    try {
      // Fetch machines
      const { data: machinesData } = await supabase
        .from('machines')
        .select('id, name, fuel_type')
        .eq('facility_id', profile.facility_id)
        .eq('is_active', true)
        .order('name')

      if (machinesData) setMachines(machinesData)

      // Fetch recent circle checks (today)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data: checks } = await supabase
        .from('circle_checks')
        .select('id, event_time, notes, machine:machines(name), operator:profiles(full_name), circle_check_results(passed)')
        .eq('facility_id', profile.facility_id)
        .gte('event_time', todayStart.toISOString())
        .order('event_time', { ascending: false })

      if (checks) setRecentChecks(checks as unknown as RecentCircleCheck[])
    } catch {
      toast({ title: 'Error', description: 'Failed to load data.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [profile?.facility_id, supabase, toast])

  useEffect(() => {
    if (!authLoading && profile?.facility_id) {
      fetchData()
    }
  }, [authLoading, profile?.facility_id, fetchData])

  // ============================================
  // Load circle check items when machine changes
  // ============================================

  const loadCheckItems = useCallback(async (mId: string) => {
    setLoadingItems(true)
    setCheckItems([])
    setValidationErrors(new Set())

    try {
      const { data: items } = await supabase
        .from('circle_check_items')
        .select('id, item_text, sort_order')
        .eq('machine_id', mId)
        .eq('is_active', true)
        .order('sort_order')

      if (items && items.length > 0) {
        setCheckItems(
          items.map((item: CheckItem) => ({
            check_item_id: item.id,
            item_text: item.item_text,
            passed: false,
            fail_notes: '',
          }))
        )
      } else {
        setCheckItems([])
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load check items.', variant: 'destructive' })
    } finally {
      setLoadingItems(false)
    }
  }, [supabase, toast])

  function handleMachineChange(mId: string) {
    setMachineId(mId)
    const machine = machines.find((m) => m.id === mId) || null
    setSelectedMachine(machine)
    setNotes('')
    setValidationErrors(new Set())
    if (mId) {
      loadCheckItems(mId)
    } else {
      setCheckItems([])
    }
  }

  // ============================================
  // Toggle check item pass/fail
  // ============================================

  function toggleItem(index: number, checked: boolean) {
    setCheckItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        passed: checked,
        fail_notes: checked ? '' : updated[index].fail_notes,
      }
      return updated
    })
    // Clear validation error for this item if it's now passed
    if (checked) {
      setValidationErrors((prev) => {
        const next = new Set(prev)
        next.delete(checkItems[index].check_item_id)
        return next
      })
    }
  }

  function updateFailNotes(index: number, value: string) {
    setCheckItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], fail_notes: value }
      return updated
    })
    // Clear validation error if notes are now filled
    if (value.trim()) {
      setValidationErrors((prev) => {
        const next = new Set(prev)
        next.delete(checkItems[index].check_item_id)
        return next
      })
    }
  }

  // ============================================
  // Form submit
  // ============================================

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!machineId) {
      toast({ title: 'Validation Error', description: 'Please select a machine.', variant: 'destructive' })
      return
    }

    if (checkItems.length === 0) {
      toast({ title: 'Validation Error', description: 'No check items found for this machine.', variant: 'destructive' })
      return
    }

    // Validate: all failed items must have fail_notes
    const errors = new Set<string>()
    for (const item of checkItems) {
      if (!item.passed && !item.fail_notes.trim()) {
        errors.add(item.check_item_id)
      }
    }

    if (errors.size > 0) {
      setValidationErrors(errors)
      toast({
        title: 'Validation Error',
        description: 'All failed items must have notes explaining the failure.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const eventTime = new Date().toISOString()
      const results = checkItems.map((item) => ({
        check_item_id: item.check_item_id,
        passed: item.passed,
        fail_notes: item.passed ? null : item.fail_notes.trim() || null,
      }))

      const result = await createCircleCheck({
        machine_id: machineId,
        event_time: eventTime,
        notes: notes || undefined,
        results,
      })

      if (result.success) {
        toast({ title: 'Circle Check Completed', description: 'Check has been recorded successfully.', variant: 'success' })
        // Reset form
        setMachineId('')
        setSelectedMachine(null)
        setCheckItems([])
        setNotes('')
        setValidationErrors(new Set())
        // Refresh recent checks
        await fetchData()
      } else {
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : 'Validation failed. Please check your inputs.'
        toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================
  // Render
  // ============================================

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Ice Operations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log ice makes, blade changes, edging, and machine circle checks.
          </p>
        </div>
        <TabNav />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-navy dark:text-action-green" />
        </div>
      </div>
    )
  }

  const passedCount = checkItems.filter((i) => i.passed).length
  const failedCount = checkItems.filter((i) => !i.passed).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Ice Operations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log ice makes, blade changes, edging, and machine circle checks.
        </p>
      </div>

      <TabNav />

      {/* Circle Check Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-navy dark:text-white">
            <ClipboardCheck className="h-5 w-5" />
            Machine Circle Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operator display */}
            <div className="flex items-center gap-2 rounded-md bg-wolf-grey-light/50 dark:bg-navy-light/30 p-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Operator:</span>
              <span className="text-sm font-medium text-navy dark:text-white">
                {profile?.full_name || 'Current User'}
              </span>
            </div>

            {/* Machine selector */}
            <div className="space-y-1.5">
              <Label>Machine *</Label>
              <Select value={machineId} onValueChange={handleMachineChange}>
                <SelectTrigger className="min-h-[48px]">
                  <SelectValue placeholder="Select machine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fuel type badge */}
            {selectedMachine && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Fuel Type:</span>
                <Badge
                  className={cn(
                    'text-white',
                    selectedMachine.fuel_type === 'electric'
                      ? 'bg-action-green hover:bg-action-green'
                      : 'bg-wolf-grey hover:bg-wolf-grey'
                  )}
                >
                  {selectedMachine.fuel_type === 'electric' ? 'Electric' : 'Gas'}
                </Badge>
              </div>
            )}

            {/* Loading items */}
            {loadingItems && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-navy dark:text-action-green" />
                <span className="ml-2 text-sm text-muted-foreground">Loading check items...</span>
              </div>
            )}

            {/* Check items */}
            {machineId && !loadingItems && checkItems.length === 0 && (
              <div className="rounded-md border border-wolf-grey-light dark:border-navy-light p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No check items configured for this machine. Please configure items in the Admin panel.
                </p>
              </div>
            )}

            {checkItems.length > 0 && (
              <div className="space-y-1">
                {/* Summary badges */}
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline" className="text-action-green border-action-green">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {passedCount} Pass
                  </Badge>
                  <Badge variant="outline" className="text-alert-red border-alert-red">
                    <XCircle className="mr-1 h-3 w-3" />
                    {failedCount} Fail
                  </Badge>
                </div>

                <div className="space-y-3">
                  {checkItems.map((item, index) => {
                    const hasError = validationErrors.has(item.check_item_id)
                    return (
                      <div
                        key={item.check_item_id}
                        className={cn(
                          'rounded-lg border p-4 transition-colors',
                          item.passed
                            ? 'border-action-green/30 bg-action-green/5 dark:bg-action-green/10'
                            : hasError
                              ? 'border-alert-red bg-alert-red/5 dark:bg-alert-red/10'
                              : 'border-wolf-grey-light dark:border-navy-light'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`check-${item.check_item_id}`}
                            checked={item.passed}
                            onCheckedChange={(checked) =>
                              toggleItem(index, checked === true)
                            }
                            className="mt-0.5 h-6 w-6 min-h-[24px] min-w-[24px]"
                          />
                          <label
                            htmlFor={`check-${item.check_item_id}`}
                            className={cn(
                              'flex-1 text-sm font-medium cursor-pointer min-h-[48px] flex items-center',
                              item.passed
                                ? 'text-action-green'
                                : 'text-navy dark:text-white'
                            )}
                          >
                            {item.item_text}
                          </label>
                          {item.passed && (
                            <CheckCircle2 className="h-5 w-5 text-action-green shrink-0" />
                          )}
                          {!item.passed && (
                            <XCircle className="h-5 w-5 text-alert-red shrink-0" />
                          )}
                        </div>

                        {/* Fail notes textarea - shown when item is unchecked (failed) */}
                        {!item.passed && (
                          <div className="mt-3 ml-9">
                            <Label
                              htmlFor={`fail-notes-${item.check_item_id}`}
                              className="text-xs text-alert-red font-medium"
                            >
                              Failure Notes (required) *
                            </Label>
                            <Textarea
                              id={`fail-notes-${item.check_item_id}`}
                              placeholder="Describe what failed and any actions taken..."
                              value={item.fail_notes}
                              onChange={(e) => updateFailNotes(index, e.target.value)}
                              rows={2}
                              className={cn(
                                'mt-1',
                                hasError && 'border-alert-red focus-visible:ring-alert-red'
                              )}
                            />
                            {hasError && (
                              <p className="mt-1 text-xs text-alert-red">
                                Failure notes are required for failed items.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* General notes */}
            {checkItems.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="notes">General Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Optional general notes about this circle check..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Submit */}
            {checkItems.length > 0 && (
              <Button
                type="submit"
                disabled={submitting || checkItems.length === 0}
                className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px] w-full sm:w-auto"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Circle Check
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Recent Circle Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-navy dark:text-white">
            Today&apos;s Circle Checks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentChecks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No circle checks completed today.
            </p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentChecks.map((check) => {
                      const total = check.circle_check_results?.length || 0
                      const passed = check.circle_check_results?.filter((r) => r.passed).length || 0
                      const failed = total - passed
                      return (
                        <TableRow key={check.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDisplayTime(check.event_time)}
                          </TableCell>
                          <TableCell>{check.machine?.name || '-'}</TableCell>
                          <TableCell>{check.operator?.full_name || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-action-green border-action-green text-xs"
                              >
                                {passed} pass
                              </Badge>
                              {failed > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-alert-red border-alert-red text-xs"
                                >
                                  {failed} fail
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                            {check.notes || '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {recentChecks.map((check) => {
                  const total = check.circle_check_results?.length || 0
                  const passed = check.circle_check_results?.filter((r) => r.passed).length || 0
                  const failed = total - passed
                  return (
                    <Card key={check.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-navy dark:text-white">
                            {check.machine?.name || 'Unknown Machine'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDisplayTime(check.event_time)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {check.operator?.full_name || '-'}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-action-green border-action-green text-xs"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {passed}/{total} pass
                        </Badge>
                        {failed > 0 && (
                          <Badge
                            variant="outline"
                            className="text-alert-red border-alert-red text-xs"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            {failed} fail
                          </Badge>
                        )}
                      </div>
                      {check.notes && (
                        <p className="mt-2 text-xs text-muted-foreground">{check.notes}</p>
                      )}
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
