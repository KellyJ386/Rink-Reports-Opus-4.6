"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LayoutDashboard } from "lucide-react";

import { cn } from "@/lib/utils";
import { MODULE_CONFIG } from "@/lib/constants/moduleIcons";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const modules = Object.entries(MODULE_CONFIG);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-white dark:bg-navy-dark transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-2">
          {/* Dashboard link */}
          <SidebarLink
            href="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            active={pathname === "/dashboard"}
            collapsed={collapsed}
          />

          {/* Module links */}
          {modules.map(([key, config]) => {
            // Admin link - shown always for now, role check can be added later
            const isActive =
              pathname === config.href ||
              pathname.startsWith(config.href + "/");

            return (
              <SidebarLink
                key={key}
                href={config.href}
                icon={config.icon}
                label={config.label}
                active={isActive}
                collapsed={collapsed}
              />
            );
          })}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full justify-center",
            !collapsed && "justify-end"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <span className="mr-2 text-xs text-muted-foreground">
                Collapse
              </span>
              <ChevronsLeft className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Internal link component with tooltip support for collapsed state   */
/* ------------------------------------------------------------------ */

interface SidebarLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  collapsed: boolean;
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
}: SidebarLinkProps) {
  const linkContent = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}
