"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Briefcase, MapPin, MessageSquare, Search, Star, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function Candidates() {
  const { userRole, getCandidates } = useFirebase()
  const [candidates, setCandidates] = useState<any[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        // Implement getCandidates in firebase-provider.tsx
        const data = await getCandidates()
        setCandidates(data || [])
        setFilteredCandidates(data || [])
      } catch (error) {
        console.error("Error fetching candidates:", error)
        toast({
          title: "Error",
          description: "Failed to load candidates. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCandidates()
  }, [getCandidates, toast])

  // Redirect if not a recruiter
  useEffect(() => {
    if (userRole !== "recruiter" && !loading) {
      router.push("/dashboard")
    }
  }, [userRole, loading, router])

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = candidates.filter(
        (candidate) =>
          candidate.displayName?.toLowerCase().includes(query) ||
          candidate.skills?.some((skill: string) => skill.toLowerCase().includes(query)) ||
          candidate.bio?.toLowerCase().includes(query),
      )
      setFilteredCandidates(filtered)
    } else {
      setFilteredCandidates(candidates)
    }
  }, [searchQuery, candidates])

  const handleContactCandidate = (candidateId: string) => {
    router.push(`/dashboard/messages?recipient=${candidateId}`)
  }

  const handleViewProfile = (candidateId: string) => {
    router.push(`/dashboard/candidates/${candidateId}`)
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight doodle-heading">Candidates</h1>
        <p className="text-muted-foreground">Browse and connect with potential candidates for your jobs</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-kaaj-200 focus-visible:ring-kaaj-500"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCandidates.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3">
            <Card className="border-kaaj-100 doodle-card">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No candidates found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Try adjusting your search query" : "There are no candidates available at the moment"}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="border-kaaj-100 overflow-hidden doodle-card">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 border border-kaaj-100">
                    <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                      {candidate.displayName?.charAt(0) || <User className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg">{candidate.displayName}</CardTitle>
                    <div className="flex items-center gap-2">
                      {candidate.averageRating ? (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-kaaj-500 text-kaaj-500" />
                          <span className="ml-1 text-sm">{candidate.averageRating.toFixed(1)}</span>
                        </div>
                      ) : null}
                      {candidate.verified && <Badge className="badge-verified">Verified</Badge>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{candidate.bio || "No bio provided"}</p>

                <div className="mt-4 space-y-2">
                  {candidate.location && (
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{candidate.location}</span>
                    </div>
                  )}

                  {candidate.experience && (
                    <div className="flex items-center gap-2 text-xs">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      <span className="line-clamp-1">{candidate.experience}</span>
                    </div>
                  )}
                </div>

                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="bg-kaaj-100 text-kaaj-700 text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{candidate.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-kaaj-500 border-kaaj-200 hover:bg-kaaj-50 hover:text-kaaj-600"
                  onClick={() => handleViewProfile(candidate.id)}
                >
                  View Profile
                </Button>
                <Button
                  size="sm"
                  className="bg-kaaj-500 hover:bg-kaaj-600"
                  onClick={() => handleContactCandidate(candidate.id)}
                >
                  <MessageSquare className="mr-1 h-3 w-3" /> Contact
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
