"use client";

import React, { useState } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

interface Rink {
  id: string;
  name: string;
  length: number;
  width: number;
  status: "active" | "inactive";
}

interface Thresholds {
  greenMin: number;
  greenMax: number;
  yellowMin: number;
  yellowMax: number;
  redMin: number;
  redMax: number;
}

const initialRinks: Rink[] = [
  { id: "1", name: "Main Rink", length: 200, width: 85, status: "active" },
  {
    id: "2",
    name: "Practice Rink",
    length: 185,
    width: 85,
    status: "active",
  },
  {
    id: "3",
    name: "Community Pad",
    length: 160,
    width: 80,
    status: "inactive",
  },
];

export default function RinkConfigurationPage() {
  const { toast } = useToast();
  const [rinks, setRinks] = useState<Rink[]>(initialRinks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLength, setNewLength] = useState("");
  const [newWidth, setNewWidth] = useState("");

  const [thresholds, setThresholds] = useState<Thresholds>({
    greenMin: 1.0,
    greenMax: 1.25,
    yellowMin: 0.75,
    yellowMax: 1.0,
    redMin: 0,
    redMax: 0.75,
  });

  const handleAddRink = () => {
    if (!newName || !newLength || !newWidth) return;
    const rink: Rink = {
      id: String(Date.now()),
      name: newName,
      length: parseFloat(newLength),
      width: parseFloat(newWidth),
      status: "active",
    };
    setRinks((prev) => [...prev, rink]);
    setNewName("");
    setNewLength("");
    setNewWidth("");
    setDialogOpen(false);
    toast({
      title: "Rink added",
      description: `${rink.name} has been added successfully.`,
    });
  };

  const handleSaveThresholds = () => {
    toast({
      title: "Thresholds saved",
      description: "Ice depth thresholds have been updated successfully.",
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <LayoutGrid className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Rink Configuration
          </h1>
          <p className="text-sm text-slate-500">
            Configure your rinks, dimensions, and ice depth thresholds
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Rinks Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Rinks</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rink
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Rink</DialogTitle>
                  <DialogDescription>
                    Configure the name and dimensions for the new rink.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="rink-name">Rink Name</Label>
                    <Input
                      id="rink-name"
                      placeholder="e.g., Main Rink"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rink-length">Length (ft)</Label>
                      <Input
                        id="rink-length"
                        type="number"
                        placeholder="200"
                        value={newLength}
                        onChange={(e) => setNewLength(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rink-width">Width (ft)</Label>
                      <Input
                        id="rink-width"
                        type="number"
                        placeholder="85"
                        value={newWidth}
                        onChange={(e) => setNewWidth(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddRink}>Add Rink</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Dimensions (ft)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rinks.map((rink) => (
                  <TableRow key={rink.id}>
                    <TableCell className="font-medium">{rink.name}</TableCell>
                    <TableCell className="text-slate-500">
                      {rink.length} x {rink.width}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          rink.status === "active" ? "default" : "outline"
                        }
                        className={
                          rink.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "text-slate-500"
                        }
                      >
                        {rink.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Ice Depth Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ice Depth Thresholds</CardTitle>
            <p className="text-sm text-slate-500">
              Configure the acceptable ranges for ice depth measurements
              (inches)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Green Range */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32 shrink-0">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Green (Good)</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={thresholds.greenMin}
                  onChange={(e) =>
                    setThresholds((prev) => ({
                      ...prev,
                      greenMin: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-24"
                />
                <span className="text-sm text-slate-400">to</span>
                <Input
                  type="number"
                  step="0.01"
                  value={thresholds.greenMax}
                  onChange={(e) =>
                    setThresholds((prev) => ({
                      ...prev,
                      greenMax: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-24"
                />
                <span className="text-sm text-slate-500">inches</span>
              </div>
            </div>

            <Separator />

            {/* Yellow Range */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32 shrink-0">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm font-medium">Yellow (Warn)</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={thresholds.yellowMin}
                  onChange={(e) =>
                    setThresholds((prev) => ({
                      ...prev,
                      yellowMin: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-24"
                />
                <span className="text-sm text-slate-400">to</span>
                <Input
                  type="number"
                  step="0.01"
                  value={thresholds.yellowMax}
                  onChange={(e) =>
                    setThresholds((prev) => ({
                      ...prev,
                      yellowMax: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-24"
                />
                <span className="text-sm text-slate-500">inches</span>
              </div>
            </div>

            <Separator />

            {/* Red Range */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32 shrink-0">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium">Red (Critical)</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={thresholds.redMin}
                  onChange={(e) =>
                    setThresholds((prev) => ({
                      ...prev,
                      redMin: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-24"
                />
                <span className="text-sm text-slate-400">to</span>
                <Input
                  type="number"
                  step="0.01"
                  value={thresholds.redMax}
                  onChange={(e) =>
                    setThresholds((prev) => ({
                      ...prev,
                      redMax: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-24"
                />
                <span className="text-sm text-slate-500">inches</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveThresholds}>Save Thresholds</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
