"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  createThreshold,
  updateThreshold,
  deleteThreshold,
} from "@/app/(app)/admin/actions";
import type { Threshold, ModuleType } from "@/lib/types/database";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
  Gauge,
} from "lucide-react";

interface ThresholdSettingsProps {
  facilityId: string;
  thresholds: Threshold[];
}

const MODULE_OPTIONS: { value: ModuleType; label: string }[] = [
  { value: "daily_reports", label: "Daily Reports" },
  { value: "ice_depth", label: "Ice Depth" },
  { value: "ice_operations", label: "Ice Operations" },
  { value: "refrigeration", label: "Refrigeration" },
  { value: "air_quality", label: "Air Quality" },
];

interface ThresholdFormData {
  module: ModuleType;
  metric_name: string;
  metric_label: string;
  unit: string;
  warning_low: string;
  warning_high: string;
  critical_low: string;
  critical_high: string;
  is_active: boolean;
}

const EMPTY_FORM: ThresholdFormData = {
  module: "refrigeration",
  metric_name: "",
  metric_label: "",
  unit: "",
  warning_low: "",
  warning_high: "",
  critical_low: "",
  critical_high: "",
  is_active: true,
};

export function ThresholdSettings({
  facilityId,
  thresholds,
}: ThresholdSettingsProps) {
  const { toast } = useToast();
  const [thresholdList, setThresholdList] = useState<Threshold[]>(thresholds);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<Threshold | null>(null);
  const [formData, setFormData] = useState<ThresholdFormData>(EMPTY_FORM);
  const [filterModule, setFilterModule] = useState<string>("all");

  const filteredThresholds =
    filterModule === "all"
      ? thresholdList
      : thresholdList.filter((t) => t.module === filterModule);

  const handleChange = (field: keyof ThresholdFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (threshold: Threshold) => {
    setEditingId(threshold.id);
    setFormData({
      module: threshold.module,
      metric_name: threshold.metric_name,
      metric_label: threshold.metric_label,
      unit: threshold.unit || "",
      warning_low: threshold.warning_low !== null ? String(threshold.warning_low) : "",
      warning_high: threshold.warning_high !== null ? String(threshold.warning_high) : "",
      critical_low: threshold.critical_low !== null ? String(threshold.critical_low) : "",
      critical_high: threshold.critical_high !== null ? String(threshold.critical_high) : "",
      is_active: threshold.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.metric_name || !formData.metric_label) return;
    setLoading(true);

    const payload = {
      module: formData.module,
      metric_name: formData.metric_name,
      metric_label: formData.metric_label,
      unit: formData.unit || null,
      warning_low: formData.warning_low ? parseFloat(formData.warning_low) : null,
      warning_high: formData.warning_high ? parseFloat(formData.warning_high) : null,
      critical_low: formData.critical_low ? parseFloat(formData.critical_low) : null,
      critical_high: formData.critical_high ? parseFloat(formData.critical_high) : null,
      is_active: formData.is_active,
    };

    try {
      if (editingId) {
        const result = await updateThreshold(editingId, payload);
        if (result.success) {
          setThresholdList((prev) =>
            prev.map((t) =>
              t.id === editingId ? (result.data as Threshold) : t
            )
          );
          setDialogOpen(false);
          toast({
            title: "Threshold updated",
            description: `${formData.metric_label} threshold has been updated.`,
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update threshold.",
            variant: "destructive",
          });
        }
      } else {
        const result = await createThreshold(facilityId, payload);
        if (result.success) {
          setThresholdList((prev) => [...prev, result.data as Threshold]);
          setDialogOpen(false);
          toast({
            title: "Threshold created",
            description: `${formData.metric_label} threshold has been added.`,
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create threshold.",
            variant: "destructive",
          });
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setLoading(true);

    try {
      const result = await deleteThreshold(deletingItem.id);
      if (result.success) {
        setThresholdList((prev) =>
          prev.filter((t) => t.id !== deletingItem.id)
        );
        setDeleteDialogOpen(false);
        setDeletingItem(null);
        toast({
          title: "Threshold deleted",
          description: `${deletingItem.metric_label} threshold has been removed.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete threshold.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (threshold: Threshold) => {
    setDeletingItem(threshold);
    setDeleteDialogOpen(true);
  };

  const formatRange = (low: number | null, high: number | null, unit: string | null) => {
    const u = unit || "";
    if (low !== null && high !== null) return `${low}${u} - ${high}${u}`;
    if (low !== null) return `>= ${low}${u}`;
    if (high !== null) return `<= ${high}${u}`;
    return "---";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Threshold Settings</CardTitle>
            <CardDescription>
              Configure warning and critical alert thresholds for monitored
              metrics.
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Threshold
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Module Filter */}
        <div className="mb-4 flex items-center gap-3">
          <Label className="text-sm text-muted-foreground">Filter by module:</Label>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {MODULE_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Thresholds Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="hidden sm:table-cell">Module</TableHead>
                <TableHead className="hidden md:table-cell">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-alert-yellow" />
                    Warning Range
                  </span>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-alert-red" />
                    Critical Range
                  </span>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredThresholds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Gauge className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No thresholds configured yet.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredThresholds.map((threshold) => (
                  <TableRow key={threshold.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{threshold.metric_label}</p>
                        <p className="text-xs text-muted-foreground">
                          {threshold.metric_name}
                          {threshold.unit ? ` (${threshold.unit})` : ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {MODULE_OPTIONS.find((m) => m.value === threshold.module)
                          ?.label || threshold.module}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">
                        {formatRange(
                          threshold.warning_low,
                          threshold.warning_high,
                          threshold.unit
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">
                        {formatRange(
                          threshold.critical_low,
                          threshold.critical_high,
                          threshold.unit
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={threshold.is_active ? "default" : "secondary"}
                      >
                        {threshold.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(threshold)}
                          title="Edit threshold"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(threshold)}
                          title="Delete threshold"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {filteredThresholds.length} threshold
          {filteredThresholds.length !== 1 ? "s" : ""}{" "}
          {filterModule !== "all" ? "in this module" : "total"}
        </p>
      </CardContent>

      {/* Create/Edit Threshold Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Threshold" : "Add Threshold"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update threshold ranges for this metric."
                : "Define warning and critical ranges for a new metric."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="th-module">Module</Label>
                <Select
                  value={formData.module}
                  onValueChange={(val) => handleChange("module", val)}
                >
                  <SelectTrigger id="th-module">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULE_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="th-unit">Unit</Label>
                <Input
                  id="th-unit"
                  value={formData.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  placeholder="e.g. PSI, F, ppm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="th-metric-name">Metric Name (key) *</Label>
                <Input
                  id="th-metric-name"
                  value={formData.metric_name}
                  onChange={(e) => handleChange("metric_name", e.target.value)}
                  placeholder="e.g. suction_pressure"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="th-metric-label">Metric Label *</Label>
                <Input
                  id="th-metric-label"
                  value={formData.metric_label}
                  onChange={(e) => handleChange("metric_label", e.target.value)}
                  placeholder="e.g. Suction Pressure"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-alert-yellow/30 bg-alert-yellow/5 p-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-alert-yellow" />
                Warning Range
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="th-warning-low">Low</Label>
                  <Input
                    id="th-warning-low"
                    type="number"
                    step="any"
                    value={formData.warning_low}
                    onChange={(e) => handleChange("warning_low", e.target.value)}
                    placeholder="Min value"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="th-warning-high">High</Label>
                  <Input
                    id="th-warning-high"
                    type="number"
                    step="any"
                    value={formData.warning_high}
                    onChange={(e) => handleChange("warning_high", e.target.value)}
                    placeholder="Max value"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-alert-red/30 bg-alert-red/5 p-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-alert-red" />
                Critical Range
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="th-critical-low">Low</Label>
                  <Input
                    id="th-critical-low"
                    type="number"
                    step="any"
                    value={formData.critical_low}
                    onChange={(e) => handleChange("critical_low", e.target.value)}
                    placeholder="Min value"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="th-critical-high">High</Label>
                  <Input
                    id="th-critical-high"
                    type="number"
                    step="any"
                    value={formData.critical_high}
                    onChange={(e) => handleChange("critical_high", e.target.value)}
                    placeholder="Max value"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="th-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
              <Label htmlFor="th-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                loading || !formData.metric_name || !formData.metric_label
              }
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {editingId ? "Save Changes" : "Add Threshold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Threshold</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the threshold for{" "}
              <span className="font-semibold">
                {deletingItem?.metric_label}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
