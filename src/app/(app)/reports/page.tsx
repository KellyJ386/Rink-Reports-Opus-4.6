import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FileText, Download, Calendar } from "lucide-react";
import Link from "next/link";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let archives: Array<{
    id: string;
    report_type: string;
    title: string;
    file_format: string;
    date_range_start: string | null;
    date_range_end: string | null;
    created_at: string;
  }> = [];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("facility_id")
      .eq("id", user.id)
      .single();

    if (profile?.facility_id) {
      const { data } = await supabase
        .from("report_archives")
        .select(
          "id, report_type, title, file_format, date_range_start, date_range_end, created_at"
        )
        .eq("facility_id", profile.facility_id)
        .order("created_at", { ascending: false })
        .limit(50);

      archives = data || [];
    }
  }

  const formatBadge: Record<string, string> = {
    pdf: "bg-alert-red/10 text-alert-red",
    csv: "bg-action-green/10 text-action-green",
    xlsx: "bg-blue-500/10 text-blue-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Export</h1>
          <p className="mt-1 text-muted-foreground">
            Generate and download facility reports
          </p>
        </div>
        <Link href="/reports/generate">
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </Link>
      </div>

      {/* Quick Export Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-alert-red/10 p-2">
              <FileText className="h-5 w-5 text-alert-red" />
            </div>
            <div>
              <p className="font-medium">Daily Summary</p>
              <p className="text-xs text-muted-foreground">PDF Report</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-action-green/10 p-2">
              <Download className="h-5 w-5 text-action-green" />
            </div>
            <div>
              <p className="font-medium">Data Export</p>
              <p className="text-xs text-muted-foreground">CSV / Excel</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Compliance Report</p>
              <p className="text-xs text-muted-foreground">Regulatory</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Archive */}
      <Card>
        <CardHeader>
          <CardTitle>Report Archive</CardTitle>
        </CardHeader>
        <CardContent>
          {archives.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No reports generated yet. Click &quot;Generate Report&quot; to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {archives.map((archive) => (
                  <TableRow key={archive.id}>
                    <TableCell className="font-medium">
                      {archive.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {archive.report_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          formatBadge[archive.file_format] || ""
                        }
                      >
                        {archive.file_format.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {archive.date_range_start && archive.date_range_end
                        ? `${archive.date_range_start} - ${archive.date_range_end}`
                        : "--"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(archive.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
