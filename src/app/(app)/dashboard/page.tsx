import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Ruler,
  Snowflake,
  Calendar,
  AlertTriangle,
  Thermometer,
  Wind,
  Clock,
} from "lucide-react";
import Link from "next/link";

const modules = [
  {
    title: "Daily Reports",
    description: "Create and review daily operational reports",
    icon: FileText,
    href: "/daily-reports",
    color: "text-action-green",
  },
  {
    title: "Ice Depth",
    description: "Track ice thickness measurements",
    icon: Ruler,
    href: "/ice-depth",
    color: "text-blue-500",
  },
  {
    title: "Ice Operations",
    description: "Log resurfacing and maintenance",
    icon: Snowflake,
    href: "/ice-operations",
    color: "text-cyan-500",
  },
  {
    title: "Scheduling",
    description: "Manage employee shifts and availability",
    icon: Calendar,
    href: "/scheduling",
    color: "text-purple-500",
  },
  {
    title: "Incidents",
    description: "Report and track facility incidents",
    icon: AlertTriangle,
    href: "/incidents",
    color: "text-alert-yellow",
  },
  {
    title: "Refrigeration",
    description: "Monitor plant readings and maintenance",
    icon: Thermometer,
    href: "/refrigeration",
    color: "text-orange-500",
  },
  {
    title: "Air Quality",
    description: "Track CO, NO2, humidity and temperature",
    icon: Wind,
    href: "/air-quality",
    color: "text-teal-500",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome to Max Facility Rink Reports
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-action-green/10 p-2">
                <FileText className="h-5 w-5 text-action-green" />
              </div>
              <div>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">Reports Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-alert-yellow/10 p-2">
                <AlertTriangle className="h-5 w-5 text-alert-yellow" />
              </div>
              <div>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">Open Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Snowflake className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">Resurfaces</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">Staff On Duty</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Modules</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((mod) => (
            <Link key={mod.href} href={mod.href}>
              <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <mod.icon className={`h-6 w-6 ${mod.color}`} />
                    <CardTitle className="text-base">{mod.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{mod.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
