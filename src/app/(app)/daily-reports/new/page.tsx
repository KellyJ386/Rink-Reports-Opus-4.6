"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { createDailyReport } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewDailyReportPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    const result = await createDailyReport(formData);

    if (result.success) {
      router.push(`/daily-reports/${result.data.id}`);
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Daily Report</h1>
        <p className="mt-1 text-muted-foreground">
          Create a new daily report for your facility. After creating, you can fill in
          checklist items and submit for review.
        </p>
      </div>

      <Card className="max-w-lg">
        <form action={handleSubmit}>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>
              Select the date for this daily report. Only one report can exist per date.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md border border-alert-red/50 bg-alert-red/5 p-3">
                <p className="text-sm text-alert-red">{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="report_date">Report Date</Label>
              <Input
                id="report_date"
                name="report_date"
                type="date"
                defaultValue={today}
                required
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                The date this daily report covers.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/daily-reports">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-action-green hover:bg-action-green-hover text-white"
            >
              {isSubmitting ? "Creating..." : "Create Report"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
