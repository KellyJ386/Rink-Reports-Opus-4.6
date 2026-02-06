"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { resolveIncident, closeIncident, createFollowUp } from "../actions";

interface IncidentDetailActionsProps {
  incidentId: string;
  status: string;
}

export function IncidentDetailActions({
  incidentId,
  status,
}: IncidentDetailActionsProps) {
  const router = useRouter();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResolve(formData: FormData) {
    setLoading(true);
    const result = await resolveIncident(incidentId, formData);
    setLoading(false);
    if (result.success) {
      setResolveOpen(false);
      router.refresh();
    }
  }

  async function handleClose() {
    setLoading(true);
    const result = await closeIncident(incidentId);
    setLoading(false);
    if (result.success) {
      router.refresh();
    }
  }

  async function handleFollowUp(formData: FormData) {
    setLoading(true);
    formData.set("incident_id", incidentId);
    const result = await createFollowUp(formData);
    setLoading(false);
    if (result.success) {
      setFollowUpOpen(false);
      router.refresh();
    }
  }

  const isActive = status === "open" || status === "investigating";
  const canResolve = isActive;
  const canClose = status === "resolved";

  return (
    <div className="flex flex-wrap gap-2">
      {/* Add Follow-up */}
      {isActive && (
        <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Add Follow-up</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Follow-up</DialogTitle>
              <DialogDescription>
                Record an action taken or investigation note
              </DialogDescription>
            </DialogHeader>
            <form action={handleFollowUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="action_taken">Action Taken *</Label>
                <Textarea
                  id="action_taken"
                  name="action_taken"
                  placeholder="Describe the action taken..."
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="follow_up_notes">Notes</Label>
                <Textarea
                  id="follow_up_notes"
                  name="notes"
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  id="follow_up_date"
                  name="follow_up_date"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFollowUpOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Add Follow-up"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Resolve Incident */}
      {canResolve && (
        <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
          <DialogTrigger asChild>
            <Button>Resolve</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Incident</DialogTitle>
              <DialogDescription>
                Mark this incident as resolved with a root cause
              </DialogDescription>
            </DialogHeader>
            <form action={handleResolve} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="root_cause">Root Cause</Label>
                <Textarea
                  id="root_cause"
                  name="root_cause"
                  placeholder="Describe the root cause of this incident..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResolveOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Resolving..." : "Resolve Incident"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Close Incident */}
      {canClose && (
        <Button onClick={handleClose} variant="secondary" disabled={loading}>
          {loading ? "Closing..." : "Close Incident"}
        </Button>
      )}
    </div>
  );
}
