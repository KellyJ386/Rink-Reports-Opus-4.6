"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIncident } from "../actions";
import type { Rink } from "@/lib/types/database";

interface NewIncidentFormProps {
  rinks: Rink[];
}

const INCIDENT_TYPES = [
  { value: "injury", label: "Injury" },
  { value: "equipment_failure", label: "Equipment Failure" },
  { value: "safety_hazard", label: "Safety Hazard" },
  { value: "property_damage", label: "Property Damage" },
  { value: "near_miss", label: "Near Miss" },
  { value: "other", label: "Other" },
];

const SEVERITY_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function NewIncidentForm({ rinks }: NewIncidentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [rinkId, setRinkId] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setErrorMessage(null);

    // Add select values to formData since radix selects don't use native form values
    formData.set("type", type);
    formData.set("severity", severity);
    if (rinkId && rinkId !== "none") {
      formData.set("rink_id", rinkId);
    }

    const result = await createIncident(formData);
    setLoading(false);

    if (result.success) {
      router.push(`/incidents/${result.data.id}`);
    } else {
      setErrorMessage(result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="rounded-md border border-alert-red/50 bg-alert-red/10 p-3 text-sm text-alert-red">
              {errorMessage}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Brief description of the incident"
              required
            />
          </div>

          {/* Type & Severity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Incident Type *</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity *</Label>
              <Select value={severity} onValueChange={setSeverity} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_LEVELS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rink & Location */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Rink</Label>
              <Select value={rinkId} onValueChange={setRinkId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rink (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {rinks.map((rink) => (
                    <SelectItem key={rink.id} value={rink.id}>
                      {rink.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="Where did this occur?"
              />
            </div>
          </div>

          {/* Date/Time */}
          <div className="space-y-2">
            <Label htmlFor="event_time">Date and Time of Incident</Label>
            <Input
              id="event_time"
              name="event_time"
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detailed description of what happened..."
              rows={4}
              required
            />
          </div>

          {/* Injured Party */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Injured Party (if applicable)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="injured_party_name">Name</Label>
                <Input
                  id="injured_party_name"
                  name="injured_party_name"
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="injured_party_contact">Contact Info</Label>
                <Input
                  id="injured_party_contact"
                  name="injured_party_contact"
                  placeholder="Phone or email"
                />
              </div>
            </div>
          </div>

          {/* Witnesses */}
          <div className="space-y-2">
            <Label htmlFor="witnesses">Witnesses</Label>
            <Textarea
              id="witnesses"
              name="witnesses"
              placeholder="Names and contact info of any witnesses..."
              rows={2}
            />
          </div>

          {/* Immediate Action */}
          <div className="space-y-2">
            <Label htmlFor="immediate_action">Immediate Action Taken</Label>
            <Textarea
              id="immediate_action"
              name="immediate_action"
              placeholder="What steps were taken immediately following the incident?"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !type || !severity}>
              {loading ? "Submitting..." : "Submit Incident Report"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
