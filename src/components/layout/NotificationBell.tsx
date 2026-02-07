"use client"

import { cn } from "@/lib/utils"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NotificationBellProps {
  onClick: () => void
  unreadCount: number
}

export function NotificationBell({ onClick, unreadCount }: NotificationBellProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={onClick}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex items-center justify-center",
            "min-w-[18px] h-[18px] rounded-full px-1",
            "bg-red-600 text-white text-[10px] font-bold leading-none"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Button>
  )
}
