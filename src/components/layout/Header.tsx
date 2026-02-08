"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Menu, Bell, Moon, Sun, LogOut, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants/brand";
import { logout } from "@/app/(auth)/actions";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAlertCounts } from "@/lib/hooks/useAlertCounts";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { NotificationDrawer, type Notification } from "@/components/layout/NotificationDrawer";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const { profile, user } = useAuth();
  const { counts } = useAlertCounts();

  // Total alert count across all modules
  const alertCount = Object.values(counts).reduce((sum, n) => sum + n, 0);

  // Compute initials from the user's full name (first letter of first and last name)
  const userInitials = (() => {
    if (!profile?.full_name) return "??";
    const parts = profile.full_name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(
        data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          title: row.title as string,
          body: row.body as string,
          link: (row.link as string) ?? undefined,
          createdAt: row.created_at as string,
          read: row.read as boolean,
        }))
      );
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark all notifications as read
  const handleMarkAllRead = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", user.id)
      .eq("read", false);

    // Update local state immediately
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  }, [user]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm dark:bg-navy-dark dark:border-border",
          className
        )}
      >
        {/* Left section */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop logo */}
          <Link
            href="/dashboard"
            className="hidden items-center gap-2 md:flex"
          >
            <span className="text-lg font-bold text-navy dark:text-white">
              {BRAND.shortName}
            </span>
          </Link>

          {/* Mobile logo */}
          <Link href="/dashboard" className="flex items-center md:hidden">
            <span className="text-lg font-bold text-navy dark:text-white">
              {BRAND.shortName}
            </span>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
            onClick={() => setNotifOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {alertCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-[10px]"
              >
                {alertCount > 99 ? "99+" : alertCount}
              </Badge>
            )}
          </Button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
                aria-label="User menu"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-navy text-white text-sm dark:bg-navy-light">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.full_name ?? "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email ?? ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex cursor-pointer items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="cursor-pointer"
              >
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile sidebar sheet */}
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      {/* Notification drawer */}
      <NotificationDrawer
        open={notifOpen}
        onOpenChange={setNotifOpen}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />
    </>
  );
}
