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
import { 
  BookOpen, 
  ExternalLink, 
  Play, 
  Plus, 
  Search, 
  Tag, 
  Calendar, 
  Filter, 
  X, 
  Loader2 
} from "lucide-react"
import { PageContainer, PageHeader } from "@/components/dashboard/page-container"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

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
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
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
    // Filter resources based on category, tab and search query
    let filtered = resources

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((resource) => resource.category === selectedCategory)
    }

    // Apply tab filter
    if (activeTab !== "all") {
      const type = activeTab.slice(0, -1) // Remove 's' from end (videos -> video)
      filtered = filtered.filter((resource) => resource.type === type)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(query) || 
          resource.description.toLowerCase().includes(query) ||
          resource.category.toLowerCase().includes(query)
      )
    }

    setFilteredResources(filtered)
  }, [selectedCategory, activeTab, searchQuery, resources])

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

  const getResourceActionText = (type: string) => {
    switch (type) {
      case "video":
        return "Watch Video"
      case "article":
        return "Read Article"
      case "course":
        return "Start Course"
      default:
        return "View Resource"
    }
  }

  const ResourceCard = ({ resource }: { resource: any }) => (
    <Card className="overflow-hidden border-kaaj-100 transition-all hover:shadow-md group">
      <CardHeader className="p-4 pb-2 bg-gradient-to-br from-kaaj-50 to-kaaj-100/60">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium text-kaaj-800">{resource.title}</CardTitle>
          <Badge variant="outline" className="bg-white flex items-center gap-1 text-kaaj-600 border-kaaj-200">
            {getResourceTypeIcon(resource.type)}
            <span className="capitalize">{resource.type}</span>
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 mt-1 text-kaaj-600">{resource.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3 text-kaaj-500" />
            <span className="bg-kaaj-100 text-kaaj-700 px-2 py-0.5 rounded-full">
              {resource.category}
            </span>
          </div>
          {resource.createdAt && (
            <div className="flex items-center gap-1 ml-auto">
              <Calendar className="h-3 w-3 text-kaaj-400" />
              <span className="text-kaaj-500">
                {new Date(resource.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="text-kaaj-600 border-kaaj-200 hover:bg-kaaj-50 hover:text-kaaj-700 group-hover:border-kaaj-400 transition-all duration-200"
        >
          <a href={resource.url} target="_blank" rel="noopener noreferrer">
            {getResourceActionText(resource.type)} <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )

  const EmptyState = ({ type = "resource" }: { type?: string }) => (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-white/50 rounded-lg border border-dashed border-kaaj-200 p-8">
      {type === "video" ? (
        <Play className="h-12 w-12 text-kaaj-300 mb-4" />
      ) : (
        <BookOpen className="h-12 w-12 text-kaaj-300 mb-4" />
      )}
      <h3 className="text-lg font-medium text-kaaj-700">No {type}s found</h3>
      <p className="text-sm text-kaaj-500 mt-1 max-w-md">
        {searchQuery || selectedCategory !== "all" ? (
          <>
            No results match your current filters. Try adjusting your search or category filters.
          </>
        ) : (
          <>Check back later for new content or try exploring a different category.</>
        )}
      </p>
      {(searchQuery || selectedCategory !== "all") && (
        <Button 
          variant="outline" 
          onClick={() => {
            setSearchQuery("")
            setSelectedCategory("all")
          }}
          className="mt-4 border-kaaj-200 text-kaaj-600 hover:bg-kaaj-50"
        >
          <X className="h-4 w-4 mr-2" /> Clear Filters
        </Button>
      )}
    </div>
  )

  const LoadingState = () => (
    <div className="flex flex-col space-y-4 w-full h-full min-h-[300px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-kaaj-500" />
      <p className="text-kaaj-600">Loading resources...</p>
    </div>
  )

  const LoadingSkeletons = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="overflow-hidden border-kaaj-100">
          <CardHeader className="p-4 pb-2 bg-kaaj-50">
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-4/5 mt-1" />
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/4 rounded-full" />
              <Skeleton className="h-4 w-1/5" />
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-end">
            <Skeleton className="h-8 w-32" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )

  return (
    <PageContainer>
      <PageHeader 
        title="Learning Path"
        description="Explore resources to develop your skills and advance your career."
      >
        {userRole === "recruiter" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-kaaj-500 hover:bg-kaaj-600 text-white">
                <Plus className="mr-2 h-4 w-4" /> Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
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
                      className="border-kaaj-200 focus-visible:ring-kaaj-500"
                      placeholder="E.g. Introduction to Web Development"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newResource.description}
                      onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                      className="border-kaaj-200 focus-visible:ring-kaaj-500"
                      placeholder="Brief description of what this resource covers"
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
                      className="border-kaaj-200 focus-visible:ring-kaaj-500"
                      placeholder="https://example.com/resource"
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
                        <SelectTrigger className="border-kaaj-200 focus:ring-kaaj-500">
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
                        <SelectTrigger className="border-kaaj-200 focus:ring-kaaj-500">
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
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="border-kaaj-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-kaaj-500 hover:bg-kaaj-600 text-white" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                    ) : (
                      <>Add Resource</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Main content area with responsive layout */}
      <div className="relative">
        {/* Mobile filter button */}
        <div className="md:hidden mb-4">
          <Button 
            variant="outline" 
            className="w-full border-kaaj-200 text-kaaj-700 justify-between"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" /> 
              {selectedCategory !== "all" ? `Category: ${selectedCategory}` : "Filter by Category"}
            </div>
            {selectedCategory !== "all" && (
              <Badge className="ml-auto bg-kaaj-100 text-kaaj-700 hover:bg-kaaj-200">
                1
              </Badge>
            )}
          </Button>
        </div>

        {/* Mobile filters panel */}
        {mobileFiltersOpen && (
          <div className="md:hidden bg-white rounded-lg border border-kaaj-100 mb-4 shadow-md">
            <div className="p-4 border-b border-kaaj-100 flex justify-between items-center">
              <h3 className="font-medium text-kaaj-700">Categories</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
              <Button
                variant={selectedCategory === "all" ? "default" : "ghost"}
                className={
                  selectedCategory === "all"
                    ? "bg-kaaj-500 hover:bg-kaaj-600 w-full justify-start text-white"
                    : "w-full justify-start hover:text-kaaj-500"
                }
                onClick={() => {
                  setSelectedCategory("all")
                  setMobileFiltersOpen(false)
                }}
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  className={
                    selectedCategory === category
                      ? "bg-kaaj-500 hover:bg-kaaj-600 w-full justify-start text-white"
                      : "w-full justify-start hover:text-kaaj-500"
                  }
                  onClick={() => {
                    setSelectedCategory(category)
                    setMobileFiltersOpen(false)
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar / Filter section */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-kaaj-400" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-kaaj-200 focus-visible:ring-kaaj-500"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-kaaj-400 hover:text-kaaj-500"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="bg-white rounded-lg border border-kaaj-100 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-kaaj-100">
                  <h3 className="font-medium text-kaaj-700">Categories</h3>
                </div>
                <div className="p-2 max-h-96 overflow-y-auto">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "ghost"}
                    className={
                      selectedCategory === "all"
                        ? "bg-kaaj-500 hover:bg-kaaj-600 w-full justify-start mb-1 text-white"
                        : "w-full justify-start mb-1 hover:text-kaaj-500 hover:bg-kaaj-50"
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
                          ? "bg-kaaj-500 hover:bg-kaaj-600 w-full justify-start mb-1 text-white"
                          : "w-full justify-start mb-1 hover:text-kaaj-500 hover:bg-kaaj-50"
                      }
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="flex-1">
            {/* Search bar (mobile only) */}
            <div className="md:hidden relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-kaaj-400" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-kaaj-200 focus-visible:ring-kaaj-500"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-kaaj-400 hover:text-kaaj-500"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Resource filters & tabs */}
            <div className="bg-white rounded-lg border border-kaaj-100 mb-4 shadow-sm">
              <Tabs 
                defaultValue="all" 
                className="w-full"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <div className="px-4 pt-4 pb-0">
                  <TabsList className="bg-kaaj-50 text-kaaj-700 p-1 w-full md:w-auto">
                    <TabsTrigger 
                      value="all" 
                      className={cn(
                        "data-[state=active]:bg-kaaj-500 data-[state=active]:text-white rounded-md",
                        "transition-all duration-200"
                      )}
                    >
                      All Resources
                    </TabsTrigger>
                    <TabsTrigger 
                      value="videos" 
                      className={cn(
                        "data-[state=active]:bg-kaaj-500 data-[state=active]:text-white rounded-md",
                        "transition-all duration-200"
                      )}
                    >
                      <Play className="h-3 w-3 mr-1" /> Videos
                    </TabsTrigger>
                    <TabsTrigger 
                      value="articles" 
                      className={cn(
                        "data-[state=active]:bg-kaaj-500 data-[state=active]:text-white rounded-md",
                        "transition-all duration-200"
                      )}
                    >
                      <BookOpen className="h-3 w-3 mr-1" /> Articles
                    </TabsTrigger>
                    <TabsTrigger 
                      value="courses" 
                      className={cn(
                        "data-[state=active]:bg-kaaj-500 data-[state=active]:text-white rounded-md",
                        "transition-all duration-200"
                      )}
                    >
                      <BookOpen className="h-3 w-3 mr-1" /> Courses
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Active filters display */}
                {(selectedCategory !== "all" || searchQuery) && (
                  <div className="px-4 py-3 flex flex-wrap gap-2 border-t border-kaaj-100 mt-4">
                    {selectedCategory !== "all" && (
                      <Badge 
                        variant="secondary" 
                        className="bg-kaaj-100 text-kaaj-700 hover:bg-kaaj-200 pl-2 pr-1 py-1"
                      >
                        Category: {selectedCategory}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 text-kaaj-500 hover:text-kaaj-700 hover:bg-transparent"
                          onClick={() => setSelectedCategory("all")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    
                    {searchQuery && (
                      <Badge 
                        variant="secondary" 
                        className="bg-kaaj-100 text-kaaj-700 hover:bg-kaaj-200 pl-2 pr-1 py-1"
                      >
                        Search: {searchQuery}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 text-kaaj-500 hover:text-kaaj-700 hover:bg-transparent"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    
                    <Button
                      variant="link"
                      size="sm"
                      className="text-kaaj-600 ml-auto p-0 h-6"
                      onClick={() => {
                        setSelectedCategory("all")
                        setSearchQuery("")
                      }}
                    >
                      Clear All
                    </Button>
                  </div>
                )}

                <div className="p-4">
                  {loading ? (
                    <LoadingSkeletons />
                  ) : (
                    <>
                      <TabsContent value="all" className="mt-0">
                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                          {filteredResources.length === 0 ? (
                            <EmptyState type="resource" />
                          ) : (
                            filteredResources.map((resource) => (
                              <ResourceCard key={resource.id} resource={resource} />
                            ))
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="videos" className="mt-0">
                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                          {filteredResources.filter((r) => r.type === "video").length === 0 ? (
                            <EmptyState type="video" />
                          ) : (
                            filteredResources
                              .filter((r) => r.type === "video")
                              .map((resource) => (
                                <ResourceCard key={resource.id} resource={resource} />
                              ))
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="articles" className="mt-0">
                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                          {filteredResources.filter((r) => r.type === "article").length === 0 ? (
                            <EmptyState type="article" />
                          ) : (
                            filteredResources
                              .filter((r) => r.type === "article")
                              .map((resource) => (
                                <ResourceCard key={resource.id} resource={resource} />
                              ))
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="courses" className="mt-0">
                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                          {filteredResources.filter((r) => r.type === "course").length === 0 ? (
                            <EmptyState type="course" />
                          ) : (
                            filteredResources
                              .filter((r) => r.type === "course")
                              .map((resource) => (
                                <ResourceCard key={resource.id} resource={resource} />
                              ))
                          )}
                        </div>
                      </TabsContent>
                    </>
                  )}
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}