'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Hand,
  Radio,
  Clock,
  Calendar,
  Loader2,
  Megaphone,
} from 'lucide-react'
import { format, parseISO, isPast } from 'date-fns'
import { pickUpShift, broadcastShift } from '../actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface OpenShift {
  id: string
  facility_id: string
  shift_type_id: string
  assigned_to: string | null
  shift_date: string
  start_time: string
  end_time: string
  is_open: boolean
  is_broadcast: boolean
  notes: string | null
  shift_types: { name: string; color: string } | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function OpenShiftsPage() {
  const { profile, user, loading: authLoading, isManager, isReadOnly } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [shifts, setShifts] = useState<OpenShift[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [pickingUpId, setPickingUpId] = useState<string | null>(null)
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Fetch open shifts
  // ---------------------------------------------------------------------------
  const fetchOpenShifts = useCallback(async () => {
    if (!profile?.facility_id) return
    setLoadingData(true)

    const today = format(new Date(), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('shifts')
      .select('*, shift_types(name, color)')
      .eq('facility_id', profile.facility_id)
      .eq('is_open', true)
      .gte('shift_date', today)
      .order('shift_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      toast({ title: 'Failed to load open shifts', description: error.message, variant: 'destructive' })
    } else {
      setShifts((data as unknown as OpenShift[]) ?? [])
    }
    setLoadingData(false)
  }, [profile?.facility_id, supabase, toast])

  useEffect(() => {
    if (!authLoading && profile?.facility_id) {
      fetchOpenShifts()
    }
  }, [authLoading, profile?.facility_id, fetchOpenShifts])

  // ---------------------------------------------------------------------------
  // Pick up a shift
  // ---------------------------------------------------------------------------
  async function handlePickUp(shiftId: string) {
    setPickingUpId(shiftId)
    const result = await pickUpShift(shiftId)

    if (result.success) {
      toast({ title: 'Shift picked up successfully', variant: 'success' })
      await fetchOpenShifts()
    } else {
      toast({
        title: 'Failed to pick up shift',
        description: typeof result.error === 'string' ? result.error : 'Error',
        variant: 'destructive',
      })
    }
    setPickingUpId(null)
  }

  // ---------------------------------------------------------------------------
  // Broadcast a shift (managers only)
  // ---------------------------------------------------------------------------
  async function handleBroadcast(shiftId: string) {
    setBroadcastingId(shiftId)
    const result = await broadcastShift(shiftId)

    if (result.success) {
      toast({ title: 'Shift is now being broadcast', variant: 'success' })
      await fetchOpenShifts()
    } else {
      toast({
        title: 'Failed to broadcast shift',
        description: typeof result.error === 'string' ? result.error : 'Error',
        variant: 'destructive',
      })
    }
    setBroadcastingId(null)
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
  // Group shifts by date
  // ---------------------------------------------------------------------------
  function groupByDate(shifts: OpenShift[]): Record<string, OpenShift[]> {
    const groups: Record<string, OpenShift[]> = {}
    for (const shift of shifts) {
      if (!groups[shift.shift_date]) {
        groups[shift.shift_date] = []
      }
      groups[shift.shift_date].push(shift)
    }
    return groups
  }

  const groupedShifts = groupByDate(shifts)
  const sortedDates = Object.keys(groupedShifts).sort()

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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Open Shifts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Available shifts that need to be filled. Pick up a shift to add it to your schedule.
        </p>
      </div>

      {/* Loading */}
      {loadingData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loadingData && shifts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No open shifts available at this time.</p>
          </CardContent>
        </Card>
      )}

      {/* Shifts grouped by date */}
      {!loadingData && sortedDates.map((dateStr) => {
        const dateShifts = groupedShifts[dateStr]
        const date = parseISO(dateStr)

        return (
          <div key={dateStr} className="space-y-3">
            {/* Date header */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                {format(date, 'EEEE, MMMM d, yyyy')}
              </h2>
            </div>

            {/* Shift cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dateShifts.map((shift) => (
                <Card
                  key={shift.id}
                  className="overflow-hidden border-dashed border-wolf-grey dark:border-wolf-grey-dark"
                >
                  <div className="flex">
                    {/* Color bar */}
                    <div
                      className="w-2 shrink-0"
                      style={{ backgroundColor: shift.shift_types?.color ?? '#6B7280' }}
                    />
                    <CardContent className="flex-1 p-4">
                      <div className="space-y-3">
                        {/* Shift type + badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className="border-transparent text-white text-xs"
                            style={{ backgroundColor: shift.shift_types?.color ?? '#6B7280' }}
                          >
                            {shift.shift_types?.name ?? 'Unknown'}
                          </Badge>
                          {shift.is_broadcast && (
                            <Badge className="bg-action-green/10 text-action-green border-action-green/30 text-xs">
                              <Radio className="h-3 w-3 mr-1" />
                              Broadcast
                            </Badge>
                          )}
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
                        </div>

                        {/* Notes */}
                        {shift.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {shift.notes}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          {/* Pick Up button for non-read-only users */}
                          {!isReadOnly && (
                            <Button
                              onClick={() => handlePickUp(shift.id)}
                              disabled={pickingUpId === shift.id}
                              className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px] flex-1"
                            >
                              {pickingUpId === shift.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Hand className="h-4 w-4 mr-1" />
                                  Pick Up
                                </>
                              )}
                            </Button>
                          )}

                          {/* Broadcast toggle for managers */}
                          {isManager && !shift.is_broadcast && (
                            <Button
                              variant="outline"
                              onClick={() => handleBroadcast(shift.id)}
                              disabled={broadcastingId === shift.id}
                              className="min-h-[48px]"
                            >
                              {broadcastingId === shift.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Radio className="h-4 w-4 mr-1" />
                                  Broadcast
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
