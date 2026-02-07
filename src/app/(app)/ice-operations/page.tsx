'use client'

import { useState, useCallback } from 'react'
import {
  Snowflake,
  Droplets,
  Disc,
  CircleCheckBig,
  ClipboardCheck,
  Plus,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

// ── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_RINKS = ['Rink A', 'Rink B']
const MOCK_MACHINES = ['Zamboni #1 - Gas', 'Zamboni #2 - Electric']
const CURRENT_USER = 'Current User'

const CIRCLE_CHECK_ITEMS = [
  { id: 'cc-1', label: 'Check tire pressure' },
  { id: 'cc-2', label: 'Inspect blade condition' },
  { id: 'cc-3', label: 'Check hydraulic fluid level' },
  { id: 'cc-4', label: 'Inspect wash water tank' },
  { id: 'cc-5', label: 'Check conditioner water flow' },
  { id: 'cc-6', label: 'Inspect snow removal auger' },
  { id: 'cc-7', label: 'Check engine oil level' },
  { id: 'cc-8', label: 'Inspect board brush condition' },
  { id: 'cc-9', label: 'Check battery charge level' },
  { id: 'cc-10', label: 'Verify emergency stop function' },
]

// ── Helper: now in datetime-local format ───────────────────────────────────────
function nowLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── Shared Log Entry types ─────────────────────────────────────────────────────
interface IceMakeEntry {
  id: string
  timestamp: string
  rink: string
  machine: string
  machineHours: string
  iceTaken: string
  waterUsed: string
  notes: string
  operator: string
}

interface BladeChangeEntry {
  id: string
  timestamp: string
  machine: string
  notes: string
  operator: string
}

interface EdgingEntry {
  id: string
  timestamp: string
  rink: string
  notes: string
  operator: string
}

interface CircleCheckEntry {
  id: string
  timestamp: string
  machine: string
  operator: string
  passedCount: number
  failedCount: number
  failedItems: string[]
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function IceOperationsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Snowflake className="h-6 w-6 text-[#002244]" />
        <h1 className="text-2xl font-bold tracking-tight text-[#002244]">
          Ice Operations
        </h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ice-makes" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="ice-makes" className="gap-1.5">
            <Droplets className="h-4 w-4" />
            Ice Makes
          </TabsTrigger>
          <TabsTrigger value="blade-change" className="gap-1.5">
            <Disc className="h-4 w-4" />
            Blade Change
          </TabsTrigger>
          <TabsTrigger value="edging" className="gap-1.5">
            <Snowflake className="h-4 w-4" />
            Edging
          </TabsTrigger>
          <TabsTrigger value="circle-check" className="gap-1.5">
            <CircleCheckBig className="h-4 w-4" />
            Circle Check
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ice-makes">
          <IceMakesTab />
        </TabsContent>
        <TabsContent value="blade-change">
          <BladeChangeTab />
        </TabsContent>
        <TabsContent value="edging">
          <EdgingTab />
        </TabsContent>
        <TabsContent value="circle-check">
          <CircleCheckTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 1: Ice Makes
// ═══════════════════════════════════════════════════════════════════════════════
function IceMakesTab() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<IceMakeEntry[]>([])
  const [form, setForm] = useState({
    timestamp: nowLocal(),
    rink: MOCK_RINKS[0],
    machine: MOCK_MACHINES[0],
    machineHours: '',
    iceTaken: '',
    waterUsed: '',
    notes: '',
  })

  const handleSubmit = useCallback(() => {
    const entry: IceMakeEntry = {
      id: crypto.randomUUID(),
      ...form,
      operator: CURRENT_USER,
    }
    setEntries((prev) => [entry, ...prev])
    setForm({
      timestamp: nowLocal(),
      rink: MOCK_RINKS[0],
      machine: MOCK_MACHINES[0],
      machineHours: '',
      iceTaken: '',
      waterUsed: '',
      notes: '',
    })
    toast({ title: 'Ice make logged', description: `${form.rink} - ${form.machine}` })
  }, [form, toast])

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log Ice Make</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="im-time">Timestamp</Label>
              <Input
                id="im-time"
                type="datetime-local"
                value={form.timestamp}
                onChange={(e) => setForm((f) => ({ ...f, timestamp: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Operator</Label>
              <Input value={CURRENT_USER} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="im-rink">Rink</Label>
              <Select value={form.rink} onValueChange={(v) => setForm((f) => ({ ...f, rink: v }))}>
                <SelectTrigger id="im-rink">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_RINKS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="im-machine">Machine</Label>
              <Select value={form.machine} onValueChange={(v) => setForm((f) => ({ ...f, machine: v }))}>
                <SelectTrigger id="im-machine">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_MACHINES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="im-hours">Machine Hours</Label>
              <Input
                id="im-hours"
                type="number"
                step="0.1"
                placeholder="e.g. 1234.5"
                value={form.machineHours}
                onChange={(e) => setForm((f) => ({ ...f, machineHours: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="im-ice">Ice Taken</Label>
              <Input
                id="im-ice"
                placeholder="e.g. Light, Medium, Heavy"
                value={form.iceTaken}
                onChange={(e) => setForm((f) => ({ ...f, iceTaken: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="im-water">Water Used</Label>
              <Input
                id="im-water"
                placeholder="e.g. 150 gallons"
                value={form.waterUsed}
                onChange={(e) => setForm((f) => ({ ...f, waterUsed: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="im-notes">Notes</Label>
            <Textarea
              id="im-notes"
              placeholder="Optional notes..."
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Submit
          </Button>
        </CardContent>
      </Card>

      {/* Today's log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s Log</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No ice makes logged today.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Rink</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Ice</TableHead>
                  <TableHead>Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatTime(e.timestamp)}</TableCell>
                    <TableCell>{e.rink}</TableCell>
                    <TableCell>{e.machine}</TableCell>
                    <TableCell>{e.machineHours || '-'}</TableCell>
                    <TableCell>{e.iceTaken || '-'}</TableCell>
                    <TableCell>{e.operator}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 2: Blade Change
// ═══════════════════════════════════════════════════════════════════════════════
function BladeChangeTab() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<BladeChangeEntry[]>([])
  const [form, setForm] = useState({
    timestamp: nowLocal(),
    machine: MOCK_MACHINES[0],
    notes: '',
  })

  const handleSubmit = useCallback(() => {
    const entry: BladeChangeEntry = {
      id: crypto.randomUUID(),
      ...form,
      operator: CURRENT_USER,
    }
    setEntries((prev) => [entry, ...prev])
    setForm({ timestamp: nowLocal(), machine: MOCK_MACHINES[0], notes: '' })
    toast({ title: 'Blade change logged', description: form.machine })
  }, [form, toast])

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log Blade Change</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bc-time">Timestamp</Label>
              <Input
                id="bc-time"
                type="datetime-local"
                value={form.timestamp}
                onChange={(e) => setForm((f) => ({ ...f, timestamp: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Operator</Label>
              <Input value={CURRENT_USER} disabled />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bc-machine">Machine</Label>
              <Select value={form.machine} onValueChange={(v) => setForm((f) => ({ ...f, machine: v }))}>
                <SelectTrigger id="bc-machine">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_MACHINES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bc-notes">Notes</Label>
            <Textarea
              id="bc-notes"
              placeholder="Optional notes..."
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Submit
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s Log</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No blade changes logged today.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatTime(e.timestamp)}</TableCell>
                    <TableCell>{e.machine}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{e.notes || '-'}</TableCell>
                    <TableCell>{e.operator}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 3: Edging
// ═══════════════════════════════════════════════════════════════════════════════
function EdgingTab() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<EdgingEntry[]>([])
  const [form, setForm] = useState({
    timestamp: nowLocal(),
    rink: MOCK_RINKS[0],
    notes: '',
  })

  const handleSubmit = useCallback(() => {
    const entry: EdgingEntry = {
      id: crypto.randomUUID(),
      ...form,
      operator: CURRENT_USER,
    }
    setEntries((prev) => [entry, ...prev])
    setForm({ timestamp: nowLocal(), rink: MOCK_RINKS[0], notes: '' })
    toast({ title: 'Edging logged', description: form.rink })
  }, [form, toast])

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log Edging</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ed-time">Timestamp</Label>
              <Input
                id="ed-time"
                type="datetime-local"
                value={form.timestamp}
                onChange={(e) => setForm((f) => ({ ...f, timestamp: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Operator</Label>
              <Input value={CURRENT_USER} disabled />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-rink">Rink</Label>
              <Select value={form.rink} onValueChange={(v) => setForm((f) => ({ ...f, rink: v }))}>
                <SelectTrigger id="ed-rink">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_RINKS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ed-notes">Notes</Label>
            <Textarea
              id="ed-notes"
              placeholder="Optional notes..."
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Submit
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s Log</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No edging logged today.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Rink</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatTime(e.timestamp)}</TableCell>
                    <TableCell>{e.rink}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{e.notes || '-'}</TableCell>
                    <TableCell>{e.operator}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 4: Circle Check
// ═══════════════════════════════════════════════════════════════════════════════
interface CheckItemState {
  checked: boolean
  passed: boolean
  notes: string
}

function CircleCheckTab() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<CircleCheckEntry[]>([])
  const [machine, setMachine] = useState(MOCK_MACHINES[0])
  const [items, setItems] = useState<Record<string, CheckItemState>>(() => {
    const m: Record<string, CheckItemState> = {}
    CIRCLE_CHECK_ITEMS.forEach((ci) => {
      m[ci.id] = { checked: false, passed: true, notes: '' }
    })
    return m
  })
  const [validationError, setValidationError] = useState<string | null>(null)

  const updateItem = useCallback(
    (id: string, patch: Partial<CheckItemState>) => {
      setItems((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch },
      }))
      setValidationError(null)
    },
    [],
  )

  const resetForm = useCallback(() => {
    const m: Record<string, CheckItemState> = {}
    CIRCLE_CHECK_ITEMS.forEach((ci) => {
      m[ci.id] = { checked: false, passed: true, notes: '' }
    })
    setItems(m)
    setMachine(MOCK_MACHINES[0])
    setValidationError(null)
  }, [])

  const handleSubmit = useCallback(() => {
    // All items must be checked
    const unchecked = CIRCLE_CHECK_ITEMS.filter((ci) => !items[ci.id].checked)
    if (unchecked.length > 0) {
      setValidationError('All items must be checked before submitting.')
      return
    }

    // Failed items require notes
    const failedWithoutNotes = CIRCLE_CHECK_ITEMS.filter(
      (ci) => !items[ci.id].passed && !items[ci.id].notes.trim(),
    )
    if (failedWithoutNotes.length > 0) {
      setValidationError('Failed items require notes explaining the issue.')
      return
    }

    const failedItems = CIRCLE_CHECK_ITEMS.filter((ci) => !items[ci.id].passed).map(
      (ci) => ci.label,
    )
    const passedCount = CIRCLE_CHECK_ITEMS.length - failedItems.length

    const entry: CircleCheckEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      machine,
      operator: CURRENT_USER,
      passedCount,
      failedCount: failedItems.length,
      failedItems,
    }
    setEntries((prev) => [entry, ...prev])
    resetForm()
    toast({
      title: 'Circle check completed',
      description: `${passedCount} passed, ${failedItems.length} failed`,
    })
  }, [items, machine, resetForm, toast])

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Circle Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cc-machine">Machine</Label>
              <Select value={machine} onValueChange={setMachine}>
                <SelectTrigger id="cc-machine">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_MACHINES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operator</Label>
              <Input value={CURRENT_USER} disabled />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3 rounded-md border p-4">
            {CIRCLE_CHECK_ITEMS.map((ci) => {
              const state = items[ci.id]
              return (
                <div key={ci.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={ci.id}
                        checked={state.checked}
                        onCheckedChange={(checked) =>
                          updateItem(ci.id, { checked: checked === true })
                        }
                      />
                      <Label
                        htmlFor={ci.id}
                        className={cn(
                          'cursor-pointer text-sm',
                          state.checked && !state.passed && 'text-[#D32F2F]',
                          state.checked && state.passed && 'text-[#69BE28]',
                        )}
                      >
                        {ci.label}
                      </Label>
                    </div>
                    {state.checked && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={state.passed ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            'h-7 text-xs',
                            state.passed &&
                              'bg-[#69BE28] hover:bg-[#5AA822] text-white',
                          )}
                          onClick={() => updateItem(ci.id, { passed: true })}
                        >
                          Pass
                        </Button>
                        <Button
                          type="button"
                          variant={!state.passed ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            'h-7 text-xs',
                            !state.passed &&
                              'bg-[#D32F2F] hover:bg-[#b71c1c] text-white',
                          )}
                          onClick={() => updateItem(ci.id, { passed: false })}
                        >
                          Fail
                        </Button>
                      </div>
                    )}
                  </div>
                  {state.checked && !state.passed && (
                    <Textarea
                      placeholder="Describe the issue..."
                      rows={2}
                      value={state.notes}
                      onChange={(e) => updateItem(ci.id, { notes: e.target.value })}
                      className="ml-7"
                    />
                  )}
                </div>
              )
            })}
          </div>

          {validationError && (
            <p className="text-sm font-medium text-[#D32F2F]">{validationError}</p>
          )}

          <Button onClick={handleSubmit} className="w-full sm:w-auto">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Submit Circle Check
          </Button>
        </CardContent>
      </Card>

      {/* Today's log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s Log</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No circle checks completed today.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatTime(e.timestamp)}</TableCell>
                    <TableCell>{e.machine}</TableCell>
                    <TableCell>
                      <span className="font-medium text-[#69BE28]">{e.passedCount}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'font-medium',
                          e.failedCount > 0 ? 'text-[#D32F2F]' : 'text-muted-foreground',
                        )}
                      >
                        {e.failedCount}
                      </span>
                      {e.failedItems.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {e.failedItems.join(', ')}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{e.operator}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
