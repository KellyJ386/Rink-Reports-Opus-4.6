"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  { value: "all", label: "All Events" },
  { value: "resurfacing", label: "Resurfacing" },
  { value: "flood", label: "Flood" },
  { value: "scrape", label: "Scrape" },
  { value: "edge", label: "Edge" },
  { value: "maintenance", label: "Maintenance" },
] as const;

interface IceOperationsFilterProps {
  activeFilter: string;
}

export function IceOperationsFilter({ activeFilter }: IceOperationsFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {EVENT_TYPES.map((type) => (
        <Link
          key={type.value}
          href={
            type.value === "all"
              ? "/ice-operations"
              : `/ice-operations?filter=${type.value}`
          }
          className={cn(
            "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            "border hover:bg-accent hover:text-accent-foreground",
            activeFilter === type.value
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-input"
          )}
        >
          {type.label}
        </Link>
      ))}
    </div>
  );
}
