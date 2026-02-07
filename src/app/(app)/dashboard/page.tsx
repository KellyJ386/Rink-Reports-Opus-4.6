import Link from "next/link";
import {
  ClipboardList,
  Ruler,
  Snowflake,
  Calendar,
  AlertTriangle,
  Thermometer,
  Wind,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ModuleItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

const MODULE_CONFIG: ModuleItem[] = [
  { key: "daily_reports", label: "Daily Reports", href: "/daily-reports", icon: ClipboardList },
  { key: "ice_depth", label: "Ice Depth", href: "/ice-depth", icon: Ruler },
  { key: "ice_operations", label: "Ice Operations", href: "/ice-operations", icon: Snowflake },
  { key: "scheduling", label: "Scheduling", href: "/scheduling", icon: Calendar },
  { key: "incidents", label: "Incidents", href: "/incidents", icon: AlertTriangle },
  { key: "refrigeration", label: "Refrigeration", href: "/refrigeration", icon: Thermometer },
  { key: "air_quality", label: "Air Quality", href: "/air-quality", icon: Wind },
  { key: "admin", label: "Admin", href: "/admin", icon: Settings },
];

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {MODULE_CONFIG.map((mod) => {
          const Icon = mod.icon;

          return (
            <Link key={mod.key} href={mod.href} className="group">
              <Card
                className={cn(
                  "relative flex min-h-[120px] flex-col items-center justify-center gap-3 p-4",
                  "bg-white shadow-md transition-all duration-200",
                  "hover:shadow-lg hover:scale-[1.03]",
                  "rounded-lg cursor-pointer"
                )}
              >
                {/* Alert badge placeholder */}
                <span className="absolute right-2 top-2" aria-hidden="true" />

                <Icon className="h-8 w-8 text-[var(--color-navy)]" strokeWidth={1.75} />

                <span className="text-center text-sm font-semibold text-foreground">
                  {mod.label}
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
