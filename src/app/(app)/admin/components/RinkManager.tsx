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
import { Separator } from "@/components/ui/separator";
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
  createRink,
  updateRink,
  deleteRink,
  createRinkZone,
  updateRinkZone,
  deleteRinkZone,
} from "@/app/(app)/admin/actions";
import type { Rink, RinkZone } from "@/lib/types/database";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  SquareIcon,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RinkManagerProps {
  facilityId: string;
  rinks: Rink[];
  zones: RinkZone[];
}

const SURFACE_TYPES = [
  { value: "ice", label: "Ice" },
  { value: "synthetic", label: "Synthetic" },
  { value: "concrete", label: "Concrete (dry floor)" },
];

interface RinkFormData {
  name: string;
  dimensions_length: string;
  dimensions_width: string;
  surface_type: string;
  is_active: boolean;
  sort_order: string;
}

interface ZoneFormData {
  rink_id: string;
  name: string;
  label: string;
  x_position: string;
  y_position: string;
  sort_order: string;
  is_active: boolean;
}

const EMPTY_RINK_FORM: RinkFormData = {
  name: "",
  dimensions_length: "",
  dimensions_width: "",
  surface_type: "ice",
  is_active: true,
  sort_order: "0",
};

const EMPTY_ZONE_FORM: ZoneFormData = {
  rink_id: "",
  name: "",
  label: "",
  x_position: "",
  y_position: "",
  sort_order: "0",
  is_active: true,
};

