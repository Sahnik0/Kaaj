"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  MessageSquare,
  Bell,
  BookOpen,
  Star,
  AlertTriangle,
  User,
  Settings,
  PlusCircle,
  LogOut,
} from "lucide-react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { useTranslation } from "@/lib/i18n/language-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useFirebase()
  const [userRole, setUserRole] = useState<string | null>(null)
  const { t } = useTranslation()
  const { isMobile } = useSidebar()

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem("userRole")
    setUserRole(role)
  }, [])

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const menuItems = [
    {
      title: t("dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
      show: true,
    },
    {
      title: t("myJobs"),
      icon: Briefcase,
      href: "/dashboard/jobs",
      show: userRole === "recruiter",
    },
    {
      title: t("postJob"),
      icon: PlusCircle,
      href: "/dashboard/post-job",
      show: userRole === "recruiter",
    },
    {
      title: t("findJobs"),
      icon: Briefcase,
      href: "/dashboard/find-jobs",
      show: userRole === "candidate",
    },
    {
      title: t("applications"),
      icon: Briefcase,
      href: "/dashboard/applications",
      show: userRole === "candidate",
    },
    {
      title: t("candidates"),
      icon: Users,
      href: "/dashboard/candidates",
      show: userRole === "recruiter",
    },
    {
      title: t("messages"),
      icon: MessageSquare,
      href: "/dashboard/messages",
      show: true,
    },
    {
      title: t("notifications"),
      icon: Bell,
      href: "/dashboard/notifications",
      show: true,
    },
    {
      title: t("learningPath"),
      icon: BookOpen,
      href: "/dashboard/learning",
      show: true,
    },
    {
      title: t("ratingsReviews"),
      icon: Star,
      href: "/dashboard/ratings",
      show: true,
    },
    {
      title: t("reportIssue"),
      icon: AlertTriangle,
      href: "/dashboard/reports",
      show: true,
    },
    {
      title: t("admin"),
      icon: Settings,
      href: "/dashboard/admin",
      show: userRole === "admin",
    },
  ]

  const profileItems = [
    {
      title: t("profile"),
      icon: User,
      href: "/dashboard/profile",
    },
    {
      title: t("settings"),
      icon: Settings,
      href: "/dashboard/settings",
    },
  ]

  return (
    <Sidebar className="border-r-2 border-black">
      <SidebarHeader className="border-b-2 border-black p-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-xl">Kaaj</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems
            .filter((item) => item.show)
            .map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  className="border-2 border-transparent hover:border-black data-[active=true]:border-black data-[active=true]:bg-yellow-300"
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t-2 border-black">
        <SidebarMenu>
          {profileItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                className="border-2 border-transparent hover:border-black data-[active=true]:border-black data-[active=true]:bg-yellow-300"
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} className="border-2 border-transparent hover:border-black">
              <LogOut className="h-5 w-5" />
              <span>{t("signOut")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
