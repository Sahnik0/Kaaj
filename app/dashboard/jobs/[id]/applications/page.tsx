"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { useRetroToast } from "@/hooks/use-retro-toast"
import { Briefcase, Calendar, CheckCircle, MessageSquare, Star, User, X } from "lucide-react"

export default function JobApplications() {
  const params = useParams<{ id: string }>()
  const jobId = params.id
  const router = useRouter()
  const { getJob, getApplications, updateApplicationStatus, sendMessage, userRole } = useFirebase()
  const { toast } = useRetroToast()

  const [job, setJob] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [actionType, setActionType] = useState<"accept" | "reject">(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobData = await getJob(jobId)
        setJob(jobData)

        const applicationsData = await getApplications(jobId)
        setApplications(applicationsData)
      } catch (error) {        console.error("Error fetching job applications:", error)
        toast({
          title: "Error",
          description: "Failed to load job applications. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [jobId, getJob, getApplications, toast])
  // Only check if user is a recruiter after loading is complete
  useEffect(() => {
    if (!loading && userRole !== null && userRole !== "recruiter") {
      router.push("/dashboard")
    }
  }, [userRole, loading, router])

  const handleAction = (application: any, type: "accept" | "reject") => {
    setSelectedApplication(application)
    setActionType(type)
    setDialogOpen(true)
  }

  const confirmAction = async () => {
    if (!selectedApplication || !actionType) return

    setProcessing(true)

    try {
      await updateApplicationStatus(selectedApplication.id, actionType === "accept" ? "accepted" : "rejected")

      // Send a message to the candidate
      const message =
        actionType === "accept"
          ? `Your application for "${job.title}" has been accepted. Let's discuss the next steps.`
          : `Thank you for your interest in "${job.title}". Unfortunately, we have decided to move forward with other candidates.`

      await sendMessage(selectedApplication.candidateId, message, jobId, job.title)

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApplication.id
            ? { ...app, status: actionType === "accept" ? "accepted" : "rejected" }
            : app,
        ),
      )

      toast({
        title: "Success",
        description: `Application ${actionType === "accept" ? "accepted" : "rejected"} successfully.`,
      })
    } catch (error) {
      console.error(`Error ${actionType}ing application:`, error)
      toast({
        title: "Error",
        description: `Failed to ${actionType} application. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
      setDialogOpen(false)
    }
  }

  const handleContactCandidate = (candidateId: string) => {
    router.push(`/dashboard/messages?recipient=${candidateId}`)
  }
  const handleViewCandidateProfile = (candidateId: string) => {
    // Navigate to the candidate profile page using the new dynamic route
    router.push(`/dashboard/candidates/${candidateId}`)
  }
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kaaj-500 border-t-transparent"></div>
      </div>
    )
  }

  // Case where job data couldn't be fetched or user doesn't have permission
  if (!job) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight doodle-heading">Job Applications</h1>
          <p className="text-muted-foreground">Job not found or you don't have permission to view it.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/jobs")} className="bg-kaaj-500 hover:bg-kaaj-600 doodle-button">
          Back to My Jobs
        </Button>
      </div>
    )
  }
  
  // Extra check to make sure we have applications data
  if (!applications) {
    setApplications([]);
  }

  const pendingApplications = applications.filter((app) => app.status === "pending")
  const acceptedApplications = applications.filter((app) => app.status === "accepted")
  const rejectedApplications = applications.filter((app) => app.status === "rejected")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight doodle-heading">Applications for {job.title}</h1>
        <p className="text-muted-foreground">
          {applications.length} application{applications.length !== 1 ? "s" : ""} received
        </p>
      </div>

      <Card className="border-kaaj-100 doodle-card">
        <CardHeader className="bg-kaaj-50 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{job.title}</CardTitle>
              <CardDescription>
                Posted on {job.createdAt ? new Date(job.createdAt.toDate()).toLocaleDateString() : "Unknown"}
              </CardDescription>
            </div>
            <Badge variant={job.status === "open" ? "default" : "secondary"}>
              {job.status === "open" ? "Active" : "Closed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{job.category}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {job.jobType === "quick" ? "Quick Job" : "Long-term"}{" "}
                {job.deadline && `(Deadline: ${new Date(job.deadline).toLocaleDateString()})`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span>{applications.length} Applications</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 flex justify-between py-3">
          <Button variant="outline" onClick={() => router.push(`/dashboard/jobs/${jobId}`)}>
            View Job Details
          </Button>
          <Button
            onClick={() => router.push("/dashboard/jobs")}
            className="bg-kaaj-500 hover:bg-kaaj-600 doodle-button"
          >
            Back to My Jobs
          </Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-kaaj-50 text-kaaj-700">
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

        <TabsContent value="pending" className="mt-6 space-y-6">
          {pendingApplications.length === 0 ? (
            <Card className="border-kaaj-100 doodle-card">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No pending applications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You don't have any pending applications for this job.
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingApplications.map((application) => (
              <Card key={application.id} className="border-kaaj-100 overflow-hidden doodle-card">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-kaaj-100">
                        <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                          {application.candidateName?.charAt(0) || <User className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{application.candidateName}</CardTitle>
                        <CardDescription>
                          Applied on:{" "}
                          {application.createdAt
                            ? new Date(application.createdAt.toDate()).toLocaleDateString()
                            : "Unknown"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Candidate Information</h4>
                      <p className="text-sm text-muted-foreground">
                        View the candidate's profile to see their skills, experience, and ratings.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 flex justify-between py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleViewCandidateProfile(application.candidateId)}
                      className="border-kaaj-200"
                    >
                      View Profile
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleContactCandidate(application.candidateId)}
                      className="border-kaaj-200"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleAction(application, "reject")}
                    >
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAction(application, "accept")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Accept
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6 space-y-6">
          {acceptedApplications.length === 0 ? (
            <Card className="border-kaaj-100 doodle-card">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No accepted applications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You haven't accepted any applications for this job yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            acceptedApplications.map((application) => (
              <Card key={application.id} className="border-kaaj-100 overflow-hidden doodle-card">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-kaaj-100">
                        <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                          {application.candidateName?.charAt(0) || <User className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{application.candidateName}</CardTitle>
                        <CardDescription>
                          Applied on:{" "}
                          {application.createdAt
                            ? new Date(application.createdAt.toDate()).toLocaleDateString()
                            : "Unknown"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-500">Accepted</Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Candidate Information</h4>
                      <p className="text-sm text-muted-foreground">
                        You've accepted this candidate. Contact them to discuss next steps.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 flex justify-between py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleViewCandidateProfile(application.candidateId)}
                      className="border-kaaj-200"
                    >
                      View Profile
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleContactCandidate(application.candidateId)}
                    className="bg-kaaj-500 hover:bg-kaaj-600 doodle-button"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" /> Message Candidate
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6 space-y-6">
          {rejectedApplications.length === 0 ? (
            <Card className="border-kaaj-100 doodle-card">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <X className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No rejected applications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You haven't rejected any applications for this job.
                </p>
              </CardContent>
            </Card>
          ) : (
            rejectedApplications.map((application) => (
              <Card key={application.id} className="border-kaaj-100 overflow-hidden doodle-card">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-kaaj-100">
                        <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                          {application.candidateName?.charAt(0) || <User className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{application.candidateName}</CardTitle>
                        <CardDescription>
                          Applied on:{" "}
                          {application.createdAt
                            ? new Date(application.createdAt.toDate()).toLocaleDateString()
                            : "Unknown"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="destructive">Rejected</Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Candidate Information</h4>
                      <p className="text-sm text-muted-foreground">You've rejected this candidate for this position.</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 flex justify-between py-3">
                  <Button
                    variant="outline"
                    onClick={() => handleViewCandidateProfile(application.candidateId)}
                    className="border-kaaj-200"
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAction(application, "accept")}
                    className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                  >
                    Reconsider Application
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "accept" ? "Accept Application" : "Reject Application"}</DialogTitle>
            <DialogDescription>
              {actionType === "accept"
                ? "Are you sure you want to accept this application? The candidate will be notified."
                : "Are you sure you want to reject this application? The candidate will be notified."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={processing}
              className={
                actionType === "accept"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
            >
              {processing
                ? "Processing..."
                : actionType === "accept"
                  ? "Yes, Accept Application"
                  : "Yes, Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
