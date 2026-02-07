import Link from "next/link";
import {
  Building2,
  LayoutGrid,
  Users,
  Puzzle,
  CheckSquare,
  Wrench,
  Gauge,
  Database,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const adminSections = [
  {
    href: "/admin/facility",
    icon: Building2,
    title: "Facility Settings",
    description: "Manage facility info, hours, and branding",
  },
  {
    href: "/admin/rinks",
    icon: LayoutGrid,
    title: "Rink Configuration",
    description: "Configure rinks, measurement points, and thresholds",
  },
  {
    href: "/admin/users",
    icon: Users,
    title: "User Management",
    description: "Invite and manage team members",
  },
  {
    href: "/admin/modules",
    icon: Puzzle,
    title: "Module Settings",
    description: "Enable/disable modules and set permissions",
  },
  {
    href: "/admin/checklists",
    icon: CheckSquare,
    title: "Checklist Builder",
    description: "Configure daily report tabs and items",
  },
  {
    href: "/admin/equipment",
    icon: Wrench,
    title: "Equipment Setup",
    description: "Manage machines, refrigeration equipment",
  },
  {
    href: "/admin/thresholds",
    icon: Gauge,
    title: "Thresholds",
    description: "Configure alert thresholds for all modules",
  },
  {
    href: "/admin/data-retention",
    icon: Database,
    title: "Data Retention",
    description: "Set data retention and archival policies",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Admin Control Center
        </h1>
        <p className="text-slate-500 mt-1">
          Configure and manage all aspects of your facility
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer hover:border-slate-300">
                <CardHeader className="space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      {section.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1.5 line-clamp-2">
                      {section.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
