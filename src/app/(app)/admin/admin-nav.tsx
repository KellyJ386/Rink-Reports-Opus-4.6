'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Building2,
  SquareStack,
  Users,
  Puzzle,
  ClipboardList,
  Wrench,
  Gauge,
  Database,
} from 'lucide-react'

const navItems = [
  { label: 'Facility', href: '/admin/facility', icon: Building2 },
  { label: 'Rinks', href: '/admin/rinks', icon: SquareStack },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Modules', href: '/admin/modules', icon: Puzzle },
  { label: 'Checklists', href: '/admin/checklists', icon: ClipboardList },
  { label: 'Equipment', href: '/admin/equipment', icon: Wrench },
  { label: 'Thresholds', href: '/admin/thresholds', icon: Gauge },
  { label: 'Data Retention', href: '/admin/data-retention', icon: Database },
]

export default function AdminNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/admin/checklists') {
      return pathname.startsWith('/admin/checklists')
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r border-border bg-white dark:bg-navy">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-lg font-bold text-navy dark:text-white">
            Admin Control Center
          </h2>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors touch-target',
                  active
                    ? 'bg-navy/10 text-navy dark:bg-wolf-grey/10 dark:text-action-green'
                    : 'text-wolf-grey-dark hover:bg-muted hover:text-navy dark:text-wolf-grey dark:hover:bg-wolf-grey/10 dark:hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile horizontal tab bar */}
      <div className="lg:hidden border-b border-border bg-white dark:bg-navy">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-base font-bold text-navy dark:text-white">
            Admin Control Center
          </h2>
        </div>
        <nav className="flex overflow-x-auto px-2 pb-2 gap-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-colors touch-target shrink-0',
                  active
                    ? 'bg-navy/10 text-navy dark:bg-wolf-grey/10 dark:text-action-green'
                    : 'text-wolf-grey-dark hover:bg-muted hover:text-navy dark:text-wolf-grey dark:hover:bg-wolf-grey/10 dark:hover:text-white'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
