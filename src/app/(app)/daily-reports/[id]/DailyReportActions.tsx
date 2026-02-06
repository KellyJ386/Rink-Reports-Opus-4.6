"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitDailyReport, approveDailyReport, rejectDailyReport } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DailyReportActionsProps {
  reportId: string;
  status: string;
}

export function DailyReportActions({ reportId, status }: DailyReportActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    const result = await submitDailyReport(reportId);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
    }
    setIsSubmitting(false);
  }

  async function handleApprove(formData: FormData) {
    setIsApproving(true);
    setError(null);

    const result = await approveDailyReport(reportId, formData);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
    }
    setIsApproving(false);
  }

  async function handleReject(formData: FormData) {
    setIsRejecting(true);
    setError(null);

    const result = await rejectDailyReport(reportId, formData);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
    }
    setIsRejecting(false);
  }

  if (status !== "draft" && status !== "submitted") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>
          {status === "draft"
            ? "Submit this report when all checklist items are complete."
            : "Review this report and approve or reject it."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-alert-red/50 bg-alert-red/5 p-3">
            <p className="text-sm text-alert-red">{error}</p>
          </div>
        )}

        {status === "draft" && (
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-action-green hover:bg-action-green-hover text-white"
            >
              {isSubmitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </div>
        )}

        {status === "submitted" && !showReviewForm && (
          <div className="flex gap-3">
            <Button
              onClick={() => setShowReviewForm(true)}
              className="bg-action-green hover:bg-action-green-hover text-white"
            >
              Review Report
            </Button>
          </div>
        )}

        {status === "submitted" && showReviewForm && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reviewer_notes">Reviewer Notes (optional for approval, required for rejection)</Label>
              <Textarea
                id="reviewer_notes"
                name="reviewer_notes"
                placeholder="Add any notes about this report..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <form action={handleApprove}>
                <input
                  type="hidden"
                  name="reviewer_notes"
                  id="approve_notes"
                />
                <Button
                  type="submit"
                  disabled={isApproving}
                  className="bg-action-green hover:bg-action-green-hover text-white"
                >
                  {isApproving ? "Approving..." : "Approve"}
                </Button>
              </form>
              <form action={handleReject}>
                <input
                  type="hidden"
                  name="reviewer_notes"
                  id="reject_notes"
                />
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isRejecting}
                >
                  {isRejecting ? "Rejecting..." : "Reject"}
                </Button>
              </form>
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
