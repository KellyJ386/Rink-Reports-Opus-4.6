'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings2,
  Loader2,
  Fuel,
  Zap,
  Thermometer,
  Clock,
  MapPin,
  Wind,
} from 'lucide-react'
import {
  createMachine,
  updateMachine,
  toggleMachineActive,
  createCircleCheckItem,
  updateCircleCheckItem,
  deleteCircleCheckItem,
  reorderCircleCheckItems,
  createEquipment,
  updateEquipment,
  toggleEquipmentActive,
  createReadingType,
  updateReadingType,
  deleteReadingType,
  createShiftType,
  updateShiftType,
  toggleShiftTypeActive,
  createIncidentLocation,
  updateIncidentLocation,
  deleteIncidentLocation,
  createAirQualityMetric,
  updateAirQualityMetric,
  deleteAirQualityMetric,
  createAirQualityLocation,
  updateAirQualityLocation,
  deleteAirQualityLocation,
} from './actions'

// ============================================
// Types
// ============================================

interface Machine {
  id: string
  facility_id: string
  name: string
  fuel_type: 'gas' | 'electric'
  is_active: boolean
  sort_order: number
  circle_check_items: CircleCheckItem[]
}

interface CircleCheckItem {
  id: string
  machine_id: string
  item_text: string
  sort_order: number
  is_active: boolean
}

interface Equipment {
  id: string
  facility_id: string
  name: string
  equipment_type: string
  is_active: boolean
  sort_order: number
  equipment_reading_types: ReadingType[]
}

interface ReadingType {
  id: string
  equipment_id: string
  name: string
  unit: string
  min_threshold: number | null
  max_threshold: number | null
  sort_order: number
  is_oil_level: boolean
}

interface ShiftType {
  id: string
  facility_id: string
  name: string
  color: string
  is_active: boolean
  sort_order: number
}

interface IncidentLocation {
  id: string
  facility_id: string
  name: string
  sort_order: number
  is_active: boolean
}

interface AirQualityMetric {
  id: string
  facility_id: string
  name: string
  unit: string
  min_threshold: number | null
  max_threshold: number | null
  sort_order: number
  is_active: boolean
}

interface AirQualityLocation {
  id: string
  facility_id: string
  name: string
  sort_order: number
  is_active: boolean
}

// ============================================
// Main Page Component
// ============================================

