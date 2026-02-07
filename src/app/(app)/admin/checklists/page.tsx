"use client";

import React, { useState } from "react";
import { CheckSquare, Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

type SubTab = "opening" | "closing" | "daily";

interface ChecklistItem {
  id: string;
  label: string;
  type: "checkbox" | "number" | "text" | "select";
  subTab: SubTab;
  required: boolean;
}

interface ReportTab {
  id: string;
  name: string;
  items: ChecklistItem[];
}

const initialTabs: ReportTab[] = [
  {
    id: "ice-maintenance",
    name: "Ice Maintenance",
    items: [
      {
        id: "1",
        label: "Resurface all rinks",
        type: "checkbox",
        subTab: "opening",
        required: true,
      },
      {
        id: "2",
        label: "Check ice temperature",
        type: "number",
        subTab: "opening",
        required: true,
      },
      {
        id: "3",
        label: "Edge boards cleaned",
        type: "checkbox",
        subTab: "daily",
        required: false,
      },
      {
        id: "4",
        label: "Final resurface completed",
        type: "checkbox",
        subTab: "closing",
        required: true,
      },
      {
        id: "5",
        label: "Ice plant shut down for night",
        type: "checkbox",
        subTab: "closing",
        required: true,
      },
    ],
  },
  {
    id: "safety",
    name: "Safety & Security",
    items: [
      {
        id: "6",
        label: "Emergency exits clear",
        type: "checkbox",
        subTab: "opening",
        required: true,
      },
      {
        id: "7",
        label: "First aid kit stocked",
        type: "checkbox",
        subTab: "opening",
        required: true,
      },
      {
        id: "8",
        label: "Security walkthrough completed",
        type: "checkbox",
        subTab: "closing",
        required: true,
      },
    ],
  },
  {
    id: "building",
    name: "Building Operations",
    items: [
      {
        id: "9",
        label: "HVAC system check",
        type: "checkbox",
        subTab: "opening",
        required: false,
      },
      {
        id: "10",
        label: "Lighting operational",
        type: "checkbox",
        subTab: "opening",
        required: true,
      },
      {
        id: "11",
        label: "Washrooms cleaned",
        type: "checkbox",
        subTab: "daily",
        required: true,
      },
      {
        id: "12",
        label: "All doors locked",
        type: "checkbox",
        subTab: "closing",
        required: true,
      },
    ],
  },
];

const SUB_TAB_LABELS: Record<SubTab, string> = {
  opening: "Opening",
  closing: "Closing",
  daily: "Daily Operations",
};

export default function ChecklistBuilderPage() {
  const { toast } = useToast();
  const [tabs, setTabs] = useState<ReportTab[]>(initialTabs);
  const [activeTab, setActiveTab] = useState(initialTabs[0].id);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("opening");

  // Add Tab dialog
  const [addTabOpen, setAddTabOpen] = useState(false);
  const [newTabName, setNewTabName] = useState("");

  // Add Item dialog
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemType, setNewItemType] = useState<ChecklistItem["type"]>("checkbox");
  const [newItemRequired, setNewItemRequired] = useState(false);

  const currentTab = tabs.find((t) => t.id === activeTab);
  const filteredItems =
    currentTab?.items.filter((item) => item.subTab === activeSubTab) ?? [];

  const handleAddTab = () => {
    if (!newTabName.trim()) return;
    const newTab: ReportTab = {
      id: `tab-${Date.now()}`,
      name: newTabName.trim(),
      items: [],
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newTab.id);
    setNewTabName("");
    setAddTabOpen(false);
    toast({
      title: "Tab added",
      description: `"${newTab.name}" tab has been created.`,
    });
  };

  const handleAddItem = () => {
    if (!newItemLabel.trim() || !currentTab) return;
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      label: newItemLabel.trim(),
      type: newItemType,
      subTab: activeSubTab,
      required: newItemRequired,
    };
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab ? { ...t, items: [...t.items, newItem] } : t
      )
    );
    setNewItemLabel("");
    setNewItemType("checkbox");
    setNewItemRequired(false);
    setAddItemOpen(false);
    toast({
      title: "Item added",
      description: `"${newItem.label}" has been added to ${SUB_TAB_LABELS[activeSubTab]}.`,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab
          ? { ...t, items: t.items.filter((i) => i.id !== itemId) }
          : t
      )
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <CheckSquare className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Checklist Builder
          </h1>
          <p className="text-sm text-slate-500">
            Configure daily report tabs, sub-tabs, and checklist items
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Report Tab Selection */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Report Tabs</CardTitle>
            <Dialog open={addTabOpen} onOpenChange={setAddTabOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tab
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Report Tab</DialogTitle>
                  <DialogDescription>
                    Create a new tab section for the daily report.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tab-name">Tab Name</Label>
                    <Input
                      id="tab-name"
                      placeholder="e.g., Equipment Checks"
                      value={newTabName}
                      onChange={(e) => setNewTabName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddTabOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddTab}>Add Tab</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.name}
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 px-1.5 text-xs"
                  >
                    {tab.items.length}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sub-tab content */}
        {currentTab && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{currentTab.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeSubTab}
                onValueChange={(v) => setActiveSubTab(v as SubTab)}
              >
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="opening">Opening</TabsTrigger>
                    <TabsTrigger value="closing">Closing</TabsTrigger>
                    <TabsTrigger value="daily">Daily Operations</TabsTrigger>
                  </TabsList>

                  <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Checklist Item</DialogTitle>
                        <DialogDescription>
                          Add a new item to the{" "}
                          {SUB_TAB_LABELS[activeSubTab]} checklist under{" "}
                          {currentTab.name}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="item-label">Item Label</Label>
                          <Input
                            id="item-label"
                            placeholder="e.g., Check compressor pressure"
                            value={newItemLabel}
                            onChange={(e) => setNewItemLabel(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-type">Input Type</Label>
                          <Select
                            value={newItemType}
                            onValueChange={(v) =>
                              setNewItemType(v as ChecklistItem["type"])
                            }
                          >
                            <SelectTrigger id="item-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="item-required"
                            checked={newItemRequired}
                            onChange={(e) =>
                              setNewItemRequired(e.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <Label
                            htmlFor="item-required"
                            className="font-normal"
                          >
                            Required field
                          </Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setAddItemOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddItem}>Add Item</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <TabsContent value="opening" className="mt-0">
                  <ItemList
                    items={filteredItems}
                    onRemove={handleRemoveItem}
                  />
                </TabsContent>
                <TabsContent value="closing" className="mt-0">
                  <ItemList
                    items={filteredItems}
                    onRemove={handleRemoveItem}
                  />
                </TabsContent>
                <TabsContent value="daily" className="mt-0">
                  <ItemList
                    items={filteredItems}
                    onRemove={handleRemoveItem}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ItemList({
  items,
  onRemove,
}: {
  items: ChecklistItem[];
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No items configured for this section. Click &quot;Add Item&quot; to get
        started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 border rounded-md bg-slate-50/50 hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <GripVertical className="h-4 w-4 text-slate-300" />
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs h-5">
                  {item.type}
                </Badge>
                {item.required && (
                  <Badge
                    variant="secondary"
                    className="text-xs h-5 bg-amber-100 text-amber-800"
                  >
                    Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-500"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
