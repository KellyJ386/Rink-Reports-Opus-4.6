'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import {
  Plus,
  Search,
  AlertTriangle,
  FileText,
  Loader2,
  ChevronRight,
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface IncidentReport {
  id: string
  incident_type: 'incident' | 'accident'
  event_time: string
  location_text: string
  description: string
  submitted_by: string
  created_at: string
  incident_locations: { name: string } | null
  profiles: { full_name: string } | null
}

// ============================================
// Component
// ============================================

export default function IncidentsPage() {
  const { profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [reports, setReports] = useState<IncidentReport[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [typeFilter, setTypeFilter] = useState<'all' | 'incident' | 'accident'>(
    'all'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Fetch reports
  useEffect(() => {
    if (authLoading || !profile?.facility_id) return

    async function fetchReports() {
      setLoading(true)
      const { data, error } = await supabase
        .from('incident_reports')
        .select(
          '*, incident_locations(name), profiles!incident_reports_submitted_by_fkey(full_name)'
        )
        .eq('facility_id', profile!.facility_id!)
        .order('event_time', { ascending: false })

      if (error) {
        toast({
          title: 'Failed to load reports',
          description: error.message,
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      setReports((data as unknown as IncidentReport[]) ?? [])
      setLoading(false)
    }

    fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile?.facility_id])

  // Filtered reports
  const filtered = useMemo(() => {
    let result = [...reports]

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.incident_type === typeFilter)
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom)
      result = result.filter((r) => new Date(r.event_time) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter((r) => new Date(r.event_time) <= to)
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.location_text?.toLowerCase().includes(q) ||
          r.incident_locations?.name?.toLowerCase().includes(q) ||
          r.profiles?.full_name?.toLowerCase().includes(q)
      )
    }

    return result
  }, [reports, typeFilter, searchQuery, dateFrom, dateTo])

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-wolf-grey" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            Incident Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} report{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button asChild className="bg-action-green hover:bg-action-green-hover text-white">
          <Link href="/incidents/new">
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type filter */}
            <Select
              value={typeFilter}
              onValueChange={(v) =>
                setTypeFilter(v as 'all' | 'incident' | 'accident')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="incident">Incidents</SelectItem>
                <SelectItem value="accident">Accidents</SelectItem>
              </SelectContent>
            </Select>

            {/* Date from */}
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From date"
              className="text-sm"
            />

            {/* Date to */}
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To date"
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="mb-4 h-12 w-12 text-wolf-grey" />
            <p className="text-lg font-medium text-muted-foreground">
              No reports found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {reports.length === 0
                ? 'Submit your first incident report to get started.'
                : 'Try adjusting your filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((report) => {
            const locationName =
              report.incident_locations?.name || report.location_text || 'Unknown'
            const submittedByName =
              report.profiles?.full_name || 'Unknown'
            const truncatedDesc =
              report.description.length > 100
                ? report.description.slice(0, 100) + '...'
                : report.description

            return (
              <Link key={report.id} href={`/incidents/${report.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        report.incident_type === 'accident'
                          ? 'bg-alert-red/10 text-alert-red'
                          : 'bg-alert-yellow/10 text-alert-yellow'
                      )}
                    >
                      <AlertTriangle className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={cn(
                            report.incident_type === 'accident'
                              ? 'bg-alert-red text-white hover:bg-alert-red/90'
                              : 'bg-alert-yellow text-navy hover:bg-alert-yellow/90'
                          )}
                        >
                          {report.incident_type === 'accident'
                            ? 'Accident'
                            : 'Incident'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(report.event_time), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground">
                        {truncatedDesc}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Location: {locationName}</span>
                        <span>By: {submittedByName}</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
