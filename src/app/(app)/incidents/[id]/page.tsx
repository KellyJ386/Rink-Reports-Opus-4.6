import Link from "next/link";
import { notFound } from "next/navigation";
import { getIncident, getFollowUps } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IncidentDetailActions } from "./IncidentDetailActions";

interface IncidentDetailPageProps {
  params: Promise<{ id: string }>;
}

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

function formatType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function IncidentDetailPage({
  params,
}: IncidentDetailPageProps) {
  const { id } = await params;

  const [incidentResult, followUpsResult] = await Promise.all([
    getIncident(id),
    getFollowUps(id),
  ]);

  if (!incidentResult.success) {
    notFound();
  }

  const incident = incidentResult.data;
  const followUps = followUpsResult.success ? followUpsResult.data : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/incidents">
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
            <span className="font-mono text-sm text-muted-foreground">
              #{incident.incident_number}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {incident.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getSeverityBadgeClass(incident.severity)}>
              {incident.severity}
            </Badge>
            <Badge variant={getStatusBadgeVariant(incident.status)}>
              {incident.status}
            </Badge>
            <Badge variant="outline">{formatType(incident.type)}</Badge>
          </div>
        </div>
        <IncidentDetailActions
          incidentId={incident.id}
          status={incident.status}
        />
      </div>

      {/* Incident Details */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
          <CardDescription>
            Reported on {formatDateTime(incident.event_time)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">
              Description
            </h4>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {incident.description}
            </p>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            {incident.location && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Location
                </h4>
                <p className="mt-1 text-sm">{incident.location}</p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Created
              </h4>
              <p className="mt-1 text-sm">
                {formatDateTime(incident.created_at)}
              </p>
            </div>
          </div>

          {(incident.injured_party_name || incident.injured_party_contact) && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Injured Party
                </h4>
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  {incident.injured_party_name && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Name: </span>
                      {incident.injured_party_name}
                    </p>
                  )}
                  {incident.injured_party_contact && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Contact: </span>
                      {incident.injured_party_contact}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {incident.witnesses && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Witnesses
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {incident.witnesses}
                </p>
              </div>
            </>
          )}

          {incident.immediate_action && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Immediate Action Taken
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {incident.immediate_action}
                </p>
              </div>
            </>
          )}

          {incident.root_cause && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Root Cause
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {incident.root_cause}
                </p>
              </div>
            </>
          )}

          {(incident.resolved_at || incident.closed_at) && (
            <>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                {incident.resolved_at && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Resolved At
                    </h4>
                    <p className="mt-1 text-sm">
                      {formatDateTime(incident.resolved_at)}
                    </p>
                  </div>
                )}
                {incident.closed_at && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Closed At
                    </h4>
                    <p className="mt-1 text-sm">
                      {formatDateTime(incident.closed_at)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-ups</CardTitle>
          <CardDescription>
            Actions taken and investigation notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {followUps.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No follow-ups recorded yet
            </p>
          ) : (
            <div className="space-y-4">
              {followUps.map((followUp) => (
                <div
                  key={followUp.id}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {formatDate(followUp.follow_up_date)}
                    </span>
                  </div>
                  <p className="text-sm">{followUp.action_taken}</p>
                  {followUp.notes && (
                    <p className="text-xs text-muted-foreground">
                      {followUp.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
