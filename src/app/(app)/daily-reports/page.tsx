'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, CircleDot } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type CompletionStatus = 'complete' | 'partial' | 'none'

interface MockTab {
  id: string
  name: string
  status: CompletionStatus
}

const MOCK_TABS: MockTab[] = [
  { id: 'front-desk', name: 'Front Desk', status: 'complete' },
  { id: 'zamboni-log', name: 'Zamboni Log', status: 'partial' },
  { id: 'skate-rental', name: 'Skate Rental', status: 'none' },
  { id: 'concessions', name: 'Concessions', status: 'partial' },
  { id: 'janitorial', name: 'Janitorial', status: 'none' },
]

function StatusIcon({ status }: { status: CompletionStatus }) {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'partial':
      return <CircleDot className="h-5 w-5 text-yellow-500" />
    case 'none':
      return <Circle className="h-5 w-5 text-slate-300" />
  }
}

function statusLabel(status: CompletionStatus): string {
  switch (status) {
    case 'complete':
      return 'All done'
    case 'partial':
      return 'In progress'
    case 'none':
      return 'Not started'
  }
}

function statusBadgeVariant(status: CompletionStatus) {
  switch (status) {
    case 'complete':
      return 'default' as const
    case 'partial':
      return 'secondary' as const
    case 'none':
      return 'outline' as const
  }
}

export default function DailyReportsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Daily Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a tab to view and complete checklists for today.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {MOCK_TABS.map((tab) => (
          <Link key={tab.id} href={`/daily-reports/${tab.id}`}>
            <Card
              className={cn(
                'cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20',
                tab.status === 'complete' && 'border-green-200 bg-green-50/50'
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <StatusIcon status={tab.status} />
                  <Badge
                    variant={statusBadgeVariant(tab.status)}
                    className={cn(
                      'text-xs',
                      tab.status === 'complete' &&
                        'border-green-200 bg-green-100 text-green-700 hover:bg-green-100',
                      tab.status === 'partial' &&
                        'border-yellow-200 bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                    )}
                  >
                    {statusLabel(tab.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base">{tab.name}</CardTitle>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
