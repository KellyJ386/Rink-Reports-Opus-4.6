"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { markAsRead, markAllAsRead, deleteNotification } from "../actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationListProps {
  initialNotifications: NotificationItem[];
}

const typeColors: Record<string, string> = {
  alert: "bg-alert-red",
  threshold_warning: "bg-alert-yellow",
  report_submitted: "bg-action-green",
  report_approved: "bg-action-green",
  report_rejected: "bg-alert-red",
  incident_created: "bg-alert-red",
  shift_assigned: "bg-blue-500",
  maintenance_due: "bg-orange-500",
  general: "bg-wolf-grey",
};

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NotificationList({
  initialNotifications,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState<string | null>(null);

  const hasUnread = notifications.some((n) => !n.is_read);

  async function handleMarkRead(id: string) {
    setLoading(id);
    const result = await markAsRead(id);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
    setLoading(null);
  }

  async function handleMarkAllRead() {
    setLoading("all");
    const result = await markAllAsRead();
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
    setLoading(null);
  }

  async function handleDelete(id: string) {
    setLoading(id);
    const result = await deleteNotification(id);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
    setLoading(null);
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={loading === "all"}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        </div>
      )}

      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={cn(
            "transition-colors",
            !notification.is_read && "border-l-4 border-l-action-green"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      typeColors[notification.type] || "bg-wolf-grey"
                    )}
                  />
                  <p className="font-medium text-sm truncate">
                    {notification.title}
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {notification.link && (
                  <Link href={notification.link}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMarkRead(notification.id)}
                    disabled={loading === notification.id}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-alert-red"
                  onClick={() => handleDelete(notification.id)}
                  disabled={loading === notification.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
