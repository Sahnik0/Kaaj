"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useFirebase } from "@/lib/firebase/firebase-provider"

export default function Onboarding() {
  const [selectedRole, setSelectedRole] = useState<"recruiter" | "candidate" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { setUserRole, user } = useFirebase()
  const { toast } = useToast()
  const router = useRouter()

  const handleContinue = async () => {
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role to continue.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await setUserRole(selectedRole)
      toast({
        title: "Success",
        description: "Your role has been set successfully.",
      })
      router.push(`/onboarding/${selectedRole}-profile`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    router.push("/auth/signin")
    return null
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Your Role</CardTitle>
          <CardDescription>
            Select how you want to use Kaaj. You can be either a recruiter or a candidate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={selectedRole === "recruiter" ? "default" : "outline"}
              className="h-32 flex flex-col items-center justify-center gap-2"
              onClick={() => setSelectedRole("recruiter")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Recruiter</span>
              <span className="text-xs text-center">Post jobs and hire candidates</span>
            </Button>
            <Button
              variant={selectedRole === "candidate" ? "default" : "outline"}
              className="h-32 flex flex-col items-center justify-center gap-2"
              onClick={() => setSelectedRole("candidate")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Candidate</span>
              <span className="text-xs text-center">Find jobs and apply to them</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleContinue} disabled={!selectedRole || isLoading}>
            {isLoading ? "Processing..." : "Continue"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
