"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutGrid,
  Users,
  Puzzle,
  CheckSquare,
  Wrench,
  Gauge,
  Database,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const adminSections = [
  { href: "/admin/facility", label: "Facility", icon: Building2 },
  { href: "/admin/rinks", label: "Rinks", icon: LayoutGrid },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/modules", label: "Modules", icon: Puzzle },
  { href: "/admin/checklists", label: "Checklists", icon: CheckSquare },
  { href: "/admin/equipment", label: "Equipment", icon: Wrench },
  { href: "/admin/thresholds", label: "Thresholds", icon: Gauge },
  { href: "/admin/data-retention", label: "Data Retention", icon: Database },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Mobile: horizontal scrollable tab bar */}
      <div className="lg:hidden border-b bg-white">
        <div className="px-4 pt-4 pb-2">
          <Link href="/admin">
            <h2 className="text-lg font-semibold text-slate-900">Admin</h2>
          </Link>
        </div>
        <ScrollArea className="w-full">
          <div className="flex space-x-1 px-4 pb-3">
            {adminSections.map((section) => {
              const Icon = section.icon;
              const isActive = pathname === section.href;
              return (
                <Link key={section.href} href={section.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap",
                      isActive && "shadow-sm"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </Button>
                </Link>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Desktop: left sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r bg-slate-50/50">
        <div className="p-6 pb-4">
          <Link href="/admin">
            <h2 className="text-lg font-semibold text-slate-900">
              Admin Control Center
            </h2>
          </Link>
          <p className="text-sm text-slate-500 mt-1">
            Manage your facility settings
          </p>
        </div>
        <ScrollArea className="flex-1 px-3">
          <nav className="flex flex-col gap-1 pb-6">
            {adminSections.map((section) => {
              const Icon = section.icon;
              const isActive = pathname === section.href;
              return (
                <Link key={section.href} href={section.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-10",
                      isActive &&
                        "bg-slate-200/80 font-medium text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {section.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
