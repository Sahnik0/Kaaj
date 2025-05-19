"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Loader2, ArrowLeft, MessageSquare, ExternalLink } from "lucide-react"
import { RetroBox } from "@/components/ui/retro-box"
import { useLanguage } from "@/lib/i18n/language-context"
import { useRetroToast } from "@/hooks/use-retro-toast"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatDistance } from "date-fns"
import { cn } from "@/lib/utils"

interface ApplicationProps {
  params: {
    id: string
  }
}

export default function ApplicationDetailsPage({ params }: ApplicationProps) {
  const { id } = params
  const { user, userRole, getApplicationById, getJobById } = useFirebase()
  const [application, setApplication] = useState<any>(null)
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useRetroToast()

  useEffect(() => {
    async function fetchData() {
      if (!user) return
      
      try {
        // Fetch the application
        const applicationData = await getApplicationById(id)
        
        if (!applicationData) {
          toast({
            title: "Error",
            description: "Application not found",
            variant: "destructive"
          })
          router.push("/dashboard/applications")
          return
        }
        
        setApplication(applicationData)
        
        // Fetch the associated job
        if (applicationData.jobId) {
          const jobData = await getJobById(applicationData.jobId)
          setJob(jobData)
        }
        
      } catch (error) {
        console.error("Error fetching application:", error)
        toast({
          title: "Error", 
          description: "Failed to load application details",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, id, getApplicationById, getJobById, router, toast])

  // Access check - only the applicant or the job's recruiter should see this
  useEffect(() => {
    if (!loading && application && user) {
      const isApplicant = application.applicantId === user.uid
      const isRecruiter = job && job.recruiterId === user.uid
      
      if (!isApplicant && !isRecruiter) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this application",
          variant: "destructive"
        })
        router.push("/dashboard")
      }
    }
  }, [application, job, user, loading, router, toast])

  const handleContactRecruiter = () => {
    if (job && job.recruiterId) {
      router.push(`/dashboard/messages?recipient=${job.recruiterId}`)
    }
  }

  const handleContactApplicant = () => {
    if (application && application.applicantId) {
      router.push(`/dashboard/messages?recipient=${application.applicantId}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  if (!application || !job) {
    return (
      <RetroBox className="p-6 text-center">
        <p>{t("applicationNotFound")}</p>
        <Button 
          className="mt-4 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          onClick={() => router.push("/dashboard/applications")}
        >
          {t("backToApplications")}
        </Button>
      </RetroBox>
    )
  }

  const createdAt = application.createdAt?.toDate 
    ? application.createdAt.toDate() 
    : new Date(application.createdAt)

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        className="mb-6 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("back")}
      </Button>

      <RetroBox className="mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{t("applicationFor")} {job.title}</h1>
              <p className="text-gray-600">{job.company || job.recruiterName}</p>
              <p className="text-sm mt-2">
                {t("appliedOn")} {formatDistance(createdAt, new Date(), { addSuffix: true })}
              </p>
            </div>
            <Badge 
              className={cn(
                "text-sm px-3 py-1",
                application.status === "pending" && "bg-yellow-100 text-yellow-800 border-yellow-800",
                application.status === "accepted" && "bg-green-100 text-green-800 border-green-800",
                application.status === "rejected" && "bg-red-100 text-red-800 border-red-800"
              )}
            >
              {application.status === "pending" && t("pending")}
              {application.status === "accepted" && t("accepted")}
              {application.status === "rejected" && t("rejected")}
            </Badge>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold mb-4">{t("coverLetter")}</h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap">
              {application.coverLetter || t("noCoverLetter")}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">{t("attachedResume")}</h2>
            {application.resumeUrl ? (
              <Link href={application.resumeUrl} target="_blank" className="flex items-center text-blue-600 hover:text-blue-800">
                <ExternalLink className="h-4 w-4 mr-2" />
                {t("viewResume")}
              </Link>
            ) : (
              <p className="text-gray-500">{t("noResume")}</p>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            {userRole === "candidate" && (
              <Button
                className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                onClick={handleContactRecruiter}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {t("contactRecruiter")}
              </Button>
            )}
            {userRole === "recruiter" && (
              <Button
                className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                onClick={handleContactApplicant}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {t("contactApplicant")}
              </Button>
            )}
            <Link href={`/dashboard/jobs/${job.id}`}>
              <Button
                variant="outline"
                className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                {t("viewJobDetails")}
              </Button>
            </Link>
          </div>
        </div>
      </RetroBox>
    </div>
  )
}
