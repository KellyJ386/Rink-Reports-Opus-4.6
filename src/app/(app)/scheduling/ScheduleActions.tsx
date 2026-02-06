"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createSchedule, createTimeOffRequest } from "./actions";

export function ScheduleActions() {
  const router = useRouter();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [timeOffOpen, setTimeOffOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreateSchedule(formData: FormData) {
    setLoading(true);
    const result = await createSchedule(formData);
    setLoading(false);
    if (result.success) {
      setScheduleOpen(false);
      router.refresh();
    }
  }

  async function handleCreateTimeOff(formData: FormData) {
    setLoading(true);
    const result = await createTimeOffRequest(formData);
    setLoading(false);
    if (result.success) {
      setTimeOffOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* New Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogTrigger asChild>
          <Button>New Schedule</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Weekly Schedule</DialogTitle>
            <DialogDescription>
              Set the start date for a new weekly schedule
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreateSchedule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="week_start">Week Start Date (Monday)</Label>
              <Input
                id="week_start"
                name="week_start"
                type="date"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule_notes">Notes (optional)</Label>
              <Textarea
                id="schedule_notes"
                name="notes"
                placeholder="Any notes about this schedule week..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setScheduleOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Schedule"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Time Off Request Dialog */}
      <Dialog open={timeOffOpen} onOpenChange={setTimeOffOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Request Time Off</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Time Off</DialogTitle>
            <DialogDescription>
              Submit a time off request for review
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreateTimeOff} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Reason for time off..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTimeOffOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
