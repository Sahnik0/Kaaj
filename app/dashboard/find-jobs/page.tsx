"use client"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, MapPin, DollarSign, Search } from "lucide-react"
import { useTranslation } from "@/lib/i18n/language-context"
import { RetroBox } from "@/components/ui/retro-box"
import Link from "next/link"

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
}

export default function FindJobsPage() {
  const { user, firestore } = useFirebase()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const { t } = useTranslation()

  useEffect(() => {
    async function fetchJobs() {
      if (!firestore) return

      try {
        setLoading(true)

        // Fetch active jobs
        const jobsCollection = firestore.collection("jobs")
        const snapshot = await jobsCollection.where("status", "==", "active").get()

        const jobsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Job[]

        setJobs(jobsData)
        setFilteredJobs(jobsData)
      } catch (error) {
        console.error("Error fetching jobs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [firestore])

  useEffect(() => {
    // Filter jobs based on search term and location
    const filtered = jobs.filter((job) => {
      const matchesSearch =
        searchTerm === "" ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesLocation = locationFilter === "" || job.location.toLowerCase().includes(locationFilter.toLowerCase())

      return matchesSearch && matchesLocation
    })

    setFilteredJobs(filtered)
  }, [searchTerm, locationFilter, jobs])

  const locations = [...new Set(jobs.map((job) => job.location))]

  return (
    <div className="container mx-auto px-4 py-8">
      <RetroBox className="mb-6" backLink="/dashboard">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder={t("searchJobs")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-2 border-black"
              />
            </div>
          </div>
          <div className="w-full md:w-64">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="border-2 border-black">
                <SelectValue placeholder={t("filterByLocation")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allLocations")}</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </RetroBox>

      <RetroBox>
        <h1 className="text-2xl font-bold mb-6">{t("availableJobs")}</h1>

        {loading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-2 border-black p-6 rounded-md animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center gap-4">
            <Briefcase className="h-16 w-16 text-gray-400" />
            <h3 className="text-xl font-medium">{t("noJobsFound")}</h3>
            <p className="text-gray-500">{t("tryDifferentSearch")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="border-2 border-black p-6 rounded-md hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <h2 className="text-xl font-bold mb-2">{job.title}</h2>
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" />
                    {job.company}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {job.salary}
                  </div>
                </div>
                <p className="mb-4 line-clamp-3">{job.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.requirements.slice(0, 3).map((req, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 border-2 border-black rounded-md text-xs">
                      {req}
                    </span>
                  ))}
                  {job.requirements.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 border-2 border-black rounded-md text-xs">
                      +{job.requirements.length - 3} {t("more")}
                    </span>
                  )}
                </div>
                <Link href={`/dashboard/jobs/${job.id}`}>
                  <Button className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                    {t("viewDetails")}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </RetroBox>
    </div>
  )
}
