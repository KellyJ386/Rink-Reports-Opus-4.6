"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "daily-reports": "Daily Reports",
  "ice-depth": "Ice Depth",
  "ice-operations": "Ice Operations",
  scheduling: "Scheduling",
  incidents: "Incidents",
  refrigeration: "Refrigeration",
  "air-quality": "Air Quality",
  admin: "Admin",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === "dashboard")) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <Link
        href="/dashboard"
        className="hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {segments.map((segment, i) => {
        const path = "/" + segments.slice(0, i + 1).join("/");
        const label = routeLabels[segment] || segment;
        const isLast = i === segments.length - 1;

        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link
                href={path}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
