'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  Sunrise,
  Sunset,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  ArrowLeft,
} from 'lucide-react'

interface ChecklistTypeStats {
  type: string
  label: string
  icon: React.ReactNode
  totalItems: number
  completedItems: number
}

const CHECKLIST_TYPES = [
  { type: 'opening', label: 'Opening', icon: <Sunrise className="h-8 w-8" /> },
  { type: 'closing', label: 'Closing', icon: <Sunset className="h-8 w-8" /> },
  {
    type: 'daily_operations',
    label: 'Daily Operations',
    icon: <ClipboardCheck className="h-8 w-8" />,
  },
] as const

export default function DailyReportTabPage({
  params,
}: {
  params: Promise<{ tabId: string }>
}) {
  const { tabId } = use(params)
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const [tabName, setTabName] = useState<string>('')
  const [typeStats, setTypeStats] = useState<ChecklistTypeStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!profile?.facility_id) return

    const supabase = createClient()
    const today = format(new Date(), 'yyyy-MM-dd')

    // Fetch tab name
    const { data: tab } = await supabase
      .from('daily_report_tabs')
      .select('name')
      .eq('id', tabId)
      .eq('facility_id', profile.facility_id)
      .single()

    if (tab) {
      setTabName(tab.name)
    }

    // Get stats for each checklist type
    const stats: ChecklistTypeStats[] = await Promise.all(
      CHECKLIST_TYPES.map(async ({ type, label, icon }) => {
        // Total active items for this tab + type
        const { data: items } = await supabase
          .from('checklist_items')
          .select('id')
          .eq('tab_id', tabId)
          .eq('checklist_type', type)
          .eq('is_active', true)

        const itemIds = items?.map((i) => i.id) ?? []
        const totalItems = itemIds.length

        let completedItems = 0
        if (itemIds.length > 0) {
          const { count } = await supabase
            .from('checklist_completions')
            .select('id', { count: 'exact', head: true })
            .eq('facility_id', profile.facility_id)
            .eq('completed_date', today)
            .eq('is_completed', true)
            .in('checklist_item_id', itemIds)

          completedItems = count ?? 0
        }

        return {
          type,
          label,
          icon,
          totalItems,
          completedItems,
        }
      })
    )

    setTypeStats(stats)
    setLoading(false)
  }, [tabId, profile?.facility_id])

  useEffect(() => {
    if (!authLoading && profile?.facility_id) {
      fetchData()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading, profile?.facility_id, fetchData])

  if (loading || authLoading) {
    return <TypeSelectorSkeleton />
  }

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 text-wolf-grey-dark hover:text-navy dark:text-wolf-grey dark:hover:text-white"
          onClick={() => router.push('/daily-reports')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Reports
        </Button>
        <h1 className="text-2xl font-bold text-navy dark:text-white">
          {tabName || 'Daily Report'}
        </h1>
        <p className="mt-1 text-sm text-wolf-grey-dark dark:text-wolf-grey">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {typeStats.map((stat) => {
          const allDone = stat.totalItems > 0 && stat.completedItems >= stat.totalItems
          const partial = stat.completedItems > 0 && stat.completedItems < stat.totalItems
          const noneStarted = stat.completedItems === 0

          return (
            <Card
              key={stat.type}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg',
                'dark:bg-navy dark:border-navy-light',
                allDone && 'ring-2 ring-action-green/30'
              )}
              onClick={() => router.push(`/daily-reports/${tabId}/${stat.type}`)}
            >
              <CardContent className="flex min-h-[160px] flex-col items-center justify-center gap-4 p-6">
                <div className="relative">
                  <div
                    className={cn(
                      'text-navy dark:text-action-green',
                      allDone && 'text-action-green'
                    )}
                  >
                    {stat.icon}
                  </div>
                  <div className="absolute -right-1 -top-1">
                    {allDone && (
                      <CheckCircle2 className="h-5 w-5 fill-action-green text-white" />
                    )}
                    {partial && (
                      <Circle className="h-5 w-5 fill-alert-yellow text-alert-yellow" />
                    )}
                    {noneStarted && stat.totalItems > 0 && (
                      <Circle className="h-5 w-5 text-wolf-grey" />
                    )}
                  </div>
                </div>

                <span className="text-center text-base font-semibold text-navy dark:text-white">
                  {stat.label}
                </span>

                <span
                  className={cn(
                    'text-sm font-medium',
                    allDone && 'text-action-green',
                    partial && 'text-alert-yellow',
                    noneStarted && 'text-wolf-grey-dark dark:text-wolf-grey'
                  )}
                >
                  {stat.totalItems > 0
                    ? `${stat.completedItems}/${stat.totalItems} complete`
                    : 'No items'}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function TypeSelectorSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 h-8 w-32 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="h-8 w-48 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="mt-2 h-5 w-56 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-[160px] animate-pulse flex-col items-center justify-center gap-4 rounded-lg border bg-white p-6 shadow-sm dark:border-navy-light dark:bg-navy"
          >
            <div className="h-8 w-8 rounded-full bg-wolf-grey-light dark:bg-navy-light" />
            <div className="h-5 w-28 rounded bg-wolf-grey-light dark:bg-navy-light" />
            <div className="h-4 w-24 rounded bg-wolf-grey-light dark:bg-navy-light" />
          </div>
        ))}
      </div>
    </div>
  )
}
