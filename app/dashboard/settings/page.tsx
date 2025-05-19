"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { useRetroToast } from "@/hooks/use-retro-toast"
import { Moon, Sun, Bell, Globe, Shield, Eye } from "lucide-react"

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { userProfile, updateUserProfile } = useFirebase()
  const { toast } = useRetroToast()
  const [loading, setLoading] = useState(false)

  const [settings, setSettings] = useState({
    emailNotifications: userProfile?.settings?.emailNotifications ?? true,
    jobAlerts: userProfile?.settings?.jobAlerts ?? true,
    marketingEmails: userProfile?.settings?.marketingEmails ?? false,
    language: userProfile?.settings?.language ?? "en",
    theme: theme || "light",
    privacyProfile: userProfile?.settings?.privacyProfile ?? "public",
  })

  const handleToggleChange = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }))
  }

  const handleRadioChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    setSettings((prev) => ({
      ...prev,
      theme: newTheme,
    }))
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      await updateUserProfile({
        settings,
      })
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight doodle-heading">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-kaaj-100 doodle-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-kaaj-500" />
              Notification Settings
            </CardTitle>
            <CardDescription>Control how you receive notifications and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about new messages, job applications, and updates
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={() => handleToggleChange("emailNotifications")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="job-alerts">Job Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about new jobs that match your skills and preferences
                </p>
              </div>
              <Switch
                id="job-alerts"
                checked={settings.jobAlerts}
                onCheckedChange={() => handleToggleChange("jobAlerts")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-emails">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features, promotions, and events
                </p>
              </div>
              <Switch
                id="marketing-emails"
                checked={settings.marketingEmails}
                onCheckedChange={() => handleToggleChange("marketingEmails")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-kaaj-100 doodle-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-kaaj-500" />
              Language & Appearance
            </CardTitle>
            <CardDescription>Customize your language and theme preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Language</Label>
              <RadioGroup
                value={settings.language}
                onValueChange={(value) => handleRadioChange("language", value)}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="language-en" />
                  <Label htmlFor="language-en" className="font-normal">
                    English
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bn" id="language-bn" />
                  <Label htmlFor="language-bn" className="font-normal">
                    বাংলা (Bengali)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hi" id="language-hi" />
                  <Label htmlFor="language-hi" className="font-normal">
                    हिन्दी (Hindi)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label>Theme</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                    settings.theme === "light"
                      ? "border-kaaj-500 bg-kaaj-50 text-kaaj-700"
                      : "border-border hover:border-kaaj-200"
                  }`}
                  onClick={() => handleThemeChange("light")}
                >
                  <Sun className="h-8 w-8 mb-2" />
                  <span>Light</span>
                </div>
                <div
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                    settings.theme === "dark"
                      ? "border-kaaj-500 bg-kaaj-900/10 text-kaaj-400"
                      : "border-border hover:border-kaaj-200"
                  }`}
                  onClick={() => handleThemeChange("dark")}
                >
                  <Moon className="h-8 w-8 mb-2" />
                  <span>Dark</span>
                </div>
                <div
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                    settings.theme === "system"
                      ? "border-kaaj-500 bg-muted text-foreground"
                      : "border-border hover:border-kaaj-200"
                  }`}
                  onClick={() => handleThemeChange("system")}
                >
                  <div className="flex h-8 w-8 mb-2 items-center justify-center">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </div>
                  <span>System</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-kaaj-100 doodle-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-kaaj-500" />
              Privacy Settings
            </CardTitle>
            <CardDescription>Control who can see your profile and information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Label>Profile Visibility</Label>
              <RadioGroup
                value={settings.privacyProfile}
                onValueChange={(value) => handleRadioChange("privacyProfile", value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="privacy-public" />
                  <Label htmlFor="privacy-public" className="font-normal">
                    Public - Anyone can view your profile
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="limited" id="privacy-limited" />
                  <Label htmlFor="privacy-limited" className="font-normal">
                    Limited - Only registered users can view your profile
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="privacy-private" />
                  <Label htmlFor="privacy-private" className="font-normal">
                    Private - Only users you've interacted with can view your profile
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card className="border-kaaj-100 doodle-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-kaaj-500" />
              Accessibility
            </CardTitle>
            <CardDescription>Customize your accessibility preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reduce-motion">Reduce Motion</Label>
                <p className="text-sm text-muted-foreground">Minimize animations throughout the interface</p>
              </div>
              <Switch
                id="reduce-motion"
                checked={settings.reduceMotion}
                onCheckedChange={() => handleToggleChange("reduceMotion")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast">High Contrast</Label>
                <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
              </div>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={() => handleToggleChange("highContrast")}
              />
            </div>
          </CardContent>
        </Card>

        <CardFooter className="flex justify-end px-0">
          <Button onClick={saveSettings} disabled={loading} className="bg-kaaj-500 hover:bg-kaaj-600 doodle-button">
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </CardFooter>
      </div>
    </div>
  )
}
