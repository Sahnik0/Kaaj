"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { useRetroToast } from "@/hooks/use-retro-toast"
import { Briefcase, Calendar, DollarSign, MapPin, Users, CheckCircle, ArrowLeftCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function JobDetailsPage() {  
  const params = useParams<{ id: string }>()
  const jobId = params.id
  const router = useRouter()
  const { getJob, userRole, user, updateJob, applyToJob, checkUserAppliedToJob } = useFirebase()
  const { toast } = useRetroToast()
  
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
    useEffect(() => {
    const fetchJob = async () => {
      try {
        const jobData = await getJob(jobId)
        setJob(jobData)
        
        // Check if user has already applied
        if (user && userRole === 'candidate') {
          const alreadyApplied = await checkUserAppliedToJob(jobId)
          setHasApplied(alreadyApplied)
        }
      } catch (error) {
        console.error("Error fetching job details:", error)
        toast({
          title: "Error",
          description: "Failed to load job details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchJob()
  }, [jobId, getJob, toast, user, userRole, checkUserAppliedToJob])
  
  const handleCloseJob = async () => {
    try {
      setProcessing(true)
      await updateJob(jobId, { status: "closed" })
      setJob((prev: any) => ({ ...prev, status: "closed" }))
      toast({
        title: "Success",
        description: "Job has been closed successfully.",
      })
      setDialogOpen(false)
    } catch (error) {
      console.error("Error closing job:", error)
      toast({
        title: "Error",
        description: "Failed to close job. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }
  
  const handleReopenJob = async () => {
    try {
      setProcessing(true)
      await updateJob(jobId, { status: "open" })
      setJob((prev: any) => ({ ...prev, status: "open" }))
      toast({
        title: "Success",
        description: "Job has been reopened successfully.",
      })
    } catch (error) {
      console.error("Error reopening job:", error)
      toast({
        title: "Error",
        description: "Failed to reopen job. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }
  const handleApplyJob = async () => {
    try {
      setApplying(true)
      await applyToJob(jobId, job.title)
      toast({
        title: "Success",
        description: "Your application has been submitted successfully.",
      })
      // Update UI to show Already Applied without a page reload
      setHasApplied(true)
      // Redirect to applications page after a short delay
      setTimeout(() => {
        router.push("/dashboard/applications")
      }, 1500)
    } catch (error) {
      console.error("Error applying to job:", error)
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setApplying(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-kaaj-500" />
          <p className="text-kaaj-600">Loading job details...</p>
        </div>
      </div>
    )
  }
  
  if (!job) {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => router.back()}
            variant="outline" 
            className="border-kaaj-200"
          >
            <ArrowLeftCircle className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <Card className="border-kaaj-100">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="h-12 w-12 text-kaaj-300 mb-4" />
            <h3 className="text-lg font-medium text-kaaj-700">Job not found</h3>
            <p className="text-sm text-kaaj-500 mt-1">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => router.push("/dashboard/jobs")} 
              className="mt-6 bg-kaaj-500 hover:bg-kaaj-600"
            >
              View My Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const isMyJob = job.recruiterId === user?.uid || job.postedBy === user?.uid
  const isRecruiter = userRole === "recruiter"
  
  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          onClick={() => router.back()}
          variant="outline" 
          className="border-kaaj-200"
        >
          <ArrowLeftCircle className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-kaaj-100">
            <CardHeader className="bg-gradient-to-br from-kaaj-50 to-kaaj-100/60 border-b border-kaaj-100">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold text-kaaj-800">{job.title}</CardTitle>
                  <CardDescription>
                    Posted on {job.createdAt ? new Date(job.createdAt.toDate()).toLocaleDateString() : "Unknown"}
                  </CardDescription>
                </div>
                <Badge variant={job.status === "open" ? "default" : "secondary"}>
                  {job.status === "open" ? "Active" : "Closed"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-kaaj-500" />
                  <span className="text-kaaj-700">{job.category}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-kaaj-500" />
                    <span className="text-kaaj-700">{job.location}</span>
                  </div>
                )}
                {job.salary && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-kaaj-500" />
                    <span className="text-kaaj-700">{job.salary}</span>
                  </div>
                )}
                {job.jobType && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-kaaj-500" />
                    <span className="text-kaaj-700">
                      {job.jobType === "quick" || job.isTask ? "Quick Task" : "Long-term"}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-kaaj-800 mb-2">Description</h3>
                <div className="text-kaaj-600 whitespace-pre-wrap">
                  {job.description}
                </div>
              </div>
              
              {job.requirements && (
                <div>
                  <h3 className="text-lg font-medium text-kaaj-800 mb-2">Requirements</h3>
                  <div className="text-kaaj-600 whitespace-pre-wrap">
                    {job.requirements}
                  </div>
                </div>
              )}
              
              {job.budget && (
                <div>
                  <h3 className="text-lg font-medium text-kaaj-800 mb-2">Budget</h3>
                  <p className="text-kaaj-600">{job.budget}</p>
                </div>
              )}
              
              {job.deadline && (
                <div>
                  <h3 className="text-lg font-medium text-kaaj-800 mb-2">Deadline</h3>
                  <p className="text-kaaj-600">
                    {new Date(job.deadline).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
            
            {isMyJob && isRecruiter && (
              <CardFooter className="border-t border-kaaj-100 bg-kaaj-50/50 flex justify-end py-4">
                {job.status === "open" ? (
                  <Button 
                    onClick={() => setDialogOpen(true)}
                    variant="outline" 
                    className="border-kaaj-200 text-kaaj-700"
                  >
                    Close Job
                  </Button>
                ) : (
                  <Button 
                    onClick={handleReopenJob}
                    variant="outline" 
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    disabled={processing}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Reopen Job
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="border-kaaj-100">
            <CardHeader className="bg-gradient-to-br from-kaaj-50 to-kaaj-100/60 border-b border-kaaj-100">
              <CardTitle className="text-lg text-kaaj-800">Job Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">                {isMyJob && isRecruiter ? (
                  <Button 
                    className="bg-kaaj-500 hover:bg-kaaj-600 w-full"
                    onClick={() => router.push(`/dashboard/jobs/${jobId}/applications`)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Applications
                  </Button>
                ) : userRole === "candidate" && job.status === "open" ? (
                  hasApplied ? (
                    <div className="bg-green-100 text-green-800 border-2 border-green-300 rounded-md p-3 flex items-center justify-center gap-2 w-full">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Already Applied</span>
                    </div>
                  ) : (
                    <Button 
                      className="bg-kaaj-500 hover:bg-kaaj-600 w-full"
                      onClick={handleApplyJob}
                      disabled={applying}
                    >
                      {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      {applying ? "Applying..." : "Apply for this Job"}
                    </Button>
                  )
                ) : (
                  <Badge className="self-start">
                    {job.status === "closed" ? "This job is no longer accepting applications" : ""}
                  </Badge>
                )}
                
                <Button 
                  variant="outline"
                  className="border-kaaj-200 w-full"
                  onClick={() => router.push("/dashboard/jobs")}
                >
                  View All Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to close this job? It will no longer be visible to candidates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleCloseJob}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {processing ? "Processing..." : "Yes, Close Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
