"use client";

import React, { useState } from "react";
import { Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

export default function DataRetentionPage() {
  const { toast } = useToast();

  const [standardRetention, setStandardRetention] = useState(3);
  const [incidentRetention, setIncidentRetention] = useState(7);
  const [archiveMode, setArchiveMode] = useState(true);

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Data retention policies have been updated successfully.",
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Database className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Data Retention Settings
          </h1>
          <p className="text-sm text-slate-500">
            Configure how long data is retained and when it gets archived
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Retention Periods</CardTitle>
            <p className="text-sm text-slate-500">
              Set how long different types of data are kept in the active
              database before being archived or deleted.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="sm:w-64 shrink-0">
                <Label
                  htmlFor="standard-retention"
                  className="text-sm font-medium"
                >
                  Standard Data Retention
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily reports, ice depth, refrigeration readings
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="standard-retention"
                  type="number"
                  min={1}
                  max={99}
                  value={standardRetention}
                  onChange={(e) =>
                    setStandardRetention(parseInt(e.target.value) || 1)
                  }
                  className="w-20"
                />
                <span className="text-sm text-slate-500">years</span>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="sm:w-64 shrink-0">
                <Label
                  htmlFor="incident-retention"
                  className="text-sm font-medium"
                >
                  Incident Data Retention
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Incident reports, safety events, and related documentation
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="incident-retention"
                  type="number"
                  min={1}
                  max={99}
                  value={incidentRetention}
                  onChange={(e) =>
                    setIncidentRetention(parseInt(e.target.value) || 1)
                  }
                  className="w-20"
                />
                <span className="text-sm text-slate-500">years</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Archive Settings</CardTitle>
            <p className="text-sm text-slate-500">
              Configure how expired data is handled when it reaches the end of
              its retention period.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="archive-mode" className="text-sm font-medium">
                  Archive Mode
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  When enabled, expired data is moved to cold storage instead
                  of being permanently deleted. When disabled, expired data is
                  permanently removed.
                </p>
              </div>
              <Switch
                id="archive-mode"
                checked={archiveMode}
                onCheckedChange={setArchiveMode}
              />
            </div>

            {archiveMode && (
              <div className="mt-3 rounded-md bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-800">
                  Archive mode is enabled. Data past its retention period will
                  be compressed and moved to archival storage. Archived data can
                  still be retrieved upon request but may take longer to access.
                </p>
              </div>
            )}

            {!archiveMode && (
              <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800">
                  Archive mode is disabled. Data past its retention period will
                  be permanently deleted and cannot be recovered. Please ensure
                  your retention periods are set appropriately.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            Save Retention Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
