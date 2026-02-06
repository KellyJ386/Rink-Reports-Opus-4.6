'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  ClipboardList,
} from 'lucide-react'
import {
  createChecklistItem,
  updateChecklistItem,
  toggleChecklistItemActive,
  deleteChecklistItem,
  reorderChecklistItems,
} from '../actions'

type ChecklistType = 'opening' | 'closing' | 'daily_operations'
type Recurrence = 'daily' | 'weekly' | 'monthly' | 'seasonal'

interface ChecklistItem {
  id: string
  tab_id: string
  checklist_type: ChecklistType
  item_text: string
  recurrence: Recurrence
  sort_order: number
  is_active: boolean
}

interface TabInfo {
  id: string
  name: string
}

const CHECKLIST_TYPES: { value: ChecklistType; label: string }[] = [
  { value: 'opening', label: 'Opening' },
  { value: 'closing', label: 'Closing' },
  { value: 'daily_operations', label: 'Daily Operations' },
]

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'seasonal', label: 'Seasonal' },
]

const RECURRENCE_COLORS: Record<Recurrence, string> = {
  daily: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  weekly: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  monthly: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  seasonal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

export default function ChecklistBuilderPage() {
  const params = useParams()
  const tabId = params.tabId as string
  const supabase = createClient()
  const { toast } = useToast()

  const [tab, setTab] = useState<TabInfo | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChecklistType, setActiveChecklistType] = useState<ChecklistType>('opening')

  // Add item state
  const [newItemText, setNewItemText] = useState('')
  const [newItemRecurrence, setNewItemRecurrence] = useState<Recurrence>('daily')
  const [addLoading, setAddLoading] = useState(false)

  // Edit item dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [editItemText, setEditItemText] = useState('')
  const [editItemRecurrence, setEditItemRecurrence] = useState<Recurrence>('daily')
  const [editLoading, setEditLoading] = useState(false)

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [deleteItemText, setDeleteItemText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Reorder loading
  const [reorderLoading, setReorderLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)

    // Fetch tab info
    const { data: tabData, error: tabError } = await supabase
      .from('daily_report_tabs')
      .select('id, name')
      .eq('id', tabId)
      .single()

    if (tabError || !tabData) {
      toast({ title: 'Tab not found', description: 'Could not load tab information.', variant: 'destructive' })
      setLoading(false)
      return
    }

    setTab(tabData)

    // Fetch checklist items
    const { data: itemsData, error: itemsError } = await supabase
      .from('checklist_items')
      .select('id, tab_id, checklist_type, item_text, recurrence, sort_order, is_active')
      .eq('tab_id', tabId)
      .order('sort_order', { ascending: true })

    if (itemsError) {
      toast({ title: 'Error loading items', description: itemsError.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    setItems((itemsData as ChecklistItem[]) || [])
    setLoading(false)
  }, [supabase, tabId, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter items by checklist type
  function getItemsByType(type: ChecklistType): ChecklistItem[] {
    return items
      .filter((item) => item.checklist_type === type)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  // --- Add Item ---
  async function handleAddItem() {
    if (!newItemText.trim()) return
    setAddLoading(true)
    const formData = new FormData()
    formData.set('tab_id', tabId)
    formData.set('checklist_type', activeChecklistType)
    formData.set('item_text', newItemText.trim())
    formData.set('recurrence', newItemRecurrence)
    const result = await createChecklistItem(formData)
    setAddLoading(false)

    if (result.success) {
      toast({ title: 'Item added', description: `Checklist item has been created.`, variant: 'success' })
      setNewItemText('')
      setNewItemRecurrence('daily')
      fetchData()
    } else {
      toast({ title: 'Failed to add item', description: String(result.error), variant: 'destructive' })
    }
  }

  // --- Edit Item ---
  function openEditDialog(item: ChecklistItem) {
    setEditItemId(item.id)
    setEditItemText(item.item_text)
    setEditItemRecurrence(item.recurrence)
    setEditDialogOpen(true)
  }

  async function handleEditItem() {
    if (!editItemId || !editItemText.trim()) return
    setEditLoading(true)
    const editFormData = new FormData()
    editFormData.set('tab_id', tabId)
    editFormData.set('checklist_type', activeChecklistType)
    editFormData.set('item_text', editItemText.trim())
    editFormData.set('recurrence', editItemRecurrence)
    const result = await updateChecklistItem(editItemId, editFormData)
    setEditLoading(false)

    if (result.success) {
      toast({ title: 'Item updated', description: 'Checklist item has been updated.', variant: 'success' })
      setEditDialogOpen(false)
      setEditItemId(null)
      setEditItemText('')
      fetchData()
    } else {
      toast({ title: 'Failed to update item', description: String(result.error), variant: 'destructive' })
    }
  }

  // --- Toggle Active ---
  async function handleToggleItemActive(item: ChecklistItem) {
    // Optimistic UI
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i))
    )

    const result = await toggleChecklistItemActive(item.id, !item.is_active)
    if (result.success) {
      toast({
        title: item.is_active ? 'Item deactivated' : 'Item activated',
        description: `"${item.item_text}" is now ${item.is_active ? 'inactive' : 'active'}.`,
        variant: 'success',
      })
    } else {
      // Revert
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: item.is_active } : i))
      )
      toast({ title: 'Failed to toggle item', description: String(result.error), variant: 'destructive' })
    }
  }

  // --- Delete Item ---
  function openDeleteDialog(item: ChecklistItem) {
    setDeleteItemId(item.id)
    setDeleteItemText(item.item_text)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteItem() {
    if (!deleteItemId) return
    setDeleteLoading(true)
    const result = await deleteChecklistItem(deleteItemId)
    setDeleteLoading(false)

    if (result.success) {
      toast({ title: 'Item deleted', description: `"${deleteItemText}" has been deleted.`, variant: 'success' })
      setDeleteDialogOpen(false)
      setDeleteItemId(null)
      setDeleteItemText('')
      fetchData()
    } else {
      toast({ title: 'Failed to delete item', description: String(result.error), variant: 'destructive' })
    }
  }

  // --- Reorder Items ---
  async function handleReorderItem(itemId: string, direction: 'up' | 'down') {
    const typeItems = getItemsByType(activeChecklistType)
    const currentIndex = typeItems.findIndex((i) => i.id === itemId)
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === typeItems.length - 1) return

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const newTypeItems = [...typeItems]
    const temp = newTypeItems[currentIndex]
    newTypeItems[currentIndex] = newTypeItems[swapIndex]
    newTypeItems[swapIndex] = temp

    // Build new ordering with updated sort_order
    const reorderedIds = newTypeItems.map((item) => item.id)

    // Optimistic update
    const updatedItems = items.map((item) => {
      const newIndex = reorderedIds.indexOf(item.id)
      if (newIndex !== -1) {
        return { ...item, sort_order: newIndex + 1 }
      }
      return item
    })
    setItems(updatedItems)
    setReorderLoading(true)

    const result = await reorderChecklistItems(reorderedIds)
    setReorderLoading(false)

    if (!result.success) {
      toast({ title: 'Failed to reorder', description: String(result.error), variant: 'destructive' })
      fetchData() // revert
    }
  }

  // --- Render item list for a checklist type ---
  function renderItemList(type: ChecklistType) {
    const typeItems = getItemsByType(type)

    if (typeItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ClipboardList className="h-10 w-10 text-wolf-grey mb-3" />
          <p className="text-sm text-muted-foreground">
            No {type.replace('_', ' ')} items yet. Add your first item below.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {typeItems.map((item, index) => (
          <Card
            key={item.id}
            className={`transition-opacity ${!item.is_active ? 'opacity-60' : ''}`}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: Reorder + Item info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0 || reorderLoading}
                      onClick={() => handleReorderItem(item.id, 'up')}
                      aria-label="Move item up"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === typeItems.length - 1 || reorderLoading}
                      onClick={() => handleReorderItem(item.id, 'down')}
                      aria-label="Move item down"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Item text + badges */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy dark:text-white truncate">
                      {item.item_text}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <Badge
                        className={RECURRENCE_COLORS[item.recurrence]}
                      >
                        {item.recurrence}
                      </Badge>
                      <Badge
                        variant={item.is_active ? 'default' : 'secondary'}
                        className={
                          item.is_active
                            ? 'bg-action-green text-white'
                            : 'bg-wolf-grey-light text-wolf-grey-dark dark:bg-wolf-grey-dark dark:text-wolf-grey-light'
                        }
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap pl-9 sm:pl-0">
                  {/* Active toggle */}
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => handleToggleItemActive(item)}
                    aria-label={`Toggle ${item.item_text} active`}
                  />

                  {/* Edit button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(item)}
                    className="min-h-[48px] sm:min-h-0"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only lg:inline">Edit</span>
                  </Button>

                  {/* Delete button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(item)}
                    className="text-alert-red hover:text-alert-red hover:bg-alert-red/10 min-h-[48px] sm:min-h-0"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only lg:inline">Delete</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // --- Render Add Item form ---
  function renderAddItemForm() {
    return (
      <Card className="mt-4 border-dashed">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-navy dark:text-white mb-3">
            Add New Item
          </h4>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="new-item-text" className="text-sm">
                Item Text
              </Label>
              <Input
                id="new-item-text"
                placeholder="e.g., Check ice temperature"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem()
                }}
                maxLength={500}
              />
            </div>
            <div className="w-full sm:w-40 space-y-1.5">
              <Label htmlFor="new-item-recurrence" className="text-sm">
                Recurrence
              </Label>
              <Select
                value={newItemRecurrence}
                onValueChange={(val) => setNewItemRecurrence(val as Recurrence)}
              >
                <SelectTrigger id="new-item-recurrence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddItem}
              disabled={!newItemText.trim() || addLoading}
              className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px] sm:min-h-0 sm:w-auto"
            >
              {addLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      {/* Back link + Header */}
      <div className="mb-6">
        <Link
          href="/admin/checklists"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy dark:hover:text-action-green transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tabs
        </Link>
        <h1 className="text-2xl font-bold text-navy dark:text-white">
          {loading ? 'Loading...' : `Checklist Builder: ${tab?.name || 'Unknown Tab'}`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure opening, closing, and daily operations checklist items for this tab.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-navy dark:text-action-green" />
        </div>
      )}

      {/* Content */}
      {!loading && tab && (
        <Tabs
          value={activeChecklistType}
          onValueChange={(val) => setActiveChecklistType(val as ChecklistType)}
          className="w-full"
        >
          <TabsList className="w-full sm:w-auto">
            {CHECKLIST_TYPES.map((ct) => {
              const count = getItemsByType(ct.value).length
              return (
                <TabsTrigger
                  key={ct.value}
                  value={ct.value}
                  className="flex-1 sm:flex-none min-h-[48px] sm:min-h-0"
                >
                  {ct.label}
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 min-w-[20px] justify-center text-xs"
                  >
                    {count}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {CHECKLIST_TYPES.map((ct) => (
            <TabsContent key={ct.value} value={ct.value}>
              {renderItemList(ct.value)}
              {renderAddItemForm()}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Checklist Item</DialogTitle>
            <DialogDescription>
              Update the item text and recurrence for this checklist item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-item-text">Item Text</Label>
              <Input
                id="edit-item-text"
                value={editItemText}
                onChange={(e) => setEditItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditItem()
                }}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-item-recurrence">Recurrence</Label>
              <Select
                value={editItemRecurrence}
                onValueChange={(val) => setEditItemRecurrence(val as Recurrence)}
              >
                <SelectTrigger id="edit-item-recurrence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              onClick={handleEditItem}
              disabled={!editItemText.trim() || editLoading}
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
            <DialogTitle>Delete Checklist Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteItemText}&quot;? This action cannot be undone.
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
              onClick={handleDeleteItem}
              disabled={deleteLoading}
              className="min-h-[48px] sm:min-h-0"
            >
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
