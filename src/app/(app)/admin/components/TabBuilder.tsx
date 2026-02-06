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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  createTabConfiguration,
  updateTabConfiguration,
  deleteTabConfiguration,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "@/app/(app)/admin/actions";
import type {
  TabConfiguration,
  ChecklistItem,
  ModuleType,
  ChecklistFieldType,
} from "@/lib/types/database";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  LayoutList,
  ListChecks,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TabBuilderProps {
  facilityId: string;
  tabs: TabConfiguration[];
  checklists: ChecklistItem[];
}

const MODULE_OPTIONS: { value: ModuleType; label: string }[] = [
  { value: "daily_reports", label: "Daily Reports" },
  { value: "ice_depth", label: "Ice Depth" },
  { value: "ice_operations", label: "Ice Operations" },
  { value: "refrigeration", label: "Refrigeration" },
  { value: "air_quality", label: "Air Quality" },
];

const FIELD_TYPES: { value: ChecklistFieldType; label: string }[] = [
  { value: "checkbox", label: "Checkbox" },
  { value: "number", label: "Number" },
  { value: "text", label: "Text" },
  { value: "select", label: "Dropdown" },
  { value: "temperature", label: "Temperature" },
  { value: "pressure", label: "Pressure" },
  { value: "time", label: "Time" },
];

interface TabFormData {
  module: ModuleType;
  name: string;
  label: string;
  description: string;
  sort_order: string;
  is_active: boolean;
}

interface ChecklistFormData {
  tab_id: string;
  label: string;
  description: string;
  field_type: ChecklistFieldType;
  options: string;
  default_value: string;
  unit: string;
  min_value: string;
  max_value: string;
  is_required: boolean;
  sort_order: string;
  is_active: boolean;
}

const EMPTY_TAB_FORM: TabFormData = {
  module: "daily_reports",
  name: "",
  label: "",
  description: "",
  sort_order: "0",
  is_active: true,
};

const EMPTY_CHECKLIST_FORM: ChecklistFormData = {
  tab_id: "",
  label: "",
  description: "",
  field_type: "checkbox",
  options: "",
  default_value: "",
  unit: "",
  min_value: "",
  max_value: "",
  is_required: false,
  sort_order: "0",
  is_active: true,
};

