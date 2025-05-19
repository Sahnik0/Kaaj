"use client"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { type Notification, getNotifications } from "@/lib/firebase/notifications"
import { formatDistanceToNow } from "date-fns"
import { Bell, X, Search, Filter, Loader2, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/language-context"
import { PageContainer, PageHeader } from "@/components/dashboard/page-container"

export default function NotificationsPage() {
  const { user } = useFirebase()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("all") // "all", "read", "unread"
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const { t } = useTranslation()

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return

      try {
        setLoading(true)
        const fetchedNotifications = await getNotifications(user.uid)
        setNotifications(fetchedNotifications)
        setFilteredNotifications(fetchedNotifications)
      } catch (err) {
        console.error("Error fetching notifications:", err)
        setError("Failed to load notifications. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user])

  // Filter notifications based on search query and filter status
  useEffect(() => {
    let filtered = [...notifications]
    
    // Apply status filter
    if (filterStatus === "read") {
      filtered = filtered.filter(notification => notification.read)
    } else if (filterStatus === "unread") {
      filtered = filtered.filter(notification => !notification.read)
    }
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(notification => 
        notification.message.toLowerCase().includes(query)
      )
    }
    
    setFilteredNotifications(filtered)
  }, [notifications, searchQuery, filterStatus])

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto my-8 bg-white border-kaaj-100 border rounded-lg p-6 shadow-sm">
        <div className="text-center py-8 text-kaaj-700">{t("pleaseSignIn")}</div>
      </div>
    )
  }
  
  return (
    <PageContainer>
      <PageHeader
        title={t("notifications")}
        description={t("notificationsDescription") || "Stay updated with important alerts and messages"}
      />
      
      <Card className="border-kaaj-100 shadow-sm">
        <CardHeader className="border-b border-kaaj-100 bg-gradient-to-br from-kaaj-50 to-kaaj-100/60">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg text-kaaj-800">{t("notifications")}</CardTitle>
              <CardDescription className="text-kaaj-600">
                {t("notificationsDescription") || "Stay updated with important alerts and messages"}
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                className={filterStatus === "all" ? "bg-kaaj-500 hover:bg-kaaj-600" : "border-kaaj-200"}
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button 
                variant={filterStatus === "unread" ? "default" : "outline"}
                size="sm"
                className={filterStatus === "unread" ? "bg-kaaj-500 hover:bg-kaaj-600" : "border-kaaj-200"}
                onClick={() => setFilterStatus("unread")}
              >
                Unread
              </Button>
              <Button 
                variant={filterStatus === "read" ? "default" : "outline"}
                size="sm"
                className={filterStatus === "read" ? "bg-kaaj-500 hover:bg-kaaj-600" : "border-kaaj-200"}
                onClick={() => setFilterStatus("read")}
              >
                Read
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <div className="p-4 border-b border-kaaj-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-kaaj-400" />
            <Input
              placeholder="Search notifications..."
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
        </div>
        
        <CardContent className="p-4">
          {loading ? (
            <div className="flex flex-col space-y-4 w-full items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-kaaj-500" />
              <p className="text-kaaj-600">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="my-8 p-4 border border-red-200 bg-red-50 text-red-800 rounded-md flex items-center">
              <X className="h-5 w-5 mr-4 text-red-500" />
              <div>{error}</div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 flex flex-col items-center gap-4">
              {searchQuery || filterStatus !== "all" ? (
                <>
                  <Search className="h-12 w-12 text-kaaj-300 mb-2" />
                  <p className="text-kaaj-700 font-medium">No matching notifications found</p>
                  <p className="text-xs text-kaaj-500 mt-1 max-w-md">
                    Try adjusting your search or filter settings to find what you're looking for.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStatus("all");
                    }}
                    className="mt-4 border-kaaj-200 text-kaaj-600 hover:bg-kaaj-50"
                  >
                    <X className="h-4 w-4 mr-2" /> Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <Bell className="h-12 w-12 text-kaaj-300 mb-2" />
                  <p className="text-kaaj-700 font-medium">{t("noNotifications")}</p>
                  <p className="text-xs text-kaaj-500 mt-1">
                    When you receive notifications, they will appear here.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "border border-kaaj-100 p-4 rounded-lg transition-all hover:shadow-md",
                    notification.read ? "bg-white" : "bg-kaaj-50/80"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Badge className="bg-kaaj-500 text-white h-2 w-2 p-0 rounded-full" />
                        )}
                        <p className="font-medium text-kaaj-800">{notification.message}</p>
                      </div>
                      <div className="flex items-center text-xs text-kaaj-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                      </div>
                    </div>
                    {notification.link && (
                      <Link
                        href={notification.link}
                        className="ml-4 px-3 py-1 bg-kaaj-100 border border-kaaj-200 rounded-md text-sm font-medium text-kaaj-700 hover:bg-kaaj-200 transition-all"
                      >
                        {t("view")}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
