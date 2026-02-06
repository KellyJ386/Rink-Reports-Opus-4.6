"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { updateFacility } from "@/app/(app)/admin/actions";
import type { Facility } from "@/lib/types/database";
import { Loader2, Save } from "lucide-react";

interface FacilitySettingsProps {
  facilityId: string;
  facility: Facility | null;
}

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Honolulu",
  "America/Phoenix",
  "America/Toronto",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Halifax",
  "America/St_Johns",
  "America/Regina",
];

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
];

export function FacilitySettings({
  facilityId,
  facility,
}: FacilitySettingsProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    address_line1: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "US",
    timezone: "America/New_York",
    phone: "",
    email: "",
    website: "",
    number_of_rinks: 1,
    session_duration_hours: 8,
  });

  useEffect(() => {
    if (facility) {
      setFormData({
        name: facility.name || "",
        short_name: facility.short_name || "",
        address_line1: facility.address_line1 || "",
        city: facility.city || "",
        state_province: facility.state_province || "",
        postal_code: facility.postal_code || "",
        country: facility.country || "US",
        timezone: facility.timezone || "America/New_York",
        phone: facility.phone || "",
        email: facility.email || "",
        website: facility.website || "",
        number_of_rinks: facility.number_of_rinks || 1,
        session_duration_hours: facility.session_duration_hours || 8,
      });
    }
  }, [facility]);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await updateFacility(facilityId, formData);

      if (result.success) {
        toast({
          title: "Facility updated",
          description: "Your facility settings have been saved successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update facility settings.",
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
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facility Settings</CardTitle>
        <CardDescription>
          Manage your facility&apos;s basic information and configuration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Basic Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Facility Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Maple Leaf Ice Centre"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="short_name">Short Name</Label>
                <Input
                  id="short_name"
                  value={formData.short_name}
                  onChange={(e) => handleChange("short_name", e.target.value)}
                  placeholder="e.g. MLIC"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Address
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address_line1">Street Address</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={(e) =>
                    handleChange("address_line1", e.target.value)
                  }
                  placeholder="123 Arena Boulevard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Toronto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state_province">State / Province</Label>
                <Input
                  id="state_province"
                  value={formData.state_province}
                  onChange={(e) =>
                    handleChange("state_province", e.target.value)
                  }
                  placeholder="ON"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange("postal_code", e.target.value)}
                  placeholder="M5V 1A1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(val) => handleChange("country", val)}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Contact Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(416) 555-0100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="admin@facility.com"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://www.facility.com"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Operations */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Operations
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(val) => handleChange("timezone", val)}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, " ").replace("America/", "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="number_of_rinks">Number of Rinks</Label>
                <Input
                  id="number_of_rinks"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.number_of_rinks}
                  onChange={(e) =>
                    handleChange("number_of_rinks", parseInt(e.target.value) || 1)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_duration_hours">
                  Session Duration (hours)
                </Label>
                <Input
                  id="session_duration_hours"
                  type="number"
                  min={1}
                  max={24}
                  step={0.5}
                  value={formData.session_duration_hours}
                  onChange={(e) =>
                    handleChange(
                      "session_duration_hours",
                      parseFloat(e.target.value) || 8
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 8-12 hours
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
