'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Menu, User, Moon, Sun, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { AlertBadge } from '@/components/shared/AlertBadge'
import NotificationDrawer from '@/components/layout/NotificationDrawer'
import { logout } from '@/app/(auth)/actions'

interface HeaderProps {
  onToggleSidebar: () => void
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  facility_admin: 'Facility Admin',
  manager: 'Manager',
  supervisor: 'Supervisor',
  staff: 'Staff',
  read_only: 'Read Only',
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { profile } = useAuth()
  const { unreadCount } = useNotifications()
  const { theme, setTheme } = useTheme()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const isDark = theme === 'dark'

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-white px-4 dark:bg-navy">
        {/* Left: Hamburger (mobile) + Logo */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <span className="text-lg font-bold text-navy dark:text-white">
            Max Facility
          </span>
        </div>

        {/* Right: Notification bell + User menu */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setDrawerOpen(true)}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell className="h-5 w-5" />
            <AlertBadge count={unreadCount} />
          </Button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              <User className="h-5 w-5" />
            </Button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-border bg-white p-4 shadow-lg dark:bg-navy">
                {/* User Info */}
                <div className="mb-2">
                  <p className="font-semibold text-navy dark:text-white">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-sm text-wolf-grey-dark dark:text-wolf-grey">
                    {profile?.email}
                  </p>
                  {profile?.role && (
                    <Badge variant="secondary" className="mt-1">
                      {ROLE_LABELS[profile.role] || profile.role}
                    </Badge>
                  )}
                </div>

                <Separator className="my-3" />

                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-sm">
                    {isDark ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                    <span>Dark Mode</span>
                  </div>
                  <Switch
                    checked={isDark}
                    onCheckedChange={(checked) =>
                      setTheme(checked ? 'dark' : 'light')
                    }
                    aria-label="Toggle dark mode"
                  />
                </div>

                <Separator className="my-3" />

                {/* Sign Out */}
                <form action={logout}>
                  <Button
                    type="submit"
                    variant="ghost"
                    className="w-full justify-start gap-2 text-alert-red hover:bg-alert-red/10 hover:text-alert-red"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
}
