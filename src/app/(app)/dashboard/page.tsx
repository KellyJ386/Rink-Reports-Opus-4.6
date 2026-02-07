'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAlertCounts } from '@/lib/hooks/useAlertCounts'
import { MODULE_ICONS, MODULE_ROUTES } from '@/lib/constants/moduleIcons'
import { AlertBadge } from '@/components/shared/AlertBadge'

const MODULE_ORDER = [
  'daily_reports',
  'ice_depth',
  'ice_operations',
  'scheduling',
  'incidents',
  'refrigeration',
  'air_quality',
  'reports',
  'admin',
] as const

const MODULE_NAMES: Record<string, string> = {
  daily_reports: 'Daily Reports',
  ice_depth: 'Ice Depth',
  ice_operations: 'Ice Operations',
  scheduling: 'Scheduling',
  incidents: 'Incidents',
  refrigeration: 'Refrigeration',
  air_quality: 'Air Quality',
  reports: 'Reports',
  admin: 'Admin',
}

interface ModuleSetting {
  module_id: string
  is_enabled: boolean
}

export default function DashboardPage() {
  const { profile, facility, loading: authLoading, isAdmin } = useAuth()
  const { counts, loading: alertsLoading } = useAlertCounts()
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set())
  const [modulesLoading, setModulesLoading] = useState(true)

  useEffect(() => {
    async function fetchModuleSettings() {
      if (!facility?.id) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from('module_settings')
        .select('module_id, is_enabled')
        .eq('facility_id', facility.id)

      if (!error && data) {
        const enabled = new Set(
          (data as ModuleSetting[])
            .filter((m) => m.is_enabled)
            .map((m) => m.module_id)
        )
        setEnabledModules(enabled)
      }

      setModulesLoading(false)
    }

    if (facility?.id) {
      fetchModuleSettings()
    } else if (!authLoading) {
      setModulesLoading(false)
    }
  }, [facility?.id, authLoading])

  const isLoading = authLoading || modulesLoading

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const visibleModules = MODULE_ORDER.filter((moduleId) => {
    if (moduleId === 'admin') return isAdmin
    if (moduleId === 'reports') return true
    return enabledModules.has(moduleId)
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy dark:text-white">
          Welcome back, {profile?.full_name || 'User'}
        </h1>
        {facility && (
          <p className="mt-1 text-wolf-grey-dark dark:text-wolf-grey">
            {facility.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {visibleModules.map((moduleId) => {
          const Icon =
            MODULE_ICONS[moduleId as keyof typeof MODULE_ICONS]
          const route =
            MODULE_ROUTES[moduleId as keyof typeof MODULE_ROUTES]
          const name = MODULE_NAMES[moduleId]
          const alertCount = counts[moduleId] ?? 0

          return (
            <Link key={moduleId} href={route}>
              <div className="relative flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-lg dark:bg-navy">
                {alertCount > 0 && (
                  <div className="absolute right-2 top-2">
                    <AlertBadge count={alertCount} />
                  </div>
                )}
                {Icon && (
                  <Icon className="h-8 w-8 text-navy dark:text-action-green" />
                )}
                <span className="text-center text-sm font-medium text-navy dark:text-white">
                  {name}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-64 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="mt-2 h-5 w-40 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-[120px] animate-pulse flex-col items-center justify-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-navy"
          >
            <div className="h-8 w-8 rounded-full bg-wolf-grey-light dark:bg-navy-light" />
            <div className="h-4 w-20 rounded bg-wolf-grey-light dark:bg-navy-light" />
          </div>
        ))}
      </div>
    </div>
  )
}
