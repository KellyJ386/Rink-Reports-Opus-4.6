'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { createIncidentReport } from '@/app/(app)/incidents/actions'
import BodyDiagram from '@/components/diagrams/BodyDiagram'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'

// ============================================
// Types
// ============================================

interface IncidentLocation {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

// ============================================
// Component
// ============================================

export default function NewIncidentPage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  // Form state
  const [incidentType, setIncidentType] = useState<'incident' | 'accident'>('incident')
  const [eventTime, setEventTime] = useState(() =>
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  )
  const [locationId, setLocationId] = useState<string>('')
  const [locationText, setLocationText] = useState('')
  const [description, setDescription] = useState('')
  const [injuredPartyName, setInjuredPartyName] = useState('')
  const [injuredPartyType, setInjuredPartyType] = useState<'patron' | 'staff' | ''>('')
  const [bodyRegions, setBodyRegions] = useState<string[]>([])
  const [witnesses, setWitnesses] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Location data
  const [locations, setLocations] = useState<IncidentLocation[]>([])
  const [loadingLocations, setLoadingLocations] = useState(true)

  // Fetch locations
  useEffect(() => {
    if (authLoading || !profile?.facility_id) return

    async function fetchLocations() {
      setLoadingLocations(true)
      const { data } = await supabase
        .from('incident_locations')
        .select('*')
        .eq('facility_id', profile!.facility_id!)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      setLocations((data as IncidentLocation[]) ?? [])
      setLoadingLocations(false)
    }

    fetchLocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile?.facility_id])

  // Body region toggle
  const handleRegionToggle = useCallback((id: string) => {
    setBodyRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }, [])

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      toast({
        title: 'Description required',
        description: 'Please enter a description of the incident.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    const result = await createIncidentReport({
      incident_type: incidentType,
      event_time: new Date(eventTime).toISOString(),
      location_id: locationId && locationId !== 'other' ? locationId : null,
      location_text:
        locationId === 'other'
          ? locationText
          : locations.find((l) => l.id === locationId)?.name ?? '',
      description: description.trim(),
      injured_party_name:
        incidentType === 'accident' ? injuredPartyName.trim() : '',
      injured_party_type:
        incidentType === 'accident' && injuredPartyType
          ? injuredPartyType
          : null,
      body_diagram_regions:
        incidentType === 'accident' ? bodyRegions : [],
      witnesses: witnesses.trim(),
    })

    setSubmitting(false)

    if (result.success) {
      toast({ title: 'Report submitted', variant: 'success' })
      router.push(`/incidents/${result.id}`)
    } else {
      toast({
        title: 'Failed to submit',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  const isAccident = incidentType === 'accident'

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-wolf-grey" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/incidents">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            New Incident Report
          </h1>
          <p className="text-sm text-muted-foreground">
            Record the details of the incident or accident.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Incident Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Type &amp; Timing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="incident-type">Incident Type</Label>
              <Select
                value={incidentType}
                onValueChange={(v) =>
                  setIncidentType(v as 'incident' | 'accident')
                }
              >
                <SelectTrigger id="incident-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {isAccident
                  ? 'Accidents involve personal injury and require additional details.'
                  : 'Incidents are events that did not result in personal injury.'}
              </p>
            </div>

            {/* Date/Time */}
            <div className="space-y-2">
              <Label htmlFor="event-time">Date &amp; Time</Label>
              <Input
                id="event-time"
                type="datetime-local"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              {loadingLocations ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading locations...
                </div>
              ) : (
                <Select
                  value={locationId}
                  onValueChange={setLocationId}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Custom location text when "Other" is selected */}
            {locationId === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="location-text">Specify Location</Label>
                <Input
                  id="location-text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="Describe the location"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-alert-red">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened in detail..."
                rows={5}
                required
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="witnesses">Witnesses</Label>
              <Input
                id="witnesses"
                value={witnesses}
                onChange={(e) => setWitnesses(e.target.value)}
                placeholder="Names of any witnesses"
              />
            </div>
          </CardContent>
        </Card>

        {/* Injured Party - only for accidents */}
        {isAccident && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Injured Party</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="injured-name">Name</Label>
                  <Input
                    id="injured-name"
                    value={injuredPartyName}
                    onChange={(e) => setInjuredPartyName(e.target.value)}
                    placeholder="Name of injured person"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="injured-type">Type</Label>
                  <Select
                    value={injuredPartyType}
                    onValueChange={(v) =>
                      setInjuredPartyType(v as 'patron' | 'staff')
                    }
                  >
                    <SelectTrigger id="injured-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patron">Patron</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Body Diagram */}
              <div className="space-y-2">
                <Label>Injury Location</Label>
                <p className="text-xs text-muted-foreground">
                  Click on body regions to indicate where the injury occurred.
                </p>
                <BodyDiagram
                  selectedRegions={bodyRegions}
                  onRegionToggle={handleRegionToggle}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" asChild>
            <Link href="/incidents">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={submitting || !description.trim()}
            className="bg-action-green hover:bg-action-green-hover text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
