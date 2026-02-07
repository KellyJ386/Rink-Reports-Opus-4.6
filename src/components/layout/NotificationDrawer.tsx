'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useNotifications, type Notification } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils'

interface NotificationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: (notification: Notification) => void
}) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  })

  return (
    <button
      type="button"
      onClick={() => onRead(notification)}
      className={cn(
        'w-full text-left px-4 py-3 transition-colors hover:bg-wolf-grey-light/50 dark:hover:bg-white/5',
        'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-action-green',
        'min-h-[48px]',
        !notification.is_read && 'bg-navy/[0.03] dark:bg-white/[0.03]'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Unread indicator dot */}
        <div className="mt-1.5 shrink-0">
          <div
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              notification.is_read
                ? 'bg-transparent'
                : 'bg-action-green'
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-sm leading-snug',
              notification.is_read
                ? 'font-normal text-wolf-grey-dark dark:text-wolf-grey'
                : 'font-semibold text-navy dark:text-white'
            )}
          >
            {notification.title}
          </p>

          {notification.body && (
            <p className="mt-0.5 text-sm text-wolf-grey-dark dark:text-wolf-grey line-clamp-2">
              {notification.body}
            </p>
          )}

          <p className="mt-1 text-xs text-wolf-grey dark:text-wolf-grey-dark">
            {timeAgo}
          </p>
        </div>
      </div>
    </button>
  )
}

export default function NotificationDrawer({
  open,
  onOpenChange,
}: NotificationDrawerProps) {
  const router = useRouter()
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications()

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    if (notification.link) {
      router.push(notification.link)
      onOpenChange(false)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-white dark:bg-navy"
      >
        <SheetHeader className="px-4 pt-5 pb-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold text-navy dark:text-white">
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="gap-1.5 text-xs text-action-green hover:text-action-green-hover hover:bg-action-green/10"
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
          </div>
          <SheetDescription className="sr-only">
            Your recent notifications
          </SheetDescription>
        </SheetHeader>

        <Separator className="mt-3" />

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-wolf-grey border-t-navy dark:border-wolf-grey-dark dark:border-t-white" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-wolf-grey-light/50 dark:bg-white/5">
                <Bell className="h-8 w-8 text-wolf-grey dark:text-wolf-grey-dark" />
              </div>
              <p className="mt-4 text-sm font-medium text-wolf-grey-dark dark:text-wolf-grey">
                No notifications
              </p>
              <p className="mt-1 text-xs text-wolf-grey dark:text-wolf-grey-dark">
                You&apos;re all caught up
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer: link to preferences */}
        {!loading && notifications.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-wolf-grey-dark hover:text-navy dark:text-wolf-grey dark:hover:text-white"
                onClick={() => {
                  router.push('/notifications')
                  onOpenChange(false)
                }}
              >
                Manage notification preferences
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
