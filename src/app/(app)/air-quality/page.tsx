import Link from "next/link";
import { getAirQualityReadings } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  if (value === null) return "--";
  return `${value}${unit}`;
}

export default async function AirQualityPage() {
  const result = await getAirQualityReadings();
  const readings = result.success ? result.data : [];

  // Get the latest reading for stat cards
  const latestReading = readings.length > 0 ? readings[0] : null;

  const latestCoStatus = latestReading
    ? getCoStatus(latestReading.co_ppm)
    : "normal";
  const latestNo2Status = latestReading
    ? getNo2Status(latestReading.no2_ppm)
    : "normal";

  const coBadge = getStatusBadgeProps(latestCoStatus);
  const no2Badge = getStatusBadgeProps(latestNo2Status);

  // Count flagged readings
  const flaggedCount = readings.filter((r) => r.is_flagged).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Air Quality</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor CO, NO2, humidity, and temperature readings
          </p>
        </div>
        <Link href="/air-quality/new">
          <Button>New Reading</Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>CO (ppm)</CardDescription>
              <Badge className={coBadge.className}>{coBadge.label}</Badge>
            </div>
            <CardTitle className="text-2xl">
              {latestReading
                ? formatValue(latestReading.co_ppm, " ppm")
                : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Alert &gt; 25 ppm | Warning &gt; 10 ppm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>NO2 (ppm)</CardDescription>
              <Badge className={no2Badge.className}>{no2Badge.label}</Badge>
            </div>
            <CardTitle className="text-2xl">
              {latestReading
                ? formatValue(latestReading.no2_ppm, " ppm")
                : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Alert &gt; 1 ppm | Warning &gt; 0.5 ppm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Humidity</CardDescription>
            <CardTitle className="text-2xl">
              {latestReading
                ? formatValue(latestReading.humidity_percent, "%")
                : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {latestReading
                ? `Last: ${formatDateTime(latestReading.event_time)}`
                : "No readings"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Temperature</CardDescription>
            <CardTitle className="text-2xl">
              {latestReading
                ? formatValue(latestReading.temperature_f, " °F")
                : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {flaggedCount > 0
                ? `${flaggedCount} flagged reading${flaggedCount !== 1 ? "s" : ""}`
                : "No flagged readings"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Readings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Readings</CardTitle>
          <CardDescription>
            Air quality measurements recorded at this facility
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No readings recorded
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Air quality readings will appear here when submitted
              </p>
              <Link href="/air-quality/new" className="mt-4">
                <Button variant="outline">Record First Reading</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">CO (ppm)</TableHead>
                    <TableHead className="text-right">NO2 (ppm)</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      Humidity
                    </TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      Temp
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => {
                    const coStatus = getCoStatus(reading.co_ppm);
                    const no2Status = getNo2Status(reading.no2_ppm);
                    // Worst status wins
                    const overallStatus =
                      coStatus === "alert" || no2Status === "alert"
                        ? "alert"
                        : coStatus === "warning" || no2Status === "warning"
                          ? "warning"
                          : "normal";
                    const statusBadge = getStatusBadgeProps(overallStatus);

                    return (
                      <TableRow key={reading.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDateTime(reading.event_time)}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm">
                          {reading.location ?? "--"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {reading.co_ppm !== null ? reading.co_ppm : "--"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {reading.no2_ppm !== null ? reading.no2_ppm : "--"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm hidden sm:table-cell">
                          {reading.humidity_percent !== null
                            ? `${reading.humidity_percent}%`
                            : "--"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm hidden md:table-cell">
                          {reading.temperature_f !== null
                            ? `${reading.temperature_f}°F`
                            : "--"}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/air-quality/${reading.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
