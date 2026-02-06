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
  createShiftType,
  updateShiftType,
  deleteShiftType,
} from "@/app/(app)/admin/actions";
import type { ShiftType } from "@/lib/types/database";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShiftTypeManagerProps {
  facilityId: string;
  shifts: ShiftType[];
}

interface ShiftFormData {
  name: string;
  color: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const EMPTY_FORM: ShiftFormData = {
  name: "",
  color: "#69BE28",
  start_time: "",
  end_time: "",
  is_active: true,
};

const PRESET_COLORS = [
  "#002244", // navy
  "#69BE28", // action-green
  "#A5ACAF", // wolf-grey
  "#FFB800", // alert-yellow
  "#D32F2F", // alert-red
  "#2563EB", // blue
  "#7C3AED", // purple
  "#059669", // emerald
  "#EA580C", // orange
  "#DB2777", // pink
];

export function ShiftTypeManager({
  facilityId,
  shifts,
}: ShiftTypeManagerProps) {
  const { toast } = useToast();
  const [shiftList, setShiftList] = useState<ShiftType[]>(shifts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<ShiftType | null>(null);
  const [formData, setFormData] = useState<ShiftFormData>(EMPTY_FORM);

  const handleChange = (field: keyof ShiftFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (shift: ShiftType) => {
    setEditingId(shift.id);
    setFormData({
      name: shift.name,
      color: shift.color,
      start_time: shift.start_time || "",
      end_time: shift.end_time || "",
      is_active: shift.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setLoading(true);

    const payload = {
      name: formData.name,
      color: formData.color,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      is_active: formData.is_active,
    };

    try {
      if (editingId) {
        const result = await updateShiftType(editingId, payload);
        if (result.success) {
          setShiftList((prev) =>
            prev.map((s) =>
              s.id === editingId ? (result.data as ShiftType) : s
            )
          );
          setDialogOpen(false);
          toast({
            title: "Shift type updated",
            description: `${formData.name} has been updated.`,
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update shift type.",
            variant: "destructive",
          });
        }
      } else {
        const result = await createShiftType(facilityId, payload);
        if (result.success) {
          setShiftList((prev) => [...prev, result.data as ShiftType]);
          setDialogOpen(false);
          toast({
            title: "Shift type created",
            description: `${formData.name} has been added.`,
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create shift type.",
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
      const result = await deleteShiftType(deletingItem.id);
      if (result.success) {
        setShiftList((prev) =>
          prev.filter((s) => s.id !== deletingItem.id)
        );
        setDeleteDialogOpen(false);
        setDeletingItem(null);
        toast({
          title: "Shift type deleted",
          description: `${deletingItem.name} has been removed.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete shift type.",
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

  const formatTime = (time: string | null) => {
    if (!time) return "---";
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Shift Types</CardTitle>
            <CardDescription>
              Define shift categories for employee scheduling.
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shift Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Start</TableHead>
                <TableHead className="hidden sm:table-cell">End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shiftList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No shift types defined yet.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                shiftList.map((shift) => (
                  <TableRow
                    key={shift.id}
                    className={cn(!shift.is_active && "opacity-60")}
                  >
                    <TableCell>
                      <div
                        className="h-6 w-6 rounded-md border"
                        style={{ backgroundColor: shift.color }}
                        title={shift.color}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{shift.name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {formatTime(shift.start_time)} -{" "}
                          {formatTime(shift.end_time)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm">
                        {formatTime(shift.start_time)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm">
                        {formatTime(shift.end_time)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={shift.is_active ? "default" : "secondary"}
                      >
                        {shift.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(shift)}
                          title="Edit shift type"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingItem(shift);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete shift type"
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
          {shiftList.length} shift type{shiftList.length !== 1 ? "s" : ""}
        </p>
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Shift Type" : "Add Shift Type"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update this shift type."
                : "Define a new shift type for scheduling."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shift-name">Name *</Label>
              <Input
                id="shift-name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Morning Shift"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-md border-2 transition-all",
                      formData.color === color
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handleChange("color", color)}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="shift-color-custom" className="text-xs text-muted-foreground">
                  Custom:
                </Label>
                <Input
                  id="shift-color-custom"
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="h-8 w-14 cursor-pointer p-1"
                />
                <span className="text-xs text-muted-foreground">
                  {formData.color}
                </span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shift-start">Default Start Time</Label>
                <Input
                  id="shift-start"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleChange("start_time", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift-end">Default End Time</Label>
                <Input
                  id="shift-end"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleChange("end_time", e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="shift-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
              <Label htmlFor="shift-active">Active</Label>
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
              disabled={loading || !formData.name}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {editingId ? "Save Changes" : "Add Shift Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shift Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingItem?.name}</span>? This
              may affect existing schedules.
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
