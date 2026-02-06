import Link from "next/link";
import { notFound } from "next/navigation";
import { getReading } from "../actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ReadingDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatNumber(value: number | null, unit: string) {
  if (value === null || value === undefined) return "--";
  return `${value}${unit}`;
}

export default async function ReadingDetailPage({
  params,
}: ReadingDetailPageProps) {
  const { id } = await params;

  const result = await getReading(id);

  if (!result.success) {
    notFound();
  }

  const reading = result.data;

  // Group readings into logical sections
  const pressureReadings = [
    {
      label: "Suction Pressure",
      value: reading.suction_pressure_psi,
      unit: " psi",
    },
    {
      label: "Discharge Pressure",
      value: reading.discharge_pressure_psi,
      unit: " psi",
    },
    { label: "Oil Pressure", value: reading.oil_pressure_psi, unit: " psi" },
    {
      label: "Condenser Pressure",
      value: reading.condenser_pressure_psi,
      unit: " psi",
    },
  ];

  const temperatureReadings = [
    {
      label: "Suction Temp",
      value: reading.suction_temperature_f,
      unit: "°F",
    },
    {
      label: "Discharge Temp",
      value: reading.discharge_temperature_f,
      unit: "°F",
    },
    { label: "Oil Temp", value: reading.oil_temperature_f, unit: "°F" },
    {
      label: "Condenser Temp",
      value: reading.condenser_temperature_f,
      unit: "°F",
    },
    {
      label: "Brine Supply Temp",
      value: reading.brine_supply_temperature_f,
      unit: "°F",
    },
    {
      label: "Brine Return Temp",
      value: reading.brine_return_temperature_f,
      unit: "°F",
    },
    { label: "Slab Temp", value: reading.slab_temperature_f, unit: "°F" },
  ];

  const environmentReadings = [
    { label: "Room Temperature", value: reading.room_temperature_f, unit: "°F" },
    {
      label: "Room Humidity",
      value: reading.room_humidity_percent,
      unit: "%",
    },
  ];

  const hasPressureData = pressureReadings.some((r) => r.value !== null);
  const hasTemperatureData = temperatureReadings.some((r) => r.value !== null);
  const hasEnvironmentData = environmentReadings.some((r) => r.value !== null);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/refrigeration">
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Refrigeration Reading
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {formatDateTime(reading.event_time)}
            </Badge>
            {reading.is_flagged && (
              <Badge variant="destructive">Flagged</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Pressure Readings */}
      {hasPressureData && (
        <Card>
          <CardHeader>
            <CardTitle>Pressure Readings</CardTitle>
            <CardDescription>Compressor pressure values in PSI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {pressureReadings.map((item) => (
                <div key={item.label}>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </h4>
                  <p className="mt-1 text-lg font-semibold">
                    {formatNumber(item.value, item.unit)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Temperature Readings */}
      {hasTemperatureData && (
        <Card>
          <CardHeader>
            <CardTitle>Temperature Readings</CardTitle>
            <CardDescription>System temperatures in Fahrenheit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {temperatureReadings.map((item) => (
                <div key={item.label}>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </h4>
                  <p className="mt-1 text-lg font-semibold">
                    {formatNumber(item.value, item.unit)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environment Readings */}
      {hasEnvironmentData && (
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Room conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {environmentReadings.map((item) => (
                <div key={item.label}>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </h4>
                  <p className="mt-1 text-lg font-semibold">
                    {formatNumber(item.value, item.unit)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes and Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reading.notes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Notes
              </h4>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {reading.notes}
              </p>
            </div>
          )}

          {reading.notes && <Separator />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Recorded At
              </h4>
              <p className="mt-1 text-sm">
                {formatDateTime(reading.event_time)}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Created At
              </h4>
              <p className="mt-1 text-sm">
                {formatDateTime(reading.created_at)}
              </p>
            </div>
            {reading.equipment_id && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Equipment ID
                </h4>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {reading.equipment_id}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Status
              </h4>
              <p className="mt-1 text-sm">
                {reading.is_flagged ? (
                  <Badge variant="destructive">Flagged for Review</Badge>
                ) : (
                  <Badge variant="secondary">Normal</Badge>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No data fallback */}
      {!hasPressureData && !hasTemperatureData && !hasEnvironmentData && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No measurement values recorded for this reading.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
