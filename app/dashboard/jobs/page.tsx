"use client"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Briefcase } from "lucide-react"
import { useTranslation } from "@/lib/i18n/language-context"
import { RetroBox } from "@/components/ui/retro-box"

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary: string
  description: string
  requirements: string[]
  postedBy: string
  postedAt: any
  status: "active" | "closed"
  applicationsCount?: number
}

export default function JobsPage() {
  const { user, firestore } = useFirebase()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    async function fetchJobs() {
      if (!user || !firestore) return

      try {
        setLoading(true)

        // Fetch jobs posted by the current user
        const jobsCollection = firestore.collection("jobs")
        const snapshot = await jobsCollection.where("postedBy", "==", user.uid).get()

        const jobsData: Job[] = []

        for (const doc of snapshot.docs) {
          const job = { id: doc.id, ...doc.data() } as Job

          // Get application count
          const applicationsSnapshot = await firestore.collection("applications").where("jobId", "==", doc.id).get()

          job.applicationsCount = applicationsSnapshot.size
          jobsData.push(job)
        }

        setJobs(jobsData)
      } catch (error) {
        console.error("Error fetching jobs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [user, firestore])

  if (!user) {
    return (
      <RetroBox className="max-w-4xl mx-auto my-8">
        <div className="text-center py-8">{t("pleaseSignIn")}</div>
      </RetroBox>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("myJobs")}</h1>
        <Link href="/dashboard/post-job">
          <Button className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("postNewJob")}
          </Button>
        </Link>
      </div>

      <RetroBox>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 border-2 border-black rounded-md overflow-hidden">
            <TabsTrigger value="active" className="data-[state=active]:bg-yellow-300 data-[state=active]:shadow-none">
              {t("activeJobs")} ({jobs.filter((job) => job.status === "active").length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="data-[state=active]:bg-yellow-300 data-[state=active]:shadow-none">
              {t("closedJobs")} ({jobs.filter((job) => job.status === "closed").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border-2 border-black p-4 rounded-md animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : jobs.filter((job) => job.status === "active").length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center gap-4">
                <Briefcase className="h-12 w-12 text-gray-400" />
                <p>{t("noActiveJobs")}</p>
                <Link href="/dashboard/post-job">
                  <Button className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                    {t("postYourFirstJob")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs
                  .filter((job) => job.status === "active")
                  .map((job) => (
                    <div key={job.id} className="border-2 border-black p-4 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="text-sm text-gray-600">
                            {job.company} • {job.location}
                          </p>
                          <p className="text-sm mt-1">{job.salary}</p>
                        </div>
                        <Link href={`/dashboard/jobs/${job.id}/applications`}>
                          <Button
                            variant="outline"
                            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                          >
                            {t("viewApplications")} ({job.applicationsCount || 0})
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="border-2 border-black p-4 rounded-md animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : jobs.filter((job) => job.status === "closed").length === 0 ? (
              <div className="text-center py-8">
                <p>{t("noClosedJobs")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs
                  .filter((job) => job.status === "closed")
                  .map((job) => (
                    <div key={job.id} className="border-2 border-black p-4 rounded-md bg-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="text-sm text-gray-600">
                            {job.company} • {job.location}
                          </p>
                          <p className="text-sm mt-1">{job.salary}</p>
                        </div>
                        <Link href={`/dashboard/jobs/${job.id}/applications`}>
                          <Button
                            variant="outline"
                            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                          >
                            {t("viewApplications")} ({job.applicationsCount || 0})
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </RetroBox>
    </div>
  )
}
