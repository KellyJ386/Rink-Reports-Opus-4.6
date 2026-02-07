'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Thermometer,
  ArrowRight,
  Clock,
  Loader2,
  History,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

// ============================================
// Types
// ============================================

interface Equipment {
  id: string
  name: string
  equipment_type: string
  is_active: boolean
  sort_order: number
}

interface LatestReading {
  equipment_id: string
  recorded_at: string
  has_out_of_range: boolean
  recorded_by_name: string
}

// ============================================
// Skeleton Component
// ============================================

function PageSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 rounded bg-wolf-grey-light dark:bg-navy-light" />
        <div className="h-10 w-32 rounded bg-wolf-grey-light dark:bg-navy-light" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-lg bg-wolf-grey-light dark:bg-navy-light" />
        ))}
      </div>
    </div>
  )
}

// ============================================
// Main Page Component
// ============================================

export default function RefrigerationPage() {
  const { profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [latestReadings, setLatestReadings] = useState<Map<string, LatestReading>>(new Map())
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!profile?.facility_id) return

    try {
      // Fetch active equipment
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, name, equipment_type, is_active, sort_order')
        .eq('facility_id', profile.facility_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (equipmentError) {
        toast({ title: 'Failed to load equipment', variant: 'destructive' })
        return
      }

      setEquipment(equipmentData ?? [])

      // Fetch latest reading per equipment
      if (equipmentData && equipmentData.length > 0) {
        const equipmentIds = equipmentData.map((e) => e.id)
        const { data: readingsData } = await supabase
          .from('refrigeration_readings')
          .select('id, equipment_id, recorded_at, recorded_by, profiles(full_name)')
          .eq('facility_id', profile.facility_id)
          .in('equipment_id', equipmentIds)
          .order('recorded_at', { ascending: false })

        // Build a map of equipment_id -> latest reading
        const readingMap = new Map<string, LatestReading>()

        if (readingsData) {
          for (const r of readingsData as unknown as Array<{
            id: string
            equipment_id: string
            recorded_at: string
            recorded_by: string
            profiles: { full_name: string } | null
          }>) {
            if (!readingMap.has(r.equipment_id)) {
              // Check for out-of-range values in this reading
              const { data: values } = await supabase
                .from('refrigeration_reading_values')
                .select('is_out_of_range')
                .eq('reading_id', r.id)
                .eq('is_out_of_range', true)
                .limit(1)

              readingMap.set(r.equipment_id, {
                equipment_id: r.equipment_id,
                recorded_at: r.recorded_at,
                has_out_of_range: (values && values.length > 0) ?? false,
                recorded_by_name: r.profiles?.full_name ?? 'Unknown',
              })
            }
          }
        }

        setLatestReadings(readingMap)
      }
    } catch {
      toast({ title: 'Failed to load data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [profile?.facility_id, supabase, toast])

  useEffect(() => {
    if (!authLoading && profile) {
      fetchData()
    }
  }, [authLoading, profile, fetchData])

  if (authLoading || loading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            Refrigeration Plant
          </h1>
          <p className="mt-1 text-sm text-wolf-grey-dark dark:text-wolf-grey">
            Monitor and record equipment readings
          </p>
        </div>
        <Link href="/refrigeration/history">
          <Button variant="outline" size="sm">
            <History className="h-4 w-4" />
            View History
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {equipment.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Thermometer className="h-12 w-12 text-wolf-grey dark:text-wolf-grey-dark" />
            <h3 className="mt-4 text-lg font-semibold text-navy dark:text-white">
              No Equipment Configured
            </h3>
            <p className="mt-2 text-sm text-wolf-grey-dark dark:text-wolf-grey">
              Ask your facility administrator to add refrigeration equipment in Admin settings.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Equipment Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equipment.map((eq) => {
          const latest = latestReadings.get(eq.id)
          const statusColor = !latest
            ? 'bg-wolf-grey'
            : latest.has_out_of_range
              ? 'bg-alert-red'
              : 'bg-action-green'

          return (
            <Link key={eq.id} href={`/refrigeration/${eq.id}`}>
              <Card className="group cursor-pointer transition-shadow hover:shadow-md dark:hover:border-wolf-grey-dark">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-3 w-3 rounded-full shrink-0', statusColor)} />
                      <div>
                        <h3 className="font-semibold text-navy dark:text-white group-hover:text-action-green dark:group-hover:text-action-green transition-colors">
                          {eq.name}
                        </h3>
                        <Badge variant="secondary" className="mt-1">
                          {eq.equipment_type}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-wolf-grey dark:text-wolf-grey-dark group-hover:text-action-green transition-colors shrink-0" />
                  </div>

                  <div className="mt-4 space-y-2">
                    {latest ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-wolf-grey-dark dark:text-wolf-grey">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>
                            {formatDistanceToNow(new Date(latest.recorded_at), { addSuffix: true })}
                          </span>
                        </div>
                        {latest.has_out_of_range && (
                          <div className="flex items-center gap-2 text-sm text-alert-red font-medium">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Out-of-range values detected</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-wolf-grey-dark dark:text-wolf-grey italic">
                        No readings recorded yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
