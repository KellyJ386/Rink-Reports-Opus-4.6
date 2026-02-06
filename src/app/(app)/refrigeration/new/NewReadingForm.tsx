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
import type { Equipment } from "@/lib/types/database";

interface NewReadingFormProps {
  compressors: Equipment[];
}

export function NewReadingForm({ compressors }: NewReadingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [equipmentId, setEquipmentId] = useState("");
  const [isFlagged, setIsFlagged] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setErrorMessage(null);

    if (equipmentId && equipmentId !== "none") {
      formData.set("equipment_id", equipmentId);
    }
    formData.set("is_flagged", isFlagged ? "true" : "false");

    const result = await createReading(formData);
    setLoading(false);

    if (result.success) {
      router.push("/refrigeration");
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

      {/* Compressor & Time */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Select compressor and time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Compressor</Label>
              <Select value={equipmentId} onValueChange={setEquipmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select compressor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {compressors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
        </CardContent>
      </Card>

      {/* Pressure Readings */}
      <Card>
        <CardHeader>
          <CardTitle>Pressure Readings</CardTitle>
          <CardDescription>All values in PSI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="suction_pressure_psi">Suction Pressure</Label>
              <Input
                id="suction_pressure_psi"
                name="suction_pressure_psi"
                type="number"
                step="0.1"
                placeholder="PSI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discharge_pressure_psi">
                Discharge Pressure
              </Label>
              <Input
                id="discharge_pressure_psi"
                name="discharge_pressure_psi"
                type="number"
                step="0.1"
                placeholder="PSI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oil_pressure_psi">Oil Pressure</Label>
              <Input
                id="oil_pressure_psi"
                name="oil_pressure_psi"
                type="number"
                step="0.1"
                placeholder="PSI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condenser_pressure_psi">
                Condenser Pressure
              </Label>
              <Input
                id="condenser_pressure_psi"
                name="condenser_pressure_psi"
                type="number"
                step="0.1"
                placeholder="PSI"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Readings */}
      <Card>
        <CardHeader>
          <CardTitle>Temperature Readings</CardTitle>
          <CardDescription>All values in degrees Fahrenheit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="suction_temperature_f">Suction Temp</Label>
              <Input
                id="suction_temperature_f"
                name="suction_temperature_f"
                type="number"
                step="0.1"
                placeholder="°F"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discharge_temperature_f">Discharge Temp</Label>
              <Input
                id="discharge_temperature_f"
                name="discharge_temperature_f"
                type="number"
                step="0.1"
                placeholder="°F"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oil_temperature_f">Oil Temp</Label>
              <Input
                id="oil_temperature_f"
                name="oil_temperature_f"
                type="number"
                step="0.1"
                placeholder="°F"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condenser_temperature_f">Condenser Temp</Label>
              <Input
                id="condenser_temperature_f"
                name="condenser_temperature_f"
                type="number"
                step="0.1"
                placeholder="°F"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brine_supply_temperature_f">
                Brine Supply Temp
              </Label>
              <Input
                id="brine_supply_temperature_f"
                name="brine_supply_temperature_f"
                type="number"
                step="0.1"
                placeholder="°F"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brine_return_temperature_f">
                Brine Return Temp
              </Label>
              <Input
                id="brine_return_temperature_f"
                name="brine_return_temperature_f"
                type="number"
                step="0.1"
                placeholder="°F"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slab_temperature_f">Slab Temp</Label>
              <Input
                id="slab_temperature_f"
                name="slab_temperature_f"
                type="number"
                step="0.1"
                placeholder="°F"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment */}
      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>Room conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="room_temperature_f">Room Temperature</Label>
              <Input
                id="room_temperature_f"
                name="room_temperature_f"
                type="number"
                step="0.1"
                placeholder="°F"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room_humidity_percent">Room Humidity</Label>
              <Input
                id="room_humidity_percent"
                name="room_humidity_percent"
                type="number"
                step="0.1"
                placeholder="%"
              />
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
              placeholder="Any observations or concerns..."
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
              Flag this reading for review
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Reading"}
        </Button>
      </div>
    </form>
  );
}
