'use client'

import React, { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Bell, Lock, Save } from 'lucide-react'
import { saveNotificationPreferences } from './actions'

// ---------------------------------------------------------------------------
// Trigger type definitions
// ---------------------------------------------------------------------------

interface TriggerType {
  key: string
  label: string
  /** When true the in_app / email channels are forced on and cannot be toggled */
  mandatory: boolean
}

const TRIGGER_TYPES: TriggerType[] = [
  {
    key: 'refrigeration_out_of_range',
    label: 'Out-of-Range Refrigeration Reading',
    mandatory: true,
  },
  {
    key: 'air_quality_out_of_range',
    label: 'Out-of-Range Air Quality Reading',
    mandatory: true,
  },
  {
    key: 'incident_created',
    label: 'New Incident/Accident Report',
    mandatory: true,
  },
  {
    key: 'shift_reminder',
    label: 'Upcoming Shift Reminder',
    mandatory: false,
  },
  {
    key: 'shift_swap_requested',
    label: 'Shift Swap Request',
    mandatory: false,
  },
  {
    key: 'shift_swap_reviewed',
    label: 'Swap Approved/Denied',
    mandatory: false,
  },
  {
    key: 'schedule_published',
    label: 'Schedule Published',
    mandatory: false,
  },
]

const CHANNELS = [
  { key: 'in_app', label: 'In-App' },
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
] as const

type ChannelKey = (typeof CHANNELS)[number]['key']

// ---------------------------------------------------------------------------
// Build the default preferences map.
// Mandatory triggers start with in_app and email enabled.
// ---------------------------------------------------------------------------

function buildDefaultPreferences(): Record<string, Record<ChannelKey, boolean>> {
  const prefs: Record<string, Record<ChannelKey, boolean>> = {}
  for (const trigger of TRIGGER_TYPES) {
    prefs[trigger.key] = {
      in_app: trigger.mandatory,
      email: trigger.mandatory,
      sms: false,
    }
  }
  return prefs
}

// ---------------------------------------------------------------------------
// Which (trigger, channel) pairs are mandatory?
// Mandatory triggers lock in_app and email but not sms.
// ---------------------------------------------------------------------------

function isMandatory(triggerKey: string, channelKey: ChannelKey): boolean {
  const trigger = TRIGGER_TYPES.find((t) => t.key === triggerKey)
  if (!trigger || !trigger.mandatory) return false
  return channelKey === 'in_app' || channelKey === 'email'
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<
    Record<string, Record<ChannelKey, boolean>>
  >(buildDefaultPreferences)

  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // Toggle a single preference
  const toggle = (triggerKey: string, channelKey: ChannelKey) => {
    setPreferences((prev) => ({
      ...prev,
      [triggerKey]: {
        ...prev[triggerKey],
        [channelKey]: !prev[triggerKey][channelKey],
      },
    }))
  }

  // Persist preferences via server action
  const handleSave = () => {
    startTransition(async () => {
      const result = await saveNotificationPreferences(preferences)
      if (result.success) {
        toast({
          title: 'Preferences saved',
          description: 'Your notification preferences have been updated.',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save notification preferences. Please try again.',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <TooltipProvider>
      <div className="p-6 lg:p-8 max-w-4xl space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-slate-600" />
            Notification Preferences
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose how you want to be notified for each event type. Some
            notifications are mandatory for managers and cannot be disabled.
          </p>
        </div>

        {/* Preferences card */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription>
              Toggle the channels for each notification trigger. Items marked
              with a lock icon are required by your facility administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ---- Responsive table ---- */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4 font-medium text-slate-700">
                      Trigger
                    </th>
                    {CHANNELS.map((ch) => (
                      <th
                        key={ch.key}
                        className="text-center py-3 px-4 font-medium text-slate-700 whitespace-nowrap"
                      >
                        {ch.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRIGGER_TYPES.map((trigger) => (
                    <tr
                      key={trigger.key}
                      className="border-b last:border-b-0 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-4 pr-4 text-slate-800 font-medium">
                        <div className="flex items-center gap-2">
                          {trigger.label}
                          {trigger.mandatory && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              Required
                            </span>
                          )}
                        </div>
                      </td>
                      {CHANNELS.map((ch) => {
                        const locked = isMandatory(trigger.key, ch.key)
                        const checked = preferences[trigger.key]?.[ch.key] ?? false

                        return (
                          <td key={ch.key} className="py-4 px-4 text-center">
                            {locked ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1.5">
                                    <Switch
                                      checked={true}
                                      disabled
                                      aria-label={`${trigger.label} ${ch.label} (mandatory)`}
                                    />
                                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Required by facility admin
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Switch
                                checked={checked}
                                onCheckedChange={() =>
                                  toggle(trigger.key, ch.key)
                                }
                                aria-label={`${trigger.label} ${ch.label}`}
                              />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Save button */}
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isPending ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
