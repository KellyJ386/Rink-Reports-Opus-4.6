'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import ShiftBlock from '@/components/scheduling/ShiftBlock'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Loader2,
  Trash2,
} from 'lucide-react'
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameDay,
  parseISO,
} from 'date-fns'
import { createShift, updateShift, deleteShift, requestSwap } from './actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ShiftType {
  id: string
  name: string
  color: string
  is_active: boolean
  sort_order: number
}

interface Shift {
  id: string
  shift_type_id: string
  assigned_to: string | null
  shift_date: string
  start_time: string
  end_time: string
  is_open: boolean
  is_broadcast: boolean
  notes: string | null
  shift_types: { name: string; color: string } | null
  profiles: { full_name: string } | null
}

interface Employee {
  id: string
  full_name: string
  availability_status?: 'available' | 'unavailable' | 'unknown'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SchedulingPage() {
  const { profile, loading: authLoading, isManager, isReadOnly } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  // State
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [shifts, setShifts] = useState<Shift[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Add Shift Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')
  const [formShiftTypeId, setFormShiftTypeId] = useState('')
  const [formAssignedTo, setFormAssignedTo] = useState('')
  const [formIsOpen, setFormIsOpen] = useState(false)
  const [formNotes, setFormNotes] = useState('')

  // Detail Dialog (view/edit)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [requestingSwap, setRequestingSwap] = useState(false)
  const [swapTargetId, setSwapTargetId] = useState('')

  // Responsive: default to day view on mobile
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    if (mql.matches) setViewMode('day')
  }, [])

