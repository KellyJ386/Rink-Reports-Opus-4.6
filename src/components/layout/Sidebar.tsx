"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/daily-reports", label: "Daily Reports", icon: FileText },
  { href: "/ice-depth", label: "Ice Depth", icon: Ruler },
  { href: "/ice-operations", label: "Ice Operations", icon: Snowflake },
  { href: "/scheduling", label: "Scheduling", icon: Calendar },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/refrigeration", label: "Refrigeration", icon: Thermometer },
  { href: "/air-quality", label: "Air Quality", icon: Wind },
];

const adminItem = { href: "/admin", label: "Admin", icon: Settings };

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const showAdmin =
    userRole === "super_admin" || userRole === "facility_admin";

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-sidebar-background text-sidebar-foreground">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lg font-bold">Max Facility</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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

      {showAdmin && (
        <div className="border-t border-sidebar-border p-4">
          <Link
            href={adminItem.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <adminItem.icon className="h-5 w-5 shrink-0" />
            {adminItem.label}
          </Link>
        </div>
      )}
    </aside>
  );
}
