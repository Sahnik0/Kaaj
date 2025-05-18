"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BookOpen, ExternalLink, Play, Plus } from "lucide-react"

const categories = [
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

export default function LearningPath() {
  const { userRole, getLearningResources, addLearningResource } = useFirebase()
  const [resources, setResources] = useState<any[]>([])
  const [filteredResources, setFilteredResources] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    url: "",
    category: "",
    type: "video", // video, article, course
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getLearningResources()
        setResources(data)
        setFilteredResources(data)
      } catch (error) {
        console.error("Error fetching learning resources:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [getLearningResources])

  useEffect(() => {
    // Filter resources based on category and search query
    let filtered = resources

    if (selectedCategory !== "all") {
      filtered = filtered.filter((resource) => resource.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(query) || resource.description.toLowerCase().includes(query),
      )
    }

    setFilteredResources(filtered)
  }, [selectedCategory, searchQuery, resources])

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await addLearningResource(newResource)

      // Refresh resources
      const data = await getLearningResources()
      setResources(data)
      setFilteredResources(data)

      // Reset form and close dialog
      setNewResource({
        title: "",
        description: "",
        url: "",
        category: "",
        type: "video",
      })
      setDialogOpen(false)
    } catch (error) {
      console.error("Error adding learning resource:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="h-4 w-4" />
      case "article":
        return <BookOpen className="h-4 w-4" />
      case "course":
        return <BookOpen className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kaaj-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Path</h1>
          <p className="text-muted-foreground">Explore resources to develop your skills and advance your career.</p>
        </div>
        {userRole === "recruiter" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-kaaj-500 hover:bg-kaaj-600">
                <Plus className="mr-2 h-4 w-4" /> Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Learning Resource</DialogTitle>
                <DialogDescription>
                  Share educational content with candidates to help them develop their skills.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddResource}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newResource.title}
                      onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newResource.description}
                      onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      type="url"
                      value={newResource.url}
                      onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newResource.category}
                        onValueChange={(value) => setNewResource({ ...newResource, category: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Resource Type</Label>
                      <Select
                        value={newResource.type}
                        onValueChange={(value) => setNewResource({ ...newResource, type: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="course">Course</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-kaaj-500 hover:bg-kaaj-600" disabled={submitting}>
                    {submitting ? "Adding..." : "Add Resource"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-64">
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4 border-kaaj-200 focus-visible:ring-kaaj-500"
          />
          <div className="bg-white rounded-lg border border-kaaj-100 overflow-hidden">
            <div className="p-4 border-b border-kaaj-100">
              <h3 className="font-medium">Categories</h3>
            </div>
            <div className="p-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "ghost"}
                className={
                  selectedCategory === "all"
                    ? "bg-kaaj-500 hover:bg-kaaj-600 w-full justify-start"
                    : "w-full justify-start hover:text-kaaj-500"
                }
                onClick={() => setSelectedCategory("all")}
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  className={
                    selectedCategory === category
                      ? "bg-kaaj-500 hover:bg-kaaj-600 w-full justify-start"
                      : "w-full justify-start hover:text-kaaj-500"
                  }
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4 bg-kaaj-50 text-kaaj-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
                All
              </TabsTrigger>
              <TabsTrigger value="videos" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
                Videos
              </TabsTrigger>
              <TabsTrigger value="articles" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
                Articles
              </TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
                Courses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredResources.length === 0 ? (
                  <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No resources found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try adjusting your filters or check back later for new content.
                    </p>
                  </div>
                ) : (
                  filteredResources.map((resource) => (
                    <Card key={resource.id} className="overflow-hidden border-kaaj-100 transition-all hover:shadow-md">
                      <CardHeader className="p-4 pb-2 bg-kaaj-50">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-white text-kaaj-500">
                            {getResourceTypeIcon(resource.type)}
                          </div>
                        </div>
                        <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span className="bg-kaaj-100 text-kaaj-700 px-2 py-0.5 rounded-full">
                            {resource.category}
                          </span>
                          <span className="ml-auto">
                            {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-end">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-kaaj-500 border-kaaj-200 hover:bg-kaaj-50 hover:text-kaaj-600"
                        >
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            View Resource <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="videos" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredResources.filter((r) => r.type === "video").length === 0 ? (
                  <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-12 text-center">
                    <Play className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No videos found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try adjusting your filters or check back later for new content.
                    </p>
                  </div>
                ) : (
                  filteredResources
                    .filter((r) => r.type === "video")
                    .map((resource) => (
                      <Card
                        key={resource.id}
                        className="overflow-hidden border-kaaj-100 transition-all hover:shadow-md"
                      >
                        <CardHeader className="p-4 pb-2 bg-kaaj-50">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-white text-kaaj-500">
                              <Play className="h-4 w-4" />
                            </div>
                          </div>
                          <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span className="bg-kaaj-100 text-kaaj-700 px-2 py-0.5 rounded-full">
                              {resource.category}
                            </span>
                            <span className="ml-auto">
                              {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-end">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-kaaj-500 border-kaaj-200 hover:bg-kaaj-50 hover:text-kaaj-600"
                          >
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              Watch Video <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="articles" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredResources.filter((r) => r.type === "article").length === 0 ? (
                  <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No articles found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try adjusting your filters or check back later for new content.
                    </p>
                  </div>
                ) : (
                  filteredResources
                    .filter((r) => r.type === "article")
                    .map((resource) => (
                      <Card
                        key={resource.id}
                        className="overflow-hidden border-kaaj-100 transition-all hover:shadow-md"
                      >
                        <CardHeader className="p-4 pb-2 bg-kaaj-50">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-white text-kaaj-500">
                              <BookOpen className="h-4 w-4" />
                            </div>
                          </div>
                          <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span className="bg-kaaj-100 text-kaaj-700 px-2 py-0.5 rounded-full">
                              {resource.category}
                            </span>
                            <span className="ml-auto">
                              {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-end">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-kaaj-500 border-kaaj-200 hover:bg-kaaj-50 hover:text-kaaj-600"
                          >
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              Read Article <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="courses" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredResources.filter((r) => r.type === "course").length === 0 ? (
                  <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No courses found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try adjusting your filters or check back later for new content.
                    </p>
                  </div>
                ) : (
                  filteredResources
                    .filter((r) => r.type === "course")
                    .map((resource) => (
                      <Card
                        key={resource.id}
                        className="overflow-hidden border-kaaj-100 transition-all hover:shadow-md"
                      >
                        <CardHeader className="p-4 pb-2 bg-kaaj-50">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-white text-kaaj-500">
                              <BookOpen className="h-4 w-4" />
                            </div>
                          </div>
                          <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span className="bg-kaaj-100 text-kaaj-700 px-2 py-0.5 rounded-full">
                              {resource.category}
                            </span>
                            <span className="ml-auto">
                              {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-end">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-kaaj-500 border-kaaj-200 hover:bg-kaaj-50 hover:text-kaaj-600"
                          >
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              Start Course <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
