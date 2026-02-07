"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Maps URL path segments to user-friendly labels.
 * Add entries here as new routes are created.
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "daily-reports": "Daily Reports",
  "ice-depth": "Ice Depth",
  "ice-operations": "Ice Operations",
  scheduling: "Scheduling",
  incidents: "Incidents",
  refrigeration: "Refrigeration",
  "air-quality": "Air Quality",
  admin: "Admin",
  profile: "Profile",
  settings: "Settings",
  new: "New",
  edit: "Edit",
};

/**
 * Converts a URL segment to a human-readable label.
 * Falls back to title-casing the segment if no explicit mapping exists.
 */
function segmentToLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }

  // Fallback: convert kebab-case to Title Case
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Split path and filter out empty segments
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items with cumulative paths
  const items = segments.map((segment, index) => ({
    label: segmentToLabel(segment),
    href: "/" + segments.slice(0, index + 1).join("/"),
    isLast: index === segments.length - 1,
  }));

  // Don't render breadcrumbs on the dashboard root
  if (segments.length <= 1 && segments[0] === "dashboard") {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1 text-sm">
        {/* Root: Dashboard */}
        <li className="flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
        </li>

        {/* Path segments */}
        {items.map((item) => (
          <Fragment key={item.href}>
            <li className="flex items-center">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </li>
            <li className="flex items-center">
              {item.isLast ? (
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
