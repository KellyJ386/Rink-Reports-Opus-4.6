'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ClipboardList,
  Ruler,
  Snowflake,
  Calendar,
  AlertTriangle,
  Thermometer,
  Wind,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toggleModule, updateModuleRoles } from './actions'

type ModuleId =
  | 'daily_reports'
  | 'ice_depth'
  | 'ice_operations'
  | 'scheduling'
  | 'incidents'
  | 'refrigeration'
  | 'air_quality'

type RoleKey = 'facility_admin' | 'manager' | 'supervisor' | 'staff' | 'read_only'

type ModuleSetting = {
  id: string
  module: ModuleId
  is_enabled: boolean
  allowed_roles: string[]
}

const MODULE_CONFIG: Record<
  ModuleId,
  { label: string; icon: LucideIcon; description: string }
> = {
  daily_reports: {
    label: 'Daily Reports',
    icon: ClipboardList,
    description: 'Daily facility checklists and operational reports.',
  },
  ice_depth: {
    label: 'Ice Depth',
    icon: Ruler,
    description: 'Ice thickness measurement and tracking.',
  },
  ice_operations: {
    label: 'Ice Operations',
    icon: Snowflake,
    description: 'Ice makes, blade changes, edging, and circle checks.',
  },
  scheduling: {
    label: 'Scheduling',
    icon: Calendar,
    description: 'Staff scheduling, shift swaps, and availability.',
  },
  incidents: {
    label: 'Incidents',
    icon: AlertTriangle,
    description: 'Incident reporting and injury tracking.',
  },
  refrigeration: {
    label: 'Refrigeration',
    icon: Thermometer,
    description: 'Refrigeration equipment monitoring and logs.',
  },
  air_quality: {
    label: 'Air Quality',
    icon: Wind,
    description: 'Air quality monitoring and compliance reports.',
  },
}

const MODULE_ORDER: ModuleId[] = [
  'daily_reports',
  'ice_depth',
  'ice_operations',
  'scheduling',
  'incidents',
  'refrigeration',
  'air_quality',
]

const ROLES: { key: RoleKey; label: string }[] = [
  { key: 'facility_admin', label: 'Facility Admin' },
  { key: 'manager', label: 'Manager' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'staff', label: 'Staff' },
  { key: 'read_only', label: 'Read Only' },
]

export default function ModuleSettingsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [modules, setModules] = useState<ModuleSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingModules, setTogglingModules] = useState<Set<string>>(new Set())
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set())

  async function fetchModules() {
    setLoading(true)
    const { data, error } = await supabase
      .from('module_settings')
      .select('id, module, is_enabled, allowed_roles')

    if (error) {
      toast({ title: 'Error', description: 'Failed to load module settings.', variant: 'destructive' })
    } else {
      setModules(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchModules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function getModuleSetting(moduleId: ModuleId): ModuleSetting | undefined {
    return modules.find((m) => m.module === moduleId)
  }

  async function handleToggle(moduleId: ModuleId, enabled: boolean) {
    // Optimistic update
    setModules((prev) =>
      prev.map((m) => (m.module === moduleId ? { ...m, is_enabled: enabled } : m))
    )
    setTogglingModules((prev) => new Set(prev).add(moduleId))

    const result = await toggleModule(moduleId, enabled)

    setTogglingModules((prev) => {
      const next = new Set(prev)
      next.delete(moduleId)
      return next
    })

    if (result.success) {
      toast({
        title: enabled ? 'Module Enabled' : 'Module Disabled',
        description: `${MODULE_CONFIG[moduleId].label} has been ${enabled ? 'enabled' : 'disabled'}.`,
        variant: 'success',
      })
    } else {
      // Revert optimistic update
      setModules((prev) =>
        prev.map((m) => (m.module === moduleId ? { ...m, is_enabled: !enabled } : m))
      )
      toast({
        title: 'Error',
        description: typeof result.error === 'string' ? result.error : 'Failed to update module.',
        variant: 'destructive',
      })
    }
  }

  async function handleRoleChange(moduleId: ModuleId, role: RoleKey, checked: boolean) {
    const setting = getModuleSetting(moduleId)
    if (!setting) return

    const currentRoles = setting.allowed_roles || []
    const newRoles = checked
      ? [...currentRoles, role]
      : currentRoles.filter((r) => r !== role)

    if (newRoles.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one role must have access to this module.',
        variant: 'destructive',
      })
      return
    }

    // Optimistic update
    setModules((prev) =>
      prev.map((m) => (m.module === moduleId ? { ...m, allowed_roles: newRoles } : m))
    )
    setUpdatingRoles((prev) => new Set(prev).add(moduleId))

    const result = await updateModuleRoles(moduleId, newRoles)

    setUpdatingRoles((prev) => {
      const next = new Set(prev)
      next.delete(moduleId)
      return next
    })

    if (result.success) {
      toast({
        title: 'Roles Updated',
        description: `Access roles for ${MODULE_CONFIG[moduleId].label} have been updated.`,
        variant: 'success',
      })
    } else {
      // Revert optimistic update
      setModules((prev) =>
        prev.map((m) =>
          m.module === moduleId ? { ...m, allowed_roles: currentRoles } : m
        )
      )
      toast({
        title: 'Error',
        description: typeof result.error === 'string' ? result.error : 'Failed to update roles.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Module Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enable or disable modules and manage role-based access for your facility.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-action-green" />
        </div>
      )}

      {/* Module Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULE_ORDER.map((moduleId) => {
            const config = MODULE_CONFIG[moduleId]
            const setting = getModuleSetting(moduleId)
            const isEnabled = setting?.is_enabled ?? false
            const allowedRoles = setting?.allowed_roles ?? []
            const Icon = config.icon
            const isToggling = togglingModules.has(moduleId)
            const isUpdating = updatingRoles.has(moduleId)

            return (
              <Card
                key={moduleId}
                className={
                  isEnabled
                    ? 'border-action-green/30 dark:border-action-green/20'
                    : 'opacity-75'
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          isEnabled
                            ? 'bg-action-green/10 text-action-green'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{config.label}</CardTitle>
                        <Badge
                          className={
                            isEnabled
                              ? 'bg-action-green/15 text-action-green border-action-green/30 mt-1'
                              : 'bg-wolf-grey/15 text-wolf-grey-dark border-wolf-grey/30 mt-1'
                          }
                        >
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(moduleId, checked)}
                      disabled={isToggling}
                      className="touch-target data-[state=checked]:bg-action-green"
                      aria-label={`Toggle ${config.label}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{config.description}</p>
                </CardHeader>

                {isEnabled && (
                  <>
                    <Separator />
                    <CardContent className="pt-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                        Role Access
                      </p>
                      <div className="space-y-2.5">
                        {ROLES.map(({ key, label }) => {
                          const isChecked = allowedRoles.includes(key)
                          return (
                            <div key={key} className="flex items-center gap-2.5">
                              <Checkbox
                                id={`${moduleId}-${key}`}
                                checked={isChecked}
                                onCheckedChange={(checked) =>
                                  handleRoleChange(moduleId, key, checked === true)
                                }
                                disabled={isUpdating}
                                className="touch-target data-[state=checked]:bg-action-green data-[state=checked]:border-action-green"
                              />
                              <Label
                                htmlFor={`${moduleId}-${key}`}
                                className="text-sm cursor-pointer"
                              >
                                {label}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
