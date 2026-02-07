'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Loader2,
  FileText,
  Download,
  BarChart3,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { generateComplianceReport } from '../actions'

// ============================================
// Skeleton Component
// ============================================

function PageSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-8 w-56 rounded bg-wolf-grey-light dark:bg-navy-light" />
      <div className="h-48 w-full max-w-lg rounded-lg bg-wolf-grey-light dark:bg-navy-light" />
    </div>
  )
}

// ============================================
// Main Page Component
// ============================================

export default function AirQualityReportsPage() {
  const { loading: authLoading } = useAuth()
  const { toast } = useToast()

  // Default date range: last 30 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return format(d, 'yyyy-MM-dd')
  })
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  const [generating, setGenerating] = useState(false)
  const [reportSummary, setReportSummary] = useState<{
    totalReadings: number
    exceedances: number
  } | null>(null)

  // Generate and download CSV
  const handleGenerate = useCallback(async () => {
    if (!startDate || !endDate) {
      toast({ title: 'Please select a date range', variant: 'destructive' })
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({ title: 'Start date must be before end date', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setReportSummary(null)

    const result = await generateComplianceReport({
      start_date: startDate,
      end_date: endDate,
    })

    if (!result.success) {
      toast({ title: result.error ?? 'Failed to generate report', variant: 'destructive' })
      setGenerating(false)
      return
    }

    // Show summary
    setReportSummary({
      totalReadings: result.totalReadings ?? 0,
      exceedances: result.exceedances ?? 0,
    })

    // If there's CSV data, trigger download
    if (result.csv && result.csv.length > 0) {
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `air-quality-report-${startDate}-to-${endDate}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({ title: 'Report downloaded successfully', variant: 'success' })
    } else {
      toast({
        title: 'No data found',
        description: 'No readings exist for the selected date range.',
        variant: 'default',
      })
    }

    setGenerating(false)
  }, [startDate, endDate, toast])

  if (authLoading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Back Link */}
      <Link
        href="/air-quality"
        className="inline-flex items-center gap-2 text-sm text-wolf-grey-dark hover:text-navy dark:text-wolf-grey dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Air Quality
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Compliance Reports
        </h1>
        <p className="mt-1 text-sm text-wolf-grey-dark dark:text-wolf-grey">
          Generate air quality compliance reports for regulatory requirements
        </p>
      </div>

      {/* Report Generator */}
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg text-navy dark:text-white">
            Generate CSV Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-action-green text-white hover:bg-action-green-hover"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate CSV
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report Summary */}
      {reportSummary && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-lg text-navy dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Report Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Total Readings */}
              <div className="rounded-lg border border-wolf-grey-light bg-wolf-grey-light/20 p-4 dark:border-wolf-grey-dark dark:bg-navy-dark/50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-action-green" />
                  <span className="text-sm font-medium text-wolf-grey-dark dark:text-wolf-grey">
                    Total Readings
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-navy dark:text-white">
                  {reportSummary.totalReadings}
                </p>
              </div>

              {/* Exceedances */}
              <div className="rounded-lg border border-wolf-grey-light bg-wolf-grey-light/20 p-4 dark:border-wolf-grey-dark dark:bg-navy-dark/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${reportSummary.exceedances > 0 ? 'text-alert-red' : 'text-action-green'}`} />
                  <span className="text-sm font-medium text-wolf-grey-dark dark:text-wolf-grey">
                    Exceedances
                  </span>
                </div>
                <p className={`mt-2 text-3xl font-bold ${reportSummary.exceedances > 0 ? 'text-alert-red' : 'text-navy dark:text-white'}`}>
                  {reportSummary.exceedances}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <p className="text-sm text-wolf-grey-dark dark:text-wolf-grey">
              Report covers {startDate} to {endDate}. The CSV file has been downloaded to your device.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
