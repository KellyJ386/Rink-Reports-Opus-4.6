"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createMeasurement, getRinksWithZones } from "../actions";
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

interface RinkWithZones {
  id: string;
  name: string;
  zones: { id: string; name: string; label: string }[];
}

export default function NewIceDepthMeasurementPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rinks, setRinks] = useState<RinkWithZones[]>([]);
  const [selectedRinkId, setSelectedRinkId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Zone measurements - track depth for each zone
  const [zoneMeasurements, setZoneMeasurements] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    async function loadRinks() {
      const result = await getRinksWithZones();
      if (result.success) {
        setRinks(result.data as RinkWithZones[]);
        if (result.data.length > 0) {
          setSelectedRinkId(result.data[0].id);
        }
      }
      setIsLoading(false);
    }
    loadRinks();
  }, []);

  const selectedRink = rinks.find((r) => r.id === selectedRinkId);
  const zones = selectedRink?.zones ?? [];

  function handleDepthChange(zoneId: string, value: string) {
    setZoneMeasurements((prev) => ({ ...prev, [zoneId]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!selectedRinkId) {
      setError("Please select a rink");
      setIsSubmitting(false);
      return;
    }

    const form = event.currentTarget;
    const formDataBase = new FormData(form);
    const measurementMethod =
      (formDataBase.get("measurement_method") as string) || "manual";
    const notes = formDataBase.get("notes") as string;

    // Submit a measurement for each zone that has a value
    const zonesWithValues = zones.filter(
      (z) => zoneMeasurements[z.id] && parseFloat(zoneMeasurements[z.id]) > 0
    );

    if (zonesWithValues.length === 0) {
      setError("Please enter at least one zone measurement");
      setIsSubmitting(false);
      return;
    }

    const errors: string[] = [];
    let successCount = 0;

    for (const zone of zonesWithValues) {
      const formData = new FormData();
      formData.set("rink_id", selectedRinkId);
      formData.set("zone_id", zone.id);
      formData.set("depth_inches", zoneMeasurements[zone.id]);
      formData.set("measurement_method", measurementMethod);
      if (notes) formData.set("notes", notes);
      formData.set("event_time", new Date().toISOString());

      const result = await createMeasurement(formData);
      if (result.success) {
        successCount++;
      } else {
        errors.push(`${zone.name}: ${result.error}`);
      }
    }

    if (errors.length > 0) {
      setError(
        `Saved ${successCount} measurements. Errors: ${errors.join("; ")}`
      );
      setIsSubmitting(false);
    } else {
      router.push("/ice-depth");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Measurement</h1>
          <p className="mt-1 text-muted-foreground">Loading rink data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Ice Depth Measurement</h1>
        <p className="mt-1 text-muted-foreground">
          Record ice depth measurements for all zones in a rink.
        </p>
      </div>

      {rinks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No rinks configured for this facility. An administrator needs to set up
              rinks and zones in the Admin Control Center before measurements can be recorded.
            </p>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/ice-depth">Back to Ice Depth</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Rink Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Rink</CardTitle>
                <CardDescription>
                  Choose the rink to record measurements for.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {rinks.map((rink) => (
                    <Button
                      key={rink.id}
                      type="button"
                      variant={selectedRinkId === rink.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedRinkId(rink.id);
                        setZoneMeasurements({});
                      }}
                    >
                      {rink.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Zone Measurements */}
            <Card>
              <CardHeader>
                <CardTitle>Zone Measurements</CardTitle>
                <CardDescription>
                  Enter the ice depth (in inches) for each zone. Leave blank to skip a zone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 rounded-md border border-alert-red/50 bg-alert-red/5 p-3">
                    <p className="text-sm text-alert-red">{error}</p>
                  </div>
                )}

                {zones.length === 0 ? (
                  <p className="text-muted-foreground">
                    No zones configured for this rink. Set up zones in the Admin Control Center.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {zones.map((zone) => (
                      <div key={zone.id} className="space-y-2">
                        <Label htmlFor={`zone-${zone.id}`}>
                          {zone.label || zone.name}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`zone-${zone.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            placeholder="0.00"
                            value={zoneMeasurements[zone.id] ?? ""}
                            onChange={(e) =>
                              handleDepthChange(zone.id, e.target.value)
                            }
                            className="max-w-[140px]"
                          />
                          <span className="text-sm text-muted-foreground">inches</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Measurement Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="measurement_method">Measurement Method</Label>
                  <select
                    id="measurement_method"
                    name="measurement_method"
                    defaultValue="manual"
                    className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="manual">Manual (Drill + Ruler)</option>
                    <option value="bluetooth_caliper">Bluetooth Caliper</option>
                    <option value="ultrasonic">Ultrasonic</option>
                    <option value="estimated">Estimated</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any observations about ice condition, surface quality, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/ice-depth">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || zones.length === 0}
                  className="bg-action-green hover:bg-action-green-hover text-white"
                >
                  {isSubmitting ? "Saving..." : "Save Measurements"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}
