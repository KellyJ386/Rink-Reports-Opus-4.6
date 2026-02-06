import Link from 'next/link'
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
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const sections = [
  {
    title: 'Facility Settings',
    description: 'Configure facility name, address, timezone, and branding.',
    href: '/admin/facility',
    icon: Building2,
  },
  {
    title: 'Rink Configuration',
    description: 'Manage rink sheets, dimensions, and measurement points.',
    href: '/admin/rinks',
    icon: SquareStack,
  },
  {
    title: 'User Management',
    description: 'Invite users, assign roles, and manage access permissions.',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Module Settings',
    description: 'Enable or disable modules and configure module options.',
    href: '/admin/modules',
    icon: Puzzle,
  },
  {
    title: 'Checklist Builder',
    description: 'Create and edit daily report checklists and inspection items.',
    href: '/admin/checklists',
    icon: ClipboardList,
  },
  {
    title: 'Equipment Setup',
    description: 'Register equipment, define reading types, and set schedules.',
    href: '/admin/equipment',
    icon: Wrench,
  },
  {
    title: 'Thresholds',
    description: 'Set acceptable ranges and alert thresholds for readings.',
    href: '/admin/thresholds',
    icon: Gauge,
  },
  {
    title: 'Data Retention',
    description: 'Configure data archival and retention policies.',
    href: '/admin/data-retention',
    icon: Database,
  },
]

export default function AdminPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy dark:text-white">
          Admin Control Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your facility configuration, users, and system settings.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href} className="group">
              <Card className="h-full transition-shadow hover:shadow-md group-hover:border-navy/30 dark:group-hover:border-action-green/30">
                <CardHeader className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 dark:bg-action-green/10">
                    <Icon className="h-5 w-5 text-navy dark:text-action-green" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-navy dark:text-white">
                      {section.title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {section.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
