import Link from "next/link";
import { getIncidents } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function getSeverityBadgeClass(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-alert-red text-white border-alert-red";
    case "high":
      return "bg-orange-500 text-white border-orange-500";
    case "medium":
      return "bg-alert-yellow text-black border-alert-yellow";
    case "low":
      return "bg-action-green text-white border-action-green";
    default:
      return "";
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "open":
      return "destructive" as const;
    case "investigating":
      return "outline" as const;
    case "resolved":
      return "default" as const;
    case "closed":
      return "secondary" as const;
    default:
      return "secondary" as const;
  }
}

function getTypeBadgeVariant(type: string) {
  switch (type) {
    case "injury":
      return "destructive" as const;
    case "equipment_failure":
      return "outline" as const;
    case "safety_hazard":
      return "destructive" as const;
    case "property_damage":
      return "outline" as const;
    case "near_miss":
      return "secondary" as const;
    default:
      return "secondary" as const;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function IncidentsPage() {
  const result = await getIncidents();
  const incidents = result.success ? result.data : [];

  const openCount = incidents.filter((i) => i.status === "open").length;
  const investigatingCount = incidents.filter(
    (i) => i.status === "investigating"
  ).length;
  const criticalCount = incidents.filter(
    (i) => i.severity === "critical" && i.status !== "closed"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Incident Reporting
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track, manage, and resolve facility incidents
          </p>
        </div>
        <Link href="/incidents/new">
          <Button>Report Incident</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Incidents</CardDescription>
            <CardTitle className="text-2xl">{incidents.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open</CardDescription>
            <CardTitle className="text-2xl text-alert-red">
              {openCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Awaiting investigation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Investigating</CardDescription>
            <CardTitle className="text-2xl text-alert-yellow">
              {investigatingCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical Active</CardDescription>
            <CardTitle className="text-2xl text-alert-red">
              {criticalCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Incidents</CardTitle>
          <CardDescription>
            Complete list of facility incident reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No incidents reported
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Incident reports will appear here when filed
              </p>
              <Link href="/incidents/new" className="mt-4">
                <Button variant="outline">Report First Incident</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {incident.incident_number}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {incident.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(incident.type)}>
                          {formatType(incident.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getSeverityBadgeClass(incident.severity)}
                        >
                          {incident.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(incident.status)}
                        >
                          {incident.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(incident.event_time)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/incidents/${incident.id}`}>
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
    </div>
  );
}