export function RinkManager({
  facilityId,
  rinks,
  zones,
}: RinkManagerProps) {
  const { toast } = useToast();
  const [rinkList, setRinkList] = useState<Rink[]>(rinks);
  const [zoneList, setZoneList] = useState<RinkZone[]>(zones);
  const [expandedRinks, setExpandedRinks] = useState<Set<string>>(new Set());

  // Rink dialog state
  const [rinkDialogOpen, setRinkDialogOpen] = useState(false);
  const [rinkDeleteOpen, setRinkDeleteOpen] = useState(false);
  const [editingRinkId, setEditingRinkId] = useState<string | null>(null);
  const [deletingRink, setDeletingRink] = useState<Rink | null>(null);
  const [rinkForm, setRinkForm] = useState<RinkFormData>(EMPTY_RINK_FORM);

  // Zone dialog state
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [zoneDeleteOpen, setZoneDeleteOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [deletingZone, setDeletingZone] = useState<RinkZone | null>(null);
  const [zoneForm, setZoneForm] = useState<ZoneFormData>(EMPTY_ZONE_FORM);

  const [loading, setLoading] = useState(false);

  const getZonesForRink = (rinkId: string) =>
    zoneList
      .filter((z) => z.rink_id === rinkId)
      .sort((a, b) => a.sort_order - b.sort_order);

  const toggleExpanded = (rinkId: string) => {
    setExpandedRinks((prev) => {
      const next = new Set(prev);
      if (next.has(rinkId)) {
        next.delete(rinkId);
      } else {
        next.add(rinkId);
      }
      return next;
    });
  };

  // ---- Rink CRUD ----
  const openCreateRinkDialog = () => {
    setEditingRinkId(null);
    setRinkForm(EMPTY_RINK_FORM);
    setRinkDialogOpen(true);
  };

  const openEditRinkDialog = (rink: Rink) => {
    setEditingRinkId(rink.id);
    setRinkForm({
      name: rink.name,
      dimensions_length: rink.dimensions_length
        ? String(rink.dimensions_length)
        : "",
      dimensions_width: rink.dimensions_width
        ? String(rink.dimensions_width)
        : "",
      surface_type: rink.surface_type,
      is_active: rink.is_active,
      sort_order: String(rink.sort_order),
    });
    setRinkDialogOpen(true);
  };

  const handleSaveRink = async () => {
    if (!rinkForm.name) return;
    setLoading(true);

    const payload = {
      name: rinkForm.name,
      dimensions_length: rinkForm.dimensions_length
        ? parseFloat(rinkForm.dimensions_length)
        : null,
      dimensions_width: rinkForm.dimensions_width
        ? parseFloat(rinkForm.dimensions_width)
        : null,
      surface_type: rinkForm.surface_type,
      is_active: rinkForm.is_active,
      sort_order: parseInt(rinkForm.sort_order) || 0,
    };

    try {
      if (editingRinkId) {
        const result = await updateRink(editingRinkId, payload);
        if (result.success) {
          setRinkList((prev) =>
            prev.map((r) =>
              r.id === editingRinkId ? (result.data as Rink) : r
            )
          );
          setRinkDialogOpen(false);
          toast({
            title: "Rink updated",
            description: `${rinkForm.name} has been updated.`,
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update rink.",
            variant: "destructive",
          });
        }
      } else {
        const result = await createRink(facilityId, payload);
        if (result.success) {
          setRinkList((prev) => [...prev, result.data as Rink]);
          setRinkDialogOpen(false);
          toast({
            title: "Rink created",
            description: `${rinkForm.name} has been added to your facility.`,
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create rink.",
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

  const handleDeleteRink = async () => {
    if (!deletingRink) return;
    setLoading(true);

    try {
      const result = await deleteRink(deletingRink.id);
      if (result.success) {
        setRinkList((prev) => prev.filter((r) => r.id !== deletingRink.id));
        setZoneList((prev) =>
          prev.filter((z) => z.rink_id !== deletingRink.id)
        );
        setRinkDeleteOpen(false);
        setDeletingRink(null);
        toast({
          title: "Rink deleted",
          description: `${deletingRink.name} has been removed.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete rink.",
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

  // ---- Zone CRUD ----
  const openCreateZoneDialog = (rinkId: string) => {
    setEditingZoneId(null);
    setZoneForm({ ...EMPTY_ZONE_FORM, rink_id: rinkId });
    setZoneDialogOpen(true);
  };

  const openEditZoneDialog = (zone: RinkZone) => {
    setEditingZoneId(zone.id);
    setZoneForm({
      rink_id: zone.rink_id,
      name: zone.name,
      label: zone.label,
      x_position: zone.x_position !== null ? String(zone.x_position) : "",
      y_position: zone.y_position !== null ? String(zone.y_position) : "",
      sort_order: String(zone.sort_order),
      is_active: zone.is_active,
    });
    setZoneDialogOpen(true);
  };

  const handleSaveZone = async () => {
    if (!zoneForm.name || !zoneForm.label || !zoneForm.rink_id) return;
    setLoading(true);

    const payload = {
      rink_id: zoneForm.rink_id,
      name: zoneForm.name,
      label: zoneForm.label,
      x_position: zoneForm.x_position
        ? parseFloat(zoneForm.x_position)
        : null,
      y_position: zoneForm.y_position
        ? parseFloat(zoneForm.y_position)
        : null,
      sort_order: parseInt(zoneForm.sort_order) || 0,
      is_active: zoneForm.is_active,
    };

    try {
      if (editingZoneId) {
        const result = await updateRinkZone(editingZoneId, payload);
        if (result.success) {
          setZoneList((prev) =>
            prev.map((z) =>
              z.id === editingZoneId ? (result.data as RinkZone) : z
            )
          );
          setZoneDialogOpen(false);
          toast({
            title: "Zone updated",
            description: `${zoneForm.label} has been updated.`,
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update zone.",
            variant: "destructive",
          });
        }
      } else {
        const result = await createRinkZone(facilityId, payload);
        if (result.success) {
          setZoneList((prev) => [...prev, result.data as RinkZone]);
          setZoneDialogOpen(false);
          toast({
            title: "Zone created",
            description: `${zoneForm.label} has been added.`,
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create zone.",
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

  const handleDeleteZone = async () => {
    if (!deletingZone) return;
    setLoading(true);

    try {
      const result = await deleteRinkZone(deletingZone.id);
      if (result.success) {
        setZoneList((prev) =>
          prev.filter((z) => z.id !== deletingZone.id)
        );
        setZoneDeleteOpen(false);
        setDeletingZone(null);
        toast({
          title: "Zone deleted",
          description: "Zone has been removed.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete zone.",
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Rinks & Zones</CardTitle>
            <CardDescription>
              Manage rink surfaces and measurement zones for ice depth tracking.
            </CardDescription>
          </div>
          <Button onClick={openCreateRinkDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rink
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rinkList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-12">
            <SquareIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No rinks configured yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={openCreateRinkDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add your first rink
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rinkList
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((rink) => {
                const isExpanded = expandedRinks.has(rink.id);
                const rinkZones = getZonesForRink(rink.id);

                return (
                  <div
                    key={rink.id}
                    className="rounded-lg border bg-card"
                  >
                    {/* Rink Header */}
                    <div className="flex items-center gap-3 p-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => toggleExpanded(rink.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{rink.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {SURFACE_TYPES.find(
                              (s) => s.value === rink.surface_type
                            )?.label || rink.surface_type}
                          </Badge>
                          {!rink.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {rinkZones.length} zone
                            {rinkZones.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {rink.dimensions_length && rink.dimensions_width && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {rink.dimensions_length} ft x{" "}
                            {rink.dimensions_width} ft
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditRinkDialog(rink)}
                          title="Edit rink"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setDeletingRink(rink);
                            setRinkDeleteOpen(true);
                          }}
                          title="Delete rink"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Zones */}
                    {isExpanded && (
                      <div className="border-t bg-muted/30 px-4 py-3">
                        {rinkZones.length === 0 ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            No zones defined for this rink.
                          </div>
                        ) : (
                          <div className="rounded-md border bg-background">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-8">#</TableHead>
                                  <TableHead>Label</TableHead>
                                  <TableHead className="hidden sm:table-cell">
                                    Name (key)
                                  </TableHead>
                                  <TableHead className="hidden md:table-cell">
                                    Position
                                  </TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">
                                    Actions
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {rinkZones.map((zone) => (
                                  <TableRow
                                    key={zone.id}
                                    className={cn(
                                      !zone.is_active && "opacity-50"
                                    )}
                                  >
                                    <TableCell className="text-xs text-muted-foreground">
                                      {zone.sort_order}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {zone.label}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                      {zone.name}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                      {zone.x_position !== null &&
                                      zone.y_position !== null
                                        ? `(${zone.x_position}, ${zone.y_position})`
                                        : "---"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          zone.is_active
                                            ? "default"
                                            : "secondary"
                                        }
                                        className="text-xs"
                                      >
                                        {zone.is_active
                                          ? "Active"
                                          : "Inactive"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() =>
                                            openEditZoneDialog(zone)
                                          }
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => {
                                            setDeletingZone(zone);
                                            setZoneDeleteOpen(true);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCreateZoneDialog(rink.id)}
                          >
                            <Plus className="mr-2 h-3.5 w-3.5" />
                            Add Zone
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          {rinkList.length} rink{rinkList.length !== 1 ? "s" : ""},{" "}
          {zoneList.length} zone{zoneList.length !== 1 ? "s" : ""} total
        </p>
      </CardContent>

      {/* Rink Create/Edit Dialog */}
      <Dialog open={rinkDialogOpen} onOpenChange={setRinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRinkId ? "Edit Rink" : "Add Rink"}
            </DialogTitle>
            <DialogDescription>
              {editingRinkId
                ? "Update rink details."
                : "Add a new rink to your facility."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rink-name">Rink Name *</Label>
              <Input
                id="rink-name"
                value={rinkForm.name}
                onChange={(e) =>
                  setRinkForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Main Rink, Rink A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rink-surface">Surface Type</Label>
              <Select
                value={rinkForm.surface_type}
                onValueChange={(val) =>
                  setRinkForm((prev) => ({ ...prev, surface_type: val }))
                }
              >
                <SelectTrigger id="rink-surface">
                  <SelectValue placeholder="Select surface" />
                </SelectTrigger>
                <SelectContent>
                  {SURFACE_TYPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rink-length">Length (ft)</Label>
                <Input
                  id="rink-length"
                  type="number"
                  min={0}
                  value={rinkForm.dimensions_length}
                  onChange={(e) =>
                    setRinkForm((prev) => ({
                      ...prev,
                      dimensions_length: e.target.value,
                    }))
                  }
                  placeholder="e.g. 200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rink-width">Width (ft)</Label>
                <Input
                  id="rink-width"
                  type="number"
                  min={0}
                  value={rinkForm.dimensions_width}
                  onChange={(e) =>
                    setRinkForm((prev) => ({
                      ...prev,
                      dimensions_width: e.target.value,
                    }))
                  }
                  placeholder="e.g. 85"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rink-order">Sort Order</Label>
                <Input
                  id="rink-order"
                  type="number"
                  min={0}
                  value={rinkForm.sort_order}
                  onChange={(e) =>
                    setRinkForm((prev) => ({
                      ...prev,
                      sort_order: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Switch
                  id="rink-active"
                  checked={rinkForm.is_active}
                  onCheckedChange={(checked) =>
                    setRinkForm((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="rink-active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRinkDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRink}
              disabled={loading || !rinkForm.name}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {editingRinkId ? "Save Changes" : "Add Rink"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rink Delete Dialog */}
      <Dialog open={rinkDeleteOpen} onOpenChange={setRinkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rink</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingRink?.name}</span> and
              all its zones? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRinkDeleteOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRink}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Rink
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zone Create/Edit Dialog */}
      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingZoneId ? "Edit Zone" : "Add Zone"}
            </DialogTitle>
            <DialogDescription>
              {editingZoneId
                ? "Update zone details."
                : "Add a new measurement zone to this rink."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zone-name">Name (key) *</Label>
                <Input
                  id="zone-name"
                  value={zoneForm.name}
                  onChange={(e) =>
                    setZoneForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. center_ice"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone-label">Label *</Label>
                <Input
                  id="zone-label"
                  value={zoneForm.label}
                  onChange={(e) =>
                    setZoneForm((prev) => ({ ...prev, label: e.target.value }))
                  }
                  placeholder="e.g. Center Ice"
                />
              </div>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Position coordinates are used to place measurement points on the
              rink diagram (SVG). Values represent percentage positions (0-100).
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zone-x">X Position (%)</Label>
                <Input
                  id="zone-x"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={zoneForm.x_position}
                  onChange={(e) =>
                    setZoneForm((prev) => ({
                      ...prev,
                      x_position: e.target.value,
                    }))
                  }
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone-y">Y Position (%)</Label>
                <Input
                  id="zone-y"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={zoneForm.y_position}
                  onChange={(e) =>
                    setZoneForm((prev) => ({
                      ...prev,
                      y_position: e.target.value,
                    }))
                  }
                  placeholder="50"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zone-order">Sort Order</Label>
                <Input
                  id="zone-order"
                  type="number"
                  min={0}
                  value={zoneForm.sort_order}
                  onChange={(e) =>
                    setZoneForm((prev) => ({
                      ...prev,
                      sort_order: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Switch
                  id="zone-active"
                  checked={zoneForm.is_active}
                  onCheckedChange={(checked) =>
                    setZoneForm((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="zone-active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setZoneDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveZone}
              disabled={loading || !zoneForm.name || !zoneForm.label}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {editingZoneId ? "Save Changes" : "Add Zone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zone Delete Dialog */}
      <Dialog open={zoneDeleteOpen} onOpenChange={setZoneDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Zone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingZone?.label}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setZoneDeleteOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteZone}
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
