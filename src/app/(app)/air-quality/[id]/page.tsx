import Link from "next/link";
import { notFound } from "next/navigation";
import { getAirQualityReading } from "../actions";
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

interface AirQualityDetailPageProps {
  params: Promise<{ id: string }>;
}

// ============================================================
// THRESHOLD HELPERS
// ============================================================

function getCoStatus(ppm: number | null): "normal" | "warning" | "alert" {
  if (ppm === null) return "normal";
  if (ppm > 25) return "alert";
  if (ppm > 10) return "warning";
  return "normal";
}

function getNo2Status(ppm: number | null): "normal" | "warning" | "alert" {
  if (ppm === null) return "normal";
  if (ppm > 1) return "alert";
  if (ppm > 0.5) return "warning";
  return "normal";
}

function getStatusBadgeProps(status: "normal" | "warning" | "alert") {
  switch (status) {
    case "alert":
      return {
        className: "bg-alert-red text-white border-alert-red",
        label: "Alert",
      };
    case "warning":
      return {
        className: "bg-alert-yellow text-black border-alert-yellow",
        label: "Warning",
      };
    case "normal":
      return {
        className: "bg-action-green text-white border-action-green",
        label: "Normal",
      };
  }
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

function formatValue(value: number | null, unit: string): string {
  if (value === null) return "Not recorded";
  return `${value}${unit}`;
}

export default async function AirQualityDetailPage({
  params,
}: AirQualityDetailPageProps) {
  const { id } = await params;

  const result = await getAirQualityReading(id);

  if (!result.success) {
    notFound();
  }

  const reading = result.data;

  const coStatus = getCoStatus(reading.co_ppm);
  const no2Status = getNo2Status(reading.no2_ppm);
  const overallStatus =
    coStatus === "alert" || no2Status === "alert"
      ? "alert"
      : coStatus === "warning" || no2Status === "warning"
        ? "warning"
        : "normal";
  const overallBadge = getStatusBadgeProps(overallStatus);
  const coBadge = getStatusBadgeProps(coStatus);
  const no2Badge = getStatusBadgeProps(no2Status);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/air-quality">
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Air Quality Reading
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={overallBadge.className}>
              {overallBadge.label}
            </Badge>
            {reading.is_flagged && (
              <Badge variant="destructive">Flagged</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Gas Levels Card */}
      <Card>
        <CardHeader>
          <CardTitle>Gas Levels</CardTitle>
          <CardDescription>
            Recorded on {formatDateTime(reading.event_time)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  CO (Carbon Monoxide)
                </h4>
                <Badge className={coBadge.className}>{coBadge.label}</Badge>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {formatValue(reading.co_ppm, " ppm")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Alert &gt; 25 ppm | Warning &gt; 10 ppm
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  NO2 (Nitrogen Dioxide)
                </h4>
                <Badge className={no2Badge.className}>{no2Badge.label}</Badge>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {formatValue(reading.no2_ppm, " ppm")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Alert &gt; 1 ppm | Warning &gt; 0.5 ppm
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Conditions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Environmental Conditions</CardTitle>
          <CardDescription>
            Temperature and humidity measurements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Temperature
              </h4>
              <p className="mt-2 text-2xl font-bold">
                {formatValue(reading.temperature_f, " °F")}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Humidity
              </h4>
              <p className="mt-2 text-2xl font-bold">
                {formatValue(reading.humidity_percent, "%")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Location
              </h4>
              <p className="mt-1 text-sm">
                {reading.location ?? "Not specified"}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Recorded At
              </h4>
              <p className="mt-1 text-sm">
                {formatDateTime(reading.event_time)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Created
              </h4>
              <p className="mt-1 text-sm">
                {formatDateTime(reading.created_at)}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Flagged
              </h4>
              <p className="mt-1 text-sm">
                {reading.is_flagged ? "Yes" : "No"}
              </p>
            </div>
          </div>

          {reading.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Notes
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {reading.notes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
