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

/* ---------- Thresholds ---------- */

const THRESHOLDS: Record<string, { min: number; max: number }> = {
  co: { min: 0, max: 25 },
  co2: { min: 300, max: 1000 },
  no2: { min: 0, max: 0.1 },
  humidity: { min: 30, max: 60 },
  temperature: { min: 40, max: 80 },
}

function isOutOfRange(key: string, value: number | null): boolean {
  if (value === null) return false
  const t = THRESHOLDS[key]
  if (!t) return false
  return value < t.min || value > t.max
}

/* ---------- Mock history data ---------- */

interface AirReading {
  id: string
  datetime: string
  location: string
  co: number
  co2: number
  no2: number
  humidity: number
  temperature: number
  recordedBy: string
}

const LOCATION_OPTIONS = [
  { value: "all", label: "All Locations" },
  { value: "ice-level", label: "Ice Level" },
  { value: "stands", label: "Stands" },
  { value: "lobby", label: "Lobby" },
]

const MOCK_READINGS: AirReading[] = [
  {
    id: "aq1",
    datetime: "2025-06-14T09:00:00Z",
    location: "ice-level",
    co: 12,
    co2: 520,
    no2: 0.03,
    humidity: 45,
    temperature: 52,
    recordedBy: "John S.",
  },
  {
    id: "aq2",
    datetime: "2025-06-14T09:05:00Z",
    location: "stands",
    co: 8,
    co2: 680,
    no2: 0.02,
    humidity: 42,
    temperature: 65,
    recordedBy: "John S.",
  },
  {
    id: "aq3",
    datetime: "2025-06-13T14:00:00Z",
    location: "lobby",
    co: 30,
    co2: 1100,
    no2: 0.15,
    humidity: 55,
    temperature: 70,
    recordedBy: "Maria L.",
  },
  {
    id: "aq4",
    datetime: "2025-06-13T08:30:00Z",
    location: "ice-level",
    co: 5,
    co2: 450,
    no2: 0.01,
    humidity: 48,
    temperature: 50,
    recordedBy: "Dave R.",
  },
  {
    id: "aq5",
    datetime: "2025-06-12T16:00:00Z",
    location: "stands",
    co: 18,
    co2: 900,
    no2: 0.08,
    humidity: 65,
    temperature: 62,
    recordedBy: "Maria L.",
  },
]

const METRIC_COLS = [
  { key: "co" as const, label: "CO (PPM)" },
  { key: "co2" as const, label: "CO2 (PPM)" },
  { key: "no2" as const, label: "NO2 (PPM)" },
  { key: "humidity" as const, label: "Humidity (%)" },
  { key: "temperature" as const, label: "Temp (\u00b0F)" },
]

const LOCATION_LABELS: Record<string, string> = {
  "ice-level": "Ice Level",
  stands: "Stands",
  lobby: "Lobby",
}

export default function AirQualityHistoryPage() {
  const router = useRouter()
  const [locationFilter, setLocationFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filtered = useMemo(() => {
    return MOCK_READINGS.filter((r) => {
      if (locationFilter !== "all" && r.location !== locationFilter)
        return false
      if (dateFrom && r.datetime < dateFrom) return false
      if (dateTo && r.datetime > dateTo + "T23:59:59Z") return false
      return true
    })
  }, [locationFilter, dateFrom, dateTo])

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/air-quality")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Air Quality
      </Button>

      <h1 className="text-2xl font-bold tracking-tight">
        Air Quality Reading History
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_OPTIONS.map((o) => (
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
              <TableHead className="whitespace-nowrap">Location</TableHead>
              {METRIC_COLS.map((col) => (
                <TableHead
                  key={col.key}
                  className="whitespace-nowrap text-right"
                >
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="whitespace-nowrap">Recorded By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={METRIC_COLS.length + 3}
                  className="text-center text-muted-foreground py-8"
                >
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
                    {LOCATION_LABELS[r.location] ?? r.location}
                  </TableCell>
                  {METRIC_COLS.map((col) => {
                    const val = r[col.key]
                    const oor = isOutOfRange(col.key, val)
                    return (
                      <TableCell
                        key={col.key}
                        className={cn(
                          "text-right text-sm",
                          oor && "text-red-600 font-semibold"
                        )}
                      >
                        {val}
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
