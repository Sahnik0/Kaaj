"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Import translations with their correct export names
import { en } from "./translations/en"
import { bn } from "./translations/bn"
import { hi } from "./translations/hi"

// Define available languages
export type Language = "en" | "bn" | "hi"

// Translation dictionary type
type TranslationDict = Record<string, string>

// Translations object with all languages
const translations: Record<Language, TranslationDict> = {
  en,
  bn,
  hi,
}

// Language context type
type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

// Create context with default values to prevent undefined errors
const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key
})

// Provider component
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Get initial language from localStorage or default to English
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  // Set language and save to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang)
    }
  }

  // Translation function
  const t = (key: string): string => {
    // Safety check for server-side rendering or during initialization
    if (!translations[language]) {
      return key;
    }
    return translations[language][key] || key
  }

  // Load language from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && ["en", "bn", "hi"].includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    }
  }, [])

  // Context value
  const value = {
    language,
    setLanguage,
    t,
  }

  // Always provide the context, even if we're not mounted yet
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// Hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext)
  // We can remove this check since we now provide default values
  return context
}

// Export useTranslation as an alias for useLanguage for backward compatibility
export const useTranslation = useLanguage
