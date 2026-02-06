"use client";

import { Menu, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "./DarkModeToggle";
import { signOut } from "@/lib/supabase/auth-actions";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  userName?: string;
  userRole?: string;
  onMenuToggle?: () => void;
}

export function Header({ userName, userRole, onMenuToggle }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="lg:hidden flex items-center gap-2">
          <span className="font-bold text-foreground">Max Facility</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        <DarkModeToggle />

        <div className="hidden md:flex items-center gap-2 ml-2">
          <div className="text-right">
            <p className="text-sm font-medium">{userName || "User"}</p>
            {userRole && (
              <Badge variant="secondary" className="text-xs">
                {userRole.replace("_", " ")}
              </Badge>
            )}
          </div>
        </div>

        <form action={signOut}>
          <Button variant="ghost" size="icon" type="submit" aria-label="Sign out">
            <LogOut className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </header>
  );
}
