"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Ruler,
  Snowflake,
  Calendar,
  AlertTriangle,
  Thermometer,
  Wind,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/daily-reports", label: "Daily Reports", icon: FileText },
  { href: "/ice-depth", label: "Ice Depth", icon: Ruler },
  { href: "/ice-operations", label: "Ice Operations", icon: Snowflake },
  { href: "/scheduling", label: "Scheduling", icon: Calendar },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/refrigeration", label: "Refrigeration", icon: Thermometer },
  { href: "/air-quality", label: "Air Quality", icon: Wind },
  { href: "/admin", label: "Admin", icon: Settings },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  userRole?: string;
}

export function MobileNav({ open, onClose, userRole }: MobileNavProps) {
  const pathname = usePathname();

  const showAdmin =
    userRole === "super_admin" || userRole === "facility_admin";

  const items = showAdmin
    ? navItems
    : navItems.filter((item) => item.href !== "/admin");

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar-background text-sidebar-foreground lg:hidden">
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
          <span className="text-lg font-bold">Max Facility</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[48px]",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
