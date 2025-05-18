import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { FirebaseProvider } from "@/lib/firebase/firebase-provider"
import { LanguageProvider } from "@/lib/i18n/language-context"
import { ThemeProvider } from "@/components/theme-provider"
import { RetroToaster } from "@/components/retroui/Toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kaaj - Hyperlocal Job Marketplace",
  description: "Find local jobs and services in your area",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>            
            <FirebaseProvider>
              {children}
              <RetroToaster />
            </FirebaseProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
