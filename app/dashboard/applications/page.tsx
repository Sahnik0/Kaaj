"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Briefcase, Calendar, Clock, MapPin, MessageSquare, InfoIcon } from "lucide-react"
import { useRetroToast } from "@/hooks/use-retro-toast"
import { Alert } from "@/components/retroui/Alert"

export default function Applications() {
  const { user, userRole, getUserApplications } = useFirebase()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useRetroToast()

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const userApplications = await getUserApplications()
        setApplications(userApplications)
      } catch (error) {
        console.error("Error fetching applications:", error)
        toast({
          title: "Error",
          description: "Failed to load applications. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchApplications()
    }
  }, [user, getUserApplications, toast])

  // Redirect if not a candidate
  useEffect(() => {
    if (userRole !== "candidate" && !loading) {
      router.push("/dashboard")
    }
  }, [userRole, loading, router])

  const handleContactRecruiter = (recruiterId: string) => {
    router.push(`/dashboard/messages?recipient=${recruiterId}`)
  }

  const handleViewJob = (jobId: string) => {
    router.push(`/dashboard/jobs/${jobId}`)
  }

  const pendingApplications = applications.filter((app) => app.status === "pending")
  const acceptedApplications = applications.filter((app) => app.status === "accepted")
  const rejectedApplications = applications.filter((app) => app.status === "rejected")

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
        <h1 className="text-3xl font-bold tracking-tight doodle-heading">My Applications</h1>
        <p className="text-muted-foreground">Track the status of your job applications</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-kaaj-50 text-kaaj-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
            All ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
            Pending ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
            Accepted ({acceptedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
            Rejected ({rejectedApplications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-6">          {applications.length === 0 ? (
            <Alert status="info" className="flex items-start p-8">
              <InfoIcon className="h-5 w-5 mr-4 mt-1" />
              <div className="flex-1">
                <Alert.Title className="text-lg mb-2">No applications yet</Alert.Title>
                <Alert.Description className="mb-4">
                  You haven't applied to any jobs yet. Browse available jobs to get started.
                </Alert.Description>
                <Button
                  onClick={() => router.push("/dashboard/find-jobs")}
                  className="mt-2 bg-kaaj-500 hover:bg-kaaj-600"
                >
                  Find Jobs
                </Button>
              </div>
            </Alert>
          ): (
            renderApplicationsList(applications)
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6 space-y-6">          {pendingApplications.length === 0 ? (
            <Alert status="info" className="flex items-start p-8">
              <InfoIcon className="h-5 w-5 mr-4 mt-1" />
              <div>
                <Alert.Title className="text-lg mb-2">No pending applications</Alert.Title>
                <Alert.Description>
                  You don't have any pending job applications at the moment.
                </Alert.Description>
              </div>
            </Alert>
          ): (
            renderApplicationsList(pendingApplications)
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6 space-y-6">          {acceptedApplications.length === 0 ? (
            <Alert status="info" className="flex items-start p-8">
              <InfoIcon className="h-5 w-5 mr-4 mt-1" />
              <div>
                <Alert.Title className="text-lg mb-2">No accepted applications</Alert.Title>
                <Alert.Description>
                  You don't have any accepted job applications yet.
                </Alert.Description>
              </div>
            </Alert>
          ): (
            renderApplicationsList(acceptedApplications)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6 space-y-6">          {rejectedApplications.length === 0 ? (
            <Alert status="info" className="flex items-start p-8">
              <InfoIcon className="h-5 w-5 mr-4 mt-1" />
              <div>
                <Alert.Title className="text-lg mb-2">No rejected applications</Alert.Title>
                <Alert.Description>
                  You don't have any rejected job applications.
                </Alert.Description>
              </div>
            </Alert>
          ): (
            renderApplicationsList(rejectedApplications)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )

  function renderApplicationsList(appList: any[]) {
    return appList.map((app) => (
      <Card key={app.id} className="border-kaaj-100 overflow-hidden doodle-card">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{app.jobTitle}</CardTitle>
              <CardDescription>{app.recruiterName}</CardDescription>
            </div>
            <Badge
              variant={app.status === "accepted" ? "default" : app.status === "rejected" ? "destructive" : "outline"}
            >
              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{app.jobLocation || "Location not specified"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{app.jobCategory || "Category not specified"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Applied: {app.createdAt ? new Date(app.createdAt.toDate()).toLocaleDateString() : "Unknown"}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 flex justify-between py-3">
          <Button variant="outline" onClick={() => handleViewJob(app.jobId)}>
            View Job
          </Button>
          <Button onClick={() => handleContactRecruiter(app.recruiterId)} className="bg-kaaj-500 hover:bg-kaaj-600">
            <MessageSquare className="mr-2 h-4 w-4" /> Contact Recruiter
          </Button>
        </CardFooter>
      </Card>
    ))
  }
}
