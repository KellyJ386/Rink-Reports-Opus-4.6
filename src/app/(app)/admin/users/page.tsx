'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Card, CardContent } from '@/components/ui/card'
import { Search, UserPlus, Shield, UserX, UserCheck, MoreHorizontal } from 'lucide-react'
import { inviteUser, deactivateUser, updateUserRole } from './actions'

type UserProfile = {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  last_active_at: string | null
}

type UserRole = 'facility_admin' | 'manager' | 'supervisor' | 'staff' | 'read_only'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  facility_admin: 'Facility Admin',
  manager: 'Manager',
  supervisor: 'Supervisor',
  staff: 'Staff',
  read_only: 'Read Only',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-alert-red text-white',
  facility_admin: 'bg-navy text-white dark:bg-navy-light',
  manager: 'bg-action-green text-white',
  supervisor: 'bg-alert-yellow text-navy',
  staff: 'bg-wolf-grey-light text-navy dark:bg-wolf-grey-dark dark:text-white',
  read_only: 'bg-wolf-grey text-white',
}

const ASSIGNABLE_ROLES: UserRole[] = ['facility_admin', 'manager', 'supervisor', 'staff', 'read_only']

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function UserManagementPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteFullName, setInviteFullName] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('staff')
  const [inviting, setInviting] = useState(false)

  // Role change dialog state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [roleDialogUser, setRoleDialogUser] = useState<UserProfile | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('staff')
  const [updatingRole, setUpdatingRole] = useState(false)

  // Deactivate confirmation dialog state
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<UserProfile | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  // Actions menu state for mobile
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null)

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active, last_active_at')
      .order('full_name', { ascending: true })

    if (error) {
      toast({ title: 'Error', description: 'Failed to load users.', variant: 'destructive' })
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase()
    return (
      (u.full_name?.toLowerCase().includes(q) ?? false) ||
      u.email.toLowerCase().includes(q)
    )
  })

  async function handleInvite() {
    if (!inviteEmail || !inviteFullName) {
      toast({ title: 'Validation Error', description: 'Email and full name are required.', variant: 'destructive' })
      return
    }
    setInviting(true)
    const formData = new FormData()
    formData.set('email', inviteEmail)
    formData.set('fullName', inviteFullName)
    formData.set('role', inviteRole)

    const result = await inviteUser(formData)
    setInviting(false)

    if (result.success) {
      toast({ title: 'Invitation Sent', description: `Invitation sent to ${inviteEmail}.`, variant: 'success' })
      setInviteOpen(false)
      setInviteEmail('')
      setInviteFullName('')
      setInviteRole('staff')
      fetchUsers()
    } else {
      const errorMsg = typeof result.error === 'string' ? result.error : 'Failed to send invitation.'
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
    }
  }

  function openRoleDialog(user: UserProfile) {
    setRoleDialogUser(user)
    setSelectedRole(user.role as UserRole)
    setRoleDialogOpen(true)
    setActionsOpenId(null)
  }

  async function handleRoleChange() {
    if (!roleDialogUser) return
    setUpdatingRole(true)
    const result = await updateUserRole(roleDialogUser.id, selectedRole)
    setUpdatingRole(false)

    if (result.success) {
      toast({ title: 'Role Updated', description: `${roleDialogUser.full_name || roleDialogUser.email} is now ${ROLE_LABELS[selectedRole]}.`, variant: 'success' })
      setRoleDialogOpen(false)
      setRoleDialogUser(null)
      fetchUsers()
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to update role.', variant: 'destructive' })
    }
  }

  function openDeactivateDialog(user: UserProfile) {
    setDeactivateTarget(user)
    setDeactivateDialogOpen(true)
    setActionsOpenId(null)
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return
    setDeactivating(true)
    const result = await deactivateUser(deactivateTarget.id)
    setDeactivating(false)

    if (result.success) {
      toast({
        title: deactivateTarget.is_active ? 'User Deactivated' : 'User Reactivated',
        description: `${deactivateTarget.full_name || deactivateTarget.email} has been ${deactivateTarget.is_active ? 'deactivated' : 'reactivated'}.`,
        variant: 'success',
      })
      setDeactivateDialogOpen(false)
      setDeactivateTarget(null)
      fetchUsers()
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to update user status.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage team members and their access levels.
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-action-green hover:bg-action-green-hover text-white touch-target">
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation email to add a new team member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">Full Name</Label>
                <Input
                  id="invite-name"
                  type="text"
                  placeholder="John Smith"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-action-green hover:bg-action-green-hover text-white"
                onClick={handleInvite}
                disabled={inviting}
              >
                {inviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-action-green" />
        </div>
      )}

      {/* Desktop Table */}
      {!loading && (
        <div className="hidden md:block rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No users match your search.' : 'No users found.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[user.role] || 'bg-muted text-foreground'}>
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.last_active_at)}
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge className="bg-action-green/15 text-action-green border-action-green/30">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-wolf-grey/15 text-wolf-grey-dark border-wolf-grey/30">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRoleDialog(user)}
                          className="touch-target"
                        >
                          <Shield className="h-4 w-4" />
                          <span className="sr-only lg:not-sr-only lg:ml-1">Role</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeactivateDialog(user)}
                          className="touch-target"
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="h-4 w-4 text-alert-red" />
                              <span className="sr-only lg:not-sr-only lg:ml-1 text-alert-red">Deactivate</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 text-action-green" />
                              <span className="sr-only lg:not-sr-only lg:ml-1 text-action-green">Reactivate</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mobile Cards */}
      {!loading && (
        <div className="md:hidden space-y-3">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {searchQuery ? 'No users match your search.' : 'No users found.'}
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {user.full_name || '—'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge className={ROLE_COLORS[user.role] || 'bg-muted text-foreground'}>
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                        {user.is_active ? (
                          <Badge className="bg-action-green/15 text-action-green border-action-green/30">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-wolf-grey/15 text-wolf-grey-dark border-wolf-grey/30">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last active: {formatDate(user.last_active_at)}
                      </p>
                    </div>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="touch-target"
                        onClick={() =>
                          setActionsOpenId(actionsOpenId === user.id ? null : user.id)
                        }
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                      {actionsOpenId === user.id && (
                        <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-md border bg-popover p-1 shadow-lg">
                          <button
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                            onClick={() => openRoleDialog(user)}
                          >
                            <Shield className="h-4 w-4" />
                            Change Role
                          </button>
                          <button
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                            onClick={() => openDeactivateDialog(user)}
                          >
                            {user.is_active ? (
                              <>
                                <UserX className="h-4 w-4 text-alert-red" />
                                <span className="text-alert-red">Deactivate</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 text-action-green" />
                                <span className="text-action-green">Reactivate</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {roleDialogUser?.full_name || roleDialogUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="role-select">New Role</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-action-green hover:bg-action-green-hover text-white"
              onClick={handleRoleChange}
              disabled={updatingRole}
            >
              {updatingRole ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate/Reactivate Confirmation Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deactivateTarget?.is_active ? 'Deactivate User' : 'Reactivate User'}
            </DialogTitle>
            <DialogDescription>
              {deactivateTarget?.is_active
                ? `Are you sure you want to deactivate ${deactivateTarget?.full_name || deactivateTarget?.email}? They will no longer be able to access the system.`
                : `Are you sure you want to reactivate ${deactivateTarget?.full_name || deactivateTarget?.email}? They will regain access to the system.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              Cancel
            </Button>
            {deactivateTarget?.is_active ? (
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={deactivating}
              >
                {deactivating ? 'Deactivating...' : 'Deactivate'}
              </Button>
            ) : (
              <Button
                className="bg-action-green hover:bg-action-green-hover text-white"
                onClick={handleDeactivate}
                disabled={deactivating}
              >
                {deactivating ? 'Reactivating...' : 'Reactivate'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
