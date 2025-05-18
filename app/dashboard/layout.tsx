"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/language-context"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebase()
  const router = useRouter()
  const { t } = useTranslation()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (!loading && !user) {
      router.push("/auth/signin")
    }
  }, [user, loading, router])

  if (!isMounted || loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[url('/grid-pattern.svg')] bg-repeat">
        <DashboardSidebar />
        <div className="flex-1">
          <MobileNav />
          <main className="container mx-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
