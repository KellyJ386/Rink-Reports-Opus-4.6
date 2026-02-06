import Link from "next/link";
import { getIceDepthMeasurements, getIceEvents, getRinksWithZones } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { RinkSelector } from "./RinkSelector";

interface IceDepthPageProps {
  searchParams: Promise<{ rink?: string }>;
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDepth(inches: number) {
  return `${inches.toFixed(2)}\"`;
}

function getEventTypeBadge(eventType: string) {
  switch (eventType) {
    case "cut":
      return { label: "Cut", variant: "secondary" as const, color: "" };
    case "flood":
      return {
        label: "Flood",
        variant: "default" as const,
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
    case "full_resurface":
      return {
        label: "Full Resurface",
        variant: "default" as const,
        color: "bg-action-green/10 text-action-green border-action-green/20",
      };
    case "patch":
      return {
        label: "Patch",
        variant: "outline" as const,
        color: "",
      };
    default:
      return { label: eventType, variant: "secondary" as const, color: "" };
  }
}

export default async function IceDepthPage({ searchParams }: IceDepthPageProps) {
  const { rink: selectedRinkId } = await searchParams;

  const [measurementsResult, eventsResult, rinksResult] = await Promise.all([
    getIceDepthMeasurements(selectedRinkId),
    getIceEvents(selectedRinkId),
    getRinksWithZones(),
  ]);

  const measurements = measurementsResult.success ? measurementsResult.data : [];
  const events = eventsResult.success ? eventsResult.data : [];
  const rinks = rinksResult.success ? rinksResult.data : [];
  const error =
    (!measurementsResult.success ? measurementsResult.error : null) ||
    (!eventsResult.success ? eventsResult.error : null);

  // Summary stats
  const flaggedCount = measurements.filter((m) => m.is_flagged).length;
  const latestMeasurement = measurements.length > 0 ? measurements[0] : null;
  const avgDepth =
    measurements.length > 0
      ? measurements.reduce((sum, m) => sum + m.depth_inches, 0) / measurements.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ice Depth Management</h1>
          <p className="mt-1 text-muted-foreground">
            Track ice thickness across rink surfaces and monitor depth trends.
          </p>
        </div>
        <Button asChild className="bg-action-green hover:bg-action-green-hover text-white">
          <Link href="/ice-depth/new">New Measurement</Link>
        </Button>
      </div>

      {/* Rink Selector */}
      {rinks.length > 0 && (
        <RinkSelector
          rinks={rinks.map((r) => ({ id: r.id, name: r.name }))}
          selectedRinkId={selectedRinkId}
        />
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Latest Depth</CardDescription>
            <CardTitle className="text-2xl">
              {latestMeasurement ? formatDepth(latestMeasurement.depth_inches) : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {latestMeasurement
                ? `${latestMeasurement.zone_name ?? "Unknown zone"} - ${formatDateTime(latestMeasurement.event_time)}`
                : "No measurements recorded"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Depth</CardDescription>
            <CardTitle className="text-2xl">
              {measurements.length > 0 ? formatDepth(avgDepth) : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Across {measurements.length} recent measurements
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Flagged</CardDescription>
            <CardTitle className={`text-2xl ${flaggedCount > 0 ? "text-alert-yellow" : ""}`}>
              {flaggedCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Measurements outside threshold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-alert-red/50 bg-alert-red/5">
          <CardContent className="pt-6">
            <p className="text-alert-red">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Measurements</CardTitle>
          <CardDescription>
            Latest ice depth measurements{selectedRinkId ? " for the selected rink" : " across all rinks"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {measurements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No measurements recorded
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Record your first ice depth measurement to begin tracking.
              </p>
              <Button
                asChild
                className="mt-4 bg-action-green hover:bg-action-green-hover text-white"
              >
                <Link href="/ice-depth/new">Record Measurement</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="space-y-3 md:hidden">
                {measurements.map((m) => (
                  <Card key={m.id} className={m.is_flagged ? "border-alert-yellow" : ""}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-1">
                        <p className="font-medium">{formatDepth(m.depth_inches)}</p>
                        <p className="text-sm text-muted-foreground">
                          {m.rink_name ?? "Unknown rink"} - {m.zone_name ?? "Unknown zone"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(m.event_time)} by {m.measured_by_name ?? "Unknown"}
                        </p>
                      </div>
                      {m.is_flagged && (
                        <Badge variant="outline" className="border-alert-yellow text-alert-yellow">
                          Flagged
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Rink</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Depth</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Measured By</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {measurements.map((m) => (
                      <TableRow key={m.id} className={m.is_flagged ? "bg-alert-yellow/5" : ""}>
                        <TableCell>{formatDateTime(m.event_time)}</TableCell>
                        <TableCell>{m.rink_name ?? "--"}</TableCell>
                        <TableCell>{m.zone_name ?? "--"}</TableCell>
                        <TableCell className="font-medium">
                          {formatDepth(m.depth_inches)}
                        </TableCell>
                        <TableCell className="capitalize">{m.measurement_method}</TableCell>
                        <TableCell>{m.measured_by_name ?? "--"}</TableCell>
                        <TableCell>
                          {m.is_flagged ? (
                            <Badge variant="outline" className="border-alert-yellow text-alert-yellow">
                              Flagged
                            </Badge>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Ice Events Section */}
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Recent Ice Events</CardTitle>
          <CardDescription>
            Cuts, floods, resurfaces, and patches{selectedRinkId ? " for the selected rink" : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No ice events recorded yet.
            </p>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="space-y-3 md:hidden">
                {events.map((evt) => {
                  const badge = getEventTypeBadge(evt.event_type);
                  return (
                    <Card key={evt.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="space-y-1">
                          <Badge variant={badge.variant} className={badge.color}>
                            {badge.label}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {evt.rink_name ?? "Unknown rink"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(evt.event_time)} by {evt.performed_by_name ?? "Unknown"}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          {evt.depth_removed_inches !== null && (
                            <p className="text-alert-red">-{evt.depth_removed_inches}\"</p>
                          )}
                          {evt.depth_added_inches !== null && (
                            <p className="text-action-green">+{evt.depth_added_inches}\"</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Rink</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Depth Removed</TableHead>
                      <TableHead>Depth Added</TableHead>
                      <TableHead>Water Temp</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((evt) => {
                      const badge = getEventTypeBadge(evt.event_type);
                      return (
                        <TableRow key={evt.id}>
                          <TableCell>{formatDateTime(evt.event_time)}</TableCell>
                          <TableCell>{evt.rink_name ?? "--"}</TableCell>
                          <TableCell>
                            <Badge variant={badge.variant} className={badge.color}>
                              {badge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {evt.depth_removed_inches !== null
                              ? `${evt.depth_removed_inches}\"`
                              : "--"}
                          </TableCell>
                          <TableCell>
                            {evt.depth_added_inches !== null
                              ? `${evt.depth_added_inches}\"`
                              : "--"}
                          </TableCell>
                          <TableCell>
                            {evt.water_temperature_f !== null
                              ? `${evt.water_temperature_f}°F`
                              : "--"}
                          </TableCell>
                          <TableCell>{evt.performed_by_name ?? "--"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
