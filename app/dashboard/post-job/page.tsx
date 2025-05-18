"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Briefcase, Clock, AlertTriangle } from "lucide-react"

const jobCategories = [
  "Technology",
  "Clothing & Tailoring",
  "Education & Teaching",
  "Domestic Services",
  "Construction",
  "Food & Hospitality",
  "Healthcare",
  "Retail",
  "Other",
]

export default function PostJob() {
  const [jobType, setJobType] = useState<"regular" | "task">("regular")
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    requirements: "",
    location: "",
    locationType: "offline",
    salary: "",
    jobType: "long-term",
    deadline: "",
    // Task specific fields
    duration: "",
    budget: "",
    urgency: "normal",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { createJob, userRole } = useFirebase()
  const { toast } = useToast()
  const router = useRouter()

  // Redirect if not a recruiter
  useEffect(() => {
    if (userRole && userRole !== "recruiter") {
      router.push("/dashboard")
    }
  }, [userRole, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Prepare the data based on job type
      const jobData = {
        ...formData,
        isTask: jobType === "task",
      }

      const jobId = await createJob(jobData)

      toast({
        title: "Success",
        description: `Your ${jobType === "task" ? "task" : "job"} has been posted successfully.`,
      })

      router.push(`/dashboard/jobs/${jobId}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to post ${jobType === "task" ? "task" : "job"}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (userRole === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kaaj-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight doodle-heading">Post a New Opportunity</h1>
        <p className="text-muted-foreground">Create a new job listing or quick task to find the perfect candidate.</p>
      </div>

      <Tabs defaultValue="regular" onValueChange={(value) => setJobType(value as "regular" | "task")}>
        <TabsList className="bg-kaaj-50 text-kaaj-700 w-full md:w-auto">
          <TabsTrigger value="regular" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
            <Briefcase className="mr-2 h-4 w-4" />
            Regular Job
          </TabsTrigger>
          <TabsTrigger value="task" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
            <Clock className="mr-2 h-4 w-4" />
            Quick Task
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regular" className="mt-6">
          <Card className="border-kaaj-100 doodle-card">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
                <CardDescription>
                  Provide detailed information about the job to attract qualified candidates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Senior Web Developer, Tailor, Math Teacher"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="border-kaaj-200 focus-visible:ring-kaaj-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Job Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                    required
                  >
                    <SelectTrigger className="border-kaaj-200 focus-visible:ring-kaaj-500">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the job responsibilities and duties"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="min-h-32 border-kaaj-200 focus-visible:ring-kaaj-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    name="requirements"
                    placeholder="List the skills, qualifications, and experience required"
                    value={formData.requirements}
                    onChange={handleChange}
                    required
                    className="min-h-32 border-kaaj-200 focus-visible:ring-kaaj-500"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Location Type</Label>
                    <RadioGroup
                      defaultValue={formData.locationType}
                      onValueChange={(value) => handleSelectChange("locationType", value)}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="remote" id="remote" />
                        <Label htmlFor="remote" className="font-normal">
                          Remote
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="offline" id="offline" />
                        <Label htmlFor="offline" className="font-normal">
                          Offline
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hybrid" id="hybrid" />
                        <Label htmlFor="hybrid" className="font-normal">
                          Hybrid
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="City, State"
                      value={formData.location}
                      onChange={handleChange}
                      required={formData.locationType !== "remote"}
                      disabled={formData.locationType === "remote"}
                      className="border-kaaj-200 focus-visible:ring-kaaj-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary/Compensation</Label>
                    <Input
                      id="salary"
                      name="salary"
                      placeholder="e.g., ₹20,000 - ₹30,000 per month"
                      value={formData.salary}
                      onChange={handleChange}
                      required
                      className="border-kaaj-200 focus-visible:ring-kaaj-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Job Type</Label>
                    <RadioGroup
                      defaultValue={formData.jobType}
                      onValueChange={(value) => handleSelectChange("jobType", value)}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="long-term" id="long-term" />
                        <Label htmlFor="long-term" className="font-normal">
                          Long-term
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="quick" id="quick" />
                        <Label htmlFor="quick" className="font-normal">
                          Quick Job
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {formData.jobType === "quick" && (
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={handleChange}
                      required={formData.jobType === "quick"}
                      className="border-kaaj-200 focus-visible:ring-kaaj-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Quick jobs will automatically close after this deadline.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.back()} className="border-kaaj-200">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-kaaj-500 hover:bg-kaaj-600 doodle-button">
                  {isLoading ? "Posting Job..." : "Post Job"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="task" className="mt-6">
          <Card className="border-kaaj-100 doodle-card">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
                <CardDescription>
                  Provide information about your quick task to find someone to help you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Fix my leaking tap, Help move furniture, Design a logo"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="border-kaaj-200 focus-visible:ring-kaaj-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Task Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                    required
                  >
                    <SelectTrigger className="border-kaaj-200 focus-visible:ring-kaaj-500">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Task Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what needs to be done in detail"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="min-h-32 border-kaaj-200 focus-visible:ring-kaaj-500"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Address or area where the task needs to be done"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="border-kaaj-200 focus-visible:ring-kaaj-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Estimated Duration</Label>
                    <Input
                      id="duration"
                      name="duration"
                      placeholder="e.g., 2 hours, 1 day"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                      className="border-kaaj-200 focus-visible:ring-kaaj-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget</Label>
                    <Input
                      id="budget"
                      name="budget"
                      placeholder="e.g., ₹500, ₹1000-1500"
                      value={formData.budget}
                      onChange={handleChange}
                      required
                      className="border-kaaj-200 focus-visible:ring-kaaj-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Urgency</Label>
                    <RadioGroup
                      defaultValue={formData.urgency}
                      onValueChange={(value) => handleSelectChange("urgency", value)}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="urgency-low" />
                        <Label htmlFor="urgency-low" className="font-normal">
                          Low - Within a week
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="normal" id="urgency-normal" />
                        <Label htmlFor="urgency-normal" className="font-normal">
                          Normal - Within 2-3 days
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="urgency-high" />
                        <Label htmlFor="urgency-high" className="font-normal">
                          High - Today or tomorrow
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleChange}
                    required
                    className="border-kaaj-200 focus-visible:ring-kaaj-500"
                  />
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Important Note</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Quick tasks are meant for small, one-time jobs that can be completed in a short period. For
                      longer-term work, please post a regular job instead.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.back()} className="border-kaaj-200">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-kaaj-500 hover:bg-kaaj-600 doodle-button">
                  {isLoading ? "Posting Task..." : "Post Task"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
