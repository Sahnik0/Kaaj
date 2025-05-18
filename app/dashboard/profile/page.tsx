"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { useLanguage } from "@/lib/i18n/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Star, MapPin, Phone, Mail, Calendar } from "lucide-react"

export default function Profile() {
  const { user, userProfile, updateUserProfile } = useFirebase()
  const { t } = useLanguage()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    location: "",
    phone: "",
    skills: [] as string[],
    experience: "",
    education: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || user?.displayName || "",
        bio: userProfile.bio || "",
        location: userProfile.location || "",
        phone: userProfile.phone || "",
        skills: userProfile.skills || [],
        experience: userProfile.experience || "",
        education: userProfile.education || "",
      })
    }
  }, [userProfile, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await updateUserProfile(formData)
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (!user || !userProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kaaj-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight doodle-heading">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and account settings.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-kaaj-50 text-kaaj-700">
          <TabsTrigger value="profile" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
            Account
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-kaaj-500 data-[state=active]:text-white">
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card className="border-kaaj-100 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-kaaj-500 to-blue-500 relative">
              <div className="absolute -bottom-16 left-6">
                <Avatar className="h-32 w-32 border-4 border-background">
                  <AvatarFallback className="bg-kaaj-100 text-kaaj-700 text-4xl">
                    {userProfile.displayName ? getInitials(userProfile.displayName) : <User className="h-16 w-16" />}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <CardContent className="pt-20 pb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{userProfile.displayName || user.displayName}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Badge variant="outline" className="capitalize">
                      {userProfile.role || "User"}
                    </Badge>
                    {userProfile.verified && <Badge className="badge-verified">Verified</Badge>}
                  </div>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-kaaj-500 hover:bg-kaaj-600 text-white doodle-button"
                >
                  Edit Profile
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2 doodle-heading">About</h3>
                    <p className="text-muted-foreground">{userProfile.bio || "No bio provided yet."}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2 doodle-heading">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{userProfile.phone || "No phone number provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{userProfile.location || "No location provided"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {userProfile.role === "candidate" && (
                    <div>
                      <h3 className="text-lg font-medium mb-2 doodle-heading">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.skills && userProfile.skills.length > 0 ? (
                          userProfile.skills.map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="bg-kaaj-100 text-kaaj-700">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No skills listed yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-medium mb-2 doodle-heading">
                      {userProfile.role === "candidate" ? "Experience" : "Business Information"}
                    </h3>
                    <p className="text-muted-foreground">
                      {userProfile.experience || "No experience information provided yet."}
                    </p>
                  </div>

                  {userProfile.role === "candidate" && (
                    <div>
                      <h3 className="text-lg font-medium mb-2 doodle-heading">Education</h3>
                      <p className="text-muted-foreground">
                        {userProfile.education || "No education information provided yet."}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-medium mb-2 doodle-heading">Member Since</h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {userProfile.createdAt
                          ? new Date(userProfile.createdAt.toDate()).toLocaleDateString()
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isEditing && (
            <Card className="border-kaaj-100">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      className="border-kaaj-200 focus-visible:ring-kaaj-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="min-h-32 border-kaaj-200 focus-visible:ring-kaaj-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="border-kaaj-200 focus-visible:ring-kaaj-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="border-kaaj-200 focus-visible:ring-kaaj-500"
                      />
                    </div>
                  </div>

                  {userProfile.role === "candidate" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="experience">Work Experience</Label>
                        <Textarea
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleChange}
                          className="border-kaaj-200 focus-visible:ring-kaaj-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="education">Education</Label>
                        <Textarea
                          id="education"
                          name="education"
                          value={formData.education}
                          onChange={handleChange}
                          className="border-kaaj-200 focus-visible:ring-kaaj-500"
                        />
                      </div>
                    </>
                  )}

                  {userProfile.role === "recruiter" && (
                    <div className="space-y-2">
                      <Label htmlFor="experience">Business Information</Label>
                      <Textarea
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        className="border-kaaj-200 focus-visible:ring-kaaj-500"
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="border-kaaj-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-kaaj-500 hover:bg-kaaj-600 text-white doodle-button"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          <Card className="border-kaaj-100">
            <CardHeader>
              <CardTitle>Ratings & Reviews</CardTitle>
              <CardDescription>See what others are saying about you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-kaaj-500">
                    {userProfile.averageRating ? userProfile.averageRating.toFixed(1) : "0.0"}
                  </div>
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (userProfile.averageRating || 0)
                            ? "fill-kaaj-500 text-kaaj-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {userProfile.totalRatings || 0} {userProfile.totalRatings === 1 ? "review" : "reviews"}
                  </div>
                </div>

                <div className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-kaaj-200 text-kaaj-700 hover:bg-kaaj-50"
                    onClick={() => router.push("/dashboard/ratings")}
                  >
                    View All Reviews
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6 space-y-6">
          <Card className="border-kaaj-100">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={user.email || ""} disabled className="bg-muted border-kaaj-200" />
                <p className="text-xs text-muted-foreground">Your email address is used for login and notifications.</p>
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Button
                  variant="outline"
                  className="w-full border-kaaj-200 text-kaaj-700 hover:bg-kaaj-50"
                  onClick={() => router.push("/auth/reset-password")}
                >
                  Change Password
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="flex items-center gap-2 p-2 border rounded-md border-kaaj-200">
                  <Badge variant="outline" className="capitalize">
                    {userProfile.role || "User"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {userProfile.role === "recruiter"
                      ? "You can post jobs and hire candidates"
                      : userProfile.role === "candidate"
                        ? "You can find jobs and apply to them"
                        : "Your account type is not set"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-kaaj-100">
            <CardHeader>
              <CardTitle>Delete Account</CardTitle>
              <CardDescription>Permanently delete your account and all associated data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="destructive">Delete Account</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6 space-y-6">
          <Card className="border-kaaj-100">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about new messages, job applications, and updates
                  </p>
                </div>
                <div className="flex items-center h-5">
                  <input
                    id="email-notifications"
                    aria-describedby="email-notifications-description"
                    name="email-notifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-kaaj-500 focus:ring-kaaj-500"
                    defaultChecked
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Job Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about new jobs that match your skills and preferences
                  </p>
                </div>
                <div className="flex items-center h-5">
                  <input
                    id="job-alerts"
                    aria-describedby="job-alerts-description"
                    name="job-alerts"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-kaaj-500 focus:ring-kaaj-500"
                    defaultChecked
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Marketing Communications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features, promotions, and events
                  </p>
                </div>
                <div className="flex items-center h-5">
                  <input
                    id="marketing"
                    aria-describedby="marketing-description"
                    name="marketing"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-kaaj-500 focus:ring-kaaj-500"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-kaaj-500 hover:bg-kaaj-600 text-white doodle-button">Save Preferences</Button>
            </CardFooter>
          </Card>

          <Card className="border-kaaj-100">
            <CardHeader>
              <CardTitle>Language Preferences</CardTitle>
              <CardDescription>Choose your preferred language</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    id="language-en"
                    name="language"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-kaaj-500 focus:ring-kaaj-500"
                    defaultChecked
                  />
                  <Label htmlFor="language-en">English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="language-bn"
                    name="language"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-kaaj-500 focus:ring-kaaj-500"
                  />
                  <Label htmlFor="language-bn">বাংলা (Bengali)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="language-hi"
                    name="language"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-kaaj-500 focus:ring-kaaj-500"
                  />
                  <Label htmlFor="language-hi">हिन्दी (Hindi)</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-kaaj-500 hover:bg-kaaj-600 text-white doodle-button">Save Language</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
