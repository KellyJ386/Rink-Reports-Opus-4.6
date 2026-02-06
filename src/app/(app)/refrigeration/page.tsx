import Link from "next/link";
import {
  getRefrigerationReadings,
  getRefrigerationMaintenance,
  getCompressors,
} from "./actions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatNumber(value: number | null, unit: string) {
  if (value === null || value === undefined) return "--";
  return `${value}${unit}`;
}

export default async function RefrigerationPage() {
  const [readingsResult, maintenanceResult, compressorsResult] =
    await Promise.all([
      getRefrigerationReadings(),
      getRefrigerationMaintenance(),
      getCompressors(),
    ]);

  const readings = readingsResult.success ? readingsResult.data : [];
  const maintenance = maintenanceResult.success ? maintenanceResult.data : [];
  const compressors = compressorsResult.success ? compressorsResult.data : [];

  const flaggedCount = readings.filter((r) => r.is_flagged).length;
  const latestReadings = readings.slice(0, 10);
  const recentMaintenance = maintenance.slice(0, 10);

  // Get the most recent reading per compressor
  const latestByCompressor = new Map<string, (typeof readings)[0]>();
  for (const reading of readings) {
    if (reading.equipment_id && !latestByCompressor.has(reading.equipment_id)) {
      latestByCompressor.set(reading.equipment_id, reading);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Refrigeration Plant
          </h1>
          <p className="mt-1 text-muted-foreground">
            Monitor compressor readings and maintenance
          </p>
        </div>
        <Link href="/refrigeration/new">
          <Button>New Reading</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compressors</CardDescription>
            <CardTitle className="text-2xl">{compressors.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {compressors.filter((c) => c.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Readings</CardDescription>
            <CardTitle className="text-2xl">{readings.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Flagged Readings</CardDescription>
            <CardTitle className="text-2xl text-alert-yellow">
              {flaggedCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Out of threshold range
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Maintenance Records</CardDescription>
            <CardTitle className="text-2xl">{maintenance.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Compressor Status Cards */}
      {compressors.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Compressor Status</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {compressors.map((compressor) => {
              const latest = latestByCompressor.get(compressor.id);
              return (
                <Card key={compressor.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {compressor.name}
                      </CardTitle>
                      <Badge
                        variant={
                          compressor.status === "active"
                            ? "default"
                            : compressor.status === "maintenance"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {compressor.status}
                      </Badge>
                    </div>
                    {compressor.make && (
                      <CardDescription>
                        {compressor.make}
                        {compressor.model ? ` ${compressor.model}` : ""}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {latest ? (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div className="text-muted-foreground">
                          Suction PSI
                        </div>
                        <div className="text-right font-medium">
                          {formatNumber(latest.suction_pressure_psi, " psi")}
                        </div>
                        <div className="text-muted-foreground">
                          Discharge PSI
                        </div>
                        <div className="text-right font-medium">
                          {formatNumber(
                            latest.discharge_pressure_psi,
                            " psi"
                          )}
                        </div>
                        <div className="text-muted-foreground">Slab Temp</div>
                        <div className="text-right font-medium">
                          {formatNumber(latest.slab_temperature_f, "°F")}
                        </div>
                        <div className="text-muted-foreground">Brine Supply</div>
                        <div className="text-right font-medium">
                          {formatNumber(
                            latest.brine_supply_temperature_f,
                            "°F"
                          )}
                        </div>
                        <div className="col-span-2 mt-1 text-xs text-muted-foreground">
                          Last reading: {formatDateTime(latest.event_time)}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No readings recorded
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs for Readings and Maintenance */}
      <Tabs defaultValue="readings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="readings">Recent Readings</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Log</TabsTrigger>
        </TabsList>

        {/* Readings Tab */}
        <TabsContent value="readings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Readings</CardTitle>
              <CardDescription>
                Latest refrigeration system readings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestReadings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-lg font-medium text-muted-foreground">
                    No readings yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter your first refrigeration reading
                  </p>
                  <Link href="/refrigeration/new" className="mt-4">
                    <Button variant="outline">Add Reading</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Suction PSI</TableHead>
                        <TableHead>Discharge PSI</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Slab Temp
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Room Temp
                        </TableHead>
                        <TableHead>Flag</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestReadings.map((reading) => (
                        <TableRow key={reading.id}>
                          <TableCell className="font-medium">
                            {formatDateTime(reading.event_time)}
                          </TableCell>
                          <TableCell>
                            {formatNumber(
                              reading.suction_pressure_psi,
                              " psi"
                            )}
                          </TableCell>
                          <TableCell>
                            {formatNumber(
                              reading.discharge_pressure_psi,
                              " psi"
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {formatNumber(
                              reading.slab_temperature_f,
                              "°F"
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatNumber(
                              reading.room_temperature_f,
                              "°F"
                            )}
                          </TableCell>
                          <TableCell>
                            {reading.is_flagged && (
                              <Badge variant="destructive">Flagged</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/refrigeration/${reading.id}`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Log</CardTitle>
              <CardDescription>
                Recent refrigeration maintenance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentMaintenance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-lg font-medium text-muted-foreground">
                    No maintenance records
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Maintenance records will appear here when created
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Description
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Vendor
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Cost
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentMaintenance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {formatDateTime(record.event_time)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.maintenance_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden max-w-[200px] truncate sm:table-cell">
                            {record.description || "--"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {record.vendor || "--"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {record.cost
                              ? `$${record.cost.toFixed(2)}`
                              : "--"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
