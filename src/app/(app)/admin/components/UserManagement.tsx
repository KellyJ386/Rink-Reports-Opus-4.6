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
  inviteUser,
  updateUser,
  deactivateUser,
} from "@/app/(app)/admin/actions";
import type { Profile, UserRole } from "@/lib/types/database";
import { ROLE_LABELS } from "@/lib/constants/brand";
import {
  Loader2,
  Plus,
  Pencil,
  UserX,
  UserCheck,
  Search,
  Mail,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserManagementProps {
  facilityId: string;
  users: Profile[];
}

const ROLES: UserRole[] = [
  "facility_admin",
  "manager",
  "supervisor",
  "staff",
  "read_only",
];

function getRoleBadgeVariant(
  role: UserRole
): "default" | "secondary" | "outline" | "destructive" {
  switch (role) {
    case "super_admin":
    case "facility_admin":
      return "default";
    case "manager":
      return "secondary";
    default:
      return "outline";
  }
}

export function UserManagement({ facilityId, users }: UserManagementProps) {
  const { toast } = useToast();
  const [userList, setUserList] = useState<Profile[]>(users);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("staff");

  // Edit form state
  const [editRole, setEditRole] = useState<UserRole>("staff");
  const [editFullName, setEditFullName] = useState("");

  const filteredUsers = userList.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = async () => {
    if (!inviteEmail || !inviteFullName) return;
    setLoading(true);

    try {
      const result = await inviteUser(facilityId, {
        email: inviteEmail,
        full_name: inviteFullName,
        role: inviteRole,
      });

      if (result.success) {
        setUserList((prev) => [...prev, result.data as Profile]);
        setInviteOpen(false);
        setInviteEmail("");
        setInviteFullName("");
        setInviteRole("staff");
        toast({
          title: "Invitation sent",
          description: `An invitation has been sent to ${inviteEmail}.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send invitation.",
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

  const handleEdit = async () => {
    if (!selectedUser) return;
    setLoading(true);

    try {
      const result = await updateUser(selectedUser.id, {
        full_name: editFullName,
        role: editRole,
      });

      if (result.success) {
        setUserList((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? { ...u, full_name: editFullName, role: editRole }
              : u
          )
        );
        setEditOpen(false);
        setSelectedUser(null);
        toast({
          title: "User updated",
          description: "User profile has been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update user.",
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

  const handleToggleActive = async (user: Profile) => {
    const action = user.is_active ? "deactivate" : "reactivate";
    setLoading(true);

    try {
      const result = await deactivateUser(user.id, !user.is_active);

      if (result.success) {
        setUserList((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, is_active: !u.is_active } : u
          )
        );
        toast({
          title: user.is_active ? "User deactivated" : "User reactivated",
          description: `${user.full_name} has been ${action}d.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${action} user.`,
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

  const openEditDialog = (user: Profile) => {
    setSelectedUser(user);
    setEditFullName(user.full_name);
    setEditRole(user.role);
    setEditOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage users and send invitations to new team members.
            </CardDescription>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "No users match your search."
                        : "No users found. Invite your first team member."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className={cn(!user.is_active && "opacity-60")}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {user.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={user.is_active ? "outline" : "destructive"}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(user)}
                          title={
                            user.is_active
                              ? "Deactivate user"
                              : "Reactivate user"
                          }
                        >
                          {user.is_active ? (
                            <UserX className="h-4 w-4 text-destructive" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-action-green" />
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

        <p className="mt-2 text-xs text-muted-foreground">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}{" "}
          total
        </p>
      </CardContent>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an email invitation to a new team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full Name *</Label>
              <Input
                id="invite-name"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address *</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val as UserRole)}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role] || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={loading || !inviteEmail || !inviteFullName}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={selectedUser?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editRole}
                onValueChange={(val) => setEditRole(val as UserRole)}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role] || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

