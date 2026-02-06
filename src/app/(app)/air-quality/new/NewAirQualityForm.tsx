"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createReading } from "../actions";
import type { Rink } from "@/lib/types/database";

interface NewAirQualityFormProps {
  rinks: Rink[];
}

export function NewAirQualityForm({ rinks }: NewAirQualityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rinkId, setRinkId] = useState("");
  const [isFlagged, setIsFlagged] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setErrorMessage(null);

    if (rinkId && rinkId !== "none") {
      formData.set("rink_id", rinkId);
    }
    formData.set("is_flagged", isFlagged ? "true" : "false");

    const result = await createReading(formData);
    setLoading(false);

    if (result.success) {
      router.push("/air-quality");
    } else {
      setErrorMessage(result.error);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="rounded-md border border-alert-red/50 bg-alert-red/10 p-3 text-sm text-alert-red">
          {errorMessage}
        </div>
      )}

      {/* Location & Time */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Specify where and when the reading was taken
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Rink</Label>
              <Select value={rinkId} onValueChange={setRinkId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rink (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None / General</SelectItem>
                  {rinks.map((rink) => (
                    <SelectItem key={rink.id} value={rink.id}>
                      {rink.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_time">Reading Time</Label>
              <Input
                id="event_time"
                name="event_time"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Specific Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g., Center ice, Zamboni bay, Bleachers"
            />
          </div>
        </CardContent>
      </Card>

      {/* Gas Readings */}
      <Card>
        <CardHeader>
          <CardTitle>Gas Levels</CardTitle>
          <CardDescription>
            Carbon monoxide and nitrogen dioxide concentrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="co_ppm">CO (Carbon Monoxide)</Label>
              <div className="relative">
                <Input
                  id="co_ppm"
                  name="co_ppm"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  ppm
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Warning: &gt;10 ppm | Alert: &gt;25 ppm
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="no2_ppm">NO2 (Nitrogen Dioxide)</Label>
              <div className="relative">
                <Input
                  id="no2_ppm"
                  name="no2_ppm"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  ppm
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Warning: &gt;0.5 ppm | Alert: &gt;1 ppm
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment */}
      <Card>
        <CardHeader>
          <CardTitle>Environmental Conditions</CardTitle>
          <CardDescription>Temperature and humidity readings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="temperature_f">Temperature</Label>
              <div className="relative">
                <Input
                  id="temperature_f"
                  name="temperature_f"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  °F
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="humidity_percent">Humidity</Label>
              <div className="relative">
                <Input
                  id="humidity_percent"
                  name="humidity_percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="0.0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Flag */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any observations, odors, visible haze, etc..."
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_flagged"
              checked={isFlagged}
              onCheckedChange={(checked) => setIsFlagged(checked === true)}
            />
            <Label htmlFor="is_flagged" className="text-sm font-normal">
              Flag this reading for review (e.g., suspected equipment issue)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/air-quality")}
        >
          Back
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Reading"}
        </Button>
      </div>
    </form>
  );
}
