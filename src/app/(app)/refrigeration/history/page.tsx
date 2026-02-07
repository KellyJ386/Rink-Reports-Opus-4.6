"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"

/* ---------- Thresholds for out-of-range highlighting ---------- */

const THRESHOLDS: Record<string, { min: number; max: number }> = {
  headPressure: { min: 150, max: 300 },
  suctionPressure: { min: 20, max: 70 },
  oilPressure: { min: 30, max: 80 },
  dischargeTemp: { min: 120, max: 220 },
  flowRate: { min: 50, max: 200 },
  inletTemp: { min: 15, max: 35 },
  outletTemp: { min: 20, max: 45 },
}

function isOutOfRange(key: string, value: number | null): boolean {
  if (value === null) return false
  const t = THRESHOLDS[key]
  if (!t) return false
  return value < t.min || value > t.max
}

/* ---------- Mock reading history ---------- */

interface Reading {
  id: string
  datetime: string
  equipmentId: string
  equipmentName: string
  recordedBy: string
  values: Record<string, number | string | null>
}

const MOCK_READINGS: Reading[] = [
  {
    id: "r1",
    datetime: "2025-06-14T08:32:00Z",
    equipmentId: "compressor-1",
    equipmentName: "Compressor #1",
    recordedBy: "John S.",
    values: { headPressure: 245, suctionPressure: 38, oilPressure: 55, oilLevel: "OK", dischargeTemp: 185 },
  },
  {
    id: "r2",
    datetime: "2025-06-14T07:15:00Z",
    equipmentId: "compressor-2",
    equipmentName: "Compressor #2",
    recordedBy: "Maria L.",
    values: { headPressure: 310, suctionPressure: 22, oilPressure: 42, oilLevel: "Low", dischargeTemp: 230 },
  },
  {
    id: "r3",
    datetime: "2025-06-13T16:00:00Z",
    equipmentId: "compressor-1",
    equipmentName: "Compressor #1",
    recordedBy: "John S.",
    values: { headPressure: 220, suctionPressure: 45, oilPressure: 58, oilLevel: "OK", dischargeTemp: 172 },
  },
  {
    id: "r4",
    datetime: "2025-06-13T14:30:00Z",
    equipmentId: "glycol-pump-1",
    equipmentName: "Glycol Pump #1",
    recordedBy: "Dave R.",
    values: { flowRate: 140, inletTemp: 22, outletTemp: 30 },
  },
  {
    id: "r5",
    datetime: "2025-06-12T09:00:00Z",
    equipmentId: "compressor-2",
    equipmentName: "Compressor #2",
    recordedBy: "Maria L.",
    values: { headPressure: 260, suctionPressure: 15, oilPressure: 50, oilLevel: "OK", dischargeTemp: 195 },
  },
]

const ALL_COLUMNS = [
  { key: "headPressure", label: "Head PSI" },
  { key: "suctionPressure", label: "Suction PSI" },
  { key: "oilPressure", label: "Oil PSI" },
  { key: "oilLevel", label: "Oil Level" },
  { key: "dischargeTemp", label: "Discharge \u00b0F" },
  { key: "flowRate", label: "Flow GPM" },
  { key: "inletTemp", label: "Inlet \u00b0F" },
  { key: "outletTemp", label: "Outlet \u00b0F" },
]

const EQUIPMENT_OPTIONS = [
  { value: "all", label: "All Equipment" },
  { value: "compressor-1", label: "Compressor #1" },
  { value: "compressor-2", label: "Compressor #2" },
  { value: "glycol-pump-1", label: "Glycol Pump #1" },
]

export default function RefrigerationHistoryPage() {
  const router = useRouter()
  const [equipmentFilter, setEquipmentFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filtered = useMemo(() => {
    return MOCK_READINGS.filter((r) => {
      if (equipmentFilter !== "all" && r.equipmentId !== equipmentFilter) return false
      if (dateFrom && r.datetime < dateFrom) return false
      if (dateTo && r.datetime > dateTo + "T23:59:59Z") return false
      return true
    })
  }, [equipmentFilter, dateFrom, dateTo])

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/refrigeration")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Equipment
      </Button>

      <h1 className="text-2xl font-bold tracking-tight">
        Refrigeration Reading History
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <Label>Equipment</Label>
          <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[160px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Date/Time</TableHead>
              <TableHead className="whitespace-nowrap">Equipment</TableHead>
              {ALL_COLUMNS.map((col) => (
                <TableHead key={col.key} className="whitespace-nowrap text-right">
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="whitespace-nowrap">Recorded By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={ALL_COLUMNS.length + 3} className="text-center text-muted-foreground py-8">
                  No readings found for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(r.datetime).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {r.equipmentName}
                  </TableCell>
                  {ALL_COLUMNS.map((col) => {
                    const val = r.values[col.key]
                    const oor =
                      typeof val === "number" && isOutOfRange(col.key, val)
                    return (
                      <TableCell
                        key={col.key}
                        className={cn(
                          "text-right text-sm",
                          oor && "text-red-600 font-semibold"
                        )}
                      >
                        {val !== undefined && val !== null ? String(val) : "\u2014"}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-sm">{r.recordedBy}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
