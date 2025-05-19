"use client"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Briefcase, Search } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { RetroBox } from "@/components/ui/retro-box"
import { useRetroToast } from "@/hooks/use-retro-toast"

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary: string
  description: string
  requirements: string[] | string
  recruiterId: string
  recruiterName: string
  status: "open" | "closed"
  createdAt: any
  updatedAt: any
  category?: string
  jobType?: string
  budget?: string
  deadline?: any
  applicationsCount?: number
}

export default function JobsPage() {
  const { user, userRole, getAllJobs, getApplications } = useFirebase()
  const { toast } = useRetroToast()  
  const searchParams = useSearchParams()
  const router = useRouter()
  const statusParam = searchParams.get("status")
  
  // Log the status parameter for debugging
  console.log("Jobs page loaded with status param:", statusParam);
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(statusParam === "open" ? "open" : statusParam === "closed" ? "closed" : "all")
  const { t } = useLanguage()
    // Update active tab when URL parameter changes
  useEffect(() => {
    const tab = statusParam === "open" ? "open" : statusParam === "closed" ? "closed" : "all";
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [statusParam, activeTab]);
  
  // Separate effect for fetching jobs based on active tab
  useEffect(() => {
    let isMounted = true;
    
    async function fetchJobs() {
      if (!user || !isMounted) return

      try {
        setLoading(true)

        // Use activeTab for filtering
        const statusFilter = activeTab === "all" ? "all" : activeTab;
        
        console.log("Fetching jobs with status filter:", statusFilter);
        
        // Define filters with proper TypeScript interface
        const filters: { 
          status: string; 
          recruiterId?: string;
        } = {
          status: statusFilter
        }
        
        // For recruiters, modify the filters to include the recruiterId
        if (userRole === "recruiter") {
          filters.recruiterId = user.uid;
        }
        
        console.log("Fetching with filters:", filters);
        const jobsData = await getAllJobs(filters) as Job[]
        
        // Get application counts for each job
        const jobsWithCounts = await Promise.all(jobsData.map(async (job) => {
          try {
            const applications = await getApplications(job.id)
            return {
              ...job,
              applicationsCount: applications.length
            }          } catch (error) {
            console.error(`Error getting applications for job ${job.id}:`, error)
            return {
              ...job,
              applicationsCount: 0
            }
          }
        }));
          console.log(`Retrieved ${jobsData.length} jobs for ${userRole}`, jobsData);
        console.log(`Jobs with counts: ${jobsWithCounts.length}`, jobsWithCounts);
        setJobs(jobsWithCounts)
      } catch (error) {
        console.error("Error fetching jobs:", error)
        toast({
          title: "Error",
          description: "Failed to load jobs. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }    fetchJobs()
    
    return () => {
      isMounted = false;
    }
  }, [user, userRole, getAllJobs, getApplications, activeTab]);  const handleTabChange = (value: string) => {
    // Don't do anything if we're already on this tab
    if (value === activeTab) return;
    
    // Update the active tab state
    setActiveTab(value);
    
    // Update the URL without causing a full page reload
    if (value === "all") {
      router.replace('/dashboard/jobs', { scroll: false });
    } else {
      router.replace(`/dashboard/jobs?status=${value}`, { scroll: false });
    }
  };
  
  if (!user) {
    return (
      <RetroBox className="max-w-4xl mx-auto my-8">
        <div className="text-center py-8">{t("pleaseSignIn")}</div>
      </RetroBox>
    )  }
  
  // No need for additional client-side filtering since we're already fetching filtered data
  const filteredJobs = jobs;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("myJobs")}</h1>
        {userRole === "recruiter" && (
          <Link href="/dashboard/post-job">
            <Button className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("postNewJob")}
            </Button>
          </Link>
        )}
      </div>

      <RetroBox>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">          <TabsList className="grid w-full grid-cols-3 mb-4 border-2 border-black rounded-md overflow-hidden">
            <TabsTrigger value="all" className="data-[state=active]:bg-yellow-300 data-[state=active]:shadow-none">
              {t("allJobs")} 
              {!loading && `(${activeTab === "all" ? jobs.length : jobs.length})`}
            </TabsTrigger>
            <TabsTrigger value="open" className="data-[state=active]:bg-yellow-300 data-[state=active]:shadow-none">
              {t("openJobs")}
              {!loading && 
                `(${activeTab === "open" ? jobs.length : jobs.filter(job => job.status === "open").length})`}
            </TabsTrigger>
            <TabsTrigger value="closed" className="data-[state=active]:bg-yellow-300 data-[state=active]:shadow-none">
              {t("closedJobs")}
              {!loading && 
                `(${activeTab === "closed" ? jobs.length : jobs.filter(job => job.status === "closed").length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
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
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center gap-4">
                <Briefcase className="h-12 w-12 text-gray-400" />
                <p>
                  {activeTab === "all" 
                    ? t("noJobs") 
                    : activeTab === "open" 
                      ? t("noOpenJobs") 
                      : t("noClosedJobs")}
                </p>
                {userRole === "recruiter" && (
                  <Link href="/dashboard/post-job">
                    <Button className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                      {t("postYourFirstJob")}
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className={`border-2 border-black p-4 rounded-md ${job.status === "closed" ? "bg-gray-100" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        <p className="text-sm text-gray-600">
                          {job.company || job.recruiterName} • {job.location}
                        </p>
                        <p className="text-sm mt-1">{job.salary}</p>
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            job.status === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {job.status === "open" ? "Open" : "Closed"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">                        
                        <Link href={`/dashboard/jobs/${job.id}`}>
                          <Button
                            className="border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                          >
                            {t("viewDetails")}
                          </Button>
                        </Link>                        
                        {userRole === "recruiter" && (
                          <Link href={`/dashboard/jobs/${job.id}/applications`}>
                            <Button
                              className="border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                            >
                              {t("viewApplications")} ({job.applicationsCount || 0})
                            </Button>
                          </Link>
                        )}
                      </div>
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
