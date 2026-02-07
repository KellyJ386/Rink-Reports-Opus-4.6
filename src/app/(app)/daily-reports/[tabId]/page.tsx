'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sunrise, Sunset, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Mock tab name lookup
const TAB_NAMES: Record<string, string> = {
  'front-desk': 'Front Desk',
  'zamboni-log': 'Zamboni Log',
  'skate-rental': 'Skate Rental',
  concessions: 'Concessions',
  janitorial: 'Janitorial',
}

interface ChecklistTypeOption {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  completedCount: number
  totalCount: number
}

const CHECKLIST_TYPES: ChecklistTypeOption[] = [
  {
    id: 'opening',
    label: 'Opening',
    icon: Sunrise,
    description: 'Tasks to complete when opening',
    completedCount: 0,
    totalCount: 0,
  },
  {
    id: 'closing',
    label: 'Closing',
    icon: Sunset,
    description: 'Tasks to complete when closing',
    completedCount: 0,
    totalCount: 0,
  },
  {
    id: 'daily_operations',
    label: 'Daily Operations',
    icon: ClipboardList,
    description: 'Ongoing tasks throughout the day',
    completedCount: 0,
    totalCount: 0,
  },
]

export default function TabDetailPage({
  params,
}: {
  params: Promise<{ tabId: string }>
}) {
  const { tabId } = use(params)
  const tabName = TAB_NAMES[tabId] ?? tabId

  return (
    <div className="p-6 md:p-8">
      {/* Back button + header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/daily-reports">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Daily Reports
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{tabName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a checklist type to view or complete items.
        </p>
      </div>

      {/* Checklist type cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {CHECKLIST_TYPES.map((type) => {
          const Icon = type.icon
          const isAllDone =
            type.totalCount > 0 && type.completedCount === type.totalCount

          return (
            <Link
              key={type.id}
              href={`/daily-reports/${tabId}/${type.id}`}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20',
                  isAllDone && 'border-green-200 bg-green-50/50'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {type.completedCount}/{type.totalCount} complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base">{type.label}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
