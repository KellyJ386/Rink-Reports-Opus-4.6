import Link from "next/link";
import { notFound } from "next/navigation";
import { getIceEvent } from "../actions";
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface IceEventDetailPageProps {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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
// Page Component
// ---------------------------------------------------------------------------

export default async function IceEventDetailPage({
  params,
}: IceEventDetailPageProps) {
  const { id } = await params;

  const result = await getIceEvent(id);

  if (!result.success) {
    notFound();
  }

  const event = result.data;
  const badge = getEventTypeBadge(event.event_type);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link href="/ice-operations">
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ice Event Details
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={badge.className}>{badge.label}</Badge>
            {event.rink_name && (
              <Badge variant="outline">{event.rink_name}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
          <CardDescription>
            Recorded on {formatDateTime(event.created_at)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Event Type
              </h4>
              <p className="mt-1 text-sm capitalize">{event.event_type}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Rink
              </h4>
              <p className="mt-1 text-sm">{event.rink_name ?? "Unknown"}</p>
            </div>
          </div>

          <Separator />

          {/* Operator & Equipment */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Operator
              </h4>
              <p className="mt-1 text-sm">
                {event.operator_name ?? "Unknown"}
              </p>
            </div>
            {event.equipment_name && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Equipment Used
                </h4>
                <p className="mt-1 text-sm">{event.equipment_name}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Measurements */}
          <div className="grid gap-4 sm:grid-cols-3">
            {event.water_temperature !== null && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Water Temperature
                </h4>
                <p className="mt-1 text-sm">{event.water_temperature}°F</p>
              </div>
            )}
            {event.ice_temperature !== null && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Ice Temperature
                </h4>
                <p className="mt-1 text-sm">{event.ice_temperature}°F</p>
              </div>
            )}
            {event.humidity !== null && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Humidity
                </h4>
                <p className="mt-1 text-sm">{event.humidity}%</p>
              </div>
            )}
          </div>

          {event.duration_minutes !== null && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Duration
                </h4>
                <p className="mt-1 text-sm">{event.duration_minutes} minutes</p>
              </div>
            </>
          )}

          {event.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Notes
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {event.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Timestamp */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">
              Created
            </h4>
            <p className="mt-1 text-sm">
              {formatDateTime(event.created_at)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
