'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { Clock, Mail, Save } from 'lucide-react'
import {
  getScheduledReportSettings,
  upsertScheduledReportSetting,
  toggleScheduledReport,
  getFacilityProfiles
} from './actions'

// Report type definitions
const REPORT_TYPES = [
  { value: 'checklist_summary', label: 'Daily Reports - Checklist Summary' },
  { value: 'measurement_history', label: 'Ice Depth - Measurement History' },
  { value: 'ice_makes_log', label: 'Ice Operations - Ice Makes Log' },
  { value: 'hours_by_employee', label: 'Scheduling - Hours by Employee' },
  { value: 'incident_log', label: 'Incidents - Incident Log' },
  { value: 'reading_history', label: 'Refrigeration - Reading History' },
  { value: 'compliance_report', label: 'Air Quality - Compliance Report' },
] as const

type ReportType = typeof REPORT_TYPES[number]['value']

interface ScheduledReportSetting {
  id: string
  facility_id: string
  report_type: ReportType
  is_enabled: boolean
  recipients: string[]
  delivery_hour: number
  created_at: string
  updated_at: string
}

interface FacilityProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  is_active: boolean
}

interface ReportFormState {
  id?: string
  is_enabled: boolean
  recipients: string[]
  delivery_hour: number
}

export default function ScheduledReportsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<Record<ReportType, ReportFormState>>({} as any)
  const [profiles, setProfiles] = useState<FacilityProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<ReportType, boolean>>({} as any)

  // Load settings and profiles
  useEffect(() => {
    async function loadData() {
      setLoading(true)

      // Load settings
      const settingsResult = await getScheduledReportSettings()
      if (settingsResult.success && settingsResult.data) {
        const settingsMap: Record<ReportType, ReportFormState> = {} as any

        // Initialize all report types with defaults
        REPORT_TYPES.forEach(({ value }) => {
          settingsMap[value] = {
            is_enabled: false,
            recipients: [],
            delivery_hour: 7
          }
        })

        // Override with existing settings
        settingsResult.data.forEach((setting: ScheduledReportSetting) => {
          settingsMap[setting.report_type] = {
            id: setting.id,
            is_enabled: setting.is_enabled,
            recipients: setting.recipients,
            delivery_hour: setting.delivery_hour
          }
        })

        setSettings(settingsMap)
      }

      // Load profiles
      const profilesResult = await getFacilityProfiles()
      if (profilesResult.success && profilesResult.data) {
        setProfiles(profilesResult.data)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // Format hour as 12-hour time
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12:00 AM'
    if (hour < 12) return `${hour}:00 AM`
    if (hour === 12) return '12:00 PM'
    return `${hour - 12}:00 PM`
  }

  // Handle toggle
  const handleToggle = async (reportType: ReportType, enabled: boolean) => {
    const setting = settings[reportType]

    // Update local state optimistically
    setSettings(prev => ({
      ...prev,
      [reportType]: { ...prev[reportType], is_enabled: enabled }
    }))

    // If we have an ID, use the toggle action
    if (setting.id) {
      const result = await toggleScheduledReport(setting.id, enabled)
      if (!result.success) {
        // Revert on error
        setSettings(prev => ({
          ...prev,
          [reportType]: { ...prev[reportType], is_enabled: !enabled }
        }))
        toast({
          title: 'Error',
          description: result.error || 'Failed to update report',
          variant: 'destructive'
        })
      }
    } else {
      // If no ID yet, just update local state - will be saved on first save
      toast({
        title: 'Remember to save',
        description: 'Click Save to apply changes',
        variant: 'default'
      })
    }
  }

  // Handle save
  const handleSave = async (reportType: ReportType) => {
    const setting = settings[reportType]

    // Validate
    if (setting.is_enabled && setting.recipients.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one recipient',
        variant: 'destructive'
      })
      return
    }

    setSaving(prev => ({ ...prev, [reportType]: true }))

    const result = await upsertScheduledReportSetting({
      id: setting.id,
      report_type: reportType,
      is_enabled: setting.is_enabled,
      recipients: setting.recipients,
      delivery_hour: setting.delivery_hour
    })

    setSaving(prev => ({ ...prev, [reportType]: false }))

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Report settings saved',
        variant: 'default'
      })

      // Refresh data to get the ID if it was just created
      const settingsResult = await getScheduledReportSettings()
      if (settingsResult.success && settingsResult.data) {
        const updatedSetting = settingsResult.data.find(
          (s: ScheduledReportSetting) => s.report_type === reportType
        )
        if (updatedSetting) {
          setSettings(prev => ({
            ...prev,
            [reportType]: {
              ...prev[reportType],
              id: updatedSetting.id
            }
          }))
        }
      }
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to save settings',
        variant: 'destructive'
      })
    }
  }

  // Update local state
  const updateSetting = (reportType: ReportType, updates: Partial<ReportFormState>) => {
    setSettings(prev => ({
      ...prev,
      [reportType]: { ...prev[reportType], ...updates }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-action-green" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy dark:text-white">Scheduled Reports</h1>
        <p className="text-wolf-grey-dark dark:text-wolf-grey mt-2">
          Configure automated report delivery via email. Reports are sent daily at the specified time in your facility's timezone.
        </p>
      </div>

      <div className="space-y-4">
        {REPORT_TYPES.map(({ value, label }) => {
          const setting = settings[value]
          if (!setting) return null

          return (
            <Card key={value} className="border-wolf-grey-light dark:border-wolf-grey-dark">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-navy dark:text-white">
                      {label}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {setting.is_enabled ? (
                        <Badge className="bg-action-green text-white">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-wolf-grey-dark">
                          Inactive
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`toggle-${value}`} className="text-sm text-wolf-grey-dark dark:text-wolf-grey">
                      {setting.is_enabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id={`toggle-${value}`}
                      checked={setting.is_enabled}
                      onCheckedChange={(checked) => handleToggle(value, checked)}
                      className="data-[state=checked]:bg-action-green"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Delivery Hour */}
                  <div className="space-y-2">
                    <Label htmlFor={`hour-${value}`} className="flex items-center gap-2 text-navy dark:text-white">
                      <Clock className="w-4 h-4" />
                      Delivery Time
                    </Label>
                    <Select
                      value={setting.delivery_hour.toString()}
                      onValueChange={(val) => updateSetting(value, { delivery_hour: parseInt(val) })}
                      disabled={!setting.is_enabled}
                    >
                      <SelectTrigger
                        id={`hour-${value}`}
                        className="min-h-[48px] border-wolf-grey-light dark:border-wolf-grey-dark"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {formatHour(i)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recipients */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-navy dark:text-white">
                      <Mail className="w-4 h-4" />
                      Recipients ({setting.recipients.length})
                    </Label>
                    <Select
                      value=""
                      onValueChange={(profileId) => {
                        if (!setting.recipients.includes(profileId)) {
                          updateSetting(value, {
                            recipients: [...setting.recipients, profileId]
                          })
                        }
                      }}
                      disabled={!setting.is_enabled}
                    >
                      <SelectTrigger className="min-h-[48px] border-wolf-grey-light dark:border-wolf-grey-dark">
                        <SelectValue placeholder="Add recipient..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.first_name} {profile.last_name} ({profile.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Selected Recipients */}
                {setting.recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {setting.recipients.map((recipientId) => {
                      const profile = profiles.find((p) => p.id === recipientId)
                      if (!profile) return null
                      return (
                        <Badge
                          key={recipientId}
                          variant="secondary"
                          className="flex items-center gap-1 px-3 py-1.5 text-sm"
                        >
                          {profile.first_name} {profile.last_name}
                          <button
                            type="button"
                            onClick={() => {
                              updateSetting(value, {
                                recipients: setting.recipients.filter((id) => id !== recipientId)
                              })
                            }}
                            className="ml-1 hover:text-alert-red focus:outline-none"
                            disabled={!setting.is_enabled}
                          >
                            ×
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => handleSave(value)}
                    disabled={saving[value] || !setting.is_enabled}
                    className="min-h-[48px] min-w-[120px] bg-action-green hover:bg-action-green-hover text-white disabled:opacity-50"
                  >
                    {saving[value] ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
