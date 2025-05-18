"use client"

import type React from "react"

import { useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AlertTriangle, CheckCircle } from "lucide-react"

export default function ReportIssue() {
  const { user } = useFirebase()
  const [reportData, setReportData] = useState({
    type: "",
    contentId: "",
    reason: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // This would be implemented in firebase-provider.tsx
      // For now, we'll just simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSubmitted(true)
    } catch (error) {
      console.error("Error submitting report:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report an Issue</h1>
          <p className="text-muted-foreground">Let us know about any problems you encounter.</p>
        </div>

        <Card className="border-kaaj-100">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">Report Submitted</h3>
            <p className="text-muted-foreground max-w-md">
              Thank you for your report. Our team will review it and take appropriate action. We appreciate your help in
              keeping our platform safe and respectful.
            </p>
            <Button
              className="mt-6 bg-kaaj-500 hover:bg-kaaj-600"
              onClick={() => {
                setSubmitted(false)
                setReportData({
                  type: "",
                  contentId: "",
                  reason: "",
                })
              }}
            >
              Submit Another Report
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report an Issue</h1>
        <p className="text-muted-foreground">Let us know about any problems you encounter.</p>
      </div>

      <Card className="border-kaaj-100">
        <CardHeader className="bg-kaaj-50 border-b border-kaaj-100">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <div>
              <CardTitle>Submit a Report</CardTitle>
              <CardDescription>
                Help us maintain a safe and respectful community by reporting inappropriate content or behavior.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">What are you reporting?</Label>
              <Select
                value={reportData.type}
                onValueChange={(value) => setReportData({ ...reportData, type: value })}
                required
              >
                <SelectTrigger id="type" className="border-kaaj-200 focus-visible:ring-kaaj-500">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job">Job Posting</SelectItem>
                  <SelectItem value="user">User Profile</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="other">Other Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportData.type && reportData.type !== "other" && (
              <div className="space-y-2">
                <Label htmlFor="contentId">
                  {reportData.type === "job"
                    ? "Job ID or Title"
                    : reportData.type === "user"
                      ? "User Name or Email"
                      : reportData.type === "message"
                        ? "Conversation or Message Details"
                        : "Review Details"}
                </Label>
                <Textarea
                  id="contentId"
                  placeholder={`Provide details to help us identify the ${reportData.type}`}
                  value={reportData.contentId}
                  onChange={(e) => setReportData({ ...reportData, contentId: e.target.value })}
                  className="border-kaaj-200 focus-visible:ring-kaaj-500"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Report</Label>
              <Textarea
                id="reason"
                placeholder="Please provide detailed information about the issue"
                value={reportData.reason}
                onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                className="min-h-32 border-kaaj-200 focus-visible:ring-kaaj-500"
                required
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Our Commitment</h4>
              <p className="text-sm text-blue-700">
                We take all reports seriously and will investigate thoroughly. Your identity will remain confidential
                during this process. Thank you for helping us maintain a safe and respectful community.
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 border-t border-kaaj-100 flex justify-end">
            <Button type="submit" className="bg-kaaj-500 hover:bg-kaaj-600" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
