"use client";

import React, { useState } from "react";
import { Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

interface ThresholdRange {
  label: string;
  unit: string;
  min: number;
  max: number;
}

interface ThresholdSection {
  id: string;
  title: string;
  description: string;
  ranges: ThresholdRange[];
}

export default function ThresholdsPage() {
  const { toast } = useToast();

  const [sections, setSections] = useState<ThresholdSection[]>([
    {
      id: "ice-depth",
      title: "Ice Depth",
      description:
        "Set acceptable ranges for ice thickness measurements across all rinks",
      ranges: [
        { label: "Optimal Depth", unit: "inches", min: 1.0, max: 1.25 },
        { label: "Warning (Thin)", unit: "inches", min: 0.75, max: 1.0 },
        { label: "Critical (Too Thin)", unit: "inches", min: 0, max: 0.75 },
        { label: "Warning (Thick)", unit: "inches", min: 1.25, max: 1.5 },
        { label: "Critical (Too Thick)", unit: "inches", min: 1.5, max: 2.0 },
      ],
    },
    {
      id: "refrigeration",
      title: "Refrigeration",
      description:
        "Configure alert thresholds for refrigeration system readings",
      ranges: [
        {
          label: "Suction Pressure",
          unit: "PSI",
          min: 20,
          max: 35,
        },
        {
          label: "Discharge Pressure",
          unit: "PSI",
          min: 150,
          max: 200,
        },
        {
          label: "Brine Supply Temperature",
          unit: "\u00B0F",
          min: 12,
          max: 18,
        },
        {
          label: "Brine Return Temperature",
          unit: "\u00B0F",
          min: 16,
          max: 24,
        },
        {
          label: "Condenser Temperature",
          unit: "\u00B0F",
          min: 60,
          max: 95,
        },
      ],
    },
    {
      id: "air-quality",
      title: "Air Quality",
      description:
        "Set thresholds for indoor air quality monitoring sensors",
      ranges: [
        { label: "CO Level", unit: "PPM", min: 0, max: 25 },
        { label: "NO2 Level", unit: "PPM", min: 0, max: 0.5 },
        { label: "Relative Humidity", unit: "%", min: 40, max: 60 },
        { label: "Indoor Temperature", unit: "\u00B0F", min: 50, max: 65 },
      ],
    },
  ]);

  const updateRange = (
    sectionId: string,
    rangeIndex: number,
    field: "min" | "max",
    value: number
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const ranges = s.ranges.map((r, i) =>
          i === rangeIndex ? { ...r, [field]: value } : r
        );
        return { ...s, ranges };
      })
    );
  };

  const handleSave = () => {
    toast({
      title: "Thresholds saved",
      description: "All threshold configurations have been updated.",
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Gauge className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Threshold Configuration
          </h1>
          <p className="text-sm text-slate-500">
            Configure alert thresholds for ice depth, refrigeration, and air
            quality modules
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <p className="text-sm text-slate-500">{section.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.ranges.map((range, index) => (
                  <React.Fragment key={range.label}>
                    {index > 0 && <Separator />}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-48 shrink-0">
                        <Label className="text-sm font-medium">
                          {range.label}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="space-y-1">
                          <span className="text-xs text-slate-400">Min</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={range.min}
                            onChange={(e) =>
                              updateRange(
                                section.id,
                                index,
                                "min",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24"
                          />
                        </div>
                        <span className="text-slate-300 mt-5">-</span>
                        <div className="space-y-1">
                          <span className="text-xs text-slate-400">Max</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={range.max}
                            onChange={(e) =>
                              updateRange(
                                section.id,
                                index,
                                "max",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24"
                          />
                        </div>
                        <span className="text-sm text-slate-500 mt-5">
                          {range.unit}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            Save All Thresholds
          </Button>
        </div>
      </div>
    </div>
  );
}
