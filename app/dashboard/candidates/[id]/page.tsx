"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { useRetroToast } from "@/hooks/use-retro-toast"
import { Briefcase, Mail, MapPin, MessageSquare, Phone, Star, User } from "lucide-react"

export default function CandidateProfile() {
  const params = useParams<{ id: string }>()
  const candidateId = params.id
  const router = useRouter()
  const { getUserById, userRole, getUserRatings } = useFirebase()
  const { toast } = useRetroToast()

  const [candidate, setCandidate] = useState<any>(null)
  const [ratings, setRatings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const fetchCandidateData = async () => {
      try {
        const candidateData = await getUserById(candidateId)
        setCandidate(candidateData)
        
        // We only need to fetch received ratings for the candidate
        // The user stats like averageRating and ratingsCount are already included
        // in the candidate data from getUserById
      } catch (error) {
        console.error("Error fetching candidate details:", error)
        toast({
          title: "Error",
          description: "Failed to load candidate profile. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCandidateData()
  }, [candidateId, getUserById, toast])

  const handleContactCandidate = () => {
    if (candidate) {
      router.push(`/dashboard/messages?recipient=${candidateId}`)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kaaj-500 border-t-transparent"></div>
      </div>
    )
  }

  // Case where candidate data couldn't be fetched or user doesn't have permission
  if (!candidate) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight doodle-heading">Candidate Profile</h1>
          <p className="text-muted-foreground">This candidate profile is not available or you don't have permission to view it.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/candidates")} className="bg-kaaj-500 hover:bg-kaaj-600 doodle-button">
          Back to Candidates
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight doodle-heading">Candidate Profile</h1>
        <p className="text-muted-foreground">View detailed information about this candidate</p>
      </div>

      <Card className="border-kaaj-100 overflow-hidden doodle-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24 border-2 border-kaaj-100">
              <AvatarFallback className="bg-kaaj-100 text-kaaj-700 text-xl">
                {candidate.displayName?.charAt(0) || <User className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-1">
                <CardTitle className="text-2xl">{candidate.displayName}</CardTitle>
                {candidate.verified && <Badge className="w-fit badge-verified">Verified</Badge>}
              </div>
              <CardDescription className="text-base mb-2">
                {candidate.bio || "No bio provided"}
              </CardDescription>
              <div className="flex flex-wrap gap-2">
                {candidate.averageRating ? (
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-kaaj-500 text-kaaj-500" />
                    <span className="ml-1 font-medium">{candidate.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground ml-1">({candidate.ratingsCount || 0} reviews)</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No ratings yet</span>
                )}
              </div>
            </div>
            {userRole === "recruiter" && (
              <Button 
                onClick={handleContactCandidate} 
                className="bg-kaaj-500 hover:bg-kaaj-600 doodle-button"
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Contact Candidate
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Contact Information</h3>
                <div className="space-y-3">
                  {candidate.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{candidate.email}</span>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{candidate.location}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {candidate.experience && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Experience</h3>
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 mt-1 text-muted-foreground" />
                    <span>{candidate.experience}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              {candidate.skills && candidate.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="bg-kaaj-100 text-kaaj-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {candidate.education && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Education</h3>
                  <p>{candidate.education}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Additional candidate information could be added here */}
        </CardContent>
        
        <CardFooter className="bg-muted/30 flex justify-between py-4">
          <Button variant="outline" onClick={() => router.back()} className="border-kaaj-200">
            Go Back
          </Button>
          {userRole === "recruiter" && (
            <Button onClick={() => router.push("/dashboard/candidates")} className="bg-kaaj-500 hover:bg-kaaj-600 doodle-button">
              View All Candidates
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
