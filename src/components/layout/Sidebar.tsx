'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { MODULE_ICONS, MODULE_ROUTES } from '@/lib/constants/moduleIcons'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAlertCounts } from '@/lib/hooks/useAlertCounts'
import { AlertBadge } from '@/components/shared/AlertBadge'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface ModuleSetting {
  module_id: string
  is_enabled: boolean
}

const MODULE_LABELS: Record<string, string> = {
  daily_reports: 'Daily Reports',
  ice_depth: 'Ice Depth',
  ice_operations: 'Ice Operations',
  scheduling: 'Scheduling',
  incidents: 'Incidents',
  refrigeration: 'Refrigeration',
  air_quality: 'Air Quality',
  admin: 'Admin',
  reports: 'Reports',
}

// Modules that appear in the sidebar navigation (excluding admin/reports which are handled separately)
const NAV_MODULES = [
  'daily_reports',
  'ice_depth',
  'ice_operations',
  'scheduling',
  'incidents',
  'refrigeration',
  'air_quality',
] as const

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { facility, isAdmin } = useAuth()
  const { counts } = useAlertCounts()
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchModuleSettings() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('facility_id')
        .eq('id', user.id)
        .single()

      if (!profile?.facility_id) {
        setLoading(false)
        return
      }

      const { data: settings } = await supabase
        .from('module_settings')
        .select('module_id, is_enabled')
        .eq('facility_id', profile.facility_id)

      if (settings) {
        const enabled = new Set(
          (settings as ModuleSetting[])
            .filter((s) => s.is_enabled)
            .map((s) => s.module_id)
        )
        setEnabledModules(enabled)
      }

      setLoading(false)
    }

    fetchModuleSettings()
  }, [])

  const isActive = (route: string) => {
    if (route === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(route)
  }

  return (
    <nav className="flex h-full flex-col">
      {/* Dashboard link (always shown) */}
      <div className="flex-1 space-y-1 p-3">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn(
            'flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive('/dashboard')
              ? 'bg-navy/10 text-navy dark:bg-white/10 dark:text-action-green'
              : 'text-wolf-grey-dark hover:bg-navy/5 dark:text-wolf-grey dark:hover:bg-white/5'
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
          Dashboard
        </Link>

        <Separator className="my-2" />

        {/* Module links */}
        {!loading &&
          NAV_MODULES.map((moduleId) => {
            if (!enabledModules.has(moduleId)) return null

            const Icon = MODULE_ICONS[moduleId]
            const route = MODULE_ROUTES[moduleId]
            const label = MODULE_LABELS[moduleId]
            const alertCount = counts[moduleId] || 0

            return (
              <Link
                key={moduleId}
                href={route}
                onClick={onNavigate}
                className={cn(
                  'relative flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(route)
                    ? 'bg-navy/10 text-navy dark:bg-white/10 dark:text-action-green'
                    : 'text-wolf-grey-dark hover:bg-navy/5 dark:text-wolf-grey dark:hover:bg-white/5'
                )}
              >
                <span className="relative shrink-0">
                  <Icon className="h-5 w-5" />
                  <AlertBadge count={alertCount} />
                </span>
                {label}
              </Link>
            )
          })}

        <Separator className="my-2" />

        {/* Reports (always shown) */}
        {(() => {
          const ReportsIcon = MODULE_ICONS.reports
          const reportsRoute = MODULE_ROUTES.reports
          return (
            <Link
              href={reportsRoute}
              onClick={onNavigate}
              className={cn(
                'flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(reportsRoute)
                  ? 'bg-navy/10 text-navy dark:bg-white/10 dark:text-action-green'
                  : 'text-wolf-grey-dark hover:bg-navy/5 dark:text-wolf-grey dark:hover:bg-white/5'
              )}
            >
              <ReportsIcon className="h-5 w-5 shrink-0" />
              Reports
            </Link>
          )
        })()}

        {/* Admin (only for admins) */}
        {isAdmin &&
          (() => {
            const AdminIcon = MODULE_ICONS.admin
            const adminRoute = MODULE_ROUTES.admin
            return (
              <Link
                href={adminRoute}
                onClick={onNavigate}
                className={cn(
                  'flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(adminRoute)
                    ? 'bg-navy/10 text-navy dark:bg-white/10 dark:text-action-green'
                    : 'text-wolf-grey-dark hover:bg-navy/5 dark:text-wolf-grey dark:hover:bg-white/5'
                )}
              >
                <AdminIcon className="h-5 w-5 shrink-0" />
                Admin
              </Link>
            )
          })()}
      </div>

      {/* Bottom: Facility name */}
      {facility && (
        <div className="border-t border-border p-4">
          <p className="truncate text-xs font-medium text-wolf-grey-dark dark:text-wolf-grey">
            {facility.name}
          </p>
        </div>
      )}
    </nav>
  )
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col border-r border-border bg-white dark:bg-navy">
        <div className="mt-16 flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
      </aside>

      {/* Mobile sidebar (Sheet overlay) */}
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent side="left" className="w-64 p-0 bg-white dark:bg-navy">
          <SheetTitle className="px-4 pt-4 text-lg font-bold text-navy dark:text-white">
            Max Facility
          </SheetTitle>
          <div className="flex-1 overflow-y-auto">
            <SidebarNav onNavigate={onClose} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
