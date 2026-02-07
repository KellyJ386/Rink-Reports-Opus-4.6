'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  'daily-reports': 'Daily Reports',
  'ice-depth': 'Ice Depth',
  'ice-operations': 'Ice Operations',
  scheduling: 'Scheduling',
  incidents: 'Incidents',
  refrigeration: 'Refrigeration',
  'air-quality': 'Air Quality',
  admin: 'Admin',
  reports: 'Reports',
  // Sub-pages
  history: 'History',
  new: 'New',
  'ice-makes': 'Ice Makes',
  'blade-change': 'Blade Change',
  edging: 'Edging',
  'circle-check': 'Circle Check',
  availability: 'Availability',
  swaps: 'Swaps',
  'open-shifts': 'Open Shifts',
  facility: 'Facility',
  rinks: 'Rinks',
  users: 'Users',
  modules: 'Modules',
  checklists: 'Checklists',
  equipment: 'Equipment',
  thresholds: 'Thresholds',
  'data-retention': 'Data Retention',
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function Breadcrumbs() {
  const pathname = usePathname()

  // Split the pathname and filter out empty strings and route groups like (app)
  const segments = pathname
    .split('/')
    .filter((s) => s && !s.startsWith('('))

  // Don't render breadcrumbs on dashboard (root level)
  if (segments.length <= 1 && segments[0] === 'dashboard') {
    return null
  }

  // Build breadcrumb items with paths
  const breadcrumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/')
    const label = ROUTE_LABELS[segment] || capitalize(segment.replace(/-/g, ' '))
    const isLast = index === segments.length - 1

    return { path, label, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 shrink-0 text-wolf-grey" />
          )}
          {crumb.isLast ? (
            <span className="font-medium text-navy dark:text-white">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.path}
              className={cn(
                'text-wolf-grey-dark transition-colors hover:text-navy',
                'dark:text-wolf-grey dark:hover:text-white'
              )}
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
