"use client";

import React, { useState } from "react";
import { Wrench, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface Machine {
  id: string;
  name: string;
  fuelType: string;
  status: "active" | "maintenance" | "retired";
}

interface RefrigerationEquip {
  id: string;
  name: string;
  type: string;
  status: "active" | "maintenance" | "retired";
}

interface ShiftType {
  id: string;
  name: string;
  color: string;
  status: "active" | "inactive";
}

const initialMachines: Machine[] = [
  { id: "1", name: "Zamboni 552", fuelType: "Propane", status: "active" },
  { id: "2", name: "Zamboni 650", fuelType: "Electric", status: "active" },
  {
    id: "3",
    name: "Olympia Millennium",
    fuelType: "Natural Gas",
    status: "maintenance",
  },
];

const initialRefrigeration: RefrigerationEquip[] = [
  { id: "1", name: "Compressor Unit A", type: "Ammonia", status: "active" },
  { id: "2", name: "Compressor Unit B", type: "Ammonia", status: "active" },
  { id: "3", name: "Chiller System 1", type: "Brine", status: "maintenance" },
];

const initialShiftTypes: ShiftType[] = [
  { id: "1", name: "Morning", color: "#3b82f6", status: "active" },
  { id: "2", name: "Afternoon", color: "#f59e0b", status: "active" },
  { id: "3", name: "Evening", color: "#8b5cf6", status: "active" },
  { id: "4", name: "Overnight", color: "#1e293b", status: "inactive" },
];

const FUEL_TYPES = ["Propane", "Electric", "Natural Gas", "Diesel"];
const REFRIG_TYPES = ["Ammonia", "Freon", "Brine", "Glycol"];
const SHIFT_COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#10b981", label: "Green" },
  { value: "#ef4444", label: "Red" },
  { value: "#1e293b", label: "Dark" },
  { value: "#f97316", label: "Orange" },
];

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Active
        </Badge>
      );
    case "maintenance":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          Maintenance
        </Badge>
      );
    case "retired":
      return (
        <Badge variant="outline" className="text-slate-500">
          Retired
        </Badge>
      );
    case "inactive":
      return (
        <Badge variant="outline" className="text-slate-500">
          Inactive
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function EquipmentSetupPage() {
  const { toast } = useToast();

  // Machines
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [machineDialog, setMachineDialog] = useState(false);
  const [newMachineName, setNewMachineName] = useState("");
  const [newMachineFuel, setNewMachineFuel] = useState("Propane");

  // Refrigeration
  const [refrigeration, setRefrigeration] =
    useState<RefrigerationEquip[]>(initialRefrigeration);
  const [refrigDialog, setRefrigDialog] = useState(false);
  const [newRefrigName, setNewRefrigName] = useState("");
  const [newRefrigType, setNewRefrigType] = useState("Ammonia");

  // Shift Types
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>(initialShiftTypes);
  const [shiftDialog, setShiftDialog] = useState(false);
  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftColor, setNewShiftColor] = useState("#3b82f6");

  const handleAddMachine = () => {
    if (!newMachineName.trim()) return;
    setMachines((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: newMachineName.trim(),
        fuelType: newMachineFuel,
        status: "active",
      },
    ]);
    setNewMachineName("");
    setNewMachineFuel("Propane");
    setMachineDialog(false);
    toast({ title: "Machine added", description: "New machine has been added." });
  };

  const handleAddRefrig = () => {
    if (!newRefrigName.trim()) return;
    setRefrigeration((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: newRefrigName.trim(),
        type: newRefrigType,
        status: "active",
      },
    ]);
    setNewRefrigName("");
    setNewRefrigType("Ammonia");
    setRefrigDialog(false);
    toast({
      title: "Equipment added",
      description: "New refrigeration equipment has been added.",
    });
  };

  const handleAddShift = () => {
    if (!newShiftName.trim()) return;
    setShiftTypes((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: newShiftName.trim(),
        color: newShiftColor,
        status: "active",
      },
    ]);
    setNewShiftName("");
    setNewShiftColor("#3b82f6");
    setShiftDialog(false);
    toast({
      title: "Shift type added",
      description: "New shift type has been added.",
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Wrench className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Equipment Setup
          </h1>
          <p className="text-sm text-slate-500">
            Manage ice resurfacing machines, refrigeration equipment, and shift
            types
          </p>
        </div>
      </div>

      <Tabs defaultValue="machines">
        <TabsList className="mb-4">
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="refrigeration">Refrigeration</TabsTrigger>
          <TabsTrigger value="shifts">Shift Types</TabsTrigger>
        </TabsList>

        {/* Machines Tab */}
        <TabsContent value="machines">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">
                  Ice Resurfacing Machines
                </h3>
                <Dialog open={machineDialog} onOpenChange={setMachineDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Machine
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Machine</DialogTitle>
                      <DialogDescription>
                        Add a new ice resurfacing machine to your inventory.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="machine-name">Machine Name</Label>
                        <Input
                          id="machine-name"
                          placeholder="e.g., Zamboni 552"
                          value={newMachineName}
                          onChange={(e) => setNewMachineName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="machine-fuel">Fuel Type</Label>
                        <Select
                          value={newMachineFuel}
                          onValueChange={setNewMachineFuel}
                        >
                          <SelectTrigger id="machine-fuel">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FUEL_TYPES.map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setMachineDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddMachine}>Add Machine</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-slate-500">
                        {m.fuelType}
                      </TableCell>
                      <TableCell>{statusBadge(m.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refrigeration Tab */}
        <TabsContent value="refrigeration">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">
                  Refrigeration Equipment
                </h3>
                <Dialog open={refrigDialog} onOpenChange={setRefrigDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Equipment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Refrigeration Equipment</DialogTitle>
                      <DialogDescription>
                        Add new refrigeration equipment to the system.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="refrig-name">Equipment Name</Label>
                        <Input
                          id="refrig-name"
                          placeholder="e.g., Compressor Unit C"
                          value={newRefrigName}
                          onChange={(e) => setNewRefrigName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="refrig-type">Refrigerant Type</Label>
                        <Select
                          value={newRefrigType}
                          onValueChange={setNewRefrigType}
                        >
                          <SelectTrigger id="refrig-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REFRIG_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setRefrigDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddRefrig}>Add Equipment</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refrigeration.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-slate-500">
                        {r.type}
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shift Types Tab */}
        <TabsContent value="shifts">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">
                  Shift Types
                </h3>
                <Dialog open={shiftDialog} onOpenChange={setShiftDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Shift Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Shift Type</DialogTitle>
                      <DialogDescription>
                        Create a new shift type with a name and color.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="shift-name">Shift Name</Label>
                        <Input
                          id="shift-name"
                          placeholder="e.g., Weekend"
                          value={newShiftName}
                          onChange={(e) => setNewShiftName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shift-color">Color</Label>
                        <Select
                          value={newShiftColor}
                          onValueChange={setNewShiftColor}
                        >
                          <SelectTrigger id="shift-color">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SHIFT_COLORS.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: c.value }}
                                  />
                                  {c.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShiftDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddShift}>Add Shift Type</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftTypes.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="text-sm text-slate-500">
                            {s.color}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(s.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
