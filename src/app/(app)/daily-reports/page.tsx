import Link from "next/link";
import { getDailyReports } from "./actions";
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
    case "reviewed":
      return "outline" as const;
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
    case "rejected":
      return "";
    default:
      return "";
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DailyReportsPage() {
  const result = await getDailyReports();

  const reports = result.success ? result.data : [];
  const error = !result.success ? result.error : null;

  // Compute summary stats
  const draftCount = reports.filter((r) => r.status === "draft").length;
  const submittedCount = reports.filter((r) => r.status === "submitted").length;
  const approvedCount = reports.filter((r) => r.status === "approved").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Reports</h1>
          <p className="mt-1 text-muted-foreground">
            Create, submit, and review daily operational reports for your facility.
          </p>
        </div>
        <Button asChild className="bg-action-green hover:bg-action-green-hover text-white">
          <Link href="/daily-reports/new">New Report</Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-2xl">{draftCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Reports in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl">{submittedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-2xl">{approvedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Completed reports</p>
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

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Showing the latest 50 daily reports for your facility.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No daily reports yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first daily report to get started.
              </p>
              <Button
                asChild
                className="mt-4 bg-action-green hover:bg-action-green-hover text-white"
              >
                <Link href="/daily-reports/new">Create Report</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="space-y-3 md:hidden">
                {reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/daily-reports/${report.id}`}
                    className="block"
                  >
                    <Card className="transition-colors hover:bg-muted/50">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="space-y-1">
                          <p className="font-medium">{formatDate(report.report_date)}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.created_by_name ?? "Unknown"}
                          </p>
                          {report.submitted_at && (
                            <p className="text-xs text-muted-foreground">
                              Submitted {formatDateTime(report.submitted_at)}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={getStatusBadgeVariant(report.status)}
                          className={getStatusColor(report.status)}
                        >
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {formatDate(report.report_date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(report.status)}
                            className={getStatusColor(report.status)}
                          >
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.created_by_name ?? "Unknown"}</TableCell>
                        <TableCell>{formatDateTime(report.submitted_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/daily-reports/${report.id}`}>
                              {report.status === "draft" ? "Edit" : "View"}
                            </Link>
                          </Button>
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
    </div>
  );
}
