"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook that queries the active_alerts table for unacknowledged alerts
 * grouped by module. Returns a record mapping module IDs to their
 * unacknowledged alert counts.
 *
 * Example return: { refrigeration: 2, incidents: 1 }
 */
export function useAlertCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchCounts = async () => {
      const { data, error } = await supabase
        .from('active_alerts')
        .select('module')
        .eq('is_acknowledged', false)

      if (error || !data) {
        setCounts({})
        setLoading(false)
        return
      }

      // Group by module and count
      const grouped: Record<string, number> = {}
      for (const row of data) {
        const mod = row.module as string
        grouped[mod] = (grouped[mod] ?? 0) + 1
      }

      setCounts(grouped)
      setLoading(false)
    }

    fetchCounts()

    // Subscribe to realtime changes on active_alerts
    const channel = supabase
      .channel('active_alerts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_alerts' },
        () => {
          // Re-fetch counts on any change
          fetchCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { counts, loading }
}
