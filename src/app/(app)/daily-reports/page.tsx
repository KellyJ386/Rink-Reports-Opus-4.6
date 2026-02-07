'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface TabWithStats {
  id: string
  name: string
  sort_order: number
  totalItems: number
  completedItems: number
}

export default function DailyReportsPage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const [tabs, setTabs] = useState<TabWithStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTabs = useCallback(async () => {
    if (!profile?.facility_id) return

    const supabase = createClient()
    const today = format(new Date(), 'yyyy-MM-dd')

    // Fetch active tabs for this facility
    const { data: tabData, error: tabError } = await supabase
      .from('daily_report_tabs')
      .select('id, name, sort_order')
      .eq('facility_id', profile.facility_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (tabError || !tabData) {
      setLoading(false)
      return
    }

    // For each tab, get total active checklist items and completions for today
    const tabsWithStats: TabWithStats[] = await Promise.all(
      tabData.map(async (tab) => {
        // Total active checklist items for this tab
        const { count: totalItems } = await supabase
          .from('checklist_items')
          .select('id', { count: 'exact', head: true })
          .eq('tab_id', tab.id)
          .eq('is_active', true)

        // Completed items for today
        const { count: completedItems } = await supabase
          .from('checklist_completions')
          .select('id', { count: 'exact', head: true })
          .eq('facility_id', profile.facility_id)
          .eq('completed_date', today)
          .eq('is_completed', true)
          .in(
            'checklist_item_id',
            // Sub-select: get checklist_item_ids that belong to this tab
            (
              await supabase
                .from('checklist_items')
                .select('id')
                .eq('tab_id', tab.id)
                .eq('is_active', true)
            ).data?.map((i) => i.id) ?? []
          )

        return {
          id: tab.id,
          name: tab.name,
          sort_order: tab.sort_order,
          totalItems: totalItems ?? 0,
          completedItems: completedItems ?? 0,
        }
      })
    )

    setTabs(tabsWithStats)
    setLoading(false)
  }, [profile?.facility_id])

  useEffect(() => {
    if (!authLoading && profile?.facility_id) {
      fetchTabs()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading, profile?.facility_id, fetchTabs])

  if (loading || authLoading) {
    return <DailyReportsSkeleton />
  }

  if (tabs.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Daily Reports</h1>
        <p className="mt-2 text-wolf-grey-dark dark:text-wolf-grey">
          No report tabs have been configured yet. Ask your facility admin to set up
          daily report tabs in the Admin Control Center.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy dark:text-white">Daily Reports</h1>
        <p className="mt-1 text-sm text-wolf-grey-dark dark:text-wolf-grey">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {tabs.map((tab) => {
          const allDone = tab.totalItems > 0 && tab.completedItems >= tab.totalItems
          const partial = tab.completedItems > 0 && tab.completedItems < tab.totalItems
          const noneStarted = tab.completedItems === 0

          return (
            <Card
              key={tab.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg',
                'dark:bg-navy dark:border-navy-light',
                allDone && 'ring-2 ring-action-green/30'
              )}
              onClick={() => router.push(`/daily-reports/${tab.id}`)}
            >
              <CardContent className="flex min-h-[140px] flex-col items-center justify-center gap-3 p-6">
                <div className="relative">
                  <ClipboardList className="h-8 w-8 text-navy dark:text-action-green" />
                  <div className="absolute -right-1 -top-1">
                    {allDone && (
                      <CheckCircle2 className="h-4 w-4 fill-action-green text-white" />
                    )}
                    {partial && (
                      <Circle className="h-4 w-4 fill-alert-yellow text-alert-yellow" />
                    )}
                    {noneStarted && tab.totalItems > 0 && (
                      <Circle className="h-4 w-4 text-wolf-grey" />
                    )}
                  </div>
                </div>

                <span className="text-center text-sm font-medium text-navy dark:text-white">
                  {tab.name}
                </span>

                <span
                  className={cn(
                    'text-xs font-medium',
                    allDone && 'text-action-green',
                    partial && 'text-alert-yellow',
                    noneStarted && 'text-wolf-grey-dark dark:text-wolf-grey'
                  )}
                >
                  {tab.totalItems > 0
                    ? `${tab.completedItems}/${tab.totalItems} complete`
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

function DailyReportsSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-48 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="mt-2 h-5 w-56 animate-pulse rounded bg-wolf-grey-light dark:bg-navy-light" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-[140px] animate-pulse flex-col items-center justify-center gap-3 rounded-lg border bg-white p-6 shadow-sm dark:border-navy-light dark:bg-navy"
          >
            <div className="h-8 w-8 rounded-full bg-wolf-grey-light dark:bg-navy-light" />
            <div className="h-4 w-24 rounded bg-wolf-grey-light dark:bg-navy-light" />
            <div className="h-3 w-20 rounded bg-wolf-grey-light dark:bg-navy-light" />
          </div>
        ))}
      </div>
    </div>
  )
}
