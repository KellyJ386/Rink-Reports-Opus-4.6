"use client";

import React, { useState } from "react";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "America/Toronto", label: "Eastern Time - Canada" },
  { value: "America/Winnipeg", label: "Central Time - Canada" },
  { value: "America/Edmonton", label: "Mountain Time - Canada" },
  { value: "America/Vancouver", label: "Pacific Time - Canada" },
  { value: "America/Halifax", label: "Atlantic Time - Canada" },
  { value: "America/St_Johns", label: "Newfoundland Time - Canada" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface OperatingHour {
  closed: boolean;
  openTime: string;
  closeTime: string;
}

export default function FacilitySettingsPage() {
  const { toast } = useToast();

  const [facilityName, setFacilityName] = useState("MFO Ice Arena");
  const [address, setAddress] = useState(
    "123 Arena Drive\nIce City, ON M5V 2T6"
  );
  const [timezone, setTimezone] = useState("America/Toronto");
  const [seasonal, setSeasonal] = useState(false);
  const [openMonths, setOpenMonths] = useState<string[]>([
    "September",
    "October",
    "November",
    "December",
    "January",
    "February",
    "March",
    "April",
  ]);
  const [sessionDuration, setSessionDuration] = useState(2);
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>(
    DAYS.map(() => ({
      closed: false,
      openTime: "06:00",
      closeTime: "23:00",
    }))
  );

  const toggleMonth = (month: string) => {
    setOpenMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month]
    );
  };

  const updateOperatingHour = (
    index: number,
    field: keyof OperatingHour,
    value: string | boolean
  ) => {
    setOperatingHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    );
  };

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Facility settings have been updated successfully.",
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Facility Settings
          </h1>
          <p className="text-sm text-slate-500">
            Manage your facility information, hours, and operations
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facility-name">
                Facility Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="facility-name"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="Enter facility name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter facility address"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Seasonal Operation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seasonal Operation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="seasonal-toggle">Seasonal Operation</Label>
                <p className="text-sm text-slate-500">
                  Enable if your facility operates seasonally
                </p>
              </div>
              <Switch
                id="seasonal-toggle"
                checked={seasonal}
                onCheckedChange={setSeasonal}
              />
            </div>

            {seasonal && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label>Open Months</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {MONTHS.map((month) => (
                      <div
                        key={month}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`month-${month}`}
                          checked={openMonths.includes(month)}
                          onCheckedChange={() => toggleMonth(month)}
                        />
                        <Label
                          htmlFor={`month-${month}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {month.slice(0, 3)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="session-duration">
                Session Duration (hours)
              </Label>
              <Input
                id="session-duration"
                type="number"
                min={1}
                max={24}
                value={sessionDuration}
                onChange={(e) =>
                  setSessionDuration(parseInt(e.target.value) || 1)
                }
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operating Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DAYS.map((day, index) => (
                <div
                  key={day}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-b last:border-0"
                >
                  <div className="w-28 shrink-0">
                    <span className="text-sm font-medium">{day}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      id={`closed-${day}`}
                      checked={operatingHours[index].closed}
                      onCheckedChange={(checked) =>
                        updateOperatingHour(index, "closed", checked)
                      }
                    />
                    <Label
                      htmlFor={`closed-${day}`}
                      className="text-sm text-slate-500"
                    >
                      Closed
                    </Label>
                  </div>

                  {!operatingHours[index].closed && (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={operatingHours[index].openTime}
                        onChange={(e) =>
                          updateOperatingHour(
                            index,
                            "openTime",
                            e.target.value
                          )
                        }
                        className="w-32"
                      />
                      <span className="text-sm text-slate-400">to</span>
                      <Input
                        type="time"
                        value={operatingHours[index].closeTime}
                        onChange={(e) =>
                          updateOperatingHour(
                            index,
                            "closeTime",
                            e.target.value
                          )
                        }
                        className="w-32"
                      />
                    </div>
                  )}

                  {operatingHours[index].closed && (
                    <div className="flex-1">
                      <span className="text-sm text-slate-400 italic">
                        Facility closed
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
