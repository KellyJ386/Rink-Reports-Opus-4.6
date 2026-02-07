'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  link?: string | null
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setNotifications([])
        setUnreadCount(0)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        setNotifications(data as Notification[])
        setUnreadCount(data.filter((n) => !n.is_read).length)
      } else {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const markAsRead = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    },
    [supabase]
  )

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return { unreadCount, notifications, loading, markAsRead }
}
