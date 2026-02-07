"use client";

import React, { useState } from "react";
import {
  Puzzle,
  Snowflake,
  Thermometer,
  Wind,
  ClipboardList,
  Calendar,
  AlertTriangle,
  BarChart3,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

const ROLE_OPTIONS = [
  { value: "facility_admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "staff", label: "Staff" },
  { value: "read_only", label: "Read Only" },
];

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  roles: string[];
}

const initialModules: Module[] = [
  {
    id: "ice-depth",
    name: "Ice Depth Monitoring",
    description: "Track and record ice thickness measurements across rinks",
    icon: Snowflake,
    enabled: true,
    roles: ["facility_admin", "manager", "supervisor", "staff"],
  },
  {
    id: "refrigeration",
    name: "Refrigeration",
    description: "Monitor refrigeration systems, temperatures, and pressures",
    icon: Thermometer,
    enabled: true,
    roles: ["facility_admin", "manager", "supervisor"],
  },
  {
    id: "air-quality",
    name: "Air Quality",
    description: "Track CO, NO2, and humidity levels in the facility",
    icon: Wind,
    enabled: true,
    roles: ["facility_admin", "manager", "supervisor", "staff"],
  },
  {
    id: "daily-reports",
    name: "Daily Reports",
    description: "Manage opening, closing, and daily operations checklists",
    icon: ClipboardList,
    enabled: true,
    roles: ["facility_admin", "manager", "supervisor", "staff"],
  },
  {
    id: "scheduling",
    name: "Scheduling",
    description: "Manage ice sessions, events, and bookings",
    icon: Calendar,
    enabled: true,
    roles: ["facility_admin", "manager"],
  },
  {
    id: "incidents",
    name: "Incident Reporting",
    description: "Log and track facility incidents and safety concerns",
    icon: AlertTriangle,
    enabled: true,
    roles: ["facility_admin", "manager", "supervisor", "staff"],
  },
  {
    id: "analytics",
    name: "Analytics & Reports",
    description: "View dashboards, trends, and generate facility reports",
    icon: BarChart3,
    enabled: false,
    roles: ["facility_admin", "manager"],
  },
  {
    id: "ice-operations",
    name: "Ice Operations",
    description: "Track resurfacing, edging, and ice maintenance activities",
    icon: Wrench,
    enabled: true,
    roles: ["facility_admin", "manager", "supervisor", "staff"],
  },
];

export default function ModuleSettingsPage() {
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>(initialModules);

  const toggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const toggleRole = (moduleId: string, role: string) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const roles = m.roles.includes(role)
          ? m.roles.filter((r) => r !== role)
          : [...m.roles, role];
        return { ...m, roles };
      })
    );
  };

  const handleSave = () => {
    toast({
      title: "Module settings saved",
      description: "Module configurations have been updated successfully.",
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Puzzle className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Module Settings
          </h1>
          <p className="text-sm text-slate-500">
            Enable or disable modules and configure role-based access
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card
              key={mod.id}
              className={!mod.enabled ? "opacity-60" : undefined}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {mod.name}
                      </CardTitle>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={mod.enabled}
                    onCheckedChange={() => toggleModule(mod.id)}
                  />
                </div>
              </CardHeader>
              {mod.enabled && (
                <CardContent className="pt-0">
                  <Separator className="mb-3" />
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide">
                      Role Access
                    </Label>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {ROLE_OPTIONS.map((role) => (
                        <div
                          key={role.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`${mod.id}-${role.value}`}
                            checked={mod.roles.includes(role.value)}
                            onCheckedChange={() =>
                              toggleRole(mod.id, role.value)
                            }
                          />
                          <Label
                            htmlFor={`${mod.id}-${role.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {role.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} size="lg">
          Save Module Settings
        </Button>
      </div>
    </div>
  );
}
