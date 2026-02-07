'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { generateReport } from '@/app/(app)/reports/actions'

interface ExportButtonProps {
  module: string
  reportType: string
  startDate: string
  endDate: string
  filters?: Record<string, string>
}

export function ExportButton({
  module,
  reportType,
  startDate,
  endDate,
  filters,
}: ExportButtonProps) {
  const { toast } = useToast()
  const [exporting, setExporting] = useState(false)
  const [format, setFormat] = useState<'csv' | 'pdf' | 'excel'>('csv')

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({ title: 'Set a date range to export', variant: 'destructive' })
      return
    }

    setExporting(true)
    try {
      const result = await generateReport({
        module,
        reportType,
        startDate,
        endDate,
        format,
        filters: filters ?? {},
      })

      if (!result.success || !result.data) {
        toast({
          title: 'Export Failed',
          description: result.error ?? 'Unknown error',
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
      a.download = result.filename ?? 'export'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({ title: 'Export downloaded', variant: 'success' })
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'pdf' | 'excel')}>
        <SelectTrigger className="w-[100px] h-9 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csv">CSV</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="excel">Excel</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        onClick={handleExport}
        disabled={exporting}
        className="h-9"
      >
        {exporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span className="ml-1.5 hidden sm:inline">Export</span>
      </Button>
    </div>
  )
}
