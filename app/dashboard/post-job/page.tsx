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
import { useRetroToast } from "@/hooks/use-retro-toast"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Alert } from "@/components/retroui/Alert"
import { Briefcase, Clock, AlertTriangle, PlusCircle } from "lucide-react"
import { PageContainer, PageHeader } from "@/components/dashboard/page-container"
import { Badge } from "@/components/ui/badge"

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
  const { toast } = useRetroToast()
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
    <PageContainer>      <PageHeader 
        title="Post a New Opportunity" 
        description="Create a new job listing or quick task to find the perfect candidate."
        titleClassName="font-heading"
        descriptionClassName="font-body"
      >
        <Button onClick={() => router.back()} variant="outline" size="sm">
          Cancel
        </Button>
      </PageHeader>

      <Tabs defaultValue="regular" onValueChange={(value) => setJobType(value as "regular" | "task")} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-background border w-auto">
            <TabsTrigger value="regular" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white font-body">
              <Briefcase className="mr-2 h-4 w-4" />
              Regular Job
            </TabsTrigger>
            <TabsTrigger value="task" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white font-body">
              <Clock className="mr-2 h-4 w-4" />
              Quick Task
            </TabsTrigger>
          </TabsList>
          <Badge variant="outline" className="bg-kaaj-50 text-kaaj-700 gap-1 font-body">
            <PlusCircle className="h-3 w-3" />
            New Post
          </Badge>
        </div>        <TabsContent value="regular" className="mt-4">
          <Card className="border shadow-sm">
            <form onSubmit={handleSubmit}>              <CardHeader className="border-b bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="bg-kaaj-500 p-2 rounded-full">
                    <Briefcase className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="font-heading">Job Details</CardTitle>
                    <CardDescription className="font-body">
                      Provide detailed information about the job to attract qualified candidates.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-medium font-body">Job Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Senior Web Developer, Tailor, Math Teacher"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="focus-visible:ring-kaaj-500"
                  />
                </div>                <div className="space-y-2">
                  <Label htmlFor="category" className="font-medium font-body">Job Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                    required
                  >
                    <SelectTrigger className="focus-visible:ring-kaaj-500">
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
                </div>                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium font-body">Job Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the job responsibilities and duties"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="min-h-32 focus-visible:ring-kaaj-500"
                  />
                  <p className="text-xs text-muted-foreground font-body">Provide a clear and concise description of the role and responsibilities.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements" className="font-medium font-body">Requirements</Label>
                  <Textarea
                    id="requirements"
                    name="requirements"
                    placeholder="List the skills, qualifications, and experience required"
                    value={formData.requirements}
                    onChange={handleChange}
                    required
                    className="min-h-32 focus-visible:ring-kaaj-500"
                  />
                  <p className="text-xs text-muted-foreground font-body">List specific skills, experience, and qualifications needed for this position.</p>
                </div>                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="font-medium font-body">Location Type</Label>
                    <RadioGroup
                      defaultValue={formData.locationType}
                      onValueChange={(value) => handleSelectChange("locationType", value)}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="remote" id="remote" className="text-kaaj-500" />
                        <Label htmlFor="remote" className="font-normal font-body cursor-pointer w-full">
                          Remote
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="offline" id="offline" className="text-kaaj-500" />
                        <Label htmlFor="offline" className="font-normal font-body cursor-pointer w-full">
                          In-Person
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="hybrid" id="hybrid" className="text-kaaj-500" />
                        <Label htmlFor="hybrid" className="font-normal font-body cursor-pointer w-full">
                          Hybrid
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="font-medium font-body">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="City, State"
                      value={formData.location}
                      onChange={handleChange}
                      required={formData.locationType !== "remote"}
                      disabled={formData.locationType === "remote"}
                      className="focus-visible:ring-kaaj-500"
                    />
                    <p className="text-xs text-muted-foreground font-body">
                      {formData.locationType === "remote" ? 
                        "Remote work - no physical location required" : 
                        "Specify the location where the work will be performed"}
                    </p>
                  </div>
                </div>                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="salary" className="font-medium font-body">Salary/Compensation</Label>
                    <Input
                      id="salary"
                      name="salary"
                      placeholder="e.g., ₹20,000 - ₹30,000 per month"
                      value={formData.salary}
                      onChange={handleChange}
                      required
                      className="focus-visible:ring-kaaj-500"
                    />
                    <p className="text-xs text-muted-foreground font-body">
                      Specify the salary range or fixed amount with payment frequency
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-medium font-body">Job Duration</Label>
                    <RadioGroup
                      defaultValue={formData.jobType}
                      onValueChange={(value) => handleSelectChange("jobType", value)}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="long-term" id="long-term" className="text-kaaj-500" />
                        <Label htmlFor="long-term" className="font-normal cursor-pointer w-full font-body">
                          Long-term (Ongoing position)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="quick" id="quick" className="text-kaaj-500" />
                        <Label htmlFor="quick" className="font-normal cursor-pointer w-full font-body">
                          Short-term (Temporary or contract)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>                {formData.jobType === "quick" && (
                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="font-medium font-body">Deadline</Label>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={handleChange}
                      required={formData.jobType === "quick"}
                      className="focus-visible:ring-kaaj-500"
                    />
                    <p className="text-xs text-muted-foreground font-body">
                      Short-term jobs will automatically close after this deadline.
                    </p>
                  </div>
                )}
                
                <Alert status="info" className="flex items-start bg-blue-50 border-blue-100">
                  <div>
                    <Alert.Title className="text-blue-800 font-medium font-heading">Job Posting Tips</Alert.Title>
                    <Alert.Description className="text-blue-700 text-sm mt-1 font-body">
                      Be specific about requirements and responsibilities. Include clear details about compensation and work schedule to attract qualified candidates.
                    </Alert.Description>
                  </div>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t p-4 bg-muted/50">
                <Button variant="outline" type="button" onClick={() => router.back()} className="font-body">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-kaaj-500 hover:bg-kaaj-600 font-body">
                  {isLoading ? "Posting Job..." : "Post Job"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>        <TabsContent value="task" className="mt-4">
          <Card className="border shadow-sm">
            <form onSubmit={handleSubmit}>              <CardHeader className="border-b bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="bg-kaaj-500 p-2 rounded-full">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="font-heading">Task Details</CardTitle>
                    <CardDescription className="font-body">
                      Provide information about your quick task to find someone to help you.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-medium font-body">Task Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Fix my leaking tap, Help move furniture, Design a logo"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="focus-visible:ring-kaaj-500 font-body"
                  />
                </div>                <div className="space-y-2">
                  <Label htmlFor="category" className="font-medium font-body">Task Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                    required
                  >
                    <SelectTrigger className="focus-visible:ring-kaaj-500 font-body">
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
                  <p className="text-xs text-muted-foreground font-body">
                    Choosing the right category helps your task reach relevant workers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium font-body">Task Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what needs to be done in detail"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="min-h-32 focus-visible:ring-kaaj-500 font-body"
                  />
                  <p className="text-xs text-muted-foreground font-body">
                    Be specific about what needs to be done, including any materials or tools required
                  </p>
                </div>                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="font-medium font-body">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Address or area where the task needs to be done"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="focus-visible:ring-kaaj-500 font-body"
                    />
                    <p className="text-xs text-muted-foreground font-body">
                      Provide a specific address or area to help workers find you
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="font-medium font-body">Estimated Duration</Label>
                    <Input
                      id="duration"
                      name="duration"
                      placeholder="e.g., 2 hours, 1 day"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                      className="focus-visible:ring-kaaj-500 font-body"
                    />
                    <p className="text-xs text-muted-foreground font-body">
                      How long do you expect this task to take?
                    </p>
                  </div>
                </div>                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="font-medium font-body">Budget</Label>
                    <Input
                      id="budget"
                      name="budget"
                      placeholder="e.g., ₹500, ₹1000-1500"
                      value={formData.budget}
                      onChange={handleChange}
                      required
                      className="focus-visible:ring-kaaj-500 font-body"
                    />
                    <p className="text-xs text-muted-foreground font-body">
                      How much are you willing to pay for this task?
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-medium font-body">Urgency</Label>
                    <RadioGroup
                      defaultValue={formData.urgency}
                      onValueChange={(value) => handleSelectChange("urgency", value)}
                      className="grid grid-cols-1 gap-2 font-body"
                    >
                      <div className={`flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50 cursor-pointer ${formData.urgency === "low" ? "border-kaaj-200 bg-kaaj-50" : ""}`}>
                        <RadioGroupItem value="low" id="urgency-low" className="text-kaaj-500" />
                        <div>
                          <Label htmlFor="urgency-low" className="font-medium cursor-pointer font-body">
                            Low
                          </Label>
                          <p className="text-xs text-muted-foreground font-body">Within a week</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50 cursor-pointer ${formData.urgency === "normal" ? "border-kaaj-200 bg-kaaj-50" : ""}`}>
                        <RadioGroupItem value="normal" id="urgency-normal" className="text-kaaj-500" />
                        <div>
                          <Label htmlFor="urgency-normal" className="font-medium cursor-pointer font-body">
                            Normal
                          </Label>
                          <p className="text-xs text-muted-foreground font-body">Within 2-3 days</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50 cursor-pointer ${formData.urgency === "high" ? "border-kaaj-200 bg-kaaj-50" : ""}`}>
                        <RadioGroupItem value="high" id="urgency-high" className="text-kaaj-500" />
                        <div>
                          <Label htmlFor="urgency-high" className="font-medium cursor-pointer font-body">
                            High
                          </Label>
                          <p className="text-xs text-muted-foreground font-body">Today or tomorrow</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>                <div className="space-y-2">
                  <Label htmlFor="deadline" className="font-medium font-body">Deadline</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleChange}
                    required
                    className="focus-visible:ring-kaaj-500 font-body"
                  />
                  <p className="text-xs text-muted-foreground font-body">
                    The latest date by which this task needs to be completed
                  </p>
                </div>
                
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <div>
                      <h5 className="font-medium text-amber-800 font-heading">Important Note</h5>
                      <p className="text-sm text-amber-700 mt-1 font-body">
                        Quick tasks are meant for small, one-time jobs that can be completed in a short period. For
                        longer-term work, please post a regular job instead.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t p-4 bg-muted/50">
                <Button variant="outline" type="button" onClick={() => router.back()} className="font-body">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-kaaj-500 hover:bg-kaaj-600 font-body">
                  {isLoading ? "Posting Task..." : "Post Task"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>    </PageContainer>
  )
}
