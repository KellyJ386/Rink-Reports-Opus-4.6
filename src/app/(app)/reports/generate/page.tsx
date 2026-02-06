"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateReport } from "../actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GenerateReportPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await generateReport(formData);
    if (result.success) {
      router.push("/reports");
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Generate Report</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Weekly Operations Summary"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="report_type">Report Type</Label>
                <select
                  id="report_type"
                  name="report_type"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="daily">Daily Summary</option>
                  <option value="weekly">Weekly Summary</option>
                  <option value="monthly">Monthly Summary</option>
                  <option value="compliance">Compliance Report</option>
                  <option value="custom">Custom Report</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file_format">Format</Label>
                <select
                  id="file_format"
                  name="file_format"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (XLSX)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date_range_start">Start Date</Label>
                <Input
                  id="date_range_start"
                  name="date_range_start"
                  type="date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_range_end">End Date</Label>
                <Input
                  id="date_range_end"
                  name="date_range_end"
                  type="date"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-alert-red/10 p-3 text-sm text-alert-red">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Generating..." : "Generate Report"}
              </Button>
              <Link href="/reports">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
