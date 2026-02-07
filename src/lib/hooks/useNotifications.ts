'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

export interface Notification {
  id: string
  facility_id: string
  recipient_id: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const userIdRef = useRef<string | null>(null)

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
        userIdRef.current = null
        setLoading(false)
        return
      }

      userIdRef.current = user.id

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('[useNotifications] Fetch error:', error.message)
        setNotifications([])
        setUnreadCount(0)
      } else if (data) {
        const typed = data as Notification[]
        setNotifications(typed)
        setUnreadCount(typed.filter((n) => !n.is_read).length)
      } else {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('[useNotifications] Unexpected error:', err)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) {
        // Revert optimistic update on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
        )
        setUnreadCount((prev) => prev + 1)
        toast({ title: 'Failed to mark notification as read', variant: 'destructive' })
      }
    },
    [supabase, toast]
  )

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userIdRef.current!)
      .eq('is_read', false)

    if (error) {
      // Revert on failure
      await fetchNotifications()
      toast({ title: 'Failed to mark all as read', variant: 'destructive' })
    }
  }, [supabase, notifications, fetchNotifications, toast])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!userIdRef.current) return

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userIdRef.current}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)

          toast({
            title: newNotification.title,
            description: newNotification.body || undefined,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, toast, loading])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}
