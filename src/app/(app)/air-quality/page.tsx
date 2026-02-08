"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Wind, AlertTriangle, Save, History } from "lucide-react"

/* ---------- Locations ---------- */

const LOCATIONS = [
  { value: "ice-level", label: "Ice Level" },
  { value: "stands", label: "Stands" },
  { value: "lobby", label: "Lobby" },
]

/* ---------- Metric definitions ---------- */

interface MetricDef {
  key: string
  label: string
  unit: string
  min: number
  max: number
  placeholder: string
}

const METRICS: MetricDef[] = [
  { key: "co", label: "Carbon Monoxide (CO)", unit: "PPM", min: 0, max: 25, placeholder: "0" },
  { key: "co2", label: "Carbon Dioxide (CO2)", unit: "PPM", min: 300, max: 1000, placeholder: "400" },
  { key: "no2", label: "Nitrogen Dioxide (NO2)", unit: "PPM", min: 0, max: 0.1, placeholder: "0.02" },
  { key: "humidity", label: "Humidity", unit: "%", min: 30, max: 60, placeholder: "45" },
  { key: "temperature", label: "Temperature", unit: "\u00b0F", min: 40, max: 80, placeholder: "55" },
]

function nowLocalISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

export default function AirQualityPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [location, setLocation] = useState("")
  const [values, setValues] = useState<Record<string, string>>({})
  const [timestamp, setTimestamp] = useState(nowLocalISO())
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  /* Compute out-of-range fields */
  const outOfRange = useMemo(() => {
    const oor = new Set<string>()
    for (const metric of METRICS) {
      const val = parseFloat(values[metric.key] ?? "")
      if (isNaN(val)) continue
      if (val < metric.min || val > metric.max) {
        oor.add(metric.key)
      }
    }
    return oor
  }, [values])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // In production this would call the server action
      const result = await new Promise<{ success: boolean; error?: string }>((r) =>
        setTimeout(() => r({ success: true }), 600)
      )

      if ('error' in result && result.error) {
        toast({
          title: "Error",
          description: typeof result.error === 'string' ? result.error : "Something went wrong",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Air quality reading recorded successfully.",
        })
        setSubmitted(true)
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong while submitting the reading.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wind className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Air Quality Monitoring
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Record air quality metrics for a facility location.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/air-quality/history")}
        >
          <History className="h-4 w-4 mr-2" />
          View History
        </Button>
      </div>

      {submitted && (
        <Alert>
          <AlertDescription>
            Air quality reading recorded successfully.
          </AlertDescription>
        </Alert>
      )}

      {/* Location Selector */}
      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger id="location">
            <SelectValue placeholder="Select location..." />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map((loc) => (
              <SelectItem key={loc.value} value={loc.value}>
                {loc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Metric Fields */}
      <div className="space-y-5">
        {METRICS.map((metric) => {
          const isOor = outOfRange.has(metric.key)
          return (
            <div key={metric.key} className="space-y-1.5">
              <Label htmlFor={metric.key}>
                {metric.label}
                <span className="ml-1 text-muted-foreground font-normal">
                  ({metric.unit})
                </span>
              </Label>
              <div className="relative">
                <Input
                  id={metric.key}
                  type="number"
                  step="any"
                  placeholder={metric.placeholder}
                  value={values[metric.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [metric.key]: e.target.value,
                    }))
                  }
                  className={cn(
                    isOor && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  {metric.unit}
                </span>
              </div>
              {isOor && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  Out of range (expected {metric.min}&ndash;{metric.max}{" "}
                  {metric.unit})
                </p>
              )}
            </div>
          )
        })}

        {/* Timestamp */}
        <div className="space-y-1.5">
          <Label htmlFor="timestamp">Timestamp</Label>
          <Input
            id="timestamp"
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Optional notes about the reading..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          disabled={submitting || !location}
          onClick={handleSubmit}
        >
          <Save className="h-4 w-4 mr-2" />
          {submitting ? "Saving..." : "Submit Reading"}
        </Button>
      </div>
    </div>
  )
}
