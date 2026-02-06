'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createRink, updateRink, toggleRinkActive, saveDepthThresholds } from './actions'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Plus, Pencil, MapPin, Power, SquareStack, Loader2 } from 'lucide-react'

// ============================================
// Types
// ============================================

interface Rink {
  id: string
  name: string
  length_ft: number
  width_ft: number
  sort_order: number
  is_active: boolean
}

interface DepthThresholds {
  green_min: number
  green_max: number
  yellow_min: number
  yellow_max: number
  red_min: number
  red_max: number
}

const DEFAULT_THRESHOLDS: DepthThresholds = {
  green_min: 1.0,
  green_max: 1.74,
  yellow_min: 1.75,
  yellow_max: 3.5,
  red_min: 0.0,
  red_max: 0.99,
}

// ============================================
// Component
// ============================================

export default function RinksConfigPage() {
  const { toast } = useToast()
  const supabase = createClient()

  // Data state
  const [rinks, setRinks] = useState<Rink[]>([])
  const [thresholds, setThresholds] = useState<DepthThresholds>(DEFAULT_THRESHOLDS)
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [rinkDialogOpen, setRinkDialogOpen] = useState(false)
  const [editingRink, setEditingRink] = useState<Rink | null>(null)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [deactivatingRink, setDeactivatingRink] = useState<Rink | null>(null)
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false)
  const [pointsRink, setPointsRink] = useState<Rink | null>(null)

  // Form state
  const [rinkName, setRinkName] = useState('')
  const [rinkLength, setRinkLength] = useState('200')
  const [rinkWidth, setRinkWidth] = useState('85')
  const [rinkSortOrder, setRinkSortOrder] = useState('0')
  const [saving, setSaving] = useState(false)
  const [savingThresholds, setSavingThresholds] = useState(false)

  // ============================================
  // Fetch data
  // ============================================

  async function fetchData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('facility_id')
        .eq('id', user.id)
        .single()

      if (!profile?.facility_id) return

      // Fetch rinks
      const { data: rinksData } = await supabase
        .from('rinks')
        .select('id, name, length_ft, width_ft, sort_order, is_active')
        .eq('facility_id', profile.facility_id)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (rinksData) setRinks(rinksData)

      // Fetch thresholds
      const { data: thresholdsData } = await supabase
        .from('ice_depth_thresholds')
        .select('green_min, green_max, yellow_min, yellow_max, red_min, red_max')
        .eq('facility_id', profile.facility_id)
        .single()

      if (thresholdsData) {
        setThresholds(thresholdsData)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load rink data.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============================================
  // Rink Dialog helpers
  // ============================================

  function openAddDialog() {
    setEditingRink(null)
    setRinkName('')
    setRinkLength('200')
    setRinkWidth('85')
    setRinkSortOrder('0')
    setRinkDialogOpen(true)
  }

  function openEditDialog(rink: Rink) {
    setEditingRink(rink)
    setRinkName(rink.name)
    setRinkLength(String(rink.length_ft))
    setRinkWidth(String(rink.width_ft))
    setRinkSortOrder(String(rink.sort_order))
    setRinkDialogOpen(true)
  }

  function openDeactivateDialog(rink: Rink) {
    setDeactivatingRink(rink)
    setDeactivateDialogOpen(true)
  }

  function openPointsDialog(rink: Rink) {
    setPointsRink(rink)
    setPointsDialogOpen(true)
  }

  // ============================================
  // Rink CRUD handlers
  // ============================================

  async function handleSaveRink() {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.set('name', rinkName)
      formData.set('length_ft', rinkLength)
      formData.set('width_ft', rinkWidth)
      formData.set('sort_order', rinkSortOrder)

      let result
      if (editingRink) {
        result = await updateRink(editingRink.id, formData)
      } else {
        result = await createRink(formData)
      }

      if (result.success) {
        toast({
          title: editingRink ? 'Rink Updated' : 'Rink Created',
          description: editingRink
            ? `"${rinkName}" has been updated.`
            : `"${rinkName}" has been added.`,
          variant: 'success',
        })
        setRinkDialogOpen(false)
        await fetchData()
      } else {
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : 'Validation failed. Please check your inputs.'
        toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive() {
    if (!deactivatingRink) return
    setSaving(true)
    try {
      const newActive = !deactivatingRink.is_active
      const result = await toggleRinkActive(deactivatingRink.id, newActive)

      if (result.success) {
        toast({
          title: newActive ? 'Rink Activated' : 'Rink Deactivated',
          description: `"${deactivatingRink.name}" has been ${newActive ? 'activated' : 'deactivated'}.`,
          variant: 'success',
        })
        setDeactivateDialogOpen(false)
        setDeactivatingRink(null)
        await fetchData()
      } else {
        const errorMsg = typeof result.error === 'string' ? result.error : 'Operation failed.'
        toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ============================================
  // Threshold handlers
  // ============================================

  async function handleSaveThresholds() {
    setSavingThresholds(true)
    try {
      const result = await saveDepthThresholds({
        green_min: thresholds.green_min,
        green_max: thresholds.green_max,
        yellow_min: thresholds.yellow_min,
        yellow_max: thresholds.yellow_max,
        red_min: thresholds.red_min,
        red_max: thresholds.red_max,
      })

      if (result.success) {
        toast({ title: 'Thresholds Saved', description: 'Ice depth thresholds have been updated.', variant: 'success' })
      } else {
        const errorMsg = typeof result.error === 'string' ? result.error : 'Validation failed.'
        toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' })
    } finally {
      setSavingThresholds(false)
    }
  }

  function updateThreshold(field: keyof DepthThresholds, value: string) {
    const num = parseFloat(value)
    if (!isNaN(num) || value === '') {
      setThresholds((prev) => ({
        ...prev,
        [field]: value === '' ? 0 : num,
      }))
    }
  }

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-navy dark:text-action-green" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Rink Configuration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage rink sheets, dimensions, and ice depth measurement settings.
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Rink
        </Button>
      </div>

      {/* Rink List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-navy dark:text-white">
            <SquareStack className="h-5 w-5" />
            Rink Sheets
          </CardTitle>
          <CardDescription>
            {rinks.length === 0
              ? 'No rinks configured yet. Add your first rink to get started.'
              : `${rinks.length} rink${rinks.length !== 1 ? 's' : ''} configured.`}
          </CardDescription>
        </CardHeader>
        {rinks.length > 0 && (
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rinks.map((rink) => (
                    <TableRow key={rink.id}>
                      <TableCell className="font-medium">{rink.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {rink.length_ft} x {rink.width_ft} ft
                      </TableCell>
                      <TableCell>
                        {rink.is_active ? (
                          <Badge className="bg-action-green/10 text-action-green border-action-green/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-wolf-grey-light text-wolf-grey-dark dark:bg-wolf-grey-dark/20 dark:text-wolf-grey">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(rink)}
                            className="min-h-[48px] min-w-[48px]"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPointsDialog(rink)}
                            className="min-h-[48px] min-w-[48px]"
                          >
                            <MapPin className="h-4 w-4" />
                            <span className="sr-only">Configure Points</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeactivateDialog(rink)}
                            className="min-h-[48px] min-w-[48px] text-alert-red hover:text-alert-red"
                          >
                            <Power className="h-4 w-4" />
                            <span className="sr-only">{rink.is_active ? 'Deactivate' : 'Activate'}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {rinks.map((rink) => (
                <Card key={rink.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-navy dark:text-white">{rink.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {rink.length_ft} x {rink.width_ft} ft
                      </p>
                    </div>
                    {rink.is_active ? (
                      <Badge className="bg-action-green/10 text-action-green border-action-green/20">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-wolf-grey-light text-wolf-grey-dark dark:bg-wolf-grey-dark/20 dark:text-wolf-grey">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(rink)}
                      className="min-h-[48px] flex-1"
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPointsDialog(rink)}
                      className="min-h-[48px] flex-1"
                    >
                      <MapPin className="mr-1 h-4 w-4" />
                      Points
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeactivateDialog(rink)}
                      className="min-h-[48px] text-alert-red border-alert-red/30 hover:bg-alert-red/10"
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Ice Depth Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-navy dark:text-white">Ice Depth Thresholds</CardTitle>
          <CardDescription>
            Define acceptable depth ranges (in inches) for ice measurement readings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Green - Good */}
          <div className="rounded-lg border-l-4 border-l-action-green bg-action-green/5 p-4 dark:bg-action-green/10">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-action-green" />
              <span className="font-medium text-navy dark:text-white">Green (Good)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="green-min" className="text-xs text-muted-foreground">Min (inches)</Label>
                <Input
                  id="green-min"
                  type="number"
                  step="0.01"
                  min="0"
                  value={thresholds.green_min}
                  onChange={(e) => updateThreshold('green_min', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="green-max" className="text-xs text-muted-foreground">Max (inches)</Label>
                <Input
                  id="green-max"
                  type="number"
                  step="0.01"
                  min="0"
                  value={thresholds.green_max}
                  onChange={(e) => updateThreshold('green_max', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Yellow - Caution */}
          <div className="rounded-lg border-l-4 border-l-alert-yellow bg-alert-yellow/5 p-4 dark:bg-alert-yellow/10">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-alert-yellow" />
              <span className="font-medium text-navy dark:text-white">Yellow (Caution)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="yellow-min" className="text-xs text-muted-foreground">Min (inches)</Label>
                <Input
                  id="yellow-min"
                  type="number"
                  step="0.01"
                  min="0"
                  value={thresholds.yellow_min}
                  onChange={(e) => updateThreshold('yellow_min', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="yellow-max" className="text-xs text-muted-foreground">Max (inches)</Label>
                <Input
                  id="yellow-max"
                  type="number"
                  step="0.01"
                  min="0"
                  value={thresholds.yellow_max}
                  onChange={(e) => updateThreshold('yellow_max', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Red - Critical */}
          <div className="rounded-lg border-l-4 border-l-alert-red bg-alert-red/5 p-4 dark:bg-alert-red/10">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-alert-red" />
              <span className="font-medium text-navy dark:text-white">Red (Critical)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="red-min" className="text-xs text-muted-foreground">Min (inches)</Label>
                <Input
                  id="red-min"
                  type="number"
                  step="0.01"
                  min="0"
                  value={thresholds.red_min}
                  onChange={(e) => updateThreshold('red_min', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="red-max" className="text-xs text-muted-foreground">Max (inches)</Label>
                <Input
                  id="red-max"
                  type="number"
                  step="0.01"
                  min="0"
                  value={thresholds.red_max}
                  onChange={(e) => updateThreshold('red_max', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveThresholds}
            disabled={savingThresholds}
            className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]"
          >
            {savingThresholds && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Thresholds
          </Button>
        </CardFooter>
      </Card>

      {/* ============================================ */}
      {/* Add/Edit Rink Dialog */}
      {/* ============================================ */}
      <Dialog open={rinkDialogOpen} onOpenChange={setRinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRink ? 'Edit Rink' : 'Add Rink'}</DialogTitle>
            <DialogDescription>
              {editingRink
                ? 'Update the rink details below.'
                : 'Enter the details for the new rink sheet.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rink-name">Name *</Label>
              <Input
                id="rink-name"
                value={rinkName}
                onChange={(e) => setRinkName(e.target.value)}
                placeholder="e.g., Rink A, Main Sheet"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rink-length">Length (ft)</Label>
                <Input
                  id="rink-length"
                  type="number"
                  min="1"
                  value={rinkLength}
                  onChange={(e) => setRinkLength(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rink-width">Width (ft)</Label>
                <Input
                  id="rink-width"
                  type="number"
                  min="1"
                  value={rinkWidth}
                  onChange={(e) => setRinkWidth(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rink-sort">Sort Order</Label>
              <Input
                id="rink-sort"
                type="number"
                min="0"
                value={rinkSortOrder}
                onChange={(e) => setRinkSortOrder(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRinkDialogOpen(false)} className="min-h-[48px]">
              Cancel
            </Button>
            <Button
              onClick={handleSaveRink}
              disabled={saving || !rinkName.trim()}
              className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px]"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRink ? 'Update Rink' : 'Add Rink'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* Deactivate/Activate Confirmation Dialog */}
      {/* ============================================ */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deactivatingRink?.is_active ? 'Deactivate Rink' : 'Activate Rink'}
            </DialogTitle>
            <DialogDescription>
              {deactivatingRink?.is_active
                ? `Are you sure you want to deactivate "${deactivatingRink?.name}"? It will no longer appear in operational forms.`
                : `Are you sure you want to reactivate "${deactivatingRink?.name}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeactivateDialogOpen(false)
                setDeactivatingRink(null)
              }}
              className="min-h-[48px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggleActive}
              disabled={saving}
              variant={deactivatingRink?.is_active ? 'destructive' : 'default'}
              className={`min-h-[48px] ${!deactivatingRink?.is_active ? 'bg-action-green hover:bg-action-green-hover text-white' : ''}`}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deactivatingRink?.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* Configure Measurement Points Dialog */}
      {/* ============================================ */}
      <Dialog open={pointsDialogOpen} onOpenChange={setPointsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Measurement Points</DialogTitle>
            <DialogDescription>
              Measurement point placement for &quot;{pointsRink?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-dashed border-wolf-grey p-6 text-center">
            <MapPin className="mx-auto h-10 w-10 text-wolf-grey" />
            <p className="mt-3 text-sm text-muted-foreground">
              Point configuration requires the interactive rink diagram (coming in Phase 6).
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              The data model is ready -- measurement points can be placed on the SVG rink diagram once that component is built.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPointsDialogOpen(false)} className="min-h-[48px]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
