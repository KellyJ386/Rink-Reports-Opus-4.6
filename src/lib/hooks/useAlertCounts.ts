'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AlertCounts {
  [moduleId: string]: number
}

export function useAlertCounts() {
  const [counts, setCounts] = useState<AlertCounts>({})
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const refresh = useCallback(async () => {
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setCounts({})
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('facility_id')
        .eq('id', user.id)
        .single()

      if (!profile?.facility_id) {
        setCounts({})
        setLoading(false)
        return
      }

      const { data: alerts } = await supabase
        .from('active_alerts')
        .select('module_id')
        .eq('facility_id', profile.facility_id)
        .eq('is_acknowledged', false)

      if (alerts) {
        const grouped: AlertCounts = {}
        for (const alert of alerts) {
          const key = alert.module_id
          grouped[key] = (grouped[key] || 0) + 1
        }
        setCounts(grouped)
      } else {
        setCounts({})
      }
    } catch {
      setCounts({})
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { counts, loading, refresh }
}
