'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { History, Ruler, Bluetooth, BluetoothOff } from 'lucide-react'

import IceRinkDiagram, {
  DEFAULT_MEASUREMENT_POINTS,
  DEFAULT_THRESHOLDS,
  type MeasurementPoint,
  type DepthThresholds,
} from '@/components/diagrams/IceRinkDiagram'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useBluetoothCaliper } from '@/lib/hooks/useBluetoothCaliper'

// ── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_RINKS = [
  { id: 'rink-a', name: 'Rink A' },
  { id: 'rink-b', name: 'Rink B' },
]

/** Seed repeatable mock readings per rink */
function buildMockPoints(rinkId: string): MeasurementPoint[] {
  const seed = rinkId === 'rink-a' ? 1 : 2
  return DEFAULT_MEASUREMENT_POINTS.map((pt, i) => {
    // some points have readings, some do not
    const hasReading = (i + seed) % 3 !== 0
    return {
      ...pt,
      lastReading: hasReading
        ? parseFloat((0.5 + ((i * seed * 7) % 30) / 10).toFixed(2))
        : undefined,
    }
  })
}

const thresholds: DepthThresholds = DEFAULT_THRESHOLDS

// ── Helpers ────────────────────────────────────────────────────────────────────
function classifyReading(v: number | undefined, t: DepthThresholds) {
  if (v === undefined || v === null) return 'none'
  if (v >= t.red_min && v <= t.red_max) return 'red'
  if (v >= t.green_min && v <= t.green_max) return 'green'
  if (v >= t.yellow_min && v <= t.yellow_max) return 'yellow'
  return 'none'
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function IceDepthPage() {
  const { toast } = useToast()
  const bluetooth = useBluetoothCaliper()

  const [selectedRink, setSelectedRink] = useState(MOCK_RINKS[0].id)
  const [pointsMap, setPointsMap] = useState<Record<string, MeasurementPoint[]>>(() => {
    const map: Record<string, MeasurementPoint[]> = {}
    MOCK_RINKS.forEach((r) => {
      map[r.id] = buildMockPoints(r.id)
    })
    return map
  })
  const [dialogPoint, setDialogPoint] = useState<MeasurementPoint | null>(null)
  const [manualValue, setManualValue] = useState('')

  const points = pointsMap[selectedRink] ?? []

  // ── Summary counts ─────────────────────────────────────────
  const summary = useMemo(() => {
    let measured = 0
    let green = 0
    let yellow = 0
    let red = 0
    let none = 0
    points.forEach((p) => {
      const c = classifyReading(p.lastReading, thresholds)
      if (c !== 'none') measured++
      if (c === 'green') green++
      if (c === 'yellow') yellow++
      if (c === 'red') red++
      if (c === 'none') none++
    })
    return { measured, total: points.length, green, yellow, red, none }
  }, [points])

  // ── Handlers ───────────────────────────────────────────────
  const handlePointClick = useCallback(
    (pointId: string) => {
      const pt = points.find((p) => p.id === pointId)
      if (pt) {
        setDialogPoint(pt)
        setManualValue(pt.lastReading?.toString() ?? '')
      }
    },
    [points],
  )

  const handleSaveReading = useCallback(() => {
    if (!dialogPoint) return
    const val = parseFloat(manualValue)
    if (isNaN(val) || val < 0 || val > 5) {
      toast({ title: 'Invalid reading', description: 'Enter a value between 0 and 5 inches.', variant: 'destructive' })
      return
    }
    setPointsMap((prev) => {
      const updated = (prev[selectedRink] ?? []).map((p) =>
        p.id === dialogPoint.id ? { ...p, lastReading: val } : p,
      )
      return { ...prev, [selectedRink]: updated }
    })
    toast({ title: 'Reading saved', description: `Point ${dialogPoint.number}: ${val}"` })
    setDialogPoint(null)
    setManualValue('')
  }, [dialogPoint, manualValue, selectedRink, toast])

  const handleBluetoothRead = useCallback(async () => {
    if (!bluetooth.isConnected) {
      await bluetooth.connect()
    }
    const reading = await bluetooth.read()
    if (reading !== null) {
      setManualValue(reading.toString())
    } else {
      toast({ title: 'Bluetooth', description: 'No reading received from caliper.', variant: 'destructive' })
    }
  }, [bluetooth, toast])

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Ruler className="h-6 w-6 text-[#002244]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#002244]">
            Ice Depth Management
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Rink selector */}
          <Select value={selectedRink} onValueChange={setSelectedRink}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select rink" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_RINKS.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bluetooth status */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => (bluetooth.isConnected ? undefined : bluetooth.connect())}
            title={bluetooth.isSupported ? 'Connect Bluetooth caliper' : 'Bluetooth not supported'}
            disabled={!bluetooth.isSupported}
          >
            {bluetooth.isConnected ? (
              <Bluetooth className="h-4 w-4 text-[#69BE28]" />
            ) : (
              <BluetoothOff className="h-4 w-4 text-[#A5ACAF]" />
            )}
          </Button>

          <Link href="/ice-depth/history">
            <Button variant="outline" size="sm">
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
          </Link>
        </div>
      </div>

      {/* Rink diagram */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {MOCK_RINKS.find((r) => r.id === selectedRink)?.name} - Measurement Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IceRinkDiagram
            points={points}
            thresholds={thresholds}
            onPointClick={handlePointClick}
          />
        </CardContent>
      </Card>

      {/* Summary bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <span className="text-sm font-medium text-slate-700">
            {summary.measured}/{summary.total} points measured today
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-[#69BE28] bg-[#69BE28]/10 text-[#69BE28]">
              Green: {summary.green}
            </Badge>
            <Badge variant="outline" className="border-[#FFB800] bg-[#FFB800]/10 text-[#b38200]">
              Yellow: {summary.yellow}
            </Badge>
            <Badge variant="outline" className="border-[#D32F2F] bg-[#D32F2F]/10 text-[#D32F2F]">
              Red: {summary.red}
            </Badge>
            <Badge variant="outline" className="border-[#A5ACAF] bg-[#A5ACAF]/10 text-[#6B7280]">
              No reading: {summary.none}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ── Reading dialog ────────────────────────────────────── */}
      <Dialog open={!!dialogPoint} onOpenChange={(open) => !open && setDialogPoint(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Point {dialogPoint?.number}</DialogTitle>
            <DialogDescription>
              Enter or read an ice depth measurement (inches).
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reading">Reading (inches)</Label>
              <Input
                id="reading"
                type="number"
                step="0.01"
                min="0"
                max="5"
                placeholder="e.g. 1.25"
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
              />
            </div>
            {bluetooth.isSupported && (
              <Button variant="outline" size="sm" onClick={handleBluetoothRead}>
                <Bluetooth className="mr-2 h-4 w-4" />
                Read from caliper
              </Button>
            )}
            {dialogPoint?.lastReading !== undefined && (
              <p className="text-xs text-muted-foreground">
                Previous reading: {dialogPoint.lastReading}&quot;
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogPoint(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReading}>Save Reading</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
