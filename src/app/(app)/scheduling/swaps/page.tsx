'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  ArrowLeftRight,
  Check,
  X,
  Clock,
  Loader2,
  Users,
  Calendar,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { reviewSwap } from '../actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SwapRequest {
  id: string
  facility_id: string
  shift_id: string
  requester_id: string
  target_id: string
  status: 'pending' | 'approved' | 'denied'
  reviewed_by: string | null
  review_note: string | null
  created_at: string
  reviewed_at: string | null
  shifts: {
    shift_date: string
    start_time: string
    end_time: string
    shift_types: { name: string; color: string } | null
  } | null
  requester: { full_name: string } | null
  target: { full_name: string } | null
  reviewer: { full_name: string } | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ShiftSwapsPage() {
  const { profile, user, loading: authLoading, isManager } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [swaps, setSwaps] = useState<SwapRequest[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})

  // ---------------------------------------------------------------------------
  // Fetch swap requests
  // ---------------------------------------------------------------------------
  const fetchSwaps = useCallback(async () => {
    if (!profile?.facility_id || !user?.id) return
    setLoadingData(true)

    let query = supabase
      .from('shift_swap_requests')
      .select(`
        *,
        shifts(shift_date, start_time, end_time, shift_types(name, color)),
        requester:profiles!shift_swap_requests_requester_id_fkey(full_name),
        target:profiles!shift_swap_requests_target_id_fkey(full_name),
        reviewer:profiles!shift_swap_requests_reviewed_by_fkey(full_name)
      `)
      .eq('facility_id', profile.facility_id)
      .order('created_at', { ascending: false })

    // Non-managers only see their own swap requests
    if (!isManager) {
      query = query.or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
    }

    const { data, error } = await query

    if (error) {
      toast({ title: 'Failed to load swap requests', description: error.message, variant: 'destructive' })
    } else {
      setSwaps((data as unknown as SwapRequest[]) ?? [])
    }
    setLoadingData(false)
  }, [profile?.facility_id, user?.id, isManager, supabase, toast])

  useEffect(() => {
    if (!authLoading && profile?.facility_id && user?.id) {
      fetchSwaps()
    }
  }, [authLoading, profile?.facility_id, user?.id, fetchSwaps])

  // ---------------------------------------------------------------------------
  // Review a swap
  // ---------------------------------------------------------------------------
  async function handleReview(id: string, approved: boolean) {
    setReviewingId(id)
    const note = reviewNotes[id] ?? ''
    const result = await reviewSwap(id, approved, note)

    if (result.success) {
      toast({
        title: approved ? 'Swap approved' : 'Swap denied',
        variant: 'success',
      })
      await fetchSwaps()
    } else {
      toast({
        title: 'Failed to review swap',
        description: typeof result.error === 'string' ? result.error : 'Error',
        variant: 'destructive',
      })
    }
    setReviewingId(null)
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
  // Status badge
  // ---------------------------------------------------------------------------
  function getStatusBadge(status: SwapRequest['status']) {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'approved':
        return <Badge className="bg-action-green text-white border-transparent">Approved</Badge>
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // ---------------------------------------------------------------------------
  // Partition swaps
  // ---------------------------------------------------------------------------
  const pendingSwaps = swaps.filter((s) => s.status === 'pending')
  const resolvedSwaps = swaps.filter((s) => s.status !== 'pending')

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
        <h1 className="text-2xl font-bold text-foreground">Shift Swaps</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isManager
            ? 'Review and manage shift swap requests from your team.'
            : 'View your shift swap requests and their status.'}
        </p>
      </div>

      {/* Loading */}
      {loadingData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loadingData && swaps.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No swap requests found.</p>
          </CardContent>
        </Card>
      )}

      {/* Pending Swaps */}
      {!loadingData && pendingSwaps.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-alert-yellow" />
            Pending Requests ({pendingSwaps.length})
          </h2>

          <div className="space-y-3">
            {pendingSwaps.map((swap) => (
              <Card key={swap.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Swap details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(swap.status)}
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(swap.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>

                      {/* Shift info */}
                      {swap.shifts && (
                        <div className="flex items-center gap-3">
                          <div
                            className="h-8 w-1 rounded-full shrink-0"
                            style={{ backgroundColor: swap.shifts.shift_types?.color ?? '#6B7280' }}
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {swap.shifts.shift_types?.name ?? 'Shift'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(swap.shifts.shift_date), 'EEE, MMM d')}
                              {' '}{formatTime(swap.shifts.start_time)} - {formatTime(swap.shifts.end_time)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* People */}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground font-medium">
                          {swap.requester?.full_name ?? 'Unknown'}
                        </span>
                        <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground font-medium">
                          {swap.target?.full_name ?? 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Manager review actions */}
                    {isManager && (
                      <div className="flex flex-col gap-2 lg:w-64">
                        <div className="space-y-1">
                          <Label htmlFor={`note-${swap.id}`} className="text-xs text-muted-foreground">
                            Review Note (optional)
                          </Label>
                          <Textarea
                            id={`note-${swap.id}`}
                            placeholder="Add a note..."
                            value={reviewNotes[swap.id] ?? ''}
                            onChange={(e) =>
                              setReviewNotes((prev) => ({ ...prev, [swap.id]: e.target.value }))
                            }
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleReview(swap.id, true)}
                            disabled={reviewingId === swap.id}
                            className="flex-1 bg-action-green hover:bg-action-green-hover text-white min-h-[48px]"
                          >
                            {reviewingId === swap.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleReview(swap.id, false)}
                            disabled={reviewingId === swap.id}
                            className="flex-1 min-h-[48px]"
                          >
                            {reviewingId === swap.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                Deny
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Swaps */}
      {!loadingData && resolvedSwaps.length > 0 && (
        <div className="space-y-4">
          {pendingSwaps.length > 0 && <Separator />}

          <h2 className="text-lg font-semibold text-foreground">
            Resolved ({resolvedSwaps.length})
          </h2>

          <div className="space-y-3">
            {resolvedSwaps.map((swap) => (
              <Card key={swap.id} className="opacity-80">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(swap.status)}
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(swap.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      {swap.reviewed_at && (
                        <span className="text-xs text-muted-foreground">
                          -- Reviewed {format(parseISO(swap.reviewed_at), 'MMM d h:mm a')}
                        </span>
                      )}
                    </div>

                    {/* Shift info */}
                    {swap.shifts && (
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-1 rounded-full shrink-0"
                          style={{ backgroundColor: swap.shifts.shift_types?.color ?? '#6B7280' }}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {swap.shifts.shift_types?.name ?? 'Shift'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(swap.shifts.shift_date), 'EEE, MMM d')}
                            {' '}{formatTime(swap.shifts.start_time)} - {formatTime(swap.shifts.end_time)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* People */}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">
                        {swap.requester?.full_name ?? 'Unknown'}
                      </span>
                      <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-foreground">
                        {swap.target?.full_name ?? 'Unknown'}
                      </span>
                    </div>

                    {/* Review note */}
                    {swap.review_note && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Note: </span>
                        <span className="text-foreground">{swap.review_note}</span>
                      </div>
                    )}

                    {/* Reviewer */}
                    {swap.reviewer?.full_name && (
                      <p className="text-xs text-muted-foreground">
                        Reviewed by {swap.reviewer.full_name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
