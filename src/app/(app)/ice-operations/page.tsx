'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Snowflake, Wrench, Ruler, ClipboardCheck } from 'lucide-react'

const tabs = [
  { label: 'Ice Makes', href: '/ice-operations/ice-makes', icon: Snowflake },
  { label: 'Blade Change', href: '/ice-operations/blade-change', icon: Wrench },
  { label: 'Edging', href: '/ice-operations/edging', icon: Ruler },
  { label: 'Circle Check', href: '/ice-operations/circle-check', icon: ClipboardCheck },
]

export default function IceOperationsPage() {
  const pathname = usePathname()
  const router = useRouter()

  // Default redirect to ice-makes
  useEffect(() => {
    if (pathname === '/ice-operations') {
      router.replace('/ice-operations/ice-makes')
    }
  }, [pathname, router])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Ice Operations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log ice makes, blade changes, edging, and machine circle checks.
        </p>
      </div>

      {/* Tab Navigation */}
      <nav className="border-b border-wolf-grey-light dark:border-navy-light">
        <div className="-mb-px flex gap-0 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors min-h-[48px]',
                  isActive
                    ? 'border-action-green text-action-green'
                    : 'border-transparent text-muted-foreground hover:border-wolf-grey hover:text-navy dark:hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Redirect message while loading */}
      {pathname === '/ice-operations' && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Redirecting to Ice Makes...</p>
        </div>
      )}
    </div>
  )
}
