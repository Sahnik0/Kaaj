"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Ban, Check, MoreHorizontal, Search, Shield, User } from "lucide-react"
import { useRetroToast } from "@/hooks/use-retro-toast"

export default function AdminUsers() {
  const { userRole, isAdmin, getUsers, updateUserStatus } = useFirebase()
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("active")
  const [statusReason, setStatusReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useRetroToast()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers()
        setUsers(data)
        setFilteredUsers(data)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin, getUsers, toast])

  // Redirect if not an admin
  useEffect(() => {
    if (userRole !== "admin" && !loading) {
      router.push("/dashboard")
    }
  }, [userRole, loading, router])

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = users.filter(
        (user) =>
          user.displayName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.role?.toLowerCase().includes(query) ||
          user.status?.toLowerCase().includes(query),
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const handleUpdateStatus = async () => {
    if (!selectedUser || !newStatus) return

    setSubmitting(true)

    try {
      await updateUserStatus(selectedUser.id, newStatus, statusReason)

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === selectedUser.id
            ? { ...user, status: newStatus, statusReason, statusUpdatedAt: new Date() }
            : user,
        ),
      )

      toast({
        title: "Success",
        description: `User status updated to ${newStatus}`,
      })

      setStatusDialogOpen(false)
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openStatusDialog = (user: any, status: string) => {
    setSelectedUser(user)
    setNewStatus(status)
    setStatusReason("")
    setStatusDialogOpen(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "suspended":
        return "destructive"
      case "banned":
        return "outline"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kaaj-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight doodle-heading">User Management</h1>
        <p className="text-muted-foreground">Manage users, roles, and permissions</p>
      </div>

      <Card className="border-kaaj-100 doodle-card">
        <CardHeader className="pb-3">
          <CardTitle>Users</CardTitle>
          <CardDescription>View and manage all users on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-kaaj-200 focus-visible:ring-kaaj-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-kaaj-100">
                              <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                                {user.displayName?.charAt(0) || <User className="h-4 w-4" />}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.displayName || "Unnamed User"}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant="outline" className="capitalize">
                            {user.role || "No role"}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={getStatusBadgeVariant(user.status)} className="capitalize">
                            {user.status || "Unknown"}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="text-sm">
                            {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : "Unknown"}
                          </div>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}>
                                <User className="mr-2 h-4 w-4" /> View Profile
                              </DropdownMenuItem>
                              {user.status !== "active" && (
                                <DropdownMenuItem onClick={() => openStatusDialog(user, "active")}>
                                  <Check className="mr-2 h-4 w-4" /> Activate User
                                </DropdownMenuItem>
                              )}
                              {user.status !== "suspended" && (
                                <DropdownMenuItem onClick={() => openStatusDialog(user, "suspended")}>
                                  <Shield className="mr-2 h-4 w-4" /> Suspend User
                                </DropdownMenuItem>
                              )}
                              {user.status !== "banned" && (
                                <DropdownMenuItem onClick={() => openStatusDialog(user, "banned")}>
                                  <Ban className="mr-2 h-4 w-4" /> Ban User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newStatus === "active" ? "Activate User" : newStatus === "suspended" ? "Suspend User" : "Ban User"}
            </DialogTitle>
            <DialogDescription>
              {newStatus === "active"
                ? "This will restore the user's access to the platform."
                : newStatus === "suspended"
                  ? "This will temporarily suspend the user's access to the platform."
                  : "This will permanently ban the user from the platform."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Provide a reason for this status change"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={submitting || !statusReason}>
              {submitting ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