export default function EquipmentSetupPage() {
  const { profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  // Data state
  const [machines, setMachines] = useState<Machine[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [incidentLocations, setIncidentLocations] = useState<IncidentLocation[]>([])
  const [airQualityMetrics, setAirQualityMetrics] = useState<AirQualityMetric[]>([])
  const [airQualityLocations, setAirQualityLocations] = useState<AirQualityLocation[]>([])
  const [loading, setLoading] = useState(true)

  // ============================================
  // Data Fetching
  // ============================================

  const fetchMachines = useCallback(async () => {
    if (!profile?.facility_id) return
    const { data, error } = await supabase
      .from('machines')
      .select('*, circle_check_items(id, machine_id, item_text, sort_order, is_active)')
      .eq('facility_id', profile.facility_id)
      .order('sort_order', { ascending: true })

    if (error) {
      toast({ title: 'Error', description: 'Failed to load machines', variant: 'destructive' })
      return
    }
    setMachines(
      (data ?? []).map((m) => ({
        ...m,
        circle_check_items: (m.circle_check_items ?? []).sort(
          (a: CircleCheckItem, b: CircleCheckItem) => a.sort_order - b.sort_order
        ),
      }))
    )
  }, [profile?.facility_id, supabase, toast])

  const fetchEquipment = useCallback(async () => {
    if (!profile?.facility_id) return
    const { data, error } = await supabase
      .from('equipment')
      .select('*, equipment_reading_types(id, equipment_id, name, unit, min_threshold, max_threshold, sort_order, is_oil_level)')
      .eq('facility_id', profile.facility_id)
      .order('sort_order', { ascending: true })

    if (error) {
      toast({ title: 'Error', description: 'Failed to load equipment', variant: 'destructive' })
      return
    }
    setEquipment(
      (data ?? []).map((e) => ({
        ...e,
        equipment_reading_types: (e.equipment_reading_types ?? []).sort(
          (a: ReadingType, b: ReadingType) => a.sort_order - b.sort_order
        ),
      }))
    )
  }, [profile?.facility_id, supabase, toast])

  const fetchShiftTypes = useCallback(async () => {
    if (!profile?.facility_id) return
    const { data, error } = await supabase
      .from('shift_types')
      .select('*')
      .eq('facility_id', profile.facility_id)
      .order('sort_order', { ascending: true })

    if (error) {
      toast({ title: 'Error', description: 'Failed to load shift types', variant: 'destructive' })
      return
    }
    setShiftTypes(data ?? [])
  }, [profile?.facility_id, supabase, toast])

  const fetchIncidentLocations = useCallback(async () => {
    if (!profile?.facility_id) return
    const { data, error } = await supabase
      .from('incident_locations')
      .select('*')
      .eq('facility_id', profile.facility_id)
      .order('sort_order', { ascending: true })

    if (error) {
      toast({ title: 'Error', description: 'Failed to load incident locations', variant: 'destructive' })
      return
    }
    setIncidentLocations(data ?? [])
  }, [profile?.facility_id, supabase, toast])

  const fetchAirQualityMetrics = useCallback(async () => {
    if (!profile?.facility_id) return
    const { data, error } = await supabase
      .from('air_quality_metrics')
      .select('*')
      .eq('facility_id', profile.facility_id)
      .order('sort_order', { ascending: true })

    if (error) {
      toast({ title: 'Error', description: 'Failed to load air quality metrics', variant: 'destructive' })
      return
    }
    setAirQualityMetrics(data ?? [])
  }, [profile?.facility_id, supabase, toast])

  const fetchAirQualityLocations = useCallback(async () => {
    if (!profile?.facility_id) return
    const { data, error } = await supabase
      .from('air_quality_locations')
      .select('*')
      .eq('facility_id', profile.facility_id)
      .order('sort_order', { ascending: true })

    if (error) {
      toast({ title: 'Error', description: 'Failed to load air quality locations', variant: 'destructive' })
      return
    }
    setAirQualityLocations(data ?? [])
  }, [profile?.facility_id, supabase, toast])

  useEffect(() => {
    if (!profile?.facility_id) return
    setLoading(true)
    Promise.all([
      fetchMachines(),
      fetchEquipment(),
      fetchShiftTypes(),
      fetchIncidentLocations(),
      fetchAirQualityMetrics(),
      fetchAirQualityLocations(),
    ]).finally(() => setLoading(false))
  }, [
    profile?.facility_id,
    fetchMachines,
    fetchEquipment,
    fetchShiftTypes,
    fetchIncidentLocations,
    fetchAirQualityMetrics,
    fetchAirQualityLocations,
  ])

  // ============================================
  // Loading / Auth States
  // ============================================

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Equipment Setup</h1>
        <p className="text-muted-foreground mt-1">
          Configure machines, refrigeration equipment, shift types, locations, and air quality settings.
        </p>
      </div>

      <Tabs defaultValue="machines" className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="machines" className="gap-1.5 min-h-[40px]">
            <Fuel className="h-4 w-4 hidden sm:inline-block" />
            Machines
          </TabsTrigger>
          <TabsTrigger value="refrigeration" className="gap-1.5 min-h-[40px]">
            <Thermometer className="h-4 w-4 hidden sm:inline-block" />
            Refrigeration
          </TabsTrigger>
          <TabsTrigger value="shift-types" className="gap-1.5 min-h-[40px]">
            <Clock className="h-4 w-4 hidden sm:inline-block" />
            Shift Types
          </TabsTrigger>
          <TabsTrigger value="incident-locations" className="gap-1.5 min-h-[40px]">
            <MapPin className="h-4 w-4 hidden sm:inline-block" />
            Incident Locations
          </TabsTrigger>
          <TabsTrigger value="air-quality-metrics" className="gap-1.5 min-h-[40px]">
            <Wind className="h-4 w-4 hidden sm:inline-block" />
            AQ Metrics
          </TabsTrigger>
          <TabsTrigger value="air-quality-locations" className="gap-1.5 min-h-[40px]">
            <MapPin className="h-4 w-4 hidden sm:inline-block" />
            AQ Locations
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Machines */}
        <TabsContent value="machines">
          <MachinesTab
            machines={machines}
            onRefresh={fetchMachines}
            toast={toast}
          />
        </TabsContent>

        {/* Tab 2: Refrigeration */}
        <TabsContent value="refrigeration">
          <RefrigerationTab
            equipment={equipment}
            onRefresh={fetchEquipment}
            toast={toast}
          />
        </TabsContent>

        {/* Tab 3: Shift Types */}
        <TabsContent value="shift-types">
          <ShiftTypesTab
            shiftTypes={shiftTypes}
            onRefresh={fetchShiftTypes}
            toast={toast}
          />
        </TabsContent>

        {/* Tab 4: Incident Locations */}
        <TabsContent value="incident-locations">
          <IncidentLocationsTab
            locations={incidentLocations}
            onRefresh={fetchIncidentLocations}
            toast={toast}
          />
        </TabsContent>

        {/* Tab 5: Air Quality Metrics */}
        <TabsContent value="air-quality-metrics">
          <AirQualityMetricsTab
            metrics={airQualityMetrics}
            onRefresh={fetchAirQualityMetrics}
            toast={toast}
          />
        </TabsContent>

        {/* Tab 6: Air Quality Locations */}
        <TabsContent value="air-quality-locations">
          <AirQualityLocationsTab
            locations={airQualityLocations}
            onRefresh={fetchAirQualityLocations}
            toast={toast}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================
// Confirmation Dialog Component
// ============================================

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// Tab 1: Machines (Zamboni/Resurfacers)
// ============================================

function MachinesTab({
  machines,
  onRefresh,
  toast,
}: {
  machines: Machine[]
  onRefresh: () => Promise<void>
  toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editMachine, setEditMachine] = useState<Machine | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedMachine, setExpandedMachine] = useState<string | null>(null)

  // Add Machine form state
  const [newName, setNewName] = useState('')
  const [newFuelType, setNewFuelType] = useState<string>('gas')

  // Edit Machine form state
  const [editName, setEditName] = useState('')
  const [editFuelType, setEditFuelType] = useState<string>('gas')

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ title: 'Validation Error', description: 'Machine name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    const formData = new FormData()
    formData.set('name', newName.trim())
    formData.set('fuel_type', newFuelType)
    const result = await createMachine(formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Machine Added', description: `"${newName.trim()}" has been created`, variant: 'success' })
      setAddOpen(false)
      setNewName('')
      setNewFuelType('gas')
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to create machine', variant: 'destructive' })
    }
  }

  const handleUpdate = async () => {
    if (!editMachine || !editName.trim()) return
    setSaving(true)
    const formData = new FormData()
    formData.set('name', editName.trim())
    formData.set('fuel_type', editFuelType)
    const result = await updateMachine(editMachine.id, formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Machine Updated', description: `"${editName.trim()}" has been updated`, variant: 'success' })
      setEditOpen(false)
      setEditMachine(null)
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to update machine', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (machine: Machine) => {
    const result = await toggleMachineActive(machine.id, !machine.is_active)
    if (result.success) {
      toast({
        title: machine.is_active ? 'Machine Deactivated' : 'Machine Activated',
        description: `"${machine.name}" has been ${machine.is_active ? 'deactivated' : 'activated'}`,
        variant: 'success',
      })
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to toggle status', variant: 'destructive' })
    }
  }

  const openEdit = (machine: Machine) => {
    setEditMachine(machine)
    setEditName(machine.name)
    setEditFuelType(machine.fuel_type)
    setEditOpen(true)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Machines (Zamboni / Resurfacers)</CardTitle>
          <CardDescription>Manage ice resurfacing machines and their circle check items</CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]">
              <Plus className="h-4 w-4 mr-2" />
              Add Machine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Machine</DialogTitle>
              <DialogDescription>Add a new ice resurfacing machine to your facility.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-machine-name">Name</Label>
                <Input
                  id="new-machine-name"
                  placeholder="e.g. Zamboni 1"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-machine-fuel">Fuel Type</Label>
                <Select value={newFuelType} onValueChange={setNewFuelType}>
                  <SelectTrigger id="new-machine-fuel">
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gas">Gas</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving} className="bg-action-green hover:bg-action-green-hover text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Machine
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {machines.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No machines configured yet. Add your first machine to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {machines.map((machine) => (
              <div key={machine.id} className="border rounded-lg dark:border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-foreground">{machine.name}</span>
                    <Badge
                      className={
                        machine.fuel_type === 'gas'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }
                    >
                      {machine.fuel_type === 'gas' ? (
                        <Fuel className="h-3 w-3 mr-1" />
                      ) : (
                        <Zap className="h-3 w-3 mr-1" />
                      )}
                      {machine.fuel_type === 'gas' ? 'Gas' : 'Electric'}
                    </Badge>
                    <Badge variant={machine.is_active ? 'default' : 'secondary'}>
                      {machine.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {machine.circle_check_items.length} circle check item{machine.circle_check_items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-h-[48px]">
                      <Label htmlFor={`machine-active-${machine.id}`} className="text-sm text-muted-foreground sr-only">
                        Active
                      </Label>
                      <Switch
                        id={`machine-active-${machine.id}`}
                        checked={machine.is_active}
                        onCheckedChange={() => handleToggleActive(machine)}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEdit(machine)} className="min-h-[48px] min-w-[48px]">
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedMachine(expandedMachine === machine.id ? null : machine.id)}
                      className="min-h-[48px]"
                    >
                      <Settings2 className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Circle Check</span>
                      {expandedMachine === machine.id ? (
                        <ChevronUp className="h-4 w-4 ml-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </Button>
                  </div>
                </div>
                {expandedMachine === machine.id && (
                  <div className="border-t dark:border-border">
                    <CircleCheckSection
                      machineId={machine.id}
                      items={machine.circle_check_items}
                      onRefresh={onRefresh}
                      toast={toast}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Machine Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Machine</DialogTitle>
            <DialogDescription>Update the machine details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-machine-name">Name</Label>
              <Input
                id="edit-machine-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-machine-fuel">Fuel Type</Label>
              <Select value={editFuelType} onValueChange={setEditFuelType}>
                <SelectTrigger id="edit-machine-fuel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-action-green hover:bg-action-green-hover text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ============================================
// Circle Check Items Section
// ============================================

function CircleCheckSection({
  machineId,
  items,
  onRefresh,
  toast,
}: {
  machineId: string
  items: CircleCheckItem[]
  onRefresh: () => Promise<void>
  toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}) {
  const [newItemText, setNewItemText] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleAddItem = async () => {
    if (!newItemText.trim()) return
    setSaving(true)
    const formData = new FormData()
    formData.set('machine_id', machineId)
    formData.set('item_text', newItemText.trim())
    const result = await createCircleCheckItem(formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Item Added', description: 'Circle check item has been added', variant: 'success' })
      setNewItemText('')
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to add item', variant: 'destructive' })
    }
  }

  const handleUpdateItem = async (id: string) => {
    if (!editingText.trim()) return
    setSaving(true)
    const formData = new FormData()
    formData.set('item_text', editingText.trim())
    const result = await updateCircleCheckItem(id, formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Item Updated', description: 'Circle check item has been updated', variant: 'success' })
      setEditingId(null)
      setEditingText('')
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to update item', variant: 'destructive' })
    }
  }

  const handleDeleteItem = async () => {
    if (!deleteConfirmId) return
    setDeleting(true)
    const result = await deleteCircleCheckItem(deleteConfirmId)
    setDeleting(false)
    if (result.success) {
      toast({ title: 'Item Deleted', description: 'Circle check item has been removed', variant: 'success' })
      setDeleteConfirmId(null)
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to delete item', variant: 'destructive' })
    }
  }

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= items.length) return

    const updated = items.map((item, i) => {
      if (i === index) return { id: item.id, sort_order: items[swapIndex].sort_order }
      if (i === swapIndex) return { id: item.id, sort_order: items[index].sort_order }
      return { id: item.id, sort_order: item.sort_order }
    })

    const result = await reorderCircleCheckItems(updated)
    if (result.success) {
      await onRefresh()
    } else {
      toast({ title: 'Error', description: 'Failed to reorder items', variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 bg-muted/30 dark:bg-muted/10 space-y-3">
      <h4 className="text-sm font-medium text-foreground">Circle Check Items</h4>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">No circle check items yet.</p>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          <div className="flex flex-col">
            <button
              onClick={() => handleReorder(index, 'up')}
              disabled={index === 0}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 min-w-[28px] min-h-[28px] flex items-center justify-center"
              aria-label="Move up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleReorder(index, 'down')}
              disabled={index === items.length - 1}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 min-w-[28px] min-h-[28px] flex items-center justify-center"
              aria-label="Move down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {editingId === item.id ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateItem(item.id)
                  if (e.key === 'Escape') { setEditingId(null); setEditingText('') }
                }}
              />
              <Button
                size="sm"
                onClick={() => handleUpdateItem(item.id)}
                disabled={saving}
                className="bg-action-green hover:bg-action-green-hover text-white min-h-[40px]"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditingId(null); setEditingText('') }}
                className="min-h-[40px]"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-h-[40px]">
              <span className="flex-1 text-sm text-foreground">{item.item_text}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setEditingId(item.id); setEditingText(item.item_text) }}
                className="min-h-[40px] min-w-[40px]"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmId(item.id)}
                className="text-alert-red hover:text-alert-red hover:bg-alert-red/10 min-h-[40px] min-w-[40px]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Add new item */}
      <div className="flex items-center gap-2 pt-2">
        <Input
          placeholder="New circle check item..."
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem() }}
        />
        <Button
          onClick={handleAddItem}
          disabled={saving || !newItemText.trim()}
          className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          Add
        </Button>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}
        title="Delete Circle Check Item"
        description="Are you sure you want to delete this circle check item? This action cannot be undone."
        onConfirm={handleDeleteItem}
        loading={deleting}
      />
    </div>
  )
}

// ============================================
// Tab 2: Refrigeration
// ============================================

function RefrigerationTab({
  equipment,
  onRefresh,
  toast,
}: {
  equipment: Equipment[]
  onRefresh: () => Promise<void>
  toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editEquip, setEditEquip] = useState<Equipment | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedEquip, setExpandedEquip] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('compressor')

  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('')

  const equipmentTypes = ['compressor', 'pump', 'condenser']

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ title: 'Validation Error', description: 'Equipment name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    const formData = new FormData()
    formData.set('name', newName.trim())
    formData.set('equipment_type', newType)
    const result = await createEquipment(formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Equipment Added', description: `"${newName.trim()}" has been created`, variant: 'success' })
      setAddOpen(false)
      setNewName('')
      setNewType('compressor')
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to create equipment', variant: 'destructive' })
    }
  }

  const handleUpdate = async () => {
    if (!editEquip || !editName.trim()) return
    setSaving(true)
    const formData = new FormData()
    formData.set('name', editName.trim())
    formData.set('equipment_type', editType)
    const result = await updateEquipment(editEquip.id, formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Equipment Updated', description: `"${editName.trim()}" has been updated`, variant: 'success' })
      setEditOpen(false)
      setEditEquip(null)
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to update equipment', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (equip: Equipment) => {
    const result = await toggleEquipmentActive(equip.id, !equip.is_active)
    if (result.success) {
      toast({
        title: equip.is_active ? 'Equipment Deactivated' : 'Equipment Activated',
        description: `"${equip.name}" has been ${equip.is_active ? 'deactivated' : 'activated'}`,
        variant: 'success',
      })
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to toggle status', variant: 'destructive' })
    }
  }

  const openEdit = (equip: Equipment) => {
    setEditEquip(equip)
    setEditName(equip.name)
    setEditType(equip.equipment_type)
    setEditOpen(true)
  }

  const typeColorMap: Record<string, string> = {
    compressor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    pump: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    condenser: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Refrigeration Equipment</CardTitle>
          <CardDescription>Manage compressors, pumps, condensers, and their reading types</CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]">
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Equipment</DialogTitle>
              <DialogDescription>Add a new refrigeration equipment to your facility.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-equip-name">Name</Label>
                <Input
                  id="new-equip-name"
                  placeholder="e.g. Main Compressor"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-equip-type">Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger id="new-equip-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {newType === 'custom' && (
                  <Input
                    placeholder="Enter custom type..."
                    onChange={(e) => setNewType(e.target.value || 'custom')}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving} className="bg-action-green hover:bg-action-green-hover text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Equipment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {equipment.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No refrigeration equipment configured yet. Add your first equipment to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {equipment.map((equip) => (
              <div key={equip.id} className="border rounded-lg dark:border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-foreground">{equip.name}</span>
                    <Badge className={typeColorMap[equip.equipment_type] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'}>
                      {equip.equipment_type.charAt(0).toUpperCase() + equip.equipment_type.slice(1)}
                    </Badge>
                    <Badge variant={equip.is_active ? 'default' : 'secondary'}>
                      {equip.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {equip.equipment_reading_types.length} reading type{equip.equipment_reading_types.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-h-[48px]">
                      <Switch
                        checked={equip.is_active}
                        onCheckedChange={() => handleToggleActive(equip)}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEdit(equip)} className="min-h-[48px] min-w-[48px]">
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedEquip(expandedEquip === equip.id ? null : equip.id)}
                      className="min-h-[48px]"
                    >
                      <Settings2 className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Readings</span>
                      {expandedEquip === equip.id ? (
                        <ChevronUp className="h-4 w-4 ml-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </Button>
                  </div>
                </div>
                {expandedEquip === equip.id && (
                  <div className="border-t dark:border-border">
                    <ReadingTypesSection
                      equipmentId={equip.id}
                      readingTypes={equip.equipment_reading_types}
                      onRefresh={onRefresh}
                      toast={toast}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Equipment Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>Update the equipment details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-equip-name">Name</Label>
              <Input
                id="edit-equip-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-equip-type">Type</Label>
              <Select
                value={equipmentTypes.includes(editType) ? editType : 'custom'}
                onValueChange={(val) => {
                  if (val === 'custom') setEditType('')
                  else setEditType(val)
                }}
              >
                <SelectTrigger id="edit-equip-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {!equipmentTypes.includes(editType) && (
                <Input
                  placeholder="Enter custom type..."
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-action-green hover:bg-action-green-hover text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ============================================
// Reading Types Section (Refrigeration sub-items)
// ============================================

function ReadingTypesSection({
  equipmentId,
  readingTypes,
  onRefresh,
  toast,
}: {
  equipmentId: string
  readingTypes: ReadingType[]
  onRefresh: () => Promise<void>
  toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editRT, setEditRT] = useState<ReadingType | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Add form state
  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newMin, setNewMin] = useState('')
  const [newMax, setNewMax] = useState('')
  const [newIsOil, setNewIsOil] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editMin, setEditMin] = useState('')
  const [editMax, setEditMax] = useState('')
  const [editIsOil, setEditIsOil] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim() || !newUnit.trim()) {
      toast({ title: 'Validation Error', description: 'Name and unit are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    const formData = new FormData()
    formData.set('equipment_id', equipmentId)
    formData.set('name', newName.trim())
    formData.set('unit', newUnit.trim())
    if (newMin) formData.set('min_threshold', newMin)
    if (newMax) formData.set('max_threshold', newMax)
    formData.set('is_oil_level', String(newIsOil))
    const result = await createReadingType(formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Reading Type Added', description: `"${newName.trim()}" has been created`, variant: 'success' })
      setAddOpen(false)
      setNewName('')
      setNewUnit('')
      setNewMin('')
      setNewMax('')
      setNewIsOil(false)
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to add reading type', variant: 'destructive' })
    }
  }

  const handleUpdate = async () => {
    if (!editRT || !editName.trim() || !editUnit.trim()) return
    setSaving(true)
    const formData = new FormData()
    formData.set('equipment_id', equipmentId)
    formData.set('name', editName.trim())
    formData.set('unit', editUnit.trim())
    if (editMin) formData.set('min_threshold', editMin)
    if (editMax) formData.set('max_threshold', editMax)
    formData.set('is_oil_level', String(editIsOil))
    const result = await updateReadingType(editRT.id, formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Reading Type Updated', description: `"${editName.trim()}" has been updated`, variant: 'success' })
      setEditOpen(false)
      setEditRT(null)
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to update reading type', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    setDeleting(true)
    const result = await deleteReadingType(deleteConfirmId)
    setDeleting(false)
    if (result.success) {
      toast({ title: 'Reading Type Deleted', description: 'Reading type has been removed', variant: 'success' })
      setDeleteConfirmId(null)
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to delete reading type', variant: 'destructive' })
    }
  }

  const openEditRT = (rt: ReadingType) => {
    setEditRT(rt)
    setEditName(rt.name)
    setEditUnit(rt.unit)
    setEditMin(rt.min_threshold?.toString() ?? '')
    setEditMax(rt.max_threshold?.toString() ?? '')
    setEditIsOil(rt.is_oil_level)
    setEditOpen(true)
  }

  return (
    <div className="p-4 bg-muted/30 dark:bg-muted/10 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Reading Types</h4>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-action-green hover:bg-action-green-hover text-white min-h-[40px]">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Reading Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Reading Type</DialogTitle>
              <DialogDescription>Define a new reading type for this equipment.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rt-new-name">Name</Label>
                <Input id="rt-new-name" placeholder="e.g. Head Pressure" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rt-new-unit">Unit</Label>
                <Input id="rt-new-unit" placeholder="e.g. PSI" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rt-new-min">Min Threshold</Label>
                  <Input id="rt-new-min" type="number" placeholder="Optional" value={newMin} onChange={(e) => setNewMin(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rt-new-max">Max Threshold</Label>
                  <Input id="rt-new-max" type="number" placeholder="Optional" value={newMax} onChange={(e) => setNewMax(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="rt-new-oil" checked={newIsOil} onCheckedChange={setNewIsOil} />
                <Label htmlFor="rt-new-oil">Is Oil Level Reading</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleAdd} disabled={saving} className="bg-action-green hover:bg-action-green-hover text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Reading Type
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {readingTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reading types configured.</p>
      ) : (
        <div className="space-y-2">
          {readingTypes.map((rt) => (
            <div key={rt.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-background border rounded-md p-3 gap-2 dark:border-border">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">{rt.name}</span>
                <Badge variant="outline" className="text-xs">{rt.unit}</Badge>
                {rt.min_threshold !== null && (
                  <span className="text-xs text-muted-foreground">Min: {rt.min_threshold}</span>
                )}
                {rt.max_threshold !== null && (
                  <span className="text-xs text-muted-foreground">Max: {rt.max_threshold}</span>
                )}
                {rt.is_oil_level && (
                  <Badge variant="secondary" className="text-xs">Oil Level</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEditRT(rt)} className="min-h-[40px] min-w-[40px]">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmId(rt.id)}
                  className="text-alert-red hover:text-alert-red hover:bg-alert-red/10 min-h-[40px] min-w-[40px]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Reading Type Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reading Type</DialogTitle>
            <DialogDescription>Update this reading type configuration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rt-edit-name">Name</Label>
              <Input id="rt-edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rt-edit-unit">Unit</Label>
              <Input id="rt-edit-unit" value={editUnit} onChange={(e) => setEditUnit(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rt-edit-min">Min Threshold</Label>
                <Input id="rt-edit-min" type="number" placeholder="Optional" value={editMin} onChange={(e) => setEditMin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rt-edit-max">Max Threshold</Label>
                <Input id="rt-edit-max" type="number" placeholder="Optional" value={editMax} onChange={(e) => setEditMax(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="rt-edit-oil" checked={editIsOil} onCheckedChange={setEditIsOil} />
              <Label htmlFor="rt-edit-oil">Is Oil Level Reading</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-action-green hover:bg-action-green-hover text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}
        title="Delete Reading Type"
        description="Are you sure you want to delete this reading type? This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}

// ============================================
// Tab 3: Shift Types
// ============================================

function ShiftTypesTab({
  shiftTypes,
  onRefresh,
  toast,
}: {
  shiftTypes: ShiftType[]
  onRefresh: () => Promise<void>
  toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editShift, setEditShift] = useState<ShiftType | null>(null)
  const [saving, setSaving] = useState(false)

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#69BE28')

  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#69BE28')

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ title: 'Validation Error', description: 'Shift type name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    const formData = new FormData()
    formData.set('name', newName.trim())
    formData.set('color', newColor)
    const result = await createShiftType(formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Shift Type Added', description: `"${newName.trim()}" has been created`, variant: 'success' })
      setAddOpen(false)
      setNewName('')
      setNewColor('#69BE28')
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to create shift type', variant: 'destructive' })
    }
  }

  const handleUpdate = async () => {
    if (!editShift || !editName.trim()) return
    setSaving(true)
    const formData = new FormData()
    formData.set('name', editName.trim())
    formData.set('color', editColor)
    const result = await updateShiftType(editShift.id, formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Shift Type Updated', description: `"${editName.trim()}" has been updated`, variant: 'success' })
      setEditOpen(false)
      setEditShift(null)
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to update shift type', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (shift: ShiftType) => {
    const result = await toggleShiftTypeActive(shift.id, !shift.is_active)
    if (result.success) {
      toast({
        title: shift.is_active ? 'Shift Type Deactivated' : 'Shift Type Activated',
        description: `"${shift.name}" has been ${shift.is_active ? 'deactivated' : 'activated'}`,
        variant: 'success',
      })
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to toggle status', variant: 'destructive' })
    }
  }

  const openEdit = (shift: ShiftType) => {
    setEditShift(shift)
    setEditName(shift.name)
    setEditColor(shift.color)
    setEditOpen(true)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Shift Types</CardTitle>
          <CardDescription>Define the types of shifts for scheduling</CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]">
              <Plus className="h-4 w-4 mr-2" />
              Add Shift Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Shift Type</DialogTitle>
              <DialogDescription>Create a new shift type for scheduling.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-shift-name">Name</Label>
                <Input
                  id="new-shift-name"
                  placeholder="e.g. Morning"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-shift-color">Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="new-shift-color"
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-input bg-background"
                  />
                  <Input
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving} className="bg-action-green hover:bg-action-green-hover text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Shift Type
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {shiftTypes.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No shift types configured yet. Add your first shift type to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {shiftTypes.map((shift) => (
              <div
                key={shift.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 gap-3 dark:border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-6 w-6 rounded-full border border-border shrink-0"
                    style={{ backgroundColor: shift.color }}
                    title={shift.color}
                  />
                  <span className="font-medium text-foreground">{shift.name}</span>
                  <Badge variant={shift.is_active ? 'default' : 'secondary'}>
                    {shift.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={shift.is_active}
                    onCheckedChange={() => handleToggleActive(shift)}
                  />
                  <Button variant="outline" size="sm" onClick={() => openEdit(shift)} className="min-h-[48px] min-w-[48px]">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Shift Type Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shift Type</DialogTitle>
            <DialogDescription>Update the shift type details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-shift-name">Name</Label>
              <Input
                id="edit-shift-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-shift-color">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="edit-shift-color"
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-input bg-background"
                />
                <Input
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="flex-1 font-mono"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-action-green hover:bg-action-green-hover text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ============================================
// Tab 4: Incident Locations
// ============================================

function IncidentLocationsTab({
  locations,
  onRefresh,
  toast,
}: {
  locations: IncidentLocation[]
  onRefresh: () => Promise<void>
  toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}) {
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const formData = new FormData()
    formData.set('name', newName.trim())
    const result = await createIncidentLocation(formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Location Added', description: `"${newName.trim()}" has been created`, variant: 'success' })
      setNewName('')
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to add location', variant: 'destructive' })
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return
    setSaving(true)
    const formData = new FormData()
    formData.set('name', editingName.trim())
    const result = await updateIncidentLocation(id, formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Location Updated', description: 'Location has been updated', variant: 'success' })
      setEditingId(null)
      setEditingName('')
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to update location', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    setDeleting(true)
    const result = await deleteIncidentLocation(deleteConfirmId)
    setDeleting(false)
    if (result.success) {
      toast({ title: 'Location Deleted', description: 'Location has been removed', variant: 'success' })
      setDeleteConfirmId(null)
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to delete location', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Incident Locations</CardTitle>
        <CardDescription>Define locations within your facility for incident reporting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add inline */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="New location name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          />
          <Button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Add
          </Button>
        </div>

        <Separator />

        {locations.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">
            No incident locations configured yet.
          </p>
        ) : (
          <div className="space-y-2">
            {locations.map((loc) => (
              <div key={loc.id} className="flex items-center gap-2 min-h-[48px]">
                {editingId === loc.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(loc.id)
                        if (e.key === 'Escape') { setEditingId(null); setEditingName('') }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(loc.id)}
                      disabled={saving}
                      className="bg-action-green hover:bg-action-green-hover text-white min-h-[40px]"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingId(null); setEditingName('') }}
                      className="min-h-[40px]"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 border rounded-md p-3 dark:border-border">
                    <span className="flex-1 text-sm text-foreground">{loc.name}</span>
                    <span className="text-xs text-muted-foreground mr-2">#{loc.sort_order}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingId(loc.id); setEditingName(loc.name) }}
                      className="min-h-[40px] min-w-[40px]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(loc.id)}
                      className="text-alert-red hover:text-alert-red hover:bg-alert-red/10 min-h-[40px] min-w-[40px]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={!!deleteConfirmId}
          onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}
          title="Delete Incident Location"
          description="Are you sure you want to delete this location? This action cannot be undone."
          onConfirm={handleDelete}
          loading={deleting}
        />
      </CardContent>
    </Card>
  )
}

// ============================================
// Tab 5: Air Quality Metrics
// ============================================

function AirQualityMetricsTab({
  metrics,
  onRefresh,
  toast,
}: {
  metrics: AirQualityMetric[]
  onRefresh: () => Promise<void>
  toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editMetric, setEditMetric] = useState<AirQualityMetric | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newMin, setNewMin] = useState('')
  const [newMax, setNewMax] = useState('')

  const [editName, setEditName] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editMin, setEditMin] = useState('')
  const [editMax, setEditMax] = useState('')

  const handleCreate = async () => {
    if (!newName.trim() || !newUnit.trim()) {
      toast({ title: 'Validation Error', description: 'Name and unit are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    const formData = new FormData()
    formData.set('name', newName.trim())
    formData.set('unit', newUnit.trim())
    if (newMin) formData.set('min_threshold', newMin)
    if (newMax) formData.set('max_threshold', newMax)
    const result = await createAirQualityMetric(formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Metric Added', description: `"${newName.trim()}" has been created`, variant: 'success' })
      setAddOpen(false)
      setNewName('')
      setNewUnit('')
      setNewMin('')
      setNewMax('')
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to create metric', variant: 'destructive' })
    }
  }

  const handleUpdate = async () => {
    if (!editMetric || !editName.trim() || !editUnit.trim()) return
    setSaving(true)
    const formData = new FormData()
    formData.set('name', editName.trim())
    formData.set('unit', editUnit.trim())
    if (editMin) formData.set('min_threshold', editMin)
    if (editMax) formData.set('max_threshold', editMax)
    const result = await updateAirQualityMetric(editMetric.id, formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Metric Updated', description: `"${editName.trim()}" has been updated`, variant: 'success' })
      setEditOpen(false)
      setEditMetric(null)
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to update metric', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    setDeleting(true)
    const result = await deleteAirQualityMetric(deleteConfirmId)
    setDeleting(false)
    if (result.success) {
      toast({ title: 'Metric Deleted', description: 'Metric has been removed', variant: 'success' })
      setDeleteConfirmId(null)
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to delete metric', variant: 'destructive' })
    }
  }

  const openEdit = (metric: AirQualityMetric) => {
    setEditMetric(metric)
    setEditName(metric.name)
    setEditUnit(metric.unit)
    setEditMin(metric.min_threshold?.toString() ?? '')
    setEditMax(metric.max_threshold?.toString() ?? '')
    setEditOpen(true)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Air Quality Metrics</CardTitle>
          <CardDescription>Configure the air quality measurements your facility tracks</CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]">
              <Plus className="h-4 w-4 mr-2" />
              Add Metric
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Air Quality Metric</DialogTitle>
              <DialogDescription>Define a new air quality metric for monitoring.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="aq-new-name">Name</Label>
                <Input id="aq-new-name" placeholder="e.g. CO (Carbon Monoxide)" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aq-new-unit">Unit</Label>
                <Input id="aq-new-unit" placeholder="e.g. PPM" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aq-new-min">Min Threshold</Label>
                  <Input id="aq-new-min" type="number" placeholder="Optional" value={newMin} onChange={(e) => setNewMin(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aq-new-max">Max Threshold</Label>
                  <Input id="aq-new-max" type="number" placeholder="Optional" value={newMax} onChange={(e) => setNewMax(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving} className="bg-action-green hover:bg-action-green-hover text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Metric
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No air quality metrics configured yet. Add your first metric to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 gap-3 dark:border-border"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium text-foreground">{metric.name}</span>
                  <Badge variant="outline">{metric.unit}</Badge>
                  {metric.min_threshold !== null && (
                    <span className="text-sm text-muted-foreground">Min: {metric.min_threshold}</span>
                  )}
                  {metric.max_threshold !== null && (
                    <span className="text-sm text-muted-foreground">Max: {metric.max_threshold}</span>
                  )}
                  <Badge variant={metric.is_active ? 'default' : 'secondary'}>
                    {metric.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => openEdit(metric)} className="min-h-[48px] min-w-[48px]">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(metric.id)}
                    className="text-alert-red border-alert-red/30 hover:bg-alert-red/10 min-h-[48px] min-w-[48px]"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Metric Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Air Quality Metric</DialogTitle>
            <DialogDescription>Update this air quality metric configuration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="aq-edit-name">Name</Label>
              <Input id="aq-edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aq-edit-unit">Unit</Label>
              <Input id="aq-edit-unit" value={editUnit} onChange={(e) => setEditUnit(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aq-edit-min">Min Threshold</Label>
                <Input id="aq-edit-min" type="number" placeholder="Optional" value={editMin} onChange={(e) => setEditMin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aq-edit-max">Max Threshold</Label>
                <Input id="aq-edit-max" type="number" placeholder="Optional" value={editMax} onChange={(e) => setEditMax(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-action-green hover:bg-action-green-hover text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}
        title="Delete Air Quality Metric"
        description="Are you sure you want to delete this metric? This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </Card>
  )
}

// ============================================
// Tab 6: Air Quality Locations
// ============================================

function AirQualityLocationsTab({
  locations,
  onRefresh,
  toast,
}: {
  locations: AirQualityLocation[]
  onRefresh: () => Promise<void>
  toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}) {
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const formData = new FormData()
    formData.set('name', newName.trim())
    const result = await createAirQualityLocation(formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Location Added', description: `"${newName.trim()}" has been created`, variant: 'success' })
      setNewName('')
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to add location', variant: 'destructive' })
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return
    setSaving(true)
    const formData = new FormData()
    formData.set('name', editingName.trim())
    const result = await updateAirQualityLocation(id, formData)
    setSaving(false)
    if (result.success) {
      toast({ title: 'Location Updated', description: 'Location has been updated', variant: 'success' })
      setEditingId(null)
      setEditingName('')
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to update location', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    setDeleting(true)
    const result = await deleteAirQualityLocation(deleteConfirmId)
    setDeleting(false)
    if (result.success) {
      toast({ title: 'Location Deleted', description: 'Location has been removed', variant: 'success' })
      setDeleteConfirmId(null)
      await onRefresh()
    } else {
      toast({ title: 'Error', description: typeof result.error === 'string' ? result.error : 'Failed to delete location', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Air Quality Locations</CardTitle>
        <CardDescription>Define monitoring locations for air quality readings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add inline */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="New location name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          />
          <Button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Add
          </Button>
        </div>

        <Separator />

        {locations.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">
            No air quality locations configured yet.
          </p>
        ) : (
          <div className="space-y-2">
            {locations.map((loc) => (
              <div key={loc.id} className="flex items-center gap-2 min-h-[48px]">
                {editingId === loc.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(loc.id)
                        if (e.key === 'Escape') { setEditingId(null); setEditingName('') }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(loc.id)}
                      disabled={saving}
                      className="bg-action-green hover:bg-action-green-hover text-white min-h-[40px]"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingId(null); setEditingName('') }}
                      className="min-h-[40px]"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 border rounded-md p-3 dark:border-border">
                    <span className="flex-1 text-sm text-foreground">{loc.name}</span>
                    <span className="text-xs text-muted-foreground mr-2">#{loc.sort_order}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingId(loc.id); setEditingName(loc.name) }}
                      className="min-h-[40px] min-w-[40px]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(loc.id)}
                      className="text-alert-red hover:text-alert-red hover:bg-alert-red/10 min-h-[40px] min-w-[40px]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={!!deleteConfirmId}
          onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}
          title="Delete Air Quality Location"
          description="Are you sure you want to delete this location? This action cannot be undone."
          onConfirm={handleDelete}
          loading={deleting}
        />
      </CardContent>
    </Card>
  )
}
