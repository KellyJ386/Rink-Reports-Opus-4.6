'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { createIceMake } from '../actions'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Snowflake, Wrench, Ruler, ClipboardCheck, Loader2, User } from 'lucide-react'

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

interface Rink {
  id: string
  name: string
}

interface Machine {
  id: string
  name: string
  fuel_type: string
}

interface IceMakeEntry {
  id: string
  event_time: string
  machine_hours: number | null
  ice_taken: number | null
  water_used: number | null
  notes: string | null
  rink: { name: string } | null
  machine: { name: string } | null
  operator: { full_name: string } | null
}

// ============================================
// Helper: format timestamp for datetime-local input
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

export default function IceMakesPage() {
  const { toast } = useToast()
  const supabase = createClient()

  // Data
  const [rinks, setRinks] = useState<Rink[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [todayEntries, setTodayEntries] = useState<IceMakeEntry[]>([])
  const [operatorName, setOperatorName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [eventTime, setEventTime] = useState(nowLocalString())
  const [rinkId, setRinkId] = useState('')
  const [machineId, setMachineId] = useState('')
  const [machineHours, setMachineHours] = useState('')
  const [iceTaken, setIceTaken] = useState('')
  const [waterUsed, setWaterUsed] = useState('')
  const [notes, setNotes] = useState('')

  // ============================================
  // Fetch reference data and today's log
  // ============================================

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('facility_id, full_name')
        .eq('id', user.id)
        .single()

      if (!profile?.facility_id) return
      setOperatorName(profile.full_name || 'Current User')

      // Fetch rinks
      const { data: rinksData } = await supabase
        .from('rinks')
        .select('id, name')
        .eq('facility_id', profile.facility_id)
        .eq('is_active', true)
        .order('name')

      if (rinksData) setRinks(rinksData)

      // Fetch machines
      const { data: machinesData } = await supabase
        .from('machines')
        .select('id, name, fuel_type')
        .eq('facility_id', profile.facility_id)
        .eq('is_active', true)
        .order('name')

      if (machinesData) setMachines(machinesData)

      // Fetch today's entries
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data: entries } = await supabase
        .from('ice_makes')
        .select('id, event_time, machine_hours, ice_taken, water_used, notes, rink:rinks(name), machine:machines(name), operator:profiles(full_name)')
        .eq('facility_id', profile.facility_id)
        .gte('event_time', todayStart.toISOString())
        .order('event_time', { ascending: false })

      if (entries) setTodayEntries(entries as unknown as IceMakeEntry[])
    } catch {
      toast({ title: 'Error', description: 'Failed to load data.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ============================================
  // Form submit
  // ============================================

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rinkId || !machineId) {
      toast({ title: 'Validation Error', description: 'Please select a rink and machine.', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const result = await createIceMake({
        rink_id: rinkId,
        machine_id: machineId,
        event_time: new Date(eventTime).toISOString(),
        machine_hours: machineHours ? parseFloat(machineHours) : null,
        ice_taken: iceTaken ? parseFloat(iceTaken) : null,
        water_used: waterUsed ? parseFloat(waterUsed) : null,
        notes: notes || undefined,
      })

      if (result.success) {
        toast({ title: 'Ice Make Logged', description: 'Entry has been recorded successfully.', variant: 'success' })
        // Clear form
        setEventTime(nowLocalString())
        setRinkId('')
        setMachineId('')
        setMachineHours('')
        setIceTaken('')
        setWaterUsed('')
        setNotes('')
        // Refresh today's entries
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

  if (loading) {
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

      {/* Ice Make Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-navy dark:text-white">
            <Snowflake className="h-5 w-5" />
            Log Ice Make
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operator display */}
            <div className="flex items-center gap-2 rounded-md bg-wolf-grey-light/50 dark:bg-navy-light/30 p-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Operator:</span>
              <span className="text-sm font-medium text-navy dark:text-white">{operatorName}</span>
            </div>

            {/* Timestamp */}
            <div className="space-y-1.5">
              <Label htmlFor="event-time">Date &amp; Time *</Label>
              <Input
                id="event-time"
                type="datetime-local"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="min-h-[48px]"
                required
              />
            </div>

            {/* Rink and Machine */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Rink *</Label>
                <Select value={rinkId} onValueChange={setRinkId}>
                  <SelectTrigger className="min-h-[48px]">
                    <SelectValue placeholder="Select rink" />
                  </SelectTrigger>
                  <SelectContent>
                    {rinks.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Machine *</Label>
                <Select value={machineId} onValueChange={setMachineId}>
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
            </div>

            {/* Numeric fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="machine-hours">Machine Hours</Label>
                <Input
                  id="machine-hours"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g., 1234.5"
                  value={machineHours}
                  onChange={(e) => setMachineHours(e.target.value)}
                  className="min-h-[48px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ice-taken">Ice Taken</Label>
                <Input
                  id="ice-taken"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 0.25"
                  value={iceTaken}
                  onChange={(e) => setIceTaken(e.target.value)}
                  className="min-h-[48px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="water-used">Water Used</Label>
                <Input
                  id="water-used"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 150"
                  value={waterUsed}
                  onChange={(e) => setWaterUsed(e.target.value)}
                  className="min-h-[48px]"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes about this ice make..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting || !rinkId || !machineId}
              className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px] w-full sm:w-auto"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Ice Make
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Today's Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-navy dark:text-white">
            Today&apos;s Ice Makes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No ice makes logged today.
            </p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Rink</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Ice Taken</TableHead>
                      <TableHead>Water</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDisplayTime(entry.event_time)}
                        </TableCell>
                        <TableCell>{entry.rink?.name || '-'}</TableCell>
                        <TableCell>{entry.machine?.name || '-'}</TableCell>
                        <TableCell>{entry.machine_hours ?? '-'}</TableCell>
                        <TableCell>{entry.ice_taken ?? '-'}</TableCell>
                        <TableCell>{entry.water_used ?? '-'}</TableCell>
                        <TableCell>{entry.operator?.full_name || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {entry.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {todayEntries.map((entry) => (
                  <Card key={entry.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-navy dark:text-white">
                          {entry.rink?.name || 'Unknown Rink'} - {entry.machine?.name || 'Unknown Machine'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDisplayTime(entry.event_time)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {entry.operator?.full_name || '-'}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">Hours</span>
                        <p className="font-medium">{entry.machine_hours ?? '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Ice Taken</span>
                        <p className="font-medium">{entry.ice_taken ?? '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Water</span>
                        <p className="font-medium">{entry.water_used ?? '-'}</p>
                      </div>
                    </div>
                    {entry.notes && (
                      <p className="mt-2 text-xs text-muted-foreground">{entry.notes}</p>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
