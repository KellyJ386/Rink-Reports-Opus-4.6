'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import BodyDiagram from '@/components/diagrams/BodyDiagram'
import { BODY_REGIONS } from '@/lib/constants/bodyRegions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  User,
  Users,
  AlertTriangle,
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface IncidentReportDetail {
  id: string
  facility_id: string
  incident_type: 'incident' | 'accident'
  event_time: string
  location_id: string | null
  location_text: string
  description: string
  injured_party_name: string
  injured_party_type: 'patron' | 'staff' | null
  body_diagram_regions: string[]
  witnesses: string
  submitted_by: string
  created_at: string
  incident_locations: { name: string } | null
  profiles: { full_name: string } | null
}

// ============================================
// Component
// ============================================

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [report, setReport] = useState<IncidentReportDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch report
  useEffect(() => {
    if (authLoading || !profile?.facility_id) return

    async function fetchReport() {
      setLoading(true)
      const { data, error } = await supabase
        .from('incident_reports')
        .select(
          '*, incident_locations(name), profiles!incident_reports_submitted_by_fkey(full_name)'
        )
        .eq('id', id)
        .eq('facility_id', profile!.facility_id!)
        .single()

      if (error) {
        toast({
          title: 'Failed to load report',
          description: error.message,
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      setReport(data as unknown as IncidentReportDetail)
      setLoading(false)
    }

    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile?.facility_id, id])

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-wolf-grey" />
      </div>
    )
  }

  // Not found
  if (!report) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-wolf-grey" />
        <p className="text-lg font-medium text-muted-foreground">
          Report not found
        </p>
        <Button variant="outline" asChild>
          <Link href="/incidents">Back to Reports</Link>
        </Button>
      </div>
    )
  }

  const isAccident = report.incident_type === 'accident'
  const locationName =
    report.incident_locations?.name || report.location_text || 'Not specified'
  const submittedByName = report.profiles?.full_name || 'Unknown'
  const bodyRegions = report.body_diagram_regions ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/incidents">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-navy dark:text-white">
              {isAccident ? 'Accident' : 'Incident'} Report
            </h1>
            <Badge
              className={cn(
                isAccident
                  ? 'bg-alert-red text-white hover:bg-alert-red/90'
                  : 'bg-alert-yellow text-navy hover:bg-alert-yellow/90'
              )}
            >
              {isAccident ? 'Accident' : 'Incident'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Report ID: {report.id.slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* Date, Time, Location */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Date
                </p>
                <p className="text-sm font-medium text-foreground">
                  {format(parseISO(report.event_time), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Time
                </p>
                <p className="text-sm font-medium text-foreground">
                  {format(parseISO(report.event_time), 'h:mm a')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Location
                </p>
                <p className="text-sm font-medium text-foreground">
                  {locationName}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {report.description}
          </p>
        </CardContent>
      </Card>

      {/* Witnesses */}
      {report.witnesses && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Witnesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{report.witnesses}</p>
          </CardContent>
        </Card>
      )}

      {/* Injured Party - only for accidents */}
      {isAccident && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Injured Party
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Name
                </p>
                <p className="text-sm font-medium text-foreground">
                  {report.injured_party_name || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Type
                </p>
                <p className="text-sm font-medium text-foreground">
                  {report.injured_party_type
                    ? report.injured_party_type.charAt(0).toUpperCase() +
                      report.injured_party_type.slice(1)
                    : 'Not specified'}
                </p>
              </div>
            </div>

            {/* Body diagram */}
            {bodyRegions.length > 0 && (
              <>
                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Injury Locations
                  </p>

                  {/* Region text badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {bodyRegions.map((regionId) => {
                      const region = BODY_REGIONS.find(
                        (r) => r.id === regionId
                      )
                      return (
                        <Badge
                          key={regionId}
                          variant="outline"
                          className="border-alert-red/30 bg-alert-red/10 text-alert-red dark:bg-alert-red/20"
                        >
                          {region?.label ?? regionId}
                        </Badge>
                      )
                    })}
                  </div>

                  {/* Body diagram (read-only) */}
                  <BodyDiagram
                    selectedRegions={bodyRegions}
                    onRegionToggle={() => {}}
                    readOnly
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submitted by */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                Submitted by{' '}
                <span className="font-medium text-foreground">
                  {submittedByName}
                </span>
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(parseISO(report.created_at), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Back link */}
      <div className="pb-8">
        <Button variant="outline" asChild>
          <Link href="/incidents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Link>
        </Button>
      </div>
    </div>
  )
}
