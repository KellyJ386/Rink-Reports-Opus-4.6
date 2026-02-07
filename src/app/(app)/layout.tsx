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
  LayoutDashboard,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Daily Reports", href: "/daily-reports", icon: ClipboardList },
  { label: "Ice Depth", href: "/ice-depth", icon: Ruler },
  { label: "Ice Operations", href: "/ice-operations", icon: Snowflake },
  { label: "Scheduling", href: "/scheduling", icon: Calendar },
  { label: "Incidents", href: "/incidents", icon: AlertTriangle },
  { label: "Refrigeration", href: "/refrigeration", icon: Thermometer },
  { label: "Air Quality", href: "/air-quality", icon: Wind },
  { label: "Admin", href: "/admin", icon: Settings },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-[var(--color-navy)] px-4 text-white shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-lg">Max Facility</span>
        </Link>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r bg-[var(--color-navy-dark)] md:block">
          <nav className="flex flex-col gap-1 p-2 pt-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
