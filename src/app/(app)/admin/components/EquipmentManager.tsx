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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "@/app/(app)/admin/actions";
import type {
  Equipment,
  EquipmentType,
  EquipmentStatus,
} from "@/lib/types/database";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  Search,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentManagerProps {
  facilityId: string;
  equipment: Equipment[];
}

const EQUIPMENT_TYPES: { value: EquipmentType; label: string }[] = [
  { value: "zamboni", label: "Zamboni" },
  { value: "edger", label: "Edger" },
  { value: "compressor", label: "Compressor" },
  { value: "pump", label: "Pump" },
  { value: "dehumidifier", label: "Dehumidifier" },
  { value: "sensor", label: "Sensor" },
  { value: "other", label: "Other" },
];

const EQUIPMENT_STATUSES: { value: EquipmentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

function getStatusBadgeVariant(
  status: EquipmentStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "maintenance":
      return "secondary";
    case "retired":
      return "destructive";
    default:
      return "outline";
  }
}

interface EquipmentFormData {
  name: string;
  type: EquipmentType;
  make: string;
  model: string;
  serial_number: string;
  year: string;
  status: EquipmentStatus;
  notes: string;
  maintenance_interval_days: string;
}

const EMPTY_FORM: EquipmentFormData = {
  name: "",
  type: "zamboni",
  make: "",
  model: "",
  serial_number: "",
  year: "",
  status: "active",
  notes: "",
  maintenance_interval_days: "",
};

export function EquipmentManager({
  facilityId,
  equipment,
}: EquipmentManagerProps) {
  const { toast } = useToast();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(equipment);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<EquipmentFormData>(EMPTY_FORM);

  const filteredEquipment = equipmentList.filter(
    (eq) =>
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eq.make || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eq.model || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChange = (field: keyof EquipmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (eq: Equipment) => {
    setEditingId(eq.id);
    setFormData({
      name: eq.name,
      type: eq.type,
      make: eq.make || "",
      model: eq.model || "",
      serial_number: eq.serial_number || "",
      year: eq.year ? String(eq.year) : "",
      status: eq.status,
      notes: eq.notes || "",
      maintenance_interval_days: eq.maintenance_interval_days
        ? String(eq.maintenance_interval_days)
        : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setLoading(true);

    const payload = {
      name: formData.name,
      type: formData.type,
      make: formData.make || null,
      model: formData.model || null,
      serial_number: formData.serial_number || null,
      year: formData.year ? parseInt(formData.year) : null,
      status: formData.status,
      notes: formData.notes || null,
      maintenance_interval_days: formData.maintenance_interval_days
        ? parseInt(formData.maintenance_interval_days)
        : null,
    };

    try {
      if (editingId) {
        const result = await updateEquipment(editingId, payload);
        if (result.success) {
          setEquipmentList((prev) =>
            prev.map((eq) =>
              eq.id === editingId ? (result.data as Equipment) : eq
            )
          );
          setDialogOpen(false);
          toast({
            title: "Equipment updated",
            description: `${formData.name} has been updated.`,
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update equipment.",
            variant: "destructive",
          });
        }
      } else {
        const result = await createEquipment(facilityId, payload);
        if (result.success) {
          setEquipmentList((prev) => [...prev, result.data as Equipment]);
          setDialogOpen(false);
          toast({
            title: "Equipment added",
            description: `${formData.name} has been added to your facility.`,
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to add equipment.",
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
      const result = await deleteEquipment(deletingItem.id);
      if (result.success) {
        setEquipmentList((prev) =>
          prev.filter((eq) => eq.id !== deletingItem.id)
        );
        setDeleteDialogOpen(false);
        setDeletingItem(null);
        toast({
          title: "Equipment deleted",
          description: `${deletingItem.name} has been removed.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete equipment.",
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

  const confirmDelete = (eq: Equipment) => {
    setDeletingItem(eq);
    setDeleteDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Equipment Manager</CardTitle>
            <CardDescription>
              Manage Zambonis, compressors, edgers, and other equipment.
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Equipment Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">
                  Make / Model
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Wrench className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchQuery
                          ? "No equipment matches your search."
                          : "No equipment added yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipment.map((eq) => (
                  <TableRow
                    key={eq.id}
                    className={cn(
                      eq.status === "retired" && "opacity-60"
                    )}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{eq.name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {EQUIPMENT_TYPES.find((t) => t.value === eq.type)
                            ?.label || eq.type}
                        </p>
                        {eq.serial_number && (
                          <p className="text-xs text-muted-foreground">
                            S/N: {eq.serial_number}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm capitalize">
                        {EQUIPMENT_TYPES.find((t) => t.value === eq.type)
                          ?.label || eq.type}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {[eq.make, eq.model].filter(Boolean).join(" ") || "---"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(eq.status)}>
                        {EQUIPMENT_STATUSES.find((s) => s.value === eq.status)
                          ?.label || eq.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(eq)}
                          title="Edit equipment"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(eq)}
                          title="Delete equipment"
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
          {filteredEquipment.length} item
          {filteredEquipment.length !== 1 ? "s" : ""} total
        </p>
      </CardContent>

      {/* Create/Edit Equipment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Equipment" : "Add Equipment"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update equipment details."
                : "Add a new piece of equipment to your facility."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="eq-name">Equipment Name *</Label>
                <Input
                  id="eq-name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Zamboni #1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eq-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) =>
                    handleChange("type", val)
                  }
                >
                  <SelectTrigger id="eq-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eq-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) =>
                    handleChange("status", val)
                  }
                >
                  <SelectTrigger id="eq-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eq-make">Make</Label>
                <Input
                  id="eq-make"
                  value={formData.make}
                  onChange={(e) => handleChange("make", e.target.value)}
                  placeholder="e.g. Zamboni"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eq-model">Model</Label>
                <Input
                  id="eq-model"
                  value={formData.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                  placeholder="e.g. 552"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eq-serial">Serial Number</Label>
                <Input
                  id="eq-serial"
                  value={formData.serial_number}
                  onChange={(e) =>
                    handleChange("serial_number", e.target.value)
                  }
                  placeholder="SN-12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eq-year">Year</Label>
                <Input
                  id="eq-year"
                  type="number"
                  min={1970}
                  max={2030}
                  value={formData.year}
                  onChange={(e) => handleChange("year", e.target.value)}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="eq-maintenance">
                  Maintenance Interval (days)
                </Label>
                <Input
                  id="eq-maintenance"
                  type="number"
                  min={1}
                  value={formData.maintenance_interval_days}
                  onChange={(e) =>
                    handleChange("maintenance_interval_days", e.target.value)
                  }
                  placeholder="e.g. 30"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="eq-notes">Notes</Label>
                <Textarea
                  id="eq-notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
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
              {editingId ? "Save Changes" : "Add Equipment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Equipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingItem?.name}</span>? This
              action cannot be undone.
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
