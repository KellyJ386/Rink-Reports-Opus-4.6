'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import {
  getNotificationPreferences,
  updateNotificationPreference,
  type NotificationPreference,
} from './actions'

// Trigger types and their display labels
const TRIGGER_TYPES = [
  {
    id: 'out_of_range_reading',
    label: 'Out of Range Reading',
    description: 'When a sensor reading exceeds configured thresholds',
  },
  {
    id: 'new_incident',
    label: 'New Incident',
    description: 'When a new incident report is filed',
  },
  {
    id: 'shift_reminder',
    label: 'Shift Reminder',
    description: 'Upcoming shift reminders before your scheduled shift',
  },
  {
    id: 'shift_swap',
    label: 'Shift Swap Request',
    description: 'When someone requests or approves a shift swap',
  },
  {
    id: 'open_shift',
    label: 'Open Shift Available',
    description: 'When a new open shift is posted',
  },
  {
    id: 'schedule_change',
    label: 'Schedule Change',
    description: 'When your schedule is modified by a manager',
  },
] as const

const CHANNELS = [
  { id: 'in_app' as const, label: 'In-App', icon: Bell },
  { id: 'email' as const, label: 'Email', icon: Mail },
  { id: 'sms' as const, label: 'SMS', icon: Smartphone },
] as const

type Channel = 'in_app' | 'email' | 'sms'

// Key for the preferences map: `${triggerType}:${channel}`
type PrefKey = string

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<Map<PrefKey, boolean>>(
    new Map()
  )
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<Set<PrefKey>>(new Set())
  const { toast } = useToast()

  const fetchPreferences = useCallback(async () => {
    setLoading(true)
    const result = await getNotificationPreferences()

    if (result.success && result.data) {
      const map = new Map<PrefKey, boolean>()
      for (const pref of result.data) {
        map.set(`${pref.trigger_type}:${pref.channel}`, pref.is_enabled)
      }
      setPreferences(map)
    } else if (!result.success) {
      toast({ title: 'Failed to load preferences', variant: 'destructive' })
    }

    setLoading(false)
  }, [toast])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  /**
   * Get the current enabled state for a trigger+channel combo.
   * Default: in_app=true, email=false, sms=false.
   */
  function isEnabled(triggerType: string, channel: Channel): boolean {
    const key = `${triggerType}:${channel}`
    const explicit = preferences.get(key)
    if (explicit !== undefined) return explicit
    return channel === 'in_app'
  }

  async function handleToggle(
    triggerType: string,
    channel: Channel,
    checked: boolean
  ) {
    const key = `${triggerType}:${channel}`

    // Optimistic update
    setPreferences((prev) => {
      const next = new Map(prev)
      next.set(key, checked)
      return next
    })

    setUpdating((prev) => new Set(prev).add(key))

    const result = await updateNotificationPreference(
      triggerType,
      channel,
      checked
    )

    setUpdating((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })

    if (!result.success) {
      // Revert on failure
      setPreferences((prev) => {
        const next = new Map(prev)
        next.set(key, !checked)
        return next
      })
      toast({
        title: 'Failed to update preference',
        description: result.error || 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">
          Notification Preferences
        </h1>
        <p className="mt-1 text-sm text-wolf-grey-dark dark:text-wolf-grey">
          Choose how you want to be notified for each event type.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy dark:text-white">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Enable or disable notification channels for each trigger type. In-app
            notifications are enabled by default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-wolf-grey border-t-navy dark:border-wolf-grey-dark dark:border-t-white" />
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="min-w-[500px] px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Event Type</TableHead>
                      {CHANNELS.map((channel) => {
                        const Icon = channel.icon
                        return (
                          <TableHead
                            key={channel.id}
                            className="text-center w-[16.66%]"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <Icon className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                {channel.label}
                              </span>
                            </div>
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TRIGGER_TYPES.map((trigger) => (
                      <TableRow key={trigger.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-navy dark:text-white text-sm">
                              {trigger.label}
                            </p>
                            <p className="text-xs text-wolf-grey-dark dark:text-wolf-grey mt-0.5 hidden sm:block">
                              {trigger.description}
                            </p>
                          </div>
                        </TableCell>
                        {CHANNELS.map((channel) => {
                          const key = `${trigger.id}:${channel.id}`
                          const checked = isEnabled(trigger.id, channel.id)
                          const isUpdating = updating.has(key)

                          return (
                            <TableCell key={channel.id} className="text-center">
                              <div className="flex items-center justify-center">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) =>
                                    handleToggle(
                                      trigger.id,
                                      channel.id,
                                      value === true
                                    )
                                  }
                                  disabled={isUpdating}
                                  aria-label={`${trigger.label} via ${channel.label}`}
                                  className="h-5 w-5 min-h-[48px] min-w-[48px] flex items-center justify-center data-[state=checked]:bg-action-green data-[state=checked]:border-action-green"
                                />
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SMS info card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wolf-grey-light/50 dark:bg-white/5">
              <MessageSquare className="h-5 w-5 text-wolf-grey-dark dark:text-wolf-grey" />
            </div>
            <div>
              <p className="text-sm font-medium text-navy dark:text-white">
                SMS Notifications
              </p>
              <p className="mt-0.5 text-xs text-wolf-grey-dark dark:text-wolf-grey">
                SMS notifications require a phone number on your profile. SMS
                delivery will be available in a future update. Enabling SMS
                preferences now will activate them automatically when the service
                is ready.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
