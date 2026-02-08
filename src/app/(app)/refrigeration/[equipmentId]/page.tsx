"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { ArrowLeft, AlertTriangle, Save } from "lucide-react"

/* ---------- Equipment metadata ---------- */

interface FieldDef {
  key: string
  label: string
  unit: string
  type: "number" | "select"
  options?: string[]
  min?: number
  max?: number
}

interface EquipmentMeta {
  name: string
  type: "compressor" | "pump"
  fields: FieldDef[]
}

const EQUIPMENT_MAP: Record<string, EquipmentMeta> = {
  "compressor-1": {
    name: "Compressor #1",
    type: "compressor",
    fields: [
      { key: "headPressure", label: "Head Pressure", unit: "PSI", type: "number", min: 150, max: 300 },
      { key: "suctionPressure", label: "Suction Pressure", unit: "PSI", type: "number", min: 20, max: 70 },
      { key: "oilPressure", label: "Oil Pressure", unit: "PSI", type: "number", min: 30, max: 80 },
      { key: "oilLevel", label: "Oil Level", unit: "", type: "select", options: ["OK", "Low", "Add"] },
      { key: "dischargeTemp", label: "Discharge Temp", unit: "\u00b0F", type: "number", min: 120, max: 220 },
    ],
  },
  "compressor-2": {
    name: "Compressor #2",
    type: "compressor",
    fields: [
      { key: "headPressure", label: "Head Pressure", unit: "PSI", type: "number", min: 150, max: 300 },
      { key: "suctionPressure", label: "Suction Pressure", unit: "PSI", type: "number", min: 20, max: 70 },
      { key: "oilPressure", label: "Oil Pressure", unit: "PSI", type: "number", min: 30, max: 80 },
      { key: "oilLevel", label: "Oil Level", unit: "", type: "select", options: ["OK", "Low", "Add"] },
      { key: "dischargeTemp", label: "Discharge Temp", unit: "\u00b0F", type: "number", min: 120, max: 220 },
    ],
  },
  "glycol-pump-1": {
    name: "Glycol Pump #1",
    type: "pump",
    fields: [
      { key: "flowRate", label: "Flow Rate", unit: "GPM", type: "number", min: 50, max: 200 },
      { key: "inletTemp", label: "Inlet Temp", unit: "\u00b0F", type: "number", min: 15, max: 35 },
      { key: "outletTemp", label: "Outlet Temp", unit: "\u00b0F", type: "number", min: 20, max: 45 },
    ],
  },
}

function nowLocalISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

export default function EquipmentReadingPage() {
  const { equipmentId } = useParams<{ equipmentId: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const equipment = EQUIPMENT_MAP[equipmentId]

  const [values, setValues] = useState<Record<string, string>>({})
  const [timestamp, setTimestamp] = useState(nowLocalISO())
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  /* Compute which fields are out of range */
  const outOfRange = useMemo(() => {
    if (!equipment) return new Set<string>()
    const oor = new Set<string>()
    for (const field of equipment.fields) {
      if (field.type !== "number") continue
      const val = parseFloat(values[field.key] ?? "")
      if (isNaN(val)) continue
      if (
        (field.min !== undefined && val < field.min) ||
        (field.max !== undefined && val > field.max)
      ) {
        oor.add(field.key)
      }
    }
    return oor
  }, [equipment, values])

  if (!equipment) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold">Equipment not found</h1>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/refrigeration")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Equipment
        </Button>
      </div>
    )
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // In production this would call a server action
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
          description: `${equipment.name} reading recorded successfully.`,
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
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/refrigeration")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Equipment
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {equipment.name}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Record a new reading for this {equipment.type}.
        </p>
      </div>

      {submitted && (
        <Alert>
          <AlertDescription>
            Reading recorded successfully.
          </AlertDescription>
        </Alert>
      )}

      {/* Dynamic fields */}
      <div className="space-y-5">
        {equipment.fields.map((field) => {
          const isOor = outOfRange.has(field.key)

          if (field.type === "select") {
            return (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Select
                  value={values[field.key] ?? ""}
                  onValueChange={(v) =>
                    setValues((prev) => ({ ...prev, [field.key]: v }))
                  }
                >
                  <SelectTrigger id={field.key}>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          }

          return (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key}>
                {field.label}
                {field.unit && (
                  <span className="ml-1 text-muted-foreground font-normal">
                    ({field.unit})
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id={field.key}
                  type="number"
                  step="any"
                  placeholder={`e.g. ${field.min ?? ""}`}
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className={cn(
                    isOor && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {field.unit && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    {field.unit}
                  </span>
                )}
              </div>
              {isOor && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  Out of range (expected {field.min}&ndash;{field.max}{" "}
                  {field.unit})
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
            placeholder="Optional notes about this reading..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          disabled={submitting}
          onClick={handleSubmit}
        >
          <Save className="h-4 w-4 mr-2" />
          {submitting ? "Saving..." : "Submit Reading"}
        </Button>
      </div>
    </div>
  )
}
