"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createIceEvent, getEquipmentList, getRinks } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EVENT_TYPES = [
  { value: "resurfacing", label: "Resurfacing" },
  { value: "flood", label: "Flood" },
  { value: "scrape", label: "Scrape" },
  { value: "edge", label: "Edge" },
  { value: "maintenance", label: "Maintenance" },
] as const;

interface RinkOption {
  id: string;
  name: string;
}

interface EquipmentOption {
  id: string;
  name: string;
  status: string;
}

export default function NewIceEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rinks, setRinks] = useState<RinkOption[]>([]);
  const [equipment, setEquipment] = useState<EquipmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [rinkId, setRinkId] = useState("");
  const [eventType, setEventType] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [waterTemperature, setWaterTemperature] = useState("");
  const [iceTemperature, setIceTemperature] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadData() {
      const [rinksResult, equipmentResult] = await Promise.all([
        getRinks(),
        getEquipmentList(),
      ]);
      if (rinksResult.success) {
        setRinks(rinksResult.data as RinkOption[]);
      }
      if (equipmentResult.success) {
        setEquipment(equipmentResult.data as EquipmentOption[]);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("rink_id", rinkId);
      formData.set("event_type", eventType);
      if (equipmentId) formData.set("equipment_id", equipmentId);
      if (waterTemperature) formData.set("water_temperature", waterTemperature);
      if (iceTemperature) formData.set("ice_temperature", iceTemperature);
      if (durationMinutes) formData.set("duration_minutes", durationMinutes);
      if (notes) formData.set("notes", notes);

      const result = await createIceEvent(formData);

      if (result.success) {
        router.push("/ice-operations");
      } else {
        setError(result.error);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/ice-operations">
            <Button variant="ghost" size="sm">
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Log Ice Event</h1>
            <p className="mt-1 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ice-operations">
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log Ice Event</h1>
          <p className="mt-1 text-muted-foreground">
            Record a new ice operation event
          </p>
        </div>
      </div>

      {rinks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No rinks configured for this facility. An administrator needs to set up
              rinks in the Admin Control Center before events can be logged.
            </p>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/ice-operations">Back to Operations</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                Fill in the details for this ice operation event. Required fields are
                marked with an asterisk.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error display */}
              {error && (
                <div className="rounded-md border border-alert-red/50 bg-alert-red/5 p-3">
                  <p className="text-sm text-alert-red">{error}</p>
                </div>
              )}

              {/* Rink Selection */}
              <div className="space-y-2">
                <Label htmlFor="rink_id">
                  Rink <span className="text-alert-red">*</span>
                </Label>
                <Select value={rinkId} onValueChange={setRinkId}>
                  <SelectTrigger id="rink_id">
                    <SelectValue placeholder="Select a rink" />
                  </SelectTrigger>
                  <SelectContent>
                    {rinks.map((rink) => (
                      <SelectItem key={rink.id} value={rink.id}>
                        {rink.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Type */}
              <div className="space-y-2">
                <Label htmlFor="event_type">
                  Event Type <span className="text-alert-red">*</span>
                </Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger id="event_type">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Equipment Selection */}
              <div className="space-y-2">
                <Label htmlFor="equipment_id">Equipment</Label>
                <Select value={equipmentId} onValueChange={setEquipmentId}>
                  <SelectTrigger id="equipment_id">
                    <SelectValue placeholder="Select equipment (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment
                      .filter((e) => e.status === "active")
                      .map((eq) => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="water_temperature">Water Temperature</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="water_temperature"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 140"
                      value={waterTemperature}
                      onChange={(e) => setWaterTemperature(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">°F</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ice_temperature">Ice Temperature</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="ice_temperature"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 22"
                      value={iceTemperature}
                      onChange={(e) => setIceTemperature(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">°F</span>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="duration_minutes"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 15"
                    className="max-w-[180px]"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any observations about ice condition, equipment performance, etc."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href="/ice-operations">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting || !rinkId || !eventType}
                className="bg-action-green hover:bg-action-green-hover text-white"
              >
                {isSubmitting ? "Saving..." : "Log Event"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
