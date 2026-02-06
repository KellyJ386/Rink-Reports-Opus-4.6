"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { updateModuleSetting } from "@/app/(app)/admin/actions";
import type { ModuleSetting, ModuleType } from "@/lib/types/database";
import {
  ClipboardList,
  Ruler,
  Snowflake,
  Calendar,
  AlertTriangle,
  Thermometer,
  Wind,
  Loader2,
} from "lucide-react";

interface ModuleSettingsProps {
  facilityId: string;
  modules: ModuleSetting[];
}

interface ModuleInfo {
  type: ModuleType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const MODULE_DEFINITIONS: ModuleInfo[] = [
  {
    type: "daily_reports",
    name: "Daily Reports",
    description:
      "Daily checklists, opening/closing procedures, and operational logs.",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    type: "ice_depth",
    name: "Ice Depth Management",
    description:
      "Track ice thickness across rink zones with manual or Bluetooth caliper measurements.",
    icon: <Ruler className="h-5 w-5" />,
  },
  {
    type: "ice_operations",
    name: "Ice Operations",
    description:
      "Resurface tracking, water usage, blade maintenance, and Zamboni logs.",
    icon: <Snowflake className="h-5 w-5" />,
  },
  {
    type: "scheduling",
    name: "Employee Scheduling",
    description:
      "Staff shift scheduling, availability, time-off requests, and swap management.",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    type: "incidents",
    name: "Incident Reporting",
    description:
      "Injury reports, equipment failures, safety hazards, and follow-up tracking.",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    type: "refrigeration",
    name: "Refrigeration Plant Logs",
    description:
      "Compressor readings, pressure/temperature logs, and maintenance records.",
    icon: <Thermometer className="h-5 w-5" />,
  },
  {
    type: "air_quality",
    name: "Air Quality Monitoring",
    description:
      "CO/NO2 levels, humidity, temperature readings, and air quality compliance.",
    icon: <Wind className="h-5 w-5" />,
  },
];

export function ModuleSettings({ facilityId, modules }: ModuleSettingsProps) {
  const { toast } = useToast();
  const [moduleList, setModuleList] = useState<ModuleSetting[]>(modules);
  const [loadingModule, setLoadingModule] = useState<string | null>(null);

  const isModuleEnabled = (moduleType: ModuleType): boolean => {
    const mod = moduleList.find((m) => m.module === moduleType);
    return mod?.is_enabled ?? false;
  };

  const handleToggle = async (moduleType: ModuleType, enabled: boolean) => {
    setLoadingModule(moduleType);

    try {
      const result = await updateModuleSetting(facilityId, moduleType, enabled);

      if (result.success) {
        setModuleList((prev) => {
          const existing = prev.find((m) => m.module === moduleType);
          if (existing) {
            return prev.map((m) =>
              m.module === moduleType ? { ...m, is_enabled: enabled } : m
            );
          }
          return [...prev, result.data as ModuleSetting];
        });

        toast({
          title: enabled ? "Module enabled" : "Module disabled",
          description: `${MODULE_DEFINITIONS.find((m) => m.type === moduleType)?.name || moduleType} has been ${enabled ? "enabled" : "disabled"}.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update module setting.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoadingModule(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Module Settings</CardTitle>
        <CardDescription>
          Enable or disable modules for your facility. Disabled modules will not
          appear in the navigation or be accessible to users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {MODULE_DEFINITIONS.map((mod, index) => {
            const enabled = isModuleEnabled(mod.type);
            const isLoading = loadingModule === mod.type;

            return (
              <div key={mod.type}>
                <div className="flex items-start gap-4 rounded-lg p-4 transition-colors hover:bg-muted/50">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {mod.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`module-${mod.type}`}
                        className="text-sm font-semibold"
                      >
                        {mod.name}
                      </Label>
                      <Badge
                        variant={enabled ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {mod.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Switch
                      id={`module-${mod.type}`}
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        handleToggle(mod.type, checked)
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>
                {index < MODULE_DEFINITIONS.length - 1 && <Separator />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
