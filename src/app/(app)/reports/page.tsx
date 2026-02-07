"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  FileText,
  Download,
  ClipboardList,
  Ruler,
  Snowflake,
  CalendarDays,
  ShieldAlert,
  Gauge,
  Wind,
} from "lucide-react"

/* ---------- Report type definitions ---------- */

interface ReportDef {
  id: string
  name: string
  description: string
  module: string
}

interface ReportCategory {
  label: string
  icon: React.ReactNode
  reports: ReportDef[]
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    label: "Daily Reports",
    icon: <ClipboardList className="h-4 w-4" />,
    reports: [
      {
        id: "checklist-completion",
        name: "Checklist Completion Summary",
        description: "Overview of daily checklist completion rates by date and staff member.",
        module: "daily-reports",
      },
    ],
  },
  {
    label: "Ice Depth",
    icon: <Ruler className="h-4 w-4" />,
    reports: [
      {
        id: "ice-depth-history",
        name: "Measurement History",
        description: "Historical ice depth measurements across all zones.",
        module: "ice-depth",
      },
    ],
  },
  {
    label: "Ice Operations",
    icon: <Snowflake className="h-4 w-4" />,
    reports: [
      {
        id: "ice-makes-log",
        name: "Ice Makes Log",
        description: "Detailed log of all ice make sessions with temperatures and durations.",
        module: "ice-operations",
      },
      {
        id: "machine-hours",
        name: "Machine Hours Summary",
        description: "Total hours per resurfacing machine over the selected period.",
        module: "ice-operations",
      },
    ],
  },
  {
    label: "Scheduling",
    icon: <CalendarDays className="h-4 w-4" />,
    reports: [
      {
        id: "schedule-by-date",
        name: "Schedule by Date Range",
        description: "Employee schedule breakdown for the selected date range.",
        module: "scheduling",
      },
      {
        id: "hours-by-employee",
        name: "Hours by Employee",
        description: "Total scheduled hours per employee over the selected period.",
        module: "scheduling",
      },
    ],
  },
  {
    label: "Incidents",
    icon: <ShieldAlert className="h-4 w-4" />,
    reports: [
      {
        id: "incident-log",
        name: "Incident Log",
        description: "All recorded incidents with status, severity, and resolution details.",
        module: "incidents",
      },
      {
        id: "incident-compliance",
        name: "Compliance Report",
        description: "Incident reporting compliance summary for regulatory review.",
        module: "incidents",
      },
    ],
  },
  {
    label: "Refrigeration",
    icon: <Gauge className="h-4 w-4" />,
    reports: [
      {
        id: "refrigeration-history",
        name: "Reading History",
        description: "All refrigeration plant readings across equipment types.",
        module: "refrigeration",
      },
      {
        id: "refrigeration-oor",
        name: "Out-of-Range Events",
        description: "Readings that exceeded configured thresholds for refrigeration equipment.",
        module: "refrigeration",
      },
    ],
  },
  {
    label: "Air Quality",
    icon: <Wind className="h-4 w-4" />,
    reports: [
      {
        id: "air-quality-compliance",
        name: "Compliance Report",
        description: "Air quality compliance metrics including any threshold exceedances.",
        module: "air-quality",
      },
    ],
  },
]

type ExportFormat = "pdf" | "csv" | "excel"

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
  { value: "excel", label: "Excel (.xlsx)" },
]

export default function ReportsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportDef | null>(null)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [format, setFormat] = useState<ExportFormat>("pdf")
  const [generating, setGenerating] = useState(false)

  const openDialog = (report: ReportDef) => {
    setSelectedReport(report)
    setDateFrom("")
    setDateTo("")
    setFormat("pdf")
    setDialogOpen(true)
  }

  const handleGenerate = async () => {
    if (!selectedReport) return
    setGenerating(true)
    // In production this would call a server action to generate the report
    await new Promise((r) => setTimeout(r, 1200))
    setGenerating(false)
    setDialogOpen(false)
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Reports & Export
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Generate and download reports across all facility modules.
          </p>
        </div>
      </div>

      {/* Report categories */}
      {REPORT_CATEGORIES.map((category) => (
        <section key={category.label} className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {category.icon}
            {category.label}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.reports.map((report) => (
              <Card key={report.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    {report.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => openDialog(report)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {/* Generate dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              {selectedReport
                ? `Configure and generate "${selectedReport.name}".`
                : "Select report options."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="report-from">Start Date</Label>
                <Input
                  id="report-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-to">End Date</Label>
                <Input
                  id="report-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Export format */}
            <div className="space-y-1.5">
              <Label>Format</Label>
              <div className="flex gap-2">
                {FORMAT_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={format === opt.value ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex-1",
                      format === opt.value && "pointer-events-none"
                    )}
                    onClick={() => setFormat(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Module-specific filter placeholder */}
            {selectedReport && (
              <div className="space-y-1.5">
                <Label>Filter</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="All records" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Records</SelectItem>
                    <SelectItem value="flagged">Flagged / Out-of-Range Only</SelectItem>
                    <SelectItem value="complete">Completed Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || !dateFrom || !dateTo}
            >
              <Download className="h-4 w-4 mr-2" />
              {generating ? "Generating..." : "Generate & Download"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
