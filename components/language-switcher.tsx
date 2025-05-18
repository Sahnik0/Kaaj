"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/i18n/language-context"

// Safe language hook that provides fallbacks
function useSafeLanguage() {
  try {
    // Try to import and use the language hook
    const languageContext = useLanguage()
    return languageContext
  } catch (error) {
    // Provide a fallback if the hook fails or context is not available
    return {
      language: "en",
      setLanguage: () => {},
      t: (key: string) => key,
    }
  }
}

export function LanguageSwitcher() {
  const [mounted, setMounted] = useState(false)

  // Use the safe language hook
  const { language, setLanguage } = useSafeLanguage()

  // Only show the switcher after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("en")} className={language === "en" ? "bg-muted" : ""}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("bn")} className={language === "bn" ? "bg-muted" : ""}>
          বাংলা
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("hi")} className={language === "hi" ? "bg-muted" : ""}>
          हिन्दी
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
