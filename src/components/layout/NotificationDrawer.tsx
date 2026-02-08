"use client"

import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { BellOff, CheckCheck } from "lucide-react"

/* ---------- Types ---------- */

export interface Notification {
  id: string
  title: string
  body: string
  link?: string
  createdAt: string
  read: boolean
}

interface NotificationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notifications: Notification[]
  onMarkAllRead: () => void
}

/* ---------- Helpers ---------- */

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/* ---------- Component ---------- */

export function NotificationDrawer({ open, onOpenChange, notifications, onMarkAllRead }: NotificationDrawerProps) {
  const router = useRouter()

  const handleClick = (notification: Notification) => {
    if (notification.link) {
      router.push(notification.link)
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              Notifications
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={onMarkAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark All Read
            </Button>
          </div>
          <SheetDescription className="sr-only">
            Your recent notifications
          </SheetDescription>
        </SheetHeader>

        <Separator />

        {/* Notification list */}
        <ScrollArea className="flex-1">
          {MOCK_NOTIFICATIONS.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BellOff className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {MOCK_NOTIFICATIONS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={cn(
                    "w-full text-left px-6 py-4 hover:bg-muted/50 transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    n.link && "cursor-pointer"
                  )}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex items-start gap-3">
                    {/* Unread dot */}
                    <div className="pt-1.5 shrink-0">
                      <span
                        className={cn(
                          "block h-2 w-2 rounded-full",
                          n.read ? "bg-transparent" : "bg-blue-500"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm leading-tight",
                          !n.read && "font-semibold"
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {n.body}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
