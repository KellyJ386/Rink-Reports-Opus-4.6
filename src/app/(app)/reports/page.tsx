'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList,
  Ruler,
  Snowflake,
  Calendar,
  AlertTriangle,
  Thermometer,
  Wind,
  FileText,
  Download,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { generateReport, getFilterOptions } from './actions'
import { format, subDays } from 'date-fns'

// ── Report definitions ──

interface ReportDefinition {
  module: string
  reportType: string
  title: string
  description: string
  icon: React.ReactNode
  filterKey?: string
  filterLabel?: string
  filterOptionsKey?: string
}

const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    module: 'daily_reports',
    reportType: 'checklist_summary',
    title: 'Checklist Summary',
    description: 'Summary of all daily report checklist completions across tabs and items.',
    icon: <ClipboardList className="h-6 w-6" />,
    filterKey: 'tabId',
    filterLabel: 'Report Tab',
    filterOptionsKey: 'tabs',
  },
  {
    module: 'ice_depth',
    reportType: 'measurement_history',
    title: 'Ice Depth Measurements',
    description: 'History of ice depth readings across all rinks and measurement points.',
    icon: <Ruler className="h-6 w-6" />,
    filterKey: 'rinkId',
    filterLabel: 'Rink',
    filterOptionsKey: 'rinks',
  },
  {
    module: 'ice_operations',
    reportType: 'ice_makes_log',
    title: 'Ice Makes Log',
    description: 'Log of all ice make operations including machine, operator, and water temperature.',
    icon: <Snowflake className="h-6 w-6" />,
    filterKey: 'rinkId',
    filterLabel: 'Rink',
    filterOptionsKey: 'rinks',
  },
  {
    module: 'scheduling',
    reportType: 'hours_by_employee',
    title: 'Hours by Employee',
    description: 'Employee shift hours with breakdown by shift type, date, and total hours.',
    icon: <Calendar className="h-6 w-6" />,
    filterKey: 'employeeId',
    filterLabel: 'Employee',
    filterOptionsKey: 'employees',
  },
  {
    module: 'incidents',
    reportType: 'incident_log',
    title: 'Incident Log',
    description: 'Complete log of incident reports with type, severity, location, and status.',
    icon: <AlertTriangle className="h-6 w-6" />,
    filterKey: 'locationId',
    filterLabel: 'Location',
    filterOptionsKey: 'locations',
  },
  {
    module: 'refrigeration',
    reportType: 'reading_history',
    title: 'Refrigeration Readings',
    description: 'Equipment reading history with metric values, units, and operator information.',
    icon: <Thermometer className="h-6 w-6" />,
    filterKey: 'equipmentId',
    filterLabel: 'Equipment',
    filterOptionsKey: 'equipment',
  },
  {
    module: 'air_quality',
    reportType: 'compliance_report',
    title: 'Air Quality Compliance',
    description: 'Air quality readings with compliance status against configured thresholds.',
    icon: <Wind className="h-6 w-6" />,
    filterKey: 'locationId',
    filterLabel: 'Location',
    filterOptionsKey: 'locations',
  },
]

// ── Module display groupings ──

const MODULE_GROUPS: { label: string; modules: string[] }[] = [
  { label: 'Daily Operations', modules: ['daily_reports', 'ice_depth', 'ice_operations'] },
  { label: 'Staff & Safety', modules: ['scheduling', 'incidents'] },
  { label: 'Equipment & Environment', modules: ['refrigeration', 'air_quality'] },
]

type ExportFormat = 'pdf' | 'csv' | 'excel'

