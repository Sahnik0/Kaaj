"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, Moon, Sun } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTheme } from "next-themes"
import { RetroBox } from "@/components/ui/retro-box"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { useLanguage } from "@/lib/i18n/language-context"

// Safe language hook that provides fallbacks
function useSafeLanguage() {
  let languageData
  try {
    // Try to use the language hook directly
    languageData = useLanguage()
  } catch (error) {
    // Provide a fallback if the hook fails or context is not available
    languageData = {
      language: "en",
      setLanguage: () => {},
      t: (key: string) => {
        // Simple fallback translation mapping for essential UI elements
        const fallbackTranslations: Record<string, string> = {
          "nav.about": "About",
          "nav.howItWorks": "How It Works",
          "nav.categories": "Categories",
          "nav.dashboard": "Dashboard",
          "nav.signIn": "Sign In",
          "nav.signUp": "Sign Up",
        }
        return fallbackTranslations[key] || key
      },
    }
  }

  return languageData
}

export function LandingHeader() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeLink, setActiveLink] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const { t } = useSafeLanguage()

  // Safely access Firebase user
  let user = null
  try {
    const firebase = useFirebase()
    user = firebase.user
  } catch (error) {
    console.error("Firebase context not available")
  }

  // Don't show header on auth pages
  if (pathname?.startsWith("/auth/")) {
    return null
  }

  // Update login state when component mounts
  useEffect(() => {
    setMounted(true)
    setIsLoggedIn(!!user)
  }, [user])

  const handleLinkHover = (link: string) => {
    setActiveLink(link)
  }

  const handleLinkLeave = () => {
    setActiveLink(null)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Handle hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <header className="sticky top-0 z-30 w-full border-b-2 border-black dark:border-white bg-background">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Kaaj</span>
          </Link>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4"></div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b-2 border-black dark:border-white bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary doodle-underline">Kaaj</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/about"
            className={`text-sm font-medium hover:text-primary transition-colors ${
              activeLink === "about" ? "text-primary" : ""
            }`}
            onMouseEnter={() => handleLinkHover("about")}
            onMouseLeave={handleLinkLeave}
          >
            {t("nav.about")}
          </Link>
          <Link
            href="/how-it-works"
            className={`text-sm font-medium hover:text-primary transition-colors ${
              activeLink === "how" ? "text-primary" : ""
            }`}
            onMouseEnter={() => handleLinkHover("how")}
            onMouseLeave={handleLinkLeave}
          >
            {t("nav.howItWorks")}
          </Link>
          <Link
            href="/categories"
            className={`text-sm font-medium hover:text-primary transition-colors ${
              activeLink === "categories" ? "text-primary" : ""
            }`}
            onMouseEnter={() => handleLinkHover("categories")}
            onMouseLeave={handleLinkLeave}
          >
            {t("nav.categories")}
          </Link>
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="border-2 border-black dark:border-white rounded-none hover:bg-primary/20"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button className="retro-button">{t("nav.dashboard")}</Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:text-primary border-2 border-black dark:border-white hover:bg-primary/10"
                >
                  {t("nav.signIn")}
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="retro-button">
                  {t("nav.signUp")}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="border-2 border-black dark:border-white rounded-none hover:bg-primary/20"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px] border-l-2 border-black dark:border-white p-0">
            <RetroBox className="h-full rounded-none border-0 shadow-none">
              <div className="flex flex-col gap-6 py-6">
                <Link href="/" className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary doodle-underline">Kaaj</span>
                </Link>
                <nav className="flex flex-col gap-4">
                  <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
                    {t("nav.about")}
                  </Link>
                  <Link href="/how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                    {t("nav.howItWorks")}
                  </Link>
                  <Link href="/categories" className="text-sm font-medium hover:text-primary transition-colors">
                    {t("nav.categories")}
                  </Link>
                  <div className="flex items-center gap-2 mt-2">
                    <LanguageSwitcher />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="border-2 border-black dark:border-white rounded-none hover:bg-primary/20"
                    >
                      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </div>
                </nav>
                <div className="flex flex-col gap-2 mt-auto">
                  {isLoggedIn ? (
                    <Link href="/dashboard">
                      <Button className="w-full retro-button">{t("nav.dashboard")}</Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/auth/signin">
                        <Button
                          variant="outline"
                          className="w-full border-2 border-black dark:border-white hover:bg-primary/10"
                        >
                          {t("nav.signIn")}
                        </Button>
                      </Link>
                      <Link href="/auth/signup">
                        <Button className="w-full retro-button">{t("nav.signUp")}</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </RetroBox>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
