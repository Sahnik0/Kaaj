import type React from "react"
import type { Metadata } from "next"
import { Archivo_Black, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { FirebaseProvider } from "@/lib/firebase/firebase-provider"
import { LanguageProvider } from "@/lib/i18n/language-context"
import { ThemeProvider } from "@/components/theme-provider"
import { RetroToaster } from "@/components/retroui/Toaster"

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-head",
  display: "swap",
});
 
const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

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
      <body className={`${archivoBlack.variable} ${space.variable}`}>
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
