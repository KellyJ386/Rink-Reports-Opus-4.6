'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateFacilitySettings, updateOperatingHours } from './actions'
import { Building2, Clock, Loader2 } from 'lucide-react'

const TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern (America/New_York)' },
  { value: 'America/Chicago', label: 'Central (America/Chicago)' },
  { value: 'America/Denver', label: 'Mountain (America/Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific (America/Los_Angeles)' },
  { value: 'America/Anchorage', label: 'Alaska (America/Anchorage)' },
  { value: 'America/Phoenix', label: 'Arizona (America/Phoenix)' },
  { value: 'America/Halifax', label: 'Atlantic (America/Halifax)' },
  { value: 'America/Toronto', label: 'Eastern (America/Toronto)' },
  { value: 'America/Vancouver', label: 'Pacific (America/Vancouver)' },
  { value: 'America/Edmonton', label: 'Mountain (America/Edmonton)' },
  { value: 'America/Winnipeg', label: 'Central (America/Winnipeg)' },
]

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

interface OperatingHourRow {
  day_of_week: number
  is_closed: boolean
  open_time: string
  close_time: string
}

export default function FacilitySettingsPage() {
  const supabase = createClient()
  const { profile, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Facility fields
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [timeZone, setTimeZone] = useState('America/New_York')
  const [seasonal, setSeasonal] = useState(false)
  const [openMonths, setOpenMonths] = useState<boolean[]>(new Array(12).fill(true))
  const [sessionDuration, setSessionDuration] = useState(1)

  // Operating hours
  const [operatingHours, setOperatingHours] = useState<OperatingHourRow[]>(
    DAYS_OF_WEEK.map((_, i) => ({
      day_of_week: i,
      is_closed: false,
      open_time: '06:00',
      close_time: '23:00',
    }))
  )

  useEffect(() => {
    if (authLoading || !profile?.facility_id) return

    async function loadData() {
      setLoading(true)
      try {
        // Load facility data
        const { data: facility, error: facError } = await supabase
          .from('facilities')
          .select('*')
          .eq('id', profile!.facility_id!)
          .single()

        if (facError) throw facError

        if (facility) {
          setName(facility.name || '')
          setAddress(facility.address || '')
          setTimeZone(facility.time_zone || 'America/New_York')
          setSeasonal(facility.seasonal_operation ?? false)
          setSessionDuration(facility.session_duration_hours ?? 1)

          if (facility.open_months && Array.isArray(facility.open_months)) {
            const months = new Array(12).fill(false)
            facility.open_months.forEach((m: number) => {
              if (m >= 1 && m <= 12) months[m - 1] = true
            })
            setOpenMonths(months)
          }
        }

        // Load operating hours
        const { data: hours, error: hoursError } = await supabase
          .from('operating_hours')
          .select('*')
          .eq('facility_id', profile!.facility_id!)
          .order('day_of_week', { ascending: true })

        if (hoursError) throw hoursError

        if (hours && hours.length > 0) {
          const mapped = DAYS_OF_WEEK.map((_, i) => {
            const existing = hours.find((h: { day_of_week: number }) => h.day_of_week === i)
            return {
              day_of_week: i,
              is_closed: existing?.is_closed ?? false,
              open_time: existing?.open_time ?? '06:00',
              close_time: existing?.close_time ?? '23:00',
            }
          })
          setOperatingHours(mapped)
        }
      } catch (err) {
        console.error('Error loading facility data:', err)
        toast({
          title: 'Error',
          description: 'Failed to load facility settings.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authLoading, profile?.facility_id]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleMonth(index: number) {
    setOpenMonths((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }

  function updateHour(dayIndex: number, field: keyof OperatingHourRow, value: string | boolean) {
    setOperatingHours((prev) =>
      prev.map((row) =>
        row.day_of_week === dayIndex ? { ...row, [field]: value } : row
      )
    )
  }

  async function handleSave() {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Facility Name is required.',
        variant: 'destructive',
      })
      return
    }

    if (sessionDuration < 1 || sessionDuration > 24) {
      toast({
        title: 'Validation Error',
        description: 'Session Duration must be between 1 and 24 hours.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      // Build open_months array (1-indexed month numbers)
      const openMonthNumbers = openMonths
        .map((checked, i) => (checked ? i + 1 : null))
        .filter((v): v is number => v !== null)

      const facilityResult = await updateFacilitySettings({
        name: name.trim(),
        address: address.trim(),
        time_zone: timeZone,
        seasonal_operation: seasonal,
        open_months: seasonal ? openMonthNumbers : [],
        session_duration_hours: sessionDuration,
      })

      if (!facilityResult.success) {
        toast({
          title: 'Error',
          description: facilityResult.error || 'Failed to save facility settings.',
          variant: 'destructive',
        })
        setSaving(false)
        return
      }

      const hoursResult = await updateOperatingHours(
        operatingHours.map((row) => ({
          day_of_week: row.day_of_week,
          is_closed: row.is_closed,
          open_time: row.is_closed ? null : row.open_time,
          close_time: row.is_closed ? null : row.close_time,
        }))
      )

      if (!hoursResult.success) {
        toast({
          title: 'Error',
          description: hoursResult.error || 'Failed to save operating hours.',
          variant: 'destructive',
        })
        setSaving(false)
        return
      }

      toast({
        title: 'Success',
        description: 'Facility settings saved successfully.',
        variant: 'success',
      })
    } catch (err) {
      console.error('Error saving facility settings:', err)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-wolf-grey" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Facility Settings</h1>
        <p className="text-sm text-wolf-grey-dark dark:text-wolf-grey mt-1">
          Manage your facility&apos;s general information and operating schedule.
        </p>
      </div>

      {/* General Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-navy dark:text-action-green" />
            <CardTitle className="text-lg">General Information</CardTitle>
          </div>
          <CardDescription>Basic details about your facility.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Facility Name */}
          <div className="space-y-2">
            <Label htmlFor="facility-name">
              Facility Name <span className="text-alert-red">*</span>
            </Label>
            <Input
              id="facility-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Northside Ice Arena"
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="facility-address">Address</Label>
            <Textarea
              id="facility-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, city, state/province, postal code"
              rows={3}
            />
          </div>

          {/* Time Zone */}
          <div className="space-y-2">
            <Label htmlFor="facility-timezone">Time Zone</Label>
            <Select value={timeZone} onValueChange={setTimeZone}>
              <SelectTrigger id="facility-timezone">
                <SelectValue placeholder="Select a time zone" />
              </SelectTrigger>
              <SelectContent>
                {TIME_ZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session Duration */}
          <div className="space-y-2">
            <Label htmlFor="session-duration">Session Duration (hours)</Label>
            <Input
              id="session-duration"
              type="number"
              min={1}
              max={24}
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
              className="max-w-[200px]"
            />
          </div>

          <Separator />

          {/* Seasonal Operation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="seasonal-toggle">Seasonal Operation</Label>
                <p className="text-sm text-muted-foreground">
                  Enable if your facility operates only during certain months.
                </p>
              </div>
              <Switch
                id="seasonal-toggle"
                checked={seasonal}
                onCheckedChange={setSeasonal}
              />
            </div>

            {seasonal && (
              <div className="space-y-2">
                <Label>Open Months</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {MONTHS.map((month, index) => (
                    <label
                      key={month}
                      className="flex items-center gap-2 cursor-pointer min-h-[48px]"
                    >
                      <Checkbox
                        checked={openMonths[index]}
                        onCheckedChange={() => toggleMonth(index)}
                      />
                      <span className="text-sm text-foreground">{month}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-navy dark:text-action-green" />
            <CardTitle className="text-lg">Operating Hours</CardTitle>
          </div>
          <CardDescription>Set your facility&apos;s daily operating schedule.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day, index) => {
              const row = operatingHours.find((h) => h.day_of_week === index)!
              return (
                <div
                  key={day}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-3 border-b border-border last:border-b-0"
                >
                  {/* Day label */}
                  <div className="w-full sm:w-28 shrink-0">
                    <span className="text-sm font-medium text-foreground">{day}</span>
                  </div>

                  {/* Closed toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      id={`closed-${index}`}
                      checked={row.is_closed}
                      onCheckedChange={(checked) =>
                        updateHour(index, 'is_closed', checked)
                      }
                    />
                    <Label
                      htmlFor={`closed-${index}`}
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Closed
                    </Label>
                  </div>

                  {/* Time inputs */}
                  <div className="flex items-center gap-2 flex-1">
                    <div className="space-y-1 flex-1">
                      <Label htmlFor={`open-${index}`} className="sr-only">
                        Open time for {day}
                      </Label>
                      <Input
                        id={`open-${index}`}
                        type="time"
                        value={row.open_time}
                        onChange={(e) =>
                          updateHour(index, 'open_time', e.target.value)
                        }
                        disabled={row.is_closed}
                        className="min-h-[48px]"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground px-1">to</span>
                    <div className="space-y-1 flex-1">
                      <Label htmlFor={`close-${index}`} className="sr-only">
                        Close time for {day}
                      </Label>
                      <Input
                        id={`close-${index}`}
                        type="time"
                        value={row.close_time}
                        onChange={(e) =>
                          updateHour(index, 'close_time', e.target.value)
                        }
                        disabled={row.is_closed}
                        className="min-h-[48px]"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pb-8">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px] px-8"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
