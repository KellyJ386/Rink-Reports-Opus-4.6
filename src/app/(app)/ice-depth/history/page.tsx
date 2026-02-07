'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ── Types ──────────────────────────────────────────────────────────────────────
interface HistoryEntry {
  id: string
  pointNumber: number
  reading: number
  color: 'green' | 'yellow' | 'red'
  source: string
  measuredBy: string
  dateTime: string // ISO string
}

// ── Mock history data ──────────────────────────────────────────────────────────
function generateMockHistory(): HistoryEntry[] {
  const sources = ['Manual', 'Bluetooth Caliper', 'Manual']
  const operators = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Williams']
  const entries: HistoryEntry[] = []

  const now = new Date()
  for (let i = 0; i < 30; i++) {
    const date = new Date(now)
    date.setHours(date.getHours() - i * 2)
    const reading = parseFloat((0.4 + Math.random() * 3.2).toFixed(2))
    let color: 'green' | 'yellow' | 'red' = 'green'
    if (reading < 1.0) color = 'red'
    else if (reading >= 1.75) color = 'yellow'

    entries.push({
      id: `hist-${i}`,
      pointNumber: (i % 15) + 1,
      reading,
      color,
      source: sources[i % sources.length],
      measuredBy: operators[i % operators.length],
      dateTime: date.toISOString(),
    })
  }
  return entries
}

const MOCK_HISTORY = generateMockHistory()

const COLOR_MAP = {
  green: { label: 'Green', className: 'bg-[#69BE28]' },
  yellow: { label: 'Yellow', className: 'bg-[#FFB800]' },
  red: { label: 'Red', className: 'bg-[#D32F2F]' },
} as const

// ── Page ───────────────────────────────────────────────────────────────────────
export default function IceDepthHistoryPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortAsc, setSortAsc] = useState(false) // newest first by default

  const filtered = useMemo(() => {
    let data = [...MOCK_HISTORY]

    if (startDate) {
      const s = new Date(startDate)
      data = data.filter((e) => new Date(e.dateTime) >= s)
    }
    if (endDate) {
      const e = new Date(endDate)
      e.setHours(23, 59, 59, 999)
      data = data.filter((entry) => new Date(entry.dateTime) <= e)
    }

    data.sort((a, b) => {
      const diff = new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      return sortAsc ? diff : -diff
    })
    return data
  }, [startDate, endDate, sortAsc])

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ice-depth">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#002244]">
            Measurement History
          </h1>
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[150px]"
            aria-label="Start date"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[150px]"
            aria-label="End date"
          />
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {filtered.length} reading{filtered.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Point #</TableHead>
                <TableHead className="w-[100px]">Reading (&quot;)</TableHead>
                <TableHead className="w-[80px]">Color</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Measured By</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 font-medium"
                    onClick={() => setSortAsc((prev) => !prev)}
                  >
                    Date / Time
                    <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No readings found for the selected date range.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.pointNumber}</TableCell>
                    <TableCell>{entry.reading.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="gap-1.5"
                      >
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${COLOR_MAP[entry.color].className}`}
                        />
                        {COLOR_MAP[entry.color].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.source}</TableCell>
                    <TableCell>{entry.measuredBy}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(entry.dateTime).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
