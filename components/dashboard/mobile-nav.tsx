"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DashboardSidebar } from "./dashboard-sidebar"
import { useTranslation } from "@/lib/i18n/language-context"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useTranslation()

  // Get the current page title based on the pathname
  const getPageTitle = () => {
    if (pathname === "/dashboard") return t("dashboard")
    if (pathname === "/dashboard/jobs") return t("myJobs")
    if (pathname === "/dashboard/post-job") return t("postJob")
    if (pathname === "/dashboard/find-jobs") return t("findJobs")
    if (pathname === "/dashboard/applications") return t("applications")
    if (pathname === "/dashboard/candidates") return t("candidates")
    if (pathname === "/dashboard/messages") return t("messages")
    if (pathname === "/dashboard/notifications") return t("notifications")
    if (pathname === "/dashboard/learning") return t("learningPath")
    if (pathname === "/dashboard/ratings") return t("ratingsReviews")
    if (pathname === "/dashboard/reports") return t("reportIssue")
    if (pathname === "/dashboard/admin") return t("admin")
    if (pathname === "/dashboard/profile") return t("profile")
    if (pathname === "/dashboard/settings") return t("settings")
    return ""
  }

  return (
    <div className="md:hidden border-b-2 border-black bg-white">
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="font-bold text-xl">
          Kaaj
        </Link>

        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">{getPageTitle()}</h1>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r-2 border-black">
              <DashboardSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}
