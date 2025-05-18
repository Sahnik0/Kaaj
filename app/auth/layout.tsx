import type React from "react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="hidden md:flex bg-muted items-center justify-center p-8">
        <div className="max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <span className="text-2xl font-bold">Kaaj</span>
          </Link>
          <h1 className="text-3xl font-bold mb-4">Find Local Jobs and Services</h1>
          <p className="text-muted-foreground">
            Connect with local recruiters and candidates for jobs in tailoring, teaching, cleaning, and more.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">{children}</div>
    </div>
  )
}
