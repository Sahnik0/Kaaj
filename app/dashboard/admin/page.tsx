"use client"

import { Textarea } from "@/components/ui/textarea"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, CheckCircle, Flag, MoreHorizontal, Search, Shield, User, Users, XCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminDashboard() {
  const { user, userRole, isAdmin, getUsers, getReportedContent, getJobStats, updateUserStatus } = useFirebase()
  const [users, setUsers] = useState<any[]>([])
  const [reportedContent, setReportedContent] = useState<any[]>([])
  const [jobStats, setJobStats] = useState<any>({
    total: 0,
    active: 0,
    completed: 0,
    categories: [],
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userStatusDialog, setUserStatusDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [newStatus, setNewStatus] = useState("")
  const [statusReason, setStatusReason] = useState("")
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      // If not admin, redirect to dashboard
      if (!isAdmin) {
        router.push("/dashboard")
        return
      }

      fetchData()
    }

    checkAdmin()
  }, [isAdmin, router])

  const fetchData = async () => {
    try {
      const userData = await getUsers()
      setUsers(userData)

      const reportedData = await getReportedContent()
      setReportedContent(reportedData)

      const stats = await getJobStats()
      setJobStats(stats)
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserStatusChange = async () => {
    if (!selectedUser || !newStatus) return

    try {
      await updateUserStatus(selectedUser.id, newStatus, statusReason)

      // Refresh users
      const userData = await getUsers()
      setUsers(userData)

      // Reset and close dialog
      setUserStatusDialog(false)
      setNewStatus("")
      setStatusReason("")
    } catch (error) {
      console.error("Error updating user status:", error)
    }
  }

  const openUserStatusDialog = (user: any, status: string) => {
    setSelectedUser(user)
    setNewStatus(status)
    setUserStatusDialog(true)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, content, and platform statistics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter((u) => u.role === "recruiter").length} recruiters,{" "}
              {users.filter((u) => u.role === "candidate").length} candidates
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {jobStats.active} active, {jobStats.completed} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reported Content</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportedContent.length}</div>
            <p className="text-xs text-muted-foreground">
              {reportedContent.filter((r) => !r.resolved).length} unresolved reports
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.length > 0 ? Math.round((users.filter((u) => u.verified).length / users.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">{users.filter((u) => u.verified).length} verified users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-kaaj-50 text-kaaj-700">
          <TabsTrigger value="users" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
            Users
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
            Reported Content
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card className="border-kaaj-100">
            <CardHeader className="bg-kaaj-50 border-b border-kaaj-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage all users on the platform</CardDescription>
                </div>
                <div className="w-full md:w-64">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-8 border-kaaj-200 focus-visible:ring-kaaj-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b border-kaaj-100">
                    <tr>
                      <th className="h-12 px-4 text-left align-middle font-medium">User</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Role</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Joined</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-kaaj-100 hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-kaaj-100">
                                <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.displayName}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="capitalize">
                              {user.role || "Unassigned"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              {user.status === "active" ? (
                                <Badge className="bg-green-500">Active</Badge>
                              ) : user.status === "suspended" ? (
                                <Badge className="bg-amber-500">Suspended</Badge>
                              ) : user.status === "banned" ? (
                                <Badge className="bg-red-500">Banned</Badge>
                              ) : (
                                <Badge variant="outline">Unknown</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : "Unknown"}
                            </div>
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openUserStatusDialog(user, "active")}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                  <span>Set Active</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openUserStatusDialog(user, "suspended")}>
                                  <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                                  <span>Suspend User</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openUserStatusDialog(user, "banned")}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                  <span>Ban User</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Shield className="mr-2 h-4 w-4" />
                                  <span>View Details</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card className="border-kaaj-100">
            <CardHeader className="bg-kaaj-50 border-b border-kaaj-100">
              <CardTitle>Reported Content</CardTitle>
              <CardDescription>Review and moderate reported content</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b border-kaaj-100">
                    <tr>
                      <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Reported By</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Reason</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportedContent.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                          No reported content
                        </td>
                      </tr>
                    ) : (
                      reportedContent.map((report) => (
                        <tr key={report.id} className="border-b border-kaaj-100 hover:bg-muted/50">
                          <td className="p-4">
                            <Badge variant="outline" className="capitalize">
                              {report.contentType}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 border border-kaaj-100">
                                <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                                  <User className="h-3 w-3" />
                                </AvatarFallback>
                              </Avatar>
                              <span>{report.reporterName}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="max-w-xs truncate">{report.reason}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              {report.createdAt ? new Date(report.createdAt.toDate()).toLocaleDateString() : "Unknown"}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              {report.resolved ? (
                                <Badge className="bg-green-500">Resolved</Badge>
                              ) : (
                                <Badge className="bg-amber-500">Pending</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-kaaj-500 border-kaaj-200 hover:bg-kaaj-50 hover:text-kaaj-600"
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-kaaj-100">
              <CardHeader className="bg-kaaj-50 border-b border-kaaj-100">
                <CardTitle>Job Categories</CardTitle>
                <CardDescription>Distribution of jobs by category</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {jobStats.categories.map((category: any) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-sm text-muted-foreground">{category.count} jobs</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-kaaj-100">
                        <div
                          className="h-2 rounded-full bg-kaaj-500"
                          style={{ width: `${(category.count / jobStats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-kaaj-100">
              <CardHeader className="bg-kaaj-50 border-b border-kaaj-100">
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Configure global platform settings</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox id="verification" />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="verification" className="font-medium">
                        Require ID Verification
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Users must verify their identity before posting jobs or applying
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox id="auto-suspend" />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="auto-suspend" className="font-medium">
                        Auto-suspend Reported Users
                      </Label>
                      <p className="text-sm text-muted-foreground">Automatically suspend users with multiple reports</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox id="job-approval" />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="job-approval" className="font-medium">
                        Require Job Approval
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        All job postings require admin approval before going live
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox id="maintenance" />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="maintenance" className="font-medium">
                        Maintenance Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Put the platform in maintenance mode (only admins can access)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 border-t border-kaaj-100 flex justify-end">
                <Button className="bg-kaaj-500 hover:bg-kaaj-600">Save Settings</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={userStatusDialog} onOpenChange={setUserStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newStatus === "active" ? "Activate User" : newStatus === "suspended" ? "Suspend User" : "Ban User"}
            </DialogTitle>
            <DialogDescription>
              {newStatus === "active"
                ? "Restore full access for this user."
                : newStatus === "suspended"
                  ? "Temporarily suspend this user's account."
                  : "Permanently ban this user from the platform."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 border border-kaaj-100 rounded-lg">
                <Avatar className="h-10 w-10 border border-kaaj-100">
                  <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedUser.displayName}</div>
                  <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder={
                  newStatus === "active"
                    ? "Reason for activating this user..."
                    : newStatus === "suspended"
                      ? "Reason for suspending this user..."
                      : "Reason for banning this user..."
                }
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserStatusDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUserStatusChange}
              className={
                newStatus === "active"
                  ? "bg-green-500 hover:bg-green-600"
                  : newStatus === "suspended"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-red-500 hover:bg-red-600"
              }
            >
              {newStatus === "active" ? "Activate User" : newStatus === "suspended" ? "Suspend User" : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