export default function ReportsPage() {
  const { toast } = useToast()

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null)

  // Form state
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')
  const [filterValue, setFilterValue] = useState<string>('')
  const [generating, setGenerating] = useState(false)

  // Filter options from server
  const [filterOptions, setFilterOptions] = useState<
    Record<string, { id: string; name: string }[]>
  >({})
  const [loadingFilters, setLoadingFilters] = useState(false)

  // Load filter options when a report is selected
  const loadFilters = useCallback(async (module: string) => {
    setLoadingFilters(true)
    try {
      const result = await getFilterOptions(module)
      if (result.success && result.options) {
        setFilterOptions(result.options as Record<string, { id: string; name: string }[]>)
      } else {
        setFilterOptions({})
      }
    } catch {
      setFilterOptions({})
    } finally {
      setLoadingFilters(false)
    }
  }, [])

  useEffect(() => {
    if (selectedReport) {
      loadFilters(selectedReport.module)
    }
  }, [selectedReport, loadFilters])

  const handleOpenDialog = (report: ReportDefinition) => {
    setSelectedReport(report)
    setFilterValue('')
    setExportFormat('pdf')
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedReport(null)
    setFilterOptions({})
    setFilterValue('')
  }

  const handleGenerate = async () => {
    if (!selectedReport) return

    // Validate dates
    if (!startDate || !endDate) {
      toast({ title: 'Please select both start and end dates', variant: 'destructive' })
      return
    }
    if (startDate > endDate) {
      toast({ title: 'Start date must be before end date', variant: 'destructive' })
      return
    }

    setGenerating(true)

    try {
      const filters: Record<string, string> = {}
      if (filterValue && selectedReport.filterKey) {
        filters[selectedReport.filterKey] = filterValue
      }

      const result = await generateReport({
        module: selectedReport.module,
        reportType: selectedReport.reportType,
        startDate,
        endDate,
        format: exportFormat,
        filters,
      })

      if (!result.success || !result.data) {
        toast({
          title: 'Report Generation Failed',
          description: result.error ?? 'Unknown error occurred',
          variant: 'destructive',
        })
        return
      }

      // Convert base64 to blob and trigger download
      const binaryString = atob(result.data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: result.contentType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename ?? 'report'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Report Downloaded',
        description: `${result.filename} has been generated successfully.`,
        variant: 'success',
      })

      handleCloseDialog()
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while generating the report.',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  // Get the filter dropdown options for the currently selected report
  const currentFilterItems =
    selectedReport?.filterOptionsKey
      ? filterOptions[selectedReport.filterOptionsKey] ?? []
      : []

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy text-white dark:bg-navy-light">
            <FileText className="h-5 w-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Reports & Export
          </h1>
        </div>
        <p className="text-muted-foreground ml-13">
          Generate and download reports across all modules. Select a report type, choose your date
          range and filters, then export as PDF, CSV, or Excel.
        </p>
      </div>

      {/* Report cards grouped by module category */}
      {MODULE_GROUPS.map((group) => {
        const groupReports = REPORT_DEFINITIONS.filter((r) =>
          group.modules.includes(r.module)
        )

        return (
          <div key={group.label} className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-wolf-grey-light dark:border-border pb-2">
              {group.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupReports.map((report) => (
                <Card
                  key={`${report.module}:${report.reportType}`}
                  className="group hover:shadow-md transition-shadow duration-200 dark:hover:border-wolf-grey-dark"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy/10 text-navy dark:bg-navy-light/20 dark:text-white shrink-0">
                        {report.icon}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base font-semibold leading-tight">
                          {report.title}
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm line-clamp-2">
                          {report.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      onClick={() => handleOpenDialog(report)}
                      className="w-full bg-action-green hover:bg-action-green-hover text-white min-h-[48px]"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      {/* Generate Report Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReport?.icon}
              {selectedReport?.title}
            </DialogTitle>
            <DialogDescription>
              Configure date range, format, and filters for your report.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="min-h-[48px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="min-h-[48px]"
                />
              </div>
            </div>

            {/* Format selector */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: 'pdf', label: 'PDF' },
                    { value: 'csv', label: 'CSV' },
                    { value: 'excel', label: 'Excel' },
                  ] as const
                ).map((fmt) => (
                  <button
                    key={fmt.value}
                    type="button"
                    onClick={() => setExportFormat(fmt.value)}
                    className={`
                      flex items-center justify-center min-h-[48px] rounded-md border text-sm font-medium transition-colors
                      ${
                        exportFormat === fmt.value
                          ? 'border-navy bg-navy text-white dark:border-navy-light dark:bg-navy-light'
                          : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                      }
                    `}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Module-specific filter */}
            {selectedReport?.filterKey && (
              <div className="space-y-2">
                <Label htmlFor="filter-select">{selectedReport.filterLabel ?? 'Filter'}</Label>
                {loadingFilters ? (
                  <div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading options...
                  </div>
                ) : (
                  <Select value={filterValue} onValueChange={setFilterValue}>
                    <SelectTrigger id="filter-select" className="min-h-[48px]">
                      <SelectValue
                        placeholder={`All ${selectedReport.filterLabel?.toLowerCase() ?? 'items'}s`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All {selectedReport.filterLabel?.toLowerCase() ?? 'items'}s
                      </SelectItem>
                      {currentFilterItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={generating}
              className="min-h-[48px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
