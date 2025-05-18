"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { 
  Briefcase, 
  Search, 
  MessageSquare, 
  Star, 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  CalendarDays,
  TrendingUp,
  Bookmark,
  ArrowUpRight,
  Users,
  GraduationCap,
  BarChart
} from "lucide-react"
import { PageContainer, PageHeader } from "@/components/dashboard/page-container"

export default function Dashboard() {
  const { 
    user, 
    userRole, 
    userProfile, 
    getUserJobs, 
    getAllJobs, 
    getUserApplications, 
    getConversations 
  } = useFirebase()
  
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    applications: 0,
    messages: 0,
    ratings: 0,
    views: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userRole === "recruiter") {
          const jobs = await getUserJobs()
          const conversations = await getConversations()

          setStats({
            totalJobs: jobs.length,
            activeJobs: jobs.filter((job) => job.status === "open").length,
            applications: jobs.reduce((total, job) => total + (job.applications?.length || 0), 0),
            messages: conversations.length,
            ratings: userProfile?.totalRatings || 0,
            views: jobs.reduce((total, job) => total + (job.views || 0), 0)
          })

          // Create recent activity from jobs and conversations
          const jobActivity = jobs.slice(0, 3).map((job) => ({
            type: "job",
            title: job.title,
            description: `You posted a new job: ${job.title}`,
            time: job.createdAt,
            status: job.status,
            icon: Briefcase,
            link: `/dashboard/jobs/${job.id}`
          }))

          const messageActivity = conversations.slice(0, 2).map((convo) => ({
            type: "message",
            title: convo.otherUserName || "Candidate",
            description: `New message from ${convo.otherUserName || "a candidate"}`,
            time: convo.lastMessageTime,
            icon: MessageSquare,
            link: `/dashboard/messages/${convo.id}`
          }))

          setRecentActivity([...jobActivity, ...messageActivity].sort((a, b) => {
            return new Date(b.time).getTime() - new Date(a.time).getTime()
          }).slice(0, 5))
        } else if (userRole === "candidate") {
          const jobs = await getAllJobs()
          const applications = await getUserApplications()
          const conversations = await getConversations()

          setStats({
            totalJobs: jobs.filter(job => job.status === "open").length,
            activeJobs: applications.filter(app => app.status === "pending" || app.status === "reviewing").length,
            applications: applications.length,
            messages: conversations.length,
            ratings: userProfile?.totalRatings || 0,
            views: userProfile?.profileViews || 0
          })

          // Create recent activity from applications and conversations
          const applicationActivity = applications.slice(0, 3).map((app) => ({
            type: "application",
            title: app.jobTitle,
            description: `You applied to: ${app.jobTitle}`,
            time: app.createdAt,
            status: app.status,
            icon: Briefcase,
            link: `/dashboard/applications/${app.id}`
          }))

          const messageActivity = conversations.slice(0, 2).map((convo) => ({
            type: "message",
            title: convo.otherUserName || "Recruiter",
            description: `New message from ${convo.otherUserName || "a recruiter"}`,
            time: convo.lastMessageTime,
            icon: MessageSquare,
            link: `/dashboard/messages/${convo.id}`
          }))

          setRecentActivity([...applicationActivity, ...messageActivity].sort((a, b) => {
            return new Date(b.time).getTime() - new Date(a.time).getTime()
          }).slice(0, 5))
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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Open
          </Badge>
        )
      case "closed":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
            Closed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            Pending
          </Badge>
        )
      case "reviewing":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Reviewing
          </Badge>
        )
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Accepted
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "Recent"
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        if (diffMinutes < 5) return "Just now"
        return `${diffMinutes} minutes ago`
      }
      return `${diffHours} hours ago`
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const ActivityItem = ({ activity }) => (
    <Link 
      href={activity.link || "#"} 
      className="flex items-center gap-4 rounded-lg border border-kaaj-100 p-3 hover:border-kaaj-300 transition-all hover:shadow-sm group"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kaaj-50 text-kaaj-600 group-hover:bg-kaaj-100">
        <activity.icon className="h-5 w-5" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start">
          <p className="text-sm font-medium leading-none text-kaaj-800">{activity.title}</p>
          {activity.status && getStatusBadge(activity.status)}
        </div>
        <p className="text-xs text-kaaj-500 line-clamp-1">{activity.description}</p>
        <div className="flex items-center text-xs text-kaaj-400">
          <CalendarDays className="h-3 w-3 mr-1" />
          {formatDate(activity.time)}
        </div>
      </div>
      <div className="text-kaaj-400 group-hover:text-kaaj-600 transition-colors">
        <ChevronRight className="h-4 w-4" />
      </div>
    </Link>
  )

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-kaaj-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-kaaj-100">
          <CardHeader>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>

        <Card className="border-kaaj-100">
          <CardHeader>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-kaaj-100 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  if (loading) {
    return (
      <PageContainer>
        <PageHeader 
          title="Dashboard" 
          description="Loading your dashboard data..."
        />
        <LoadingSkeleton />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Dashboard" 
        description={`Welcome back, ${user?.displayName || ''}! Here's an overview of your ${userRole === "recruiter" ? "recruitment" : "job search"} activity.`}
      />

      <Tabs 
        defaultValue="overview" 
        className="w-full mb-6"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="bg-white rounded-lg border border-kaaj-100 shadow-sm p-1 mb-6 w-full max-w-md mx-auto">
          <TabsList className="bg-kaaj-50 text-kaaj-700 p-1 w-full grid grid-cols-2">
            <TabsTrigger 
              value="overview" 
              className={cn(
                "data-[state=active]:bg-kaaj-500 data-[state=active]:text-white rounded-md",
                "transition-all duration-200"
              )}
            >
              <TrendingUp className="h-4 w-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className={cn(
                "data-[state=active]:bg-kaaj-500 data-[state=active]:text-white rounded-md",
                "transition-all duration-200"
              )}
            >
              <Clock className="h-4 w-4 mr-2" /> Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden border-kaaj-100 transition-all hover:shadow-md group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-kaaj-50 to-kaaj-100/60">
                <CardTitle className="text-sm font-medium text-kaaj-800">
                  {userRole === "recruiter" ? "Total Jobs" : "Available Jobs"}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-kaaj-500 shadow-sm">
                  <Briefcase className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-kaaj-800">{stats.totalJobs}</div>
                <p className="text-xs text-kaaj-500 mt-1">
                  {userRole === "recruiter" 
                    ? "Jobs you've posted" 
                    : "Jobs matching your skills"}
                </p>
              </CardContent>
              <CardFooter className="p-2 pt-0 flex justify-start">
                <Link href={userRole === "recruiter" ? "/dashboard/jobs" : "/dashboard/find-jobs"}>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-kaaj-600 p-0 hover:text-kaaj-800 group-hover:underline"
                  >
                    View All <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden border-kaaj-100 transition-all hover:shadow-md group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-kaaj-50 to-kaaj-100/60">
                <CardTitle className="text-sm font-medium text-kaaj-800">
                  {userRole === "recruiter" ? "Active Jobs" : "Active Applications"}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-kaaj-500 shadow-sm">
                  {userRole === "recruiter" ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-kaaj-800">{stats.activeJobs}</div>
                <p className="text-xs text-kaaj-500 mt-1">
                  {userRole === "recruiter" 
                    ? "Currently accepting applications" 
                    : "Applications in progress"}
                </p>
              </CardContent>
              <CardFooter className="p-2 pt-0 flex justify-start">
                <Link href={userRole === "recruiter" ? "/dashboard/jobs?status=open" : "/dashboard/applications?status=active"}>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-kaaj-600 p-0 hover:text-kaaj-800 group-hover:underline"
                  >
                    View Details <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden border-kaaj-100 transition-all hover:shadow-md group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-kaaj-50 to-kaaj-100/60">
                <CardTitle className="text-sm font-medium text-kaaj-800">
                  {userRole === "recruiter" ? "Applications" : "Total Applications"}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-kaaj-500 shadow-sm">
                  <Search className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-kaaj-800">{stats.applications}</div>
                <p className="text-xs text-kaaj-500 mt-1">
                  {userRole === "recruiter" 
                    ? "Candidates applied to your jobs" 
                    : "Jobs you've applied to"}
                </p>
              </CardContent>
              <CardFooter className="p-2 pt-0 flex justify-start">
                <Link href={userRole === "recruiter" ? "/dashboard/applications" : "/dashboard/applications"}>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-kaaj-600 p-0 hover:text-kaaj-800 group-hover:underline"
                  >
                    Review Applications <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden border-kaaj-100 transition-all hover:shadow-md group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-kaaj-50 to-kaaj-100/60">
                <CardTitle className="text-sm font-medium text-kaaj-800">Messages</CardTitle>
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-kaaj-500 shadow-sm">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-kaaj-800">{stats.messages}</div>
                <p className="text-xs text-kaaj-500 mt-1">Active conversations</p>
              </CardContent>
              <CardFooter className="p-2 pt-0 flex justify-start">
                <Link href="/dashboard/messages">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-kaaj-600 p-0 hover:text-kaaj-800 group-hover:underline"
                  >
                    Open Messages <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Quick Actions Card */}
            <Card className="border-kaaj-100">
              <CardHeader className="bg-gradient-to-br from-kaaj-50 to-kaaj-100/30">
                <CardTitle className="text-kaaj-800">Quick Actions</CardTitle>
                <CardDescription>Get started with these common tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6">
                {userRole === "recruiter" ? (
                  <>
                    <Button asChild className="bg-kaaj-500 hover:bg-kaaj-600 gap-2">
                      <Link href="/dashboard/post-job">
                        <Briefcase className="h-4 w-4" /> Post a New Job
                      </Link>
                    </Button>
                    <Button asChild className="border-kaaj-200 text-kaaj-700 hover:bg-kaaj-50 bg-white gap-2">
                      <Link href="/dashboard/candidates">
                        <Users className="h-4 w-4" /> Browse Candidates
                      </Link>
                    </Button>
                    <Button asChild className="border-kaaj-200 text-kaaj-700 hover:bg-kaaj-50 bg-white gap-2">
                      <Link href="/dashboard/messages">
                        <MessageSquare className="h-4 w-4" /> Check Messages
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="bg-kaaj-500 hover:bg-kaaj-600 gap-2">
                      <Link href="/dashboard/find-jobs">
                        <Search className="h-4 w-4" /> Find Jobs
                      </Link>
                    </Button>
                    <Button asChild className="border-kaaj-200 text-kaaj-700 hover:bg-kaaj-50 bg-white gap-2">
                      <Link href="/dashboard/learning">
                        <GraduationCap className="h-4 w-4" /> Learning Resources
                      </Link>
                    </Button>
                    <Button asChild className="border-kaaj-200 text-kaaj-700 hover:bg-kaaj-50 bg-white gap-2">
                      <Link href="/dashboard/messages">
                        <MessageSquare className="h-4 w-4" /> Check Messages
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stats Summary Card */}
            <Card className="border-kaaj-100">
              <CardHeader className="bg-gradient-to-br from-kaaj-50 to-kaaj-100/30">
                <CardTitle className="text-kaaj-800">Account Summary</CardTitle>
                <CardDescription>Your profile statistics and performance</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-kaaj-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-kaaj-50 flex items-center justify-center text-kaaj-600">
                        <Star className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-kaaj-800">Ratings</p>
                        <p className="text-xs text-kaaj-500">Reviews from others</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-kaaj-800">{stats.ratings}</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-b border-kaaj-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-kaaj-50 flex items-center justify-center text-kaaj-600">
                        <BarChart className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-kaaj-800">Profile Views</p>
                        <p className="text-xs text-kaaj-500">Times your profile was viewed</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-kaaj-800">{stats.views}</span>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button asChild variant="outline" className="text-kaaj-600 border-kaaj-200">
                      <Link href="/dashboard/profile">
                        View Full Profile
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-0">
          <Card className="border-kaaj-100">
            <CardHeader className="bg-gradient-to-br from-kaaj-50 to-kaaj-100/30">
              <CardTitle className="text-kaaj-800">Recent Activity</CardTitle>
              <CardDescription>Your latest interactions on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, i) => (
                    <ActivityItem key={i} activity={activity} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-kaaj-300 mb-4" />
                    <h3 className="text-lg font-medium text-kaaj-700">No recent activity found</h3>
                    <p className="text-sm text-kaaj-500 mt-1 max-w-md">
                      Start using the platform to see your activity here
                    </p>
                    {userRole === "recruiter" ? (
                      <Button asChild className="mt-4 bg-kaaj-500 hover:bg-kaaj-600">
                        <Link href="/dashboard/post-job">Post Your First Job</Link>
                      </Button>
                    ) : (
                      <Button asChild className="mt-4 bg-kaaj-500 hover:bg-kaaj-600">
                        <Link href="/dashboard/find-jobs">Find Jobs</Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            {recentActivity.length > 0 && (
              <CardFooter className="flex justify-center pt-2 pb-4">
                <Button asChild variant="outline" className="text-kaaj-600 border-kaaj-200">
                  <Link href={userRole === "recruiter" ? "/dashboard/jobs" : "/dashboard/applications"}>
                    View All Activity
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}