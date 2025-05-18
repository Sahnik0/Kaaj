"use client"

import { useState } from "react"
import Link from "next/link"
import { LanguageSwitcher } from "./language-switcher"
import { RetroBox } from "@/components/ui/retro-box"
import { Facebook, Twitter, Instagram } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"

// Create a safe version of useLanguage that provides fallbacks
function useSafeLanguage() {
  try {
    // Try to use the language hook
    const languageContext = useLanguage()
    return languageContext
  } catch (error) {
    // Provide fallback translation function and values if context is not available
    return {
      language: "en",
      setLanguage: () => {},
      t: (key: string) => {
        // Simple fallback translations for essential UI elements
        const fallbackTranslations: Record<string, string> = {
          "app.name": "Kaaj",
          "app.description": "Find local jobs and services in your area",
          "footer.about": "About",
          "footer.help": "Help",
          "footer.terms": "Terms",
          "footer.privacy": "Privacy",
          "footer.copyright": "© 2023 Kaaj. All rights reserved.",
          "nav.about": "About Us",
          "nav.howItWorks": "How It Works",
          "nav.categories": "Categories",
          "footer.contact": "Contact Us",
        }
        return fallbackTranslations[key] || key
      },
    }
  }
}

export function DoodleFooter() {
  const { t } = useSafeLanguage()
  const router = useRouter()
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)

  const handleSectionHover = (section: string) => {
    setHoveredSection(section)
  }

  const handleSectionLeave = () => {
    setHoveredSection(null)
  }

  const navigateTo = (path: string) => {
    router.push(path)
  }

  return (
    <footer className="bg-background border-t mt-10 relative">
      {/* Doodle elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full border-2 border-dashed border-primary/20 rotate-12 opacity-50"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 rounded-full border-2 border-dotted border-primary/30 -rotate-12 opacity-50"></div>
        <div className="absolute top-1/3 left-1/4 w-12 h-12 border-2 border-primary/20 transform rotate-45 opacity-30"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <RetroBox
            className={`h-full transition-all duration-300 ${hoveredSection === "main" ? "scale-105" : ""}`}
            hoverEffect="lift"
            onMouseEnter={() => handleSectionHover("main")}
            onMouseLeave={handleSectionLeave}
          >
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-primary doodle-underline">{t("app.name")}</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">{t("app.description")}</p>
            <div className="flex space-x-4">
              <button
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.open("https://facebook.com", "_blank")}
              >
                <Facebook className="h-5 w-5" />
              </button>
              <button
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.open("https://twitter.com", "_blank")}
              >
                <Twitter className="h-5 w-5" />
              </button>
              <button
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.open("https://instagram.com", "_blank")}
              >
                <Instagram className="h-5 w-5" />
              </button>
            </div>
          </RetroBox>

          <RetroBox
            className={`h-full transition-all duration-300 ${hoveredSection === "about" ? "scale-105" : ""}`}
            hoverEffect="lift"
            onMouseEnter={() => handleSectionHover("about")}
            onMouseLeave={handleSectionLeave}
          >
            <h3 className="text-lg font-medium mb-4 doodle-underline inline-block">{t("footer.about")}</h3>
            <ul className="space-y-2">
              <li>
                <button
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => navigateTo("/about")}
                >
                  {t("nav.about")}
                </button>
              </li>
              <li>
                <button
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => navigateTo("/how-it-works")}
                >
                  {t("nav.howItWorks")}
                </button>
              </li>
              <li>
                <button
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => navigateTo("/categories")}
                >
                  {t("nav.categories")}
                </button>
              </li>
            </ul>
          </RetroBox>

          <RetroBox
            className={`h-full transition-all duration-300 ${hoveredSection === "help" ? "scale-105" : ""}`}
            hoverEffect="lift"
            onMouseEnter={() => handleSectionHover("help")}
            onMouseLeave={handleSectionLeave}
          >
            <h3 className="text-lg font-medium mb-4 doodle-underline inline-block">{t("footer.help")}</h3>
            <ul className="space-y-2">
              <li>
                <button
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => navigateTo("/help")}
                >
                  {t("footer.help")}
                </button>
              </li>
              <li>
                <button
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => navigateTo("/contact")}
                >
                  {t("footer.contact")}
                </button>
              </li>
              <li>
                <button
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => navigateTo("/faq")}
                >
                  FAQ
                </button>
              </li>
            </ul>
          </RetroBox>

          <RetroBox
            className={`h-full transition-all duration-300 ${hoveredSection === "terms" ? "scale-105" : ""}`}
            hoverEffect="lift"
            onMouseEnter={() => handleSectionHover("terms")}
            onMouseLeave={handleSectionLeave}
          >
            <h3 className="text-lg font-medium mb-4 doodle-underline inline-block">{t("footer.terms")}</h3>
            <ul className="space-y-2">
              <li>
                <button
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => navigateTo("/terms")}
                >
                  {t("footer.terms")}
                </button>
              </li>
              <li>
                <button
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => navigateTo("/privacy")}
                >
                  {t("footer.privacy")}
                </button>
              </li>
              <li>
                <button
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => navigateTo("/cookies")}
                >
                  Cookies
                </button>
              </li>
            </ul>
          </RetroBox>
        </div>

        <RetroBox className="mt-12 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">{t("footer.copyright")}</p>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </RetroBox>
      </div>
    </footer>
  )
}