  // Date range
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate])
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate])
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd])

  const dateRangeStart = viewMode === 'week' ? format(weekStart, 'yyyy-MM-dd') : format(currentDate, 'yyyy-MM-dd')
  const dateRangeEnd = viewMode === 'week' ? format(weekEnd, 'yyyy-MM-dd') : format(currentDate, 'yyyy-MM-dd')

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  const fetchShifts = useCallback(async () => {
    if (!profile?.facility_id) return
    setLoadingData(true)

    const { data, error } = await supabase
      .from('shifts')
      .select('*, shift_types(name, color), profiles(full_name)')
      .eq('facility_id', profile.facility_id)
      .gte('shift_date', dateRangeStart)
      .lte('shift_date', dateRangeEnd)
      .order('start_time', { ascending: true })

    if (error) {
      toast({ title: 'Failed to load shifts', description: error.message, variant: 'destructive' })
    } else {
      setShifts((data as unknown as Shift[]) ?? [])
    }
    setLoadingData(false)
  }, [profile?.facility_id, dateRangeStart, dateRangeEnd, supabase, toast])

  const fetchShiftTypes = useCallback(async () => {
    if (!profile?.facility_id) return
    const { data } = await supabase
      .from('shift_types')
      .select('*')
      .eq('facility_id', profile.facility_id)
      .eq('is_active', true)
      .order('sort_order')
    if (data) setShiftTypes(data as ShiftType[])
  }, [profile?.facility_id, supabase])

  const fetchEmployees = useCallback(async () => {
    if (!profile?.facility_id) return
    const { data: empData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('facility_id', profile.facility_id)
      .eq('is_active', true)
      .order('full_name')

    if (!empData) return

    // Fetch availability for the visible date range
    const { data: availData } = await supabase
      .from('employee_availability')
      .select('employee_id, is_available')
      .eq('facility_id', profile.facility_id)
      .gte('date', dateRangeStart)
      .lte('date', dateRangeEnd)

    const availMap = new Map<string, boolean>()
    if (availData) {
      for (const a of availData) {
        // If any entry for this employee in range, track it
        const prev = availMap.get(a.employee_id)
        if (prev === undefined) {
          availMap.set(a.employee_id, a.is_available)
        } else if (a.is_available) {
          availMap.set(a.employee_id, true) // at least one available day
        }
      }
    }

    const enriched: Employee[] = empData.map((emp) => {
      const hasEntry = availMap.has(emp.id)
      return {
        ...emp,
        availability_status: hasEntry
          ? availMap.get(emp.id) ? 'available' : 'unavailable'
          : 'unknown',
      }
    })

    setEmployees(enriched)
  }, [profile?.facility_id, supabase, dateRangeStart, dateRangeEnd])

  useEffect(() => {
    if (!authLoading && profile?.facility_id) {
      fetchShifts()
      fetchShiftTypes()
      fetchEmployees()
    }
  }, [authLoading, profile?.facility_id, fetchShifts, fetchShiftTypes, fetchEmployees])

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  function goToday() {
    setCurrentDate(new Date())
  }
  function goPrev() {
    setCurrentDate((d) => (viewMode === 'week' ? subWeeks(d, 1) : subDays(d, 1)))
  }
  function goNext() {
    setCurrentDate((d) => (viewMode === 'week' ? addWeeks(d, 1) : addDays(d, 1)))
  }

  // ---------------------------------------------------------------------------
  // Group shifts by date
  // ---------------------------------------------------------------------------
  function getShiftsForDate(date: Date): Shift[] {
    const dateStr = format(date, 'yyyy-MM-dd')
    return shifts.filter((s) => s.shift_date === dateStr)
  }

  // ---------------------------------------------------------------------------
  // Add Shift
  // ---------------------------------------------------------------------------
  function resetForm() {
    setFormDate('')
    setFormStartTime('')
    setFormEndTime('')
    setFormShiftTypeId('')
    setFormAssignedTo('')
    setFormIsOpen(false)
    setFormNotes('')
  }

  async function handleAddShift() {
    if (!formDate || !formStartTime || !formEndTime || !formShiftTypeId) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' })
      return
    }

    setSaving(true)
    const result = await createShift({
      shift_date: formDate,
      start_time: formStartTime,
      end_time: formEndTime,
      shift_type_id: formShiftTypeId,
      assigned_to: formAssignedTo || null,
      is_open: formIsOpen,
      notes: formNotes,
    })

    if (result.success) {
      toast({ title: 'Shift created', variant: 'success' })
      setAddDialogOpen(false)
      resetForm()
      await fetchShifts()
    } else {
      toast({
        title: 'Failed to create shift',
        description: typeof result.error === 'string' ? result.error : 'Validation error',
        variant: 'destructive',
      })
    }
    setSaving(false)
  }

  // ---------------------------------------------------------------------------
  // Shift detail / delete
  // ---------------------------------------------------------------------------
  function openShiftDetail(shift: Shift) {
    setSelectedShift(shift)
    setDetailDialogOpen(true)
  }

  async function handleDeleteShift() {
    if (!selectedShift) return
    setDeleting(true)
    const result = await deleteShift(selectedShift.id)
    if (result.success) {
      toast({ title: 'Shift deleted', variant: 'success' })
      setDetailDialogOpen(false)
      setSelectedShift(null)
      await fetchShifts()
    } else {
      toast({
        title: 'Failed to delete shift',
        description: typeof result.error === 'string' ? result.error : 'Error',
        variant: 'destructive',
      })
    }
    setDeleting(false)
  }

  // ---------------------------------------------------------------------------
  // Request Swap
  // ---------------------------------------------------------------------------
  async function handleRequestSwap() {
    if (!selectedShift || !swapTargetId) {
      toast({ title: 'Select a target employee for the swap', variant: 'destructive' })
      return
    }
    setRequestingSwap(true)
    const result = await requestSwap({
      shift_id: selectedShift.id,
      target_id: swapTargetId,
    })
    if (result.success) {
      toast({ title: 'Swap request submitted', variant: 'success' })
      setDetailDialogOpen(false)
      setSelectedShift(null)
      setSwapTargetId('')
    } else {
      toast({
        title: 'Failed to request swap',
        description: typeof result.error === 'string' ? result.error : 'Error',
        variant: 'destructive',
      })
    }
    setRequestingSwap(false)
  }

  // ---------------------------------------------------------------------------
  // Format time for display (24h → 12h)
  // ---------------------------------------------------------------------------
  function formatTime(time: string): string {
    if (!time) return ''
    const [h, m] = time.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${m} ${ampm}`
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Scheduling</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {viewMode === 'week'
              ? `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
              : format(currentDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'day' | 'week')}>
            <TabsList>
              <TabsTrigger value="day" className="min-w-[48px]">Day</TabsTrigger>
              <TabsTrigger value="week" className="min-w-[48px]">Week</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              <CalendarIcon className="h-4 w-4 mr-1" />
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goNext} aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Shift */}
          {!isReadOnly && (
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Shift
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Shift</DialogTitle>
                  <DialogDescription>Create a new shift for the schedule.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="shift-date">Date *</Label>
                    <Input
                      id="shift-date"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>

                  {/* Start / End Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shift-start">Start Time *</Label>
                      <Input
                        id="shift-start"
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shift-end">End Time *</Label>
                      <Input
                        id="shift-end"
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Shift Type */}
                  <div className="space-y-2">
                    <Label>Shift Type *</Label>
                    <Select value={formShiftTypeId} onValueChange={setFormShiftTypeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift type" />
                      </SelectTrigger>
                      <SelectContent>
                        {shiftTypes.map((st) => (
                          <SelectItem key={st.id} value={st.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: st.color }}
                              />
                              {st.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assigned To */}
                  <div className="space-y-2">
                    <Label>Assigned To</Label>
                    <Select value={formAssignedTo} onValueChange={setFormAssignedTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm" title={
                                emp.availability_status === 'available' ? 'Available' :
                                emp.availability_status === 'unavailable' ? 'Not available' :
                                'No availability submitted'
                              }>
                                {emp.availability_status === 'available' ? '✅' :
                                 emp.availability_status === 'unavailable' ? '❌' : '⚠️'}
                              </span>
                              {emp.full_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      ✅ Available · ❌ Not available · ⚠️ No availability submitted
                    </p>
                  </div>

                  {/* Is Open */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="shift-open"
                      checked={formIsOpen}
                      onCheckedChange={(checked) => setFormIsOpen(checked === true)}
                    />
                    <Label htmlFor="shift-open" className="cursor-pointer">
                      Mark as open shift
                    </Label>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="shift-notes">Notes</Label>
                    <Textarea
                      id="shift-notes"
                      placeholder="Optional notes..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddShift}
                    disabled={saving}
                    className="bg-action-green hover:bg-action-green-hover text-white"
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Create Shift
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {loadingData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* WEEK VIEW                                                           */}
      {/* ------------------------------------------------------------------- */}
      {!loadingData && viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayShifts = getShiftsForDate(day)
            const today = isToday(day)

            return (
              <Card
                key={day.toISOString()}
                className={cn(
                  'min-h-[160px]',
                  today && 'ring-2 ring-action-green'
                )}
              >
                <div
                  className={cn(
                    'px-3 py-2 border-b text-center',
                    today
                      ? 'bg-action-green/10 dark:bg-action-green/20'
                      : 'bg-muted/50'
                  )}
                >
                  <p className="text-xs font-medium text-muted-foreground">{format(day, 'EEE')}</p>
                  <p className={cn(
                    'text-lg font-bold',
                    today ? 'text-action-green' : 'text-foreground'
                  )}>
                    {format(day, 'd')}
                  </p>
                </div>
                <CardContent className="p-2 space-y-1.5">
                  {dayShifts.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No shifts</p>
                  )}
                  {dayShifts.map((shift) => (
                    <ShiftBlock
                      key={shift.id}
                      shiftTypeName={shift.shift_types?.name ?? 'Unknown'}
                      shiftTypeColor={shift.shift_types?.color ?? '#6B7280'}
                      startTime={formatTime(shift.start_time)}
                      endTime={formatTime(shift.end_time)}
                      employeeName={shift.profiles?.full_name}
                      isOpen={shift.is_open}
                      isBroadcast={shift.is_broadcast}
                      onClick={() => openShiftDetail(shift)}
                    />
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* DAY VIEW                                                            */}
      {/* ------------------------------------------------------------------- */}
      {!loadingData && viewMode === 'day' && (
        <div className="space-y-3">
          {getShiftsForDate(currentDate).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No shifts scheduled for this day.</p>
              </CardContent>
            </Card>
          ) : (
            getShiftsForDate(currentDate).map((shift) => (
              <Card key={shift.id} className="overflow-hidden">
                <div className="flex">
                  {/* Color bar */}
                  <div
                    className="w-2 shrink-0"
                    style={{ backgroundColor: shift.shift_types?.color ?? '#6B7280' }}
                  />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {shift.shift_types?.name ?? 'Unknown'}
                          </span>
                          {shift.is_open && (
                            <span className="text-xs font-medium text-alert-yellow bg-alert-yellow/10 px-2 py-0.5 rounded-full border border-dashed border-alert-yellow">
                              OPEN
                            </span>
                          )}
                          {shift.is_broadcast && (
                            <span className="text-xs font-medium text-action-green bg-action-green/10 px-2 py-0.5 rounded-full">
                              Broadcast
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </p>
                        <p className="text-sm mt-1 text-foreground">
                          {shift.profiles?.full_name ?? (shift.is_open ? 'Open Shift' : 'Unassigned')}
                        </p>
                        {shift.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{shift.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openShiftDetail(shift)}
                        className="shrink-0"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* SHIFT DETAIL DIALOG                                                 */}
      {/* ------------------------------------------------------------------- */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
            <DialogDescription>
              {selectedShift
                ? `${format(parseISO(selectedShift.shift_date), 'EEEE, MMM d, yyyy')}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedShift && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: selectedShift.shift_types?.color ?? '#6B7280' }}
                />
                <span className="font-semibold text-foreground">
                  {selectedShift.shift_types?.name ?? 'Unknown'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Start</span>
                  <p className="font-medium">{formatTime(selectedShift.start_time)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">End</span>
                  <p className="font-medium">{formatTime(selectedShift.end_time)}</p>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Assigned To</span>
                <p className="font-medium">
                  {selectedShift.profiles?.full_name ?? (selectedShift.is_open ? 'Open Shift' : 'Unassigned')}
                </p>
              </div>

              {selectedShift.is_open && (
                <div className="text-xs font-medium text-alert-yellow bg-alert-yellow/10 px-3 py-1.5 rounded-md border border-dashed border-alert-yellow inline-block">
                  This is an open shift
                </div>
              )}

              {selectedShift.is_broadcast && (
                <div className="text-xs font-medium text-action-green bg-action-green/10 px-3 py-1.5 rounded-md inline-block">
                  Currently being broadcast
                </div>
              )}

              {selectedShift.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes</span>
                  <p className="mt-0.5">{selectedShift.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Request Swap — visible to staff who own this shift */}
          {selectedShift && !isManager && !isReadOnly && selectedShift.assigned_to === profile?.id && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Request Swap</p>
              <div className="space-y-2">
                <Label htmlFor="swap-target" className="text-xs text-muted-foreground">Swap with</Label>
                <Select value={swapTargetId} onValueChange={setSwapTargetId}>
                  <SelectTrigger id="swap-target">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter((e) => e.id !== profile?.id)
                      .map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleRequestSwap}
                disabled={requestingSwap || !swapTargetId}
                className="w-full bg-navy hover:bg-navy-light text-white min-h-[48px]"
              >
                {requestingSwap && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Request Swap
              </Button>
            </div>
          )}

          <DialogFooter>
            {isManager && selectedShift && (
              <Button
                variant="destructive"
                onClick={handleDeleteShift}
                disabled={deleting}
                className="min-h-[48px]"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Delete Shift
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
