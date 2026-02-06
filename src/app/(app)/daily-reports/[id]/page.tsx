import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getDailyReport,
  getChecklistItemsForReport,
} from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DailyReportActions } from "./DailyReportActions";
import { ChecklistSection } from "./ChecklistSection";

interface DailyReportDetailPageProps {
  params: Promise<{ id: string }>;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "draft":
      return "secondary" as const;
    case "submitted":
      return "default" as const;
    case "approved":
      return "default" as const;
    case "rejected":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "bg-action-green/10 text-action-green border-action-green/20";
    case "submitted":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    default:
      return "";
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DailyReportDetailPage({
  params,
}: DailyReportDetailPageProps) {
  const { id } = await params;

  const [reportResult, checklistResult] = await Promise.all([
    getDailyReport(id),
    getChecklistItemsForReport(id),
  ]);

  if (!reportResult.success) {
    notFound();
  }

  const report = reportResult.data;
  const checklistData = checklistResult.success ? checklistResult.data : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {formatDate(report.report_date)}
            </h1>
            <Badge
              variant={getStatusBadgeVariant(report.status)}
              className={getStatusColor(report.status)}
            >
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Daily Report
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/daily-reports">Back to Reports</Link>
        </Button>
      </div>

      {/* Report Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p className="mt-1">{report.created_by_name ?? "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="mt-1">{formatDateTime(report.created_at)}</p>
            </div>
            {report.submitted_by_name && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted By</p>
                <p className="mt-1">{report.submitted_by_name}</p>
              </div>
            )}
            {report.submitted_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted At</p>
                <p className="mt-1">{formatDateTime(report.submitted_at)}</p>
              </div>
            )}
            {report.reviewed_by_name && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reviewed By</p>
                <p className="mt-1">{report.reviewed_by_name}</p>
              </div>
            )}
            {report.reviewed_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reviewed At</p>
                <p className="mt-1">{formatDateTime(report.reviewed_at)}</p>
              </div>
            )}
            {report.reviewer_notes && (
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Reviewer Notes</p>
                <p className="mt-1">{report.reviewer_notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist Sections */}
      {checklistData && checklistData.tabs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
            <CardDescription>
              {report.status === "draft"
                ? "Fill in the checklist items below. Your responses are saved automatically."
                : "Checklist responses for this report."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {checklistData.tabs.map((tab, index) => (
                <div key={tab.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <ChecklistSection
                    tab={tab}
                    responses={checklistData.responses.filter(
                      (r) => r.tab_id === tab.id
                    )}
                    reportId={report.id}
                    isEditable={report.status === "draft"}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No checklist tabs configured for this facility. An administrator can
              set up checklist tabs and items in the Admin Control Center.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <DailyReportActions reportId={report.id} status={report.status} />
    </div>
  );
}
