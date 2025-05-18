"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Star, User, Search, X, Filter, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageContainer, PageHeader } from "@/components/dashboard/page-container"

export default function Ratings() {
  const { user, userRole, getUserRatings, getRatingsByUser, submitRating, getApplications, getUserApplications } =
    useFirebase()
  const [myRatings, setMyRatings] = useState<any[]>([])
  const [receivedRatings, setReceivedRatings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [newRating, setNewRating] = useState({
    rating: 0,
    review: "",
    jobId: "",
    jobTitle: "",
  })
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filteredEligibleUsers, setFilteredEligibleUsers] = useState<any[]>([])

  // Filter eligible users based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredEligibleUsers(eligibleUsers)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = eligibleUsers.filter(user => {
      return (
        user.name.toLowerCase().includes(query) || 
        (user.jobTitle && user.jobTitle.toLowerCase().includes(query))
      )
    })
    
    setFilteredEligibleUsers(filtered)
  }, [eligibleUsers, searchQuery])

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        // Get ratings received by the current user
        const received = await getUserRatings()
        setReceivedRatings(received)

        // Get ratings given by the current user
        const given = await getRatingsByUser()
        setMyRatings(given)

        // Get users eligible for rating (people you've worked with)
        const eligible = await getEligibleUsers()
        setEligibleUsers(eligible)
        setFilteredEligibleUsers(eligible)
      } catch (error) {
        console.error("Error fetching ratings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRatings()
  }, [getUserRatings, getRatingsByUser])

  // Get users that the current user has worked with
  const getEligibleUsers = async () => {
    try {
      const eligibleUsers: any[] = []
      const processedUserIds = new Set()

      if (userRole === "recruiter") {
        // Get candidates who applied to recruiter's jobs
        const applications = await getApplications("all") // Get all applications for all jobs

        applications.forEach((app) => {
          if (!processedUserIds.has(app.candidateId)) {
            processedUserIds.add(app.candidateId)
            eligibleUsers.push({
              id: app.candidateId,
              name: app.candidateName,
              role: "candidate",
              jobId: app.jobId,
              jobTitle: app.jobTitle,
            })
          }
        })
      } else if (userRole === "candidate") {
        // Get recruiters whose jobs the candidate applied to
        const applications = await getUserApplications()

        applications.forEach((app) => {
          if (!processedUserIds.has(app.recruiterId)) {
            processedUserIds.add(app.recruiterId)
            eligibleUsers.push({
              id: app.recruiterId,
              name: app.recruiterName || "Recruiter",
              role: "recruiter",
              jobId: app.jobId,
              jobTitle: app.jobTitle,
            })
          }
        })
      }

      // Filter out users who have already been rated
      const ratedUserIds = myRatings.map((rating) => rating.ratedUserId)
      return eligibleUsers.filter((user) => !ratedUserIds.includes(user.id))
    } catch (error) {
      console.error("Error getting eligible users:", error)
      return []
    }
  }

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser || newRating.rating === 0) return

    setSubmitting(true)

    try {
      await submitRating({
        userId: selectedUser.id,
        ...newRating,
      })

      // Refresh ratings
      const given = await getRatingsByUser()
      setMyRatings(given)

      // Refresh eligible users
      const eligible = await getEligibleUsers()
      setEligibleUsers(eligible)
      setFilteredEligibleUsers(eligible)

      // Reset form and close dialog
      setNewRating({
        rating: 0,
        review: "",
        jobId: "",
        jobTitle: "",
      })
      setDialogOpen(false)
    } catch (error) {
      console.error("Error submitting rating:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const openRatingDialog = (user: any) => {
    setSelectedUser(user)
    setNewRating({
      rating: 0,
      review: "",
      jobId: user.jobId,
      jobTitle: user.jobTitle,
    })
    setDialogOpen(true)
  }

  const calculateAverageRating = (ratings: any[]) => {
    if (ratings.length === 0) return "0.0"

    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0)
    return (sum / ratings.length).toFixed(1)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-kaaj-500 text-kaaj-500" : "text-muted-foreground"}`}
          />
        ))}
      </div>
    )
  }

  const renderRatingStars = () => {
    return (
      <div className="rating-stars flex mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 cursor-pointer ${
              star <= (hoverRating || newRating.rating) 
                ? "fill-kaaj-500 text-kaaj-500" 
                : "text-kaaj-300"
            }`}
            onClick={() => setNewRating({ ...newRating, rating: star })}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-kaaj-500" />
        <p className="ml-2 text-kaaj-600">Loading ratings...</p>
      </div>
    )
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Ratings & Reviews"
        description="View your ratings and provide feedback to others you've worked with."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-kaaj-100 shadow-sm">
          <CardHeader className="bg-gradient-to-br from-kaaj-50 to-kaaj-100/60 border-b border-kaaj-100">
            <CardTitle className="text-kaaj-800">Your Rating</CardTitle>
            <CardDescription className="text-kaaj-600">How others have rated your work</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {receivedRatings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Star className="h-12 w-12 text-kaaj-300 mb-4" />
                <h3 className="text-lg font-medium text-kaaj-700">No ratings yet</h3>
                <p className="text-sm text-kaaj-500 mt-1">When someone rates you, it will appear here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-kaaj-500">{calculateAverageRating(receivedRatings)}</div>
                    <div className="flex mt-1">
                      {renderStars(parseFloat(calculateAverageRating(receivedRatings)))}
                      <span className="text-sm text-kaaj-500 ml-2">
                        ({receivedRatings.length} {receivedRatings.length === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-kaaj-600">Completion Rate</div>
                    <div className="text-2xl font-bold text-kaaj-500">100%</div>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  {receivedRatings.map((rating) => (
                    <div key={rating.id} className="border border-kaaj-100 rounded-lg p-4 hover:shadow-sm transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2 border border-kaaj-100">
                            <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-kaaj-800">{rating.raterName}</div>
                            <div className="text-xs text-kaaj-500">{rating.jobTitle}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {renderStars(rating.rating)}
                          <span className="text-sm ml-2 text-kaaj-700">{rating.rating}.0</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-kaaj-600">{rating.review}</div>
                      <div className="mt-2 text-xs text-kaaj-500">
                        {rating.createdAt ? new Date(rating.createdAt.toDate()).toLocaleDateString() : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-kaaj-100 shadow-sm">
            <CardHeader className="bg-gradient-to-br from-kaaj-50 to-kaaj-100/60 border-b border-kaaj-100">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-kaaj-800">Rate Others</CardTitle>
                  <CardDescription className="text-kaaj-600">Provide feedback to people you've worked with</CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rate {selectedUser?.name}</DialogTitle>
                      <DialogDescription className="text-kaaj-600">
                        Share your experience working with {selectedUser?.name} on {selectedUser?.jobTitle}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRatingSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="rating" className="text-kaaj-700">Rating</Label>
                          {renderRatingStars()}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="review" className="text-kaaj-700">Review</Label>
                          <Textarea
                            id="review"
                            placeholder="Share your experience..."
                            value={newRating.review}
                            onChange={(e) => setNewRating({ ...newRating, review: e.target.value })}
                            className="border-kaaj-200 focus-visible:ring-kaaj-500"
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          className="bg-transparent border border-kaaj-200 text-kaaj-700 hover:bg-kaaj-50"
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-kaaj-500 hover:bg-kaaj-600 text-white"
                          disabled={submitting || newRating.rating === 0}
                        >
                          {submitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                          ) : (
                            <>Submit Rating</>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <div className="p-4 border-b border-kaaj-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-kaaj-400" />
                <Input
                  placeholder="Search people to rate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-kaaj-200 focus-visible:ring-kaaj-500"
                />
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-kaaj-400 hover:text-kaaj-500"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <CardContent className="p-6">
              {filteredEligibleUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  {searchQuery ? (
                    <>
                      <Search className="h-12 w-12 text-kaaj-300 mb-2" />
                      <h3 className="text-lg font-medium text-kaaj-700">No matching users found</h3>
                      <p className="text-sm text-kaaj-500 mt-1 max-w-md">
                        Try adjusting your search query to find the person you want to rate.
                      </p>
                      <Button 
                        onClick={() => setSearchQuery("")}
                        className="mt-4 border-kaaj-200 text-kaaj-600 hover:bg-kaaj-50 border"
                      >
                        <X className="h-4 w-4 mr-2" /> Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <User className="h-12 w-12 text-kaaj-300 mb-4" />
                      <h3 className="text-lg font-medium text-kaaj-700">No one to rate yet</h3>
                      <p className="text-sm text-kaaj-500 mt-1">
                        When you work with someone, they'll appear here for you to rate.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEligibleUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between border border-kaaj-100 rounded-lg p-4 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3 border border-kaaj-100">
                          <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-kaaj-800">{user.name}</div>
                          <div className="text-xs text-kaaj-500">
                            {user.role === "recruiter" ? "Recruiter" : "Candidate"} • {user.jobTitle}
                          </div>
                        </div>
                      </div>
                      <Button
                        className="border-kaaj-200 text-kaaj-500 hover:bg-kaaj-50 hover:text-kaaj-600 border"
                        onClick={() => openRatingDialog(user)}
                      >
                        Rate
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-kaaj-100 shadow-sm">
            <CardHeader className="bg-gradient-to-br from-kaaj-50 to-kaaj-100/60 border-b border-kaaj-100">
              <CardTitle className="text-kaaj-800">Your Reviews</CardTitle>
              <CardDescription className="text-kaaj-600">Ratings you've given to others</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {myRatings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Star className="h-12 w-12 text-kaaj-300 mb-4" />
                  <h3 className="text-lg font-medium text-kaaj-700">No reviews given</h3>
                  <p className="text-sm text-kaaj-500 mt-1">When you rate someone, it will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRatings.map((rating) => (
                    <div key={rating.id} className="border border-kaaj-100 rounded-lg p-4 hover:shadow-sm transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2 border border-kaaj-100">
                            <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-kaaj-800">{rating.ratedUserName}</div>
                            <div className="text-xs text-kaaj-500">{rating.jobTitle}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {renderStars(rating.rating)}
                          <span className="text-sm ml-2 text-kaaj-700">{rating.rating}.0</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-kaaj-600">{rating.review}</div>
                      <div className="mt-2 text-xs text-kaaj-500">
                        {rating.createdAt ? new Date(rating.createdAt.toDate()).toLocaleDateString() : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
