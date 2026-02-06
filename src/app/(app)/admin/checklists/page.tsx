'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings,
  ClipboardList,
  Loader2,
} from 'lucide-react'
import {
  createTab,
  updateTab,
  toggleTabActive,
  deleteTab,
} from './actions'

interface TabWithCount {
  id: string
  facility_id: string
  name: string
  sort_order: number
  is_active: boolean
  checklist_item_count: number
}

const MAX_TABS = 30

export default function ChecklistTabsOverviewPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [tabs, setTabs] = useState<TabWithCount[]>([])
  const [loading, setLoading] = useState(true)

  // Add Tab dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newTabName, setNewTabName] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // Edit Tab dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editTabId, setEditTabId] = useState<string | null>(null)
  const [editTabName, setEditTabName] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTabId, setDeleteTabId] = useState<string | null>(null)
  const [deleteTabName, setDeleteTabName] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Reorder loading
  const [reorderLoading, setReorderLoading] = useState(false)

  const fetchTabs = useCallback(async () => {
    setLoading(true)

    const { data: tabsData, error } = await supabase
      .from('daily_report_tabs')
      .select('id, facility_id, name, sort_order, is_active')
      .order('sort_order', { ascending: true })

    if (error) {
      toast({ title: 'Error loading tabs', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    if (!tabsData || tabsData.length === 0) {
      setTabs([])
      setLoading(false)
      return
    }

    // Fetch checklist item counts per tab
    const tabIds = tabsData.map((t) => t.id)
    const { data: itemsData } = await supabase
      .from('checklist_items')
      .select('tab_id')
      .in('tab_id', tabIds)

    const countMap: Record<string, number> = {}
    if (itemsData) {
      for (const item of itemsData) {
        countMap[item.tab_id] = (countMap[item.tab_id] || 0) + 1
      }
    }

    const tabsWithCount: TabWithCount[] = tabsData.map((t) => ({
      ...t,
      checklist_item_count: countMap[t.id] || 0,
    }))

    setTabs(tabsWithCount)
    setLoading(false)
  }, [supabase, toast])

  useEffect(() => {
    fetchTabs()
  }, [fetchTabs])

  // --- Add Tab ---
  async function handleAddTab() {
    if (!newTabName.trim()) return
    setAddLoading(true)
    const result = await createTab(newTabName.trim())
    setAddLoading(false)

    if (result.success) {
      toast({ title: 'Tab created', description: `"${newTabName.trim()}" has been added.`, variant: 'success' })
      setNewTabName('')
      setAddDialogOpen(false)
      fetchTabs()
    } else {
      toast({ title: 'Failed to create tab', description: String(result.error), variant: 'destructive' })
    }
  }

  // --- Edit Tab ---
  function openEditDialog(tab: TabWithCount) {
    setEditTabId(tab.id)
    setEditTabName(tab.name)
    setEditDialogOpen(true)
  }

  async function handleEditTab() {
    if (!editTabId || !editTabName.trim()) return
    setEditLoading(true)
    const result = await updateTab(editTabId, editTabName.trim())
    setEditLoading(false)

    if (result.success) {
      toast({ title: 'Tab updated', description: `Tab renamed to "${editTabName.trim()}".`, variant: 'success' })
      setEditDialogOpen(false)
      setEditTabId(null)
      setEditTabName('')
      fetchTabs()
    } else {
      toast({ title: 'Failed to update tab', description: String(result.error), variant: 'destructive' })
    }
  }

  // --- Toggle Active ---
  async function handleToggleActive(tab: TabWithCount) {
    // Optimistic UI
    setTabs((prev) =>
      prev.map((t) => (t.id === tab.id ? { ...t, is_active: !t.is_active } : t))
    )

    const result = await toggleTabActive(tab.id, !tab.is_active)
    if (result.success) {
      toast({
        title: tab.is_active ? 'Tab deactivated' : 'Tab activated',
        description: `"${tab.name}" is now ${tab.is_active ? 'inactive' : 'active'}.`,
        variant: 'success',
      })
    } else {
      // Revert
      setTabs((prev) =>
        prev.map((t) => (t.id === tab.id ? { ...t, is_active: tab.is_active } : t))
      )
      toast({ title: 'Failed to toggle tab', description: String(result.error), variant: 'destructive' })
    }
  }

  // --- Delete Tab ---
  function openDeleteDialog(tab: TabWithCount) {
    setDeleteTabId(tab.id)
    setDeleteTabName(tab.name)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteTab() {
    if (!deleteTabId) return
    setDeleteLoading(true)
    const result = await deleteTab(deleteTabId)
    setDeleteLoading(false)

    if (result.success) {
      toast({ title: 'Tab deleted', description: `"${deleteTabName}" has been deleted.`, variant: 'success' })
      setDeleteDialogOpen(false)
      setDeleteTabId(null)
      setDeleteTabName('')
      fetchTabs()
    } else {
      toast({ title: 'Failed to delete tab', description: String(result.error), variant: 'destructive' })
    }
  }

  // --- Reorder ---
  async function handleReorder(tabId: string, direction: 'up' | 'down') {
    const currentIndex = tabs.findIndex((t) => t.id === tabId)
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === tabs.length - 1) return

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const newTabs = [...tabs]
    const temp = newTabs[currentIndex]
    newTabs[currentIndex] = newTabs[swapIndex]
    newTabs[swapIndex] = temp

    // Update sort_order values
    const reorderedTabs = newTabs.map((t, i) => ({ ...t, sort_order: i + 1 }))

    // Optimistic update
    setTabs(reorderedTabs)
    setReorderLoading(true)

    // Save to database via direct supabase calls (swap the two sort_orders)
    const tabA = tabs[currentIndex]
    const tabB = tabs[swapIndex]

    const { error: errA } = await supabase
      .from('daily_report_tabs')
      .update({ sort_order: tabB.sort_order })
      .eq('id', tabA.id)

    const { error: errB } = await supabase
      .from('daily_report_tabs')
      .update({ sort_order: tabA.sort_order })
      .eq('id', tabB.id)

    setReorderLoading(false)

    if (errA || errB) {
      toast({ title: 'Failed to reorder', description: 'Could not update sort order.', variant: 'destructive' })
      fetchTabs() // revert
    }
  }

  const canAddTab = tabs.length < MAX_TABS

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            Daily Report Tab Configuration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage tabs for daily reports. Each tab can contain opening, closing, and daily operations checklists.
          </p>
        </div>

        {/* Add Tab Button */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={!canAddTab}
              className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px] sm:min-h-0"
            >
              <Plus className="h-4 w-4" />
              Add Tab
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tab</DialogTitle>
              <DialogDescription>
                Create a new daily report tab. You can configure its checklists after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-tab-name">Tab Name</Label>
                <Input
                  id="new-tab-name"
                  placeholder="e.g., Morning Checklist"
                  value={newTabName}
                  onChange={(e) => setNewTabName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTab()
                  }}
                  maxLength={100}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="min-h-[48px] sm:min-h-0"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTab}
                disabled={!newTabName.trim() || addLoading}
                className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px] sm:min-h-0"
              >
                {addLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Tab
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Max tabs warning */}
      {!canAddTab && (
        <div className="mb-4 rounded-md border border-alert-yellow bg-alert-yellow/10 p-3 text-sm text-alert-yellow dark:text-alert-yellow">
          Maximum of {MAX_TABS} tabs reached. Delete an existing tab to add a new one.
        </div>
      )}

      {/* Tab count summary */}
      <p className="mb-4 text-sm text-muted-foreground">
        {tabs.length} / {MAX_TABS} tabs configured
      </p>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-navy dark:text-action-green" />
        </div>
      )}

      {/* Empty state */}
      {!loading && tabs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-wolf-grey mb-4" />
            <p className="text-lg font-medium text-navy dark:text-white">No tabs configured</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first daily report tab to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tab cards */}
      {!loading && tabs.length > 0 && (
        <div className="space-y-3">
          {tabs.map((tab, index) => (
            <Card
              key={tab.id}
              className={`transition-opacity ${!tab.is_active ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Tab info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0 || reorderLoading}
                        onClick={() => handleReorder(tab.id, 'up')}
                        aria-label="Move tab up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === tabs.length - 1 || reorderLoading}
                        onClick={() => handleReorder(tab.id, 'down')}
                        aria-label="Move tab down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Tab details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-navy dark:text-white truncate">
                          {tab.name}
                        </h3>
                        <Badge
                          variant={tab.is_active ? 'default' : 'secondary'}
                          className={
                            tab.is_active
                              ? 'bg-action-green text-white'
                              : 'bg-wolf-grey-light text-wolf-grey-dark dark:bg-wolf-grey-dark dark:text-wolf-grey-light'
                          }
                        >
                          {tab.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{tab.checklist_item_count} checklist item{tab.checklist_item_count !== 1 ? 's' : ''}</span>
                        <span className="text-wolf-grey">|</span>
                        <span>Sort order: {tab.sort_order}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Active toggle */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`toggle-${tab.id}`} className="text-sm text-muted-foreground sr-only">
                        Active
                      </Label>
                      <Switch
                        id={`toggle-${tab.id}`}
                        checked={tab.is_active}
                        onCheckedChange={() => handleToggleActive(tab)}
                        aria-label={`Toggle ${tab.name} active`}
                      />
                    </div>

                    {/* Edit button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(tab)}
                      className="min-h-[48px] sm:min-h-0"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sm:hidden lg:inline">Edit</span>
                    </Button>

                    {/* Configure Checklists link */}
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="min-h-[48px] sm:min-h-0"
                    >
                      <Link href={`/admin/checklists/${tab.id}`}>
                        <Settings className="h-4 w-4" />
                        <span className="sm:hidden lg:inline">Configure</span>
                      </Link>
                    </Button>

                    {/* Delete button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(tab)}
                      className="text-alert-red hover:text-alert-red hover:bg-alert-red/10 min-h-[48px] sm:min-h-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sm:hidden lg:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Tab Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tab Name</DialogTitle>
            <DialogDescription>
              Update the name of this daily report tab.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-tab-name">Tab Name</Label>
              <Input
                id="edit-tab-name"
                value={editTabName}
                onChange={(e) => setEditTabName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditTab()
                }}
                maxLength={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="min-h-[48px] sm:min-h-0"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditTab}
              disabled={!editTabName.trim() || editLoading}
              className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px] sm:min-h-0"
            >
              {editLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tab</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTabName}&quot;? This will also delete all
              checklist items in this tab. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="min-h-[48px] sm:min-h-0"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTab}
              disabled={deleteLoading}
              className="min-h-[48px] sm:min-h-0"
            >
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Tab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
