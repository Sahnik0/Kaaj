"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/lib/firebase/firebase-provider"

export default function AdminRedirect() {
  const { isAdmin, loading } = useFirebase()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (isAdmin) {
        router.push("/dashboard/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [isAdmin, loading, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-kaaj-500 border-t-transparent"></div>
    </div>
  )
}
