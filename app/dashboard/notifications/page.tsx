"use client"

import { useEffect, useState } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { type Notification, getNotifications } from "@/lib/firebase/notifications"
import { formatDistanceToNow } from "date-fns"
import { RetroBox } from "@/components/ui/retro-box"
import { Bell } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/language-context"

export default function NotificationsPage() {
  const { user } = useFirebase()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return

      try {
        setLoading(true)
        const fetchedNotifications = await getNotifications(user.uid)
        setNotifications(fetchedNotifications)
      } catch (err) {
        console.error("Error fetching notifications:", err)
        setError("Failed to load notifications. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user])

  if (!user) {
    return (
      <RetroBox className="max-w-4xl mx-auto my-8">
        <div className="text-center py-8">{t("pleaseSignIn")}</div>
      </RetroBox>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <RetroBox className="max-w-4xl mx-auto" title={t("notifications")} backLink="/dashboard">
        {loading ? (
          <div className="space-y-4 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-2 border-black p-4 rounded-md animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 flex flex-col items-center gap-4">
            <Bell className="h-12 w-12 text-gray-400" />
            <p>{t("noNotifications")}</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-2 border-black p-4 rounded-md ${notification.read ? "bg-white" : "bg-yellow-50"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                    </p>
                  </div>
                  {notification.link && (
                    <Link
                      href={notification.link}
                      className="px-3 py-1 bg-yellow-300 border-2 border-black rounded-md text-sm font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      {t("view")}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </RetroBox>
    </div>
  )
}