export function TabBuilder({
  facilityId,
  tabs,
  checklists,
}: TabBuilderProps) {
  const { toast } = useToast();
  const [tabList, setTabList] = useState<TabConfiguration[]>(tabs);
  const [checklistList, setChecklistList] = useState<ChecklistItem[]>(checklists);
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());
  const [filterModule, setFilterModule] = useState<string>("all");

  // Tab dialog state
  const [tabDialogOpen, setTabDialogOpen] = useState(false);
  const [tabDeleteOpen, setTabDeleteOpen] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [deletingTab, setDeletingTab] = useState<TabConfiguration | null>(null);
  const [tabForm, setTabForm] = useState<TabFormData>(EMPTY_TAB_FORM);

  // Checklist dialog state
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [checklistDeleteOpen, setChecklistDeleteOpen] = useState(false);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [deletingChecklist, setDeletingChecklist] = useState<ChecklistItem | null>(null);
  const [checklistForm, setChecklistForm] = useState<ChecklistFormData>(EMPTY_CHECKLIST_FORM);

  const [loading, setLoading] = useState(false);

  const filteredTabs =
    filterModule === "all"
      ? tabList
      : tabList.filter((t) => t.module === filterModule);

  const getChecklistsForTab = (tabId: string) =>
    checklistList
      .filter((c) => c.tab_id === tabId)
      .sort((a, b) => a.sort_order - b.sort_order);

  const toggleExpanded = (tabId: string) => {
    setExpandedTabs((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) {
        next.delete(tabId);
      } else {
        next.add(tabId);
      }
      return next;
    });
  };

  // ---- Tab CRUD ----
  const openCreateTabDialog = () => {
    setEditingTabId(null);
    setTabForm(EMPTY_TAB_FORM);
    setTabDialogOpen(true);
  };

  const openEditTabDialog = (tab: TabConfiguration) => {
    setEditingTabId(tab.id);
    setTabForm({
      module: tab.module,
      name: tab.name,
      label: tab.label,
      description: tab.description || "",
      sort_order: String(tab.sort_order),
      is_active: tab.is_active,
    });
    setTabDialogOpen(true);
  };

  const handleSaveTab = async () => {
    if (!tabForm.name || !tabForm.label) return;
    setLoading(true);

    const payload = {
      module: tabForm.module,
      name: tabForm.name,
      label: tabForm.label,
      description: tabForm.description || null,
      sort_order: parseInt(tabForm.sort_order) || 0,
      is_active: tabForm.is_active,
    };

    try {
      if (editingTabId) {
        const result = await updateTabConfiguration(editingTabId, payload);
        if (result.success) {
          setTabList((prev) =>
            prev.map((t) =>
              t.id === editingTabId ? (result.data as TabConfiguration) : t
            )
          );
          setTabDialogOpen(false);
          toast({ title: "Tab updated", description: `${tabForm.label} has been updated.` });
        } else {
          toast({ title: "Error", description: result.error || "Failed to update tab.", variant: "destructive" });
        }
      } else {
        const result = await createTabConfiguration(facilityId, payload);
        if (result.success) {
          setTabList((prev) => [...prev, result.data as TabConfiguration]);
          setTabDialogOpen(false);
          toast({ title: "Tab created", description: `${tabForm.label} has been created.` });
        } else {
          toast({ title: "Error", description: result.error || "Failed to create tab.", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTab = async () => {
    if (!deletingTab) return;
    setLoading(true);
    try {
      const result = await deleteTabConfiguration(deletingTab.id);
      if (result.success) {
        setTabList((prev) => prev.filter((t) => t.id !== deletingTab.id));
        setChecklistList((prev) => prev.filter((c) => c.tab_id !== deletingTab.id));
        setTabDeleteOpen(false);
        setDeletingTab(null);
        toast({ title: "Tab deleted", description: `${deletingTab.label} has been removed.` });
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete tab.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ---- Checklist CRUD ----
  const openCreateChecklistDialog = (tabId: string) => {
    setEditingChecklistId(null);
    setChecklistForm({ ...EMPTY_CHECKLIST_FORM, tab_id: tabId });
    setChecklistDialogOpen(true);
  };

  const openEditChecklistDialog = (item: ChecklistItem) => {
    setEditingChecklistId(item.id);
    setChecklistForm({
      tab_id: item.tab_id,
      label: item.label,
      description: item.description || "",
      field_type: item.field_type,
      options: item.options ? item.options.join(", ") : "",
      default_value: item.default_value || "",
      unit: item.unit || "",
      min_value: item.min_value !== null ? String(item.min_value) : "",
      max_value: item.max_value !== null ? String(item.max_value) : "",
      is_required: item.is_required,
      sort_order: String(item.sort_order),
      is_active: item.is_active,
    });
    setChecklistDialogOpen(true);
  };

  const handleSaveChecklist = async () => {
    if (!checklistForm.label || !checklistForm.tab_id) return;
    setLoading(true);

    const payload = {
      tab_id: checklistForm.tab_id,
      label: checklistForm.label,
      description: checklistForm.description || null,
      field_type: checklistForm.field_type,
      options: checklistForm.options
        ? checklistForm.options.split(",").map((o) => o.trim()).filter(Boolean)
        : null,
      default_value: checklistForm.default_value || null,
      unit: checklistForm.unit || null,
      min_value: checklistForm.min_value ? parseFloat(checklistForm.min_value) : null,
      max_value: checklistForm.max_value ? parseFloat(checklistForm.max_value) : null,
      is_required: checklistForm.is_required,
      sort_order: parseInt(checklistForm.sort_order) || 0,
      is_active: checklistForm.is_active,
    };

    try {
      if (editingChecklistId) {
        const result = await updateChecklistItem(editingChecklistId, payload);
        if (result.success) {
          setChecklistList((prev) =>
            prev.map((c) =>
              c.id === editingChecklistId ? (result.data as ChecklistItem) : c
            )
          );
          setChecklistDialogOpen(false);
          toast({ title: "Item updated", description: `${checklistForm.label} has been updated.` });
        } else {
          toast({ title: "Error", description: result.error || "Failed to update item.", variant: "destructive" });
        }
      } else {
        const result = await createChecklistItem(facilityId, payload);
        if (result.success) {
          setChecklistList((prev) => [...prev, result.data as ChecklistItem]);
          setChecklistDialogOpen(false);
          toast({ title: "Item created", description: `${checklistForm.label} has been added.` });
        } else {
          toast({ title: "Error", description: result.error || "Failed to create item.", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChecklist = async () => {
    if (!deletingChecklist) return;
    setLoading(true);
    try {
      const result = await deleteChecklistItem(deletingChecklist.id);
      if (result.success) {
        setChecklistList((prev) => prev.filter((c) => c.id !== deletingChecklist.id));
        setChecklistDeleteOpen(false);
        setDeletingChecklist(null);
        toast({ title: "Item deleted", description: "Checklist item has been removed." });
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete item.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Reports Configuration</CardTitle>
            <CardDescription>
              Build tabs and checklist items for Daily Reports and other modules.
            </CardDescription>
          </div>
          <Button onClick={openCreateTabDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tab
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

        {/* Tabs List */}
        {filteredTabs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-12">
            <LayoutList className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No tabs configured yet.</p>
            <Button variant="outline" size="sm" onClick={openCreateTabDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first tab
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTabs
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((tab) => {
                const isExpanded = expandedTabs.has(tab.id);
                const items = getChecklistsForTab(tab.id);

                return (
                  <div
                    key={tab.id}
                    className="rounded-lg border bg-card"
                  >
                    {/* Tab Header */}
                    <div className="flex items-center gap-2 p-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => toggleExpanded(tab.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{tab.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {MODULE_OPTIONS.find((m) => m.value === tab.module)?.label || tab.module}
                          </Badge>
                          {!tab.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {items.length} item{items.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {tab.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {tab.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditTabDialog(tab)}
                          title="Edit tab"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setDeletingTab(tab);
                            setTabDeleteOpen(true);
                          }}
                          title="Delete tab"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Checklist Items */}
                    {isExpanded && (
                      <div className="border-t bg-muted/30 px-4 py-3">
                        {items.length === 0 ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                            <ListChecks className="h-4 w-4" />
                            No checklist items in this tab.
                          </div>
                        ) : (
                          <div className="rounded-md border bg-background">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-8">#</TableHead>
                                  <TableHead>Label</TableHead>
                                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                                  <TableHead className="hidden md:table-cell">Required</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {items.map((item) => (
                                  <TableRow key={item.id} className={cn(!item.is_active && "opacity-50")}>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {item.sort_order}
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <p className="text-sm font-medium">{item.label}</p>
                                        {item.description && (
                                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                            {item.description}
                                          </p>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                      <Badge variant="outline" className="text-xs">
                                        {FIELD_TYPES.find((f) => f.value === item.field_type)?.label || item.field_type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                      {item.is_required ? (
                                        <Badge variant="default" className="text-xs">Yes</Badge>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">No</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => openEditChecklistDialog(item)}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => {
                                            setDeletingChecklist(item);
                                            setChecklistDeleteOpen(true);
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
                            onClick={() => openCreateChecklistDialog(tab.id)}
                          >
                            <Plus className="mr-2 h-3.5 w-3.5" />
                            Add Checklist Item
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>

      {/* Tab Create/Edit Dialog */}
      <Dialog open={tabDialogOpen} onOpenChange={setTabDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTabId ? "Edit Tab" : "Add Tab"}</DialogTitle>
            <DialogDescription>
              {editingTabId
                ? "Update this tab configuration."
                : "Create a new tab for report checklists."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tab-module">Module</Label>
              <Select
                value={tabForm.module}
                onValueChange={(val) =>
                  setTabForm((prev) => ({ ...prev, module: val as ModuleType }))
                }
              >
                <SelectTrigger id="tab-module">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tab-name">Name (key) *</Label>
                <Input
                  id="tab-name"
                  value={tabForm.name}
                  onChange={(e) =>
                    setTabForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. opening_checklist"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tab-label">Label *</Label>
                <Input
                  id="tab-label"
                  value={tabForm.label}
                  onChange={(e) =>
                    setTabForm((prev) => ({ ...prev, label: e.target.value }))
                  }
                  placeholder="e.g. Opening Checklist"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tab-desc">Description</Label>
              <Textarea
                id="tab-desc"
                value={tabForm.description}
                onChange={(e) =>
                  setTabForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tab-order">Sort Order</Label>
                <Input
                  id="tab-order"
                  type="number"
                  min={0}
                  value={tabForm.sort_order}
                  onChange={(e) =>
                    setTabForm((prev) => ({
                      ...prev,
                      sort_order: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Switch
                  id="tab-active"
                  checked={tabForm.is_active}
                  onCheckedChange={(checked) =>
                    setTabForm((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="tab-active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTabDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveTab} disabled={loading || !tabForm.name || !tabForm.label}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {editingTabId ? "Save Changes" : "Create Tab"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tab Delete Dialog */}
      <Dialog open={tabDeleteOpen} onOpenChange={setTabDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tab</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingTab?.label}</span> and all its
              checklist items? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTabDeleteOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTab} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Tab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Item Create/Edit Dialog */}
      <Dialog open={checklistDialogOpen} onOpenChange={setChecklistDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingChecklistId ? "Edit Checklist Item" : "Add Checklist Item"}
            </DialogTitle>
            <DialogDescription>
              {editingChecklistId
                ? "Update this checklist item."
                : "Add a new item to this tab."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cl-label">Label *</Label>
                <Input
                  id="cl-label"
                  value={checklistForm.label}
                  onChange={(e) =>
                    setChecklistForm((prev) => ({ ...prev, label: e.target.value }))
                  }
                  placeholder="e.g. Ice Temperature"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cl-desc">Description</Label>
                <Textarea
                  id="cl-desc"
                  value={checklistForm.description}
                  onChange={(e) =>
                    setChecklistForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Instructions or help text..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-type">Field Type</Label>
                <Select
                  value={checklistForm.field_type}
                  onValueChange={(val) =>
                    setChecklistForm((prev) => ({
                      ...prev,
                      field_type: val as ChecklistFieldType,
                    }))
                  }
                >
                  <SelectTrigger id="cl-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-unit">Unit</Label>
                <Input
                  id="cl-unit"
                  value={checklistForm.unit}
                  onChange={(e) =>
                    setChecklistForm((prev) => ({ ...prev, unit: e.target.value }))
                  }
                  placeholder="e.g. F, PSI"
                />
              </div>
              {checklistForm.field_type === "select" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cl-options">Options (comma-separated)</Label>
                  <Input
                    id="cl-options"
                    value={checklistForm.options}
                    onChange={(e) =>
                      setChecklistForm((prev) => ({
                        ...prev,
                        options: e.target.value,
                      }))
                    }
                    placeholder="e.g. Good, Fair, Poor"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="cl-default">Default Value</Label>
                <Input
                  id="cl-default"
                  value={checklistForm.default_value}
                  onChange={(e) =>
                    setChecklistForm((prev) => ({
                      ...prev,
                      default_value: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-order">Sort Order</Label>
                <Input
                  id="cl-order"
                  type="number"
                  min={0}
                  value={checklistForm.sort_order}
                  onChange={(e) =>
                    setChecklistForm((prev) => ({
                      ...prev,
                      sort_order: e.target.value,
                    }))
                  }
                />
              </div>
              {(checklistForm.field_type === "number" ||
                checklistForm.field_type === "temperature" ||
                checklistForm.field_type === "pressure") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cl-min">Min Value</Label>
                    <Input
                      id="cl-min"
                      type="number"
                      step="any"
                      value={checklistForm.min_value}
                      onChange={(e) =>
                        setChecklistForm((prev) => ({
                          ...prev,
                          min_value: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cl-max">Max Value</Label>
                    <Input
                      id="cl-max"
                      type="number"
                      step="any"
                      value={checklistForm.max_value}
                      onChange={(e) =>
                        setChecklistForm((prev) => ({
                          ...prev,
                          max_value: e.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}
            </div>
            <Separator />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="cl-required"
                  checked={checklistForm.is_required}
                  onCheckedChange={(checked) =>
                    setChecklistForm((prev) => ({ ...prev, is_required: checked }))
                  }
                />
                <Label htmlFor="cl-required">Required</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="cl-active"
                  checked={checklistForm.is_active}
                  onCheckedChange={(checked) =>
                    setChecklistForm((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="cl-active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChecklistDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChecklist}
              disabled={loading || !checklistForm.label}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {editingChecklistId ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Delete Dialog */}
      <Dialog open={checklistDeleteOpen} onOpenChange={setChecklistDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Checklist Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingChecklist?.label}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChecklistDeleteOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteChecklist} disabled={loading}>
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
