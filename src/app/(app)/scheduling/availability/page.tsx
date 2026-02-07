'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'
import {
  Plus,
  Trash2,
  Clock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Repeat,
} from 'lucide-react'
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isToday,
} from 'date-fns'
import { submitAvailability, deleteAvailability } from '../actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Availability {
  id: string
  employee_id: string
  available_date: string
  start_time: string
  end_time: string
  is_recurring: boolean
  recurring_day: string | null
}

const DAYS_OF_WEEK = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AvailabilityPage() {
  const { profile, user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  // State
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')
  const [formIsRecurring, setFormIsRecurring] = useState(false)
  const [formRecurringDay, setFormRecurringDay] = useState('')

  // Deleting
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Week range
  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 0 }), [currentWeek])
  const weekEnd = useMemo(() => endOfWeek(currentWeek, { weekStartsOn: 0 }), [currentWeek])
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd])

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  const fetchAvailability = useCallback(async () => {
    if (!profile?.facility_id || !user?.id) return
    setLoadingData(true)

    const startStr = format(weekStart, 'yyyy-MM-dd')
    const endStr = format(weekEnd, 'yyyy-MM-dd')

    // Fetch date-specific entries for the week + all recurring entries
    const { data, error } = await supabase
      .from('employee_availability')
      .select('*')
      .eq('facility_id', profile.facility_id)
      .eq('employee_id', user.id)
      .or(`and(available_date.gte.${startStr},available_date.lte.${endStr}),is_recurring.eq.true`)
      .order('start_time', { ascending: true })

    if (error) {
      toast({ title: 'Failed to load availability', description: error.message, variant: 'destructive' })
    } else {
      setAvailability((data as Availability[]) ?? [])
    }
    setLoadingData(false)
  }, [profile?.facility_id, user?.id, weekStart, weekEnd, supabase, toast])

  useEffect(() => {
    if (!authLoading && profile?.facility_id && user?.id) {
      fetchAvailability()
    }
  }, [authLoading, profile?.facility_id, user?.id, fetchAvailability])

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  function goPrev() {
    setCurrentWeek((d) => subWeeks(d, 1))
  }
  function goNext() {
    setCurrentWeek((d) => addWeeks(d, 1))
  }
  function goThisWeek() {
    setCurrentWeek(new Date())
  }

  // ---------------------------------------------------------------------------
  // Get availability for a specific day
  // ---------------------------------------------------------------------------
  function getAvailabilityForDay(date: Date): Availability[] {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayName = format(date, 'EEEE').toLowerCase()

    return availability.filter((a) => {
      if (a.is_recurring && a.recurring_day === dayName) return true
      if (a.available_date === dateStr) return true
      return false
    })
  }

  // ---------------------------------------------------------------------------
  // Format time for display
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
  // Add Availability
  // ---------------------------------------------------------------------------
  function resetForm() {
    setFormDate('')
    setFormStartTime('')
    setFormEndTime('')
    setFormIsRecurring(false)
    setFormRecurringDay('')
  }

  async function handleAdd() {
    if (!formDate || !formStartTime || !formEndTime) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' })
      return
    }

    if (formIsRecurring && !formRecurringDay) {
      toast({ title: 'Please select a recurring day', variant: 'destructive' })
      return
    }

    setSaving(true)
    const result = await submitAvailability({
      available_date: formDate,
      start_time: formStartTime,
      end_time: formEndTime,
      is_recurring: formIsRecurring,
      recurring_day: formIsRecurring ? formRecurringDay : null,
    })

    if (result.success) {
      toast({ title: 'Availability added', variant: 'success' })
      setDialogOpen(false)
      resetForm()
      await fetchAvailability()
    } else {
      toast({
        title: 'Failed to add availability',
        description: typeof result.error === 'string' ? result.error : 'Validation error',
        variant: 'destructive',
      })
    }
    setSaving(false)
  }

  // ---------------------------------------------------------------------------
  // Delete Availability
  // ---------------------------------------------------------------------------
  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteAvailability(id)
    if (result.success) {
      toast({ title: 'Availability removed', variant: 'success' })
      await fetchAvailability()
    } else {
      toast({
        title: 'Failed to remove availability',
        description: typeof result.error === 'string' ? result.error : 'Error',
        variant: 'destructive',
      })
    }
    setDeletingId(null)
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
          <h1 className="text-2xl font-bold text-foreground">My Availability</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goThisWeek}>
              <CalendarDays className="h-4 w-4 mr-1" />
              This Week
            </Button>
            <Button variant="outline" size="icon" onClick={goNext} aria-label="Next week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Availability */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]">
                <Plus className="h-4 w-4 mr-1" />
                Add Availability
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Availability</DialogTitle>
                <DialogDescription>
                  Submit your available hours for scheduling.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="avail-date">Date *</Label>
                  <Input
                    id="avail-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>

                {/* Time range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="avail-start">Start Time *</Label>
                    <Input
                      id="avail-start"
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avail-end">End Time *</Label>
                    <Input
                      id="avail-end"
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Recurring */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="avail-recurring"
                    checked={formIsRecurring}
                    onCheckedChange={(checked) => setFormIsRecurring(checked === true)}
                  />
                  <Label htmlFor="avail-recurring" className="cursor-pointer">
                    Recurring weekly
                  </Label>
                </div>

                {/* Recurring Day */}
                {formIsRecurring && (
                  <div className="space-y-2">
                    <Label>Recurring Day *</Label>
                    <Select value={formRecurringDay} onValueChange={setFormRecurringDay}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={saving}
                  className="bg-action-green hover:bg-action-green-hover text-white"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Submit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading */}
      {loadingData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Weekly view */}
      {!loadingData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayAvail = getAvailabilityForDay(day)
            const today = isToday(day)

            return (
              <Card
                key={day.toISOString()}
                className={cn('min-h-[120px]', today && 'ring-2 ring-action-green')}
              >
                <div
                  className={cn(
                    'px-3 py-2 border-b text-center',
                    today ? 'bg-action-green/10 dark:bg-action-green/20' : 'bg-muted/50'
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
                  {dayAvail.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No availability</p>
                  )}
                  {dayAvail.map((a) => (
                    <div
                      key={a.id}
                      className="group relative rounded-md border border-action-green/30 bg-action-green/5 dark:bg-action-green/10 p-2"
                    >
                      <div className="flex items-center gap-1 text-xs text-foreground">
                        <Clock className="h-3 w-3 text-action-green shrink-0" />
                        <span>{formatTime(a.start_time)} - {formatTime(a.end_time)}</span>
                      </div>
                      {a.is_recurring && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Repeat className="h-3 w-3 shrink-0" />
                          <span className="capitalize">{a.recurring_day}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        disabled={deletingId === a.id}
                        className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity min-w-[24px] min-h-[24px] flex items-center justify-center"
                        aria-label="Delete availability"
                      >
                        {deletingId === a.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-destructive" />
                        )}
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Recurring availability summary */}
      {!loadingData && availability.filter((a) => a.is_recurring).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Repeat className="h-5 w-5 text-action-green" />
              Recurring Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availability
                .filter((a) => a.is_recurring)
                .map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize text-foreground">
                        {a.recurring_day}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(a.start_time)} - {formatTime(a.end_time)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      className="min-h-[48px] min-w-[48px]"
                      aria-label="Delete recurring availability"
                    >
                      {deletingId === a.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
