"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Briefcase, Search, MessageSquare, Star, AlertTriangle, Clock } from "lucide-react"

export default function Dashboard() {
  const { user, userRole, userProfile, getUserJobs, getAllJobs, getUserApplications, getConversations } = useFirebase()
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    applications: 0,
    messages: 0,
    ratings: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userRole === "recruiter") {
          const jobs = await getUserJobs()
          const conversations = await getConversations()

          setStats({
            totalJobs: jobs.length,
            activeJobs: jobs.filter((job) => job.status === "open").length,
            applications: 0, // This would come from aggregating all applications
            messages: conversations.length,
            ratings: userProfile?.totalRatings || 0,
          })

          // Create recent activity from jobs
          const activity = jobs.slice(0, 3).map((job) => ({
            type: "job",
            title: `Posted job: ${job.title}`,
            time: job.createdAt,
            icon: Briefcase,
          }))

          setRecentActivity(activity)
        } else if (userRole === "candidate") {
          const jobs = await getAllJobs()
          const applications = await getUserApplications()
          const conversations = await getConversations()

          setStats({
            totalJobs: jobs.length,
            activeJobs: jobs.filter((job) => job.status === "open").length,
            applications: applications.length,
            messages: conversations.length,
            ratings: userProfile?.totalRatings || 0,
          })

          // Create recent activity from applications
          const activity = applications.slice(0, 3).map((app) => ({
            type: "application",
            title: `Applied to: ${app.jobTitle}`,
            time: app.createdAt,
            icon: Briefcase,
          }))

          setRecentActivity(activity)
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user && userRole) {
      fetchData()
    }
  }, [user, userRole, getUserJobs, getAllJobs, getUserApplications, getConversations, userProfile])

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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.displayName}! Here's an overview of your{" "}
          {userRole === "recruiter" ? "recruitment" : "job search"} activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-kaaj-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userRole === "recruiter" ? "Total Jobs Posted" : "Available Jobs"}
            </CardTitle>
            <Briefcase className="h-4 w-4 text-kaaj-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {userRole === "recruiter" ? "Jobs you've posted" : "Jobs matching your skills"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-kaaj-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userRole === "recruiter" ? "Active Jobs" : "Applications"}
            </CardTitle>
            {userRole === "recruiter" ? (
              <Clock className="h-4 w-4 text-kaaj-500" />
            ) : (
              <Search className="h-4 w-4 text-kaaj-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRole === "recruiter" ? stats.activeJobs : stats.applications}</div>
            <p className="text-xs text-muted-foreground">
              {userRole === "recruiter" ? "Currently accepting applications" : "Jobs you've applied to"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-kaaj-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-kaaj-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages}</div>
            <p className="text-xs text-muted-foreground">Active conversations</p>
          </CardContent>
        </Card>
        <Card className="border-kaaj-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ratings</CardTitle>
            <Star className="h-4 w-4 text-kaaj-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ratings}</div>
            <p className="text-xs text-muted-foreground">Reviews from others</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-kaaj-100">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {userRole === "recruiter" ? (
              <>
                <Button asChild className="w-full bg-kaaj-500 hover:bg-kaaj-600">
                  <Link href="/dashboard/post-job">Post a New Job</Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-kaaj-200 text-kaaj-700 hover:bg-kaaj-50">
                  <Link href="/dashboard/candidates">Browse Candidates</Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-kaaj-200 text-kaaj-700 hover:bg-kaaj-50">
                  <Link href="/dashboard/messages">Check Messages</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="w-full bg-kaaj-500 hover:bg-kaaj-600">
                  <Link href="/dashboard/find-jobs">Find Jobs</Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-kaaj-200 text-kaaj-700 hover:bg-kaaj-50">
                  <Link href="/dashboard/learning">Explore Learning Resources</Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-kaaj-200 text-kaaj-700 hover:bg-kaaj-50">
                  <Link href="/dashboard/messages">Check Messages</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-kaaj-100">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border border-kaaj-100 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kaaj-50">
                      <activity.icon className="h-5 w-5 text-kaaj-500" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time ? new Date(activity.time).toLocaleString() : "Recently"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No recent activity found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start using the platform to see your activity here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
