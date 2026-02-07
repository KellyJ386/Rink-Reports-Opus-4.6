"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Gauge,
  Droplets,
  Clock,
  ArrowRight,
  History,
} from "lucide-react"

/* ---------- Mock equipment data ---------- */

interface Equipment {
  id: string
  name: string
  type: "compressor" | "pump"
  lastReadingAt: string | null
  status: "online" | "offline" | "no-data"
}

const EQUIPMENT: Equipment[] = [
  {
    id: "compressor-1",
    name: "Compressor #1",
    type: "compressor",
    lastReadingAt: "2025-06-14T08:32:00Z",
    status: "online",
  },
  {
    id: "compressor-2",
    name: "Compressor #2",
    type: "compressor",
    lastReadingAt: "2025-06-14T07:15:00Z",
    status: "offline",
  },
  {
    id: "glycol-pump-1",
    name: "Glycol Pump #1",
    type: "pump",
    lastReadingAt: null,
    status: "no-data",
  },
]

const STATUS_META: Record<
  Equipment["status"],
  { label: string; dot: string }
> = {
  online: { label: "Online", dot: "bg-green-500" },
  offline: { label: "Offline", dot: "bg-red-500" },
  "no-data": { label: "No Data", dot: "bg-gray-400" },
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function RefrigerationPage() {
  const router = useRouter()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Refrigeration Plant Logs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Select equipment to record a new reading.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/refrigeration/history")}
        >
          <History className="h-4 w-4 mr-2" />
          View History
        </Button>
      </div>

      {/* Equipment Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EQUIPMENT.map((eq) => {
          const meta = STATUS_META[eq.status]
          return (
            <Card
              key={eq.id}
              className="cursor-pointer hover:shadow-md transition-shadow border"
              onClick={() => router.push(`/refrigeration/${eq.id}`)}
            >
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    {eq.name}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="capitalize text-[11px]"
                  >
                    {eq.type === "compressor" ? (
                      <Gauge className="h-3 w-3 mr-1" />
                    ) : (
                      <Droplets className="h-3 w-3 mr-1" />
                    )}
                    {eq.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full shrink-0",
                      meta.dot
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {meta.label}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {eq.lastReadingAt
                      ? formatRelativeTime(eq.lastReadingAt)
                      : "No readings yet"}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
