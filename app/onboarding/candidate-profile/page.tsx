"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRetroToast } from "@/hooks/use-retro-toast"
import { useFirebase } from "@/lib/firebase/firebase-provider"

const skillCategories = [
  {
    name: "Technology",
    skills: ["Web Development", "Mobile App Development", "IT Support", "Data Entry", "Graphic Design"],
  },
  {
    name: "Clothing",
    skills: ["Tailoring", "Stitching", "Fashion Design", "Embroidery", "Pattern Making"],
  },
  {
    name: "Teaching",
    skills: ["Primary Education", "Secondary Education", "Language Teaching", "Tutoring", "Coaching"],
  },
  {
    name: "Domestic Help",
    skills: ["Cleaning", "Cooking", "Childcare", "Elderly Care", "Gardening"],
  },
]

export default function CandidateProfile() {
  const [formData, setFormData] = useState({
    fullName: "",
    location: "",
    phone: "",
    bio: "",
    skills: [] as string[],
    experience: "",
    education: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { updateUserProfile, user } = useFirebase()
  const { toast } = useRetroToast()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => {
      const skills = prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill]

      return { ...prev, skills }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.skills.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one skill.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await updateUserProfile({
        ...formData,
        profileCompleted: true,
      })

      toast({
        title: "Success",
        description: "Your candidate profile has been created successfully.",
      })

      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile. Please try again.",
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
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create Candidate Profile</CardTitle>
          <CardDescription>
            Complete your profile to start applying for jobs and connecting with recruiters.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="City, State"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="Your phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us about yourself"
                value={formData.bio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Skills</Label>
              {skillCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <h3 className="font-medium">{category.name}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {category.skills.map((skill) => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={skill}
                          checked={formData.skills.includes(skill)}
                          onCheckedChange={() => handleSkillToggle(skill)}
                        />
                        <label
                          htmlFor={skill}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {skill}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Work Experience</Label>
              <Textarea
                id="experience"
                name="experience"
                placeholder="Describe your previous work experience"
                value={formData.experience}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <Textarea
                id="education"
                name="education"
                placeholder="Describe your educational background"
                value={formData.education}
                onChange={handleChange}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Profile..." : "Complete Profile"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
