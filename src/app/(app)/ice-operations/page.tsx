import Link from "next/link";
import { getIceEvents, getIceMakes, getIceMaintenanceLogs, getEquipmentList } from "./actions";
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
import { IceOperationsFilter } from "./IceOperationsFilter";

// ---------------------------------------------------------------------------
// Helper formatters
// ---------------------------------------------------------------------------

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getEventTypeBadge(type: string) {
  switch (type) {
    case "resurfacing":
      return {
        label: "Resurfacing",
        className: "bg-action-green/10 text-action-green border-action-green/20",
      };
    case "flood":
      return {
        label: "Flood",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
    case "scrape":
      return {
        label: "Scrape",
        className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      };
    case "edge":
      return {
        label: "Edge",
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      };
    case "maintenance":
      return {
        label: "Maintenance",
        className: "bg-alert-yellow/10 text-alert-yellow border-alert-yellow/20",
      };
    default:
      return {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        className: "",
      };
  }
}

// ---------------------------------------------------------------------------
// Page props (searchParams for filtering)
// ---------------------------------------------------------------------------
interface IceOperationsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function IceOperationsPage({
  searchParams,
}: IceOperationsPageProps) {
  const { filter } = await searchParams;
  const activeFilter = filter || "all";

  const [iceEventsResult, iceMakesResult, maintenanceResult, equipmentResult] =
    await Promise.all([
      getIceEvents(activeFilter),
      getIceMakes(),
      getIceMaintenanceLogs(),
      getEquipmentList(),
    ]);

  const iceEvents = iceEventsResult.success ? iceEventsResult.data : [];
  const iceMakes = iceMakesResult.success ? iceMakesResult.data : [];
  const maintenanceLogs = maintenanceResult.success ? maintenanceResult.data : [];
  const equipment = equipmentResult.success ? equipmentResult.data : [];

  const error =
    (!iceEventsResult.success ? iceEventsResult.error : null) ||
    (!iceMakesResult.success ? iceMakesResult.error : null) ||
    (!maintenanceResult.success ? maintenanceResult.error : null);

  // Summary stats
  const todayStr = new Date().toISOString().split("T")[0];
  const todayEvents = iceEvents.filter(
    (e) => e.created_at.startsWith(todayStr)
  ).length;
  const todayMakes = iceMakes.filter(
    (m) => m.event_time.startsWith(todayStr)
  ).length;
  const equipmentNeedingMaintenance = equipment.filter(
    (e) =>
      e.next_maintenance_at &&
      new Date(e.next_maintenance_at) <= new Date()
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ice Operations</h1>
          <p className="mt-1 text-muted-foreground">
            Track resurfacing events, equipment usage, and maintenance
          </p>
        </div>
        <Link href="/ice-operations/new">
          <Button className="bg-action-green hover:bg-action-green-hover text-white">
            Log Event
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today&apos;s Events</CardDescription>
            <CardTitle className="text-2xl">{todayEvents}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Ice events logged today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today&apos;s Ice Makes</CardDescription>
            <CardTitle className="text-2xl">{todayMakes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Resurfacing runs today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Maintenance Due</CardDescription>
            <CardTitle
              className={`text-2xl ${equipmentNeedingMaintenance > 0 ? "text-alert-yellow" : ""}`}
            >
              {equipmentNeedingMaintenance}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Equipment needing service</p>
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

      {/* Ice Events Table with Filter Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent Ice Events</CardTitle>
              <CardDescription>
                Ice events across all rinks. Use filters to narrow results.
              </CardDescription>
            </div>
          </div>
          {/* Filter Tabs */}
          <IceOperationsFilter activeFilter={activeFilter} />
        </CardHeader>
        <CardContent>
          {iceEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No ice events found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeFilter !== "all"
                  ? `No "${activeFilter}" events recorded yet. Try a different filter or log a new event.`
                  : "Log your first ice event to start tracking operations."}
              </p>
              <Link href="/ice-operations/new" className="mt-4">
                <Button
                  variant="outline"
                  className="border-action-green text-action-green hover:bg-action-green/10"
                >
                  Log First Event
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="space-y-2 md:hidden">
                {iceEvents.map((event) => {
                  const badge = getEventTypeBadge(event.event_type);
                  return (
                    <Link
                      key={event.id}
                      href={`/ice-operations/${event.id}`}
                      className="block"
                    >
                      <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge className={badge.className}>
                                  {badge.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {event.rink_name ?? "Unknown rink"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                by {event.operator_name ?? "Unknown"}
                              </p>
                              {event.equipment_name && (
                                <p className="text-xs text-muted-foreground">
                                  Equipment: {event.equipment_name}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-xs text-muted-foreground space-y-0.5">
                              <p>{formatDate(event.created_at)}</p>
                              {event.duration_minutes && (
                                <p>{event.duration_minutes} min</p>
                              )}
                            </div>
                          </div>
                          {event.notes && (
                            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                              {event.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Rink</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="hidden lg:table-cell">Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {iceEvents.map((event) => {
                      const badge = getEventTypeBadge(event.event_type);
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDateTime(event.created_at)}
                          </TableCell>
                          <TableCell>{event.rink_name ?? "--"}</TableCell>
                          <TableCell>
                            <Badge className={badge.className}>
                              {badge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{event.equipment_name ?? "--"}</TableCell>
                          <TableCell>{event.operator_name ?? "--"}</TableCell>
                          <TableCell>
                            {event.duration_minutes
                              ? `${event.duration_minutes} min`
                              : "--"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                            {event.notes ?? "--"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/ice-operations/${event.id}`}>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Equipment & Maintenance Section */}
      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Equipment List */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment</CardTitle>
            <CardDescription>
              Ice resurfacing equipment for your facility
            </CardDescription>
          </CardHeader>
          <CardContent>
            {equipment.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                No equipment configured. Set up equipment in the Admin Control Center.
              </p>
            ) : (
              <div className="space-y-3">
                {equipment.map((eq) => (
                  <div
                    key={eq.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{eq.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {eq.make ?? ""} {eq.model ?? ""}{" "}
                        {eq.year ? `(${eq.year})` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={eq.status === "active" ? "default" : "secondary"}
                        className={
                          eq.status === "active"
                            ? "bg-action-green/10 text-action-green border-action-green/20"
                            : eq.status === "maintenance"
                            ? "bg-alert-yellow/10 text-alert-yellow border-alert-yellow/20"
                            : ""
                        }
                      >
                        {eq.status.charAt(0).toUpperCase() + eq.status.slice(1)}
                      </Badge>
                      {eq.next_maintenance_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Next service: {formatDate(eq.next_maintenance_at)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Maintenance Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Maintenance</CardTitle>
            <CardDescription>
              Latest maintenance and service records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {maintenanceLogs.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                No maintenance logs recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {maintenanceLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium capitalize">
                          {log.maintenance_type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {log.equipment_name ?? "Unknown equipment"}
                        </p>
                        {log.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {log.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{formatDateTime(log.event_time)}</p>
                        <p>by {log.performed_by_name ?? "Unknown"}</p>
                        {log.cost !== null && (
                          <p className="font-medium">${log.cost.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
