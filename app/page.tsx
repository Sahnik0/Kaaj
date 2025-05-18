"use client"

import { useState, useEffect } from "react"
import { LandingHeader } from "@/components/landing-header"
import { DoodleFooter } from "@/components/doodle-footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Briefcase, MessageSquare, Star } from "lucide-react"
import { HomeIcon } from "lucide-react"
import { useRouter } from "next/navigation"

// Simple translations for essential UI elements
const translations = {
  en: {
    "hero.title": "Find Local Jobs and Services",
    "hero.description": "Connect with local opportunities and skilled professionals in your neighborhood",
    "hero.getStarted": "Get Started",
    "hero.browseJobs": "Browse Jobs",
    "howItWorks.title": "How It Works",
    "howItWorks.description": "Our platform makes it easy to connect with local opportunities",
    "step1.title": "Create Your Profile",
    "step1.description": "Sign up and create your profile as a job seeker or service provider",
    "step2.title": "Find Opportunities",
    "step2.description": "Browse local jobs or post your services for others to discover",
    "step3.title": "Connect & Earn",
    "step3.description": "Message, collaborate, and build your local reputation",
    "categories.title": "Popular Categories",
    "categories.description": "Explore jobs and services across various categories",
    "categories.viewAll": "View All Categories",
    "category.homeServices": "Home Services",
    "category.homeServices.description": "Cleaning, repairs, gardening, and other household services",
    "category.professional": "Professional",
    "category.professional.description": "Accounting, legal, consulting, and business services",
    "category.creative": "Creative",
    "category.creative.description": "Design, writing, photography, and artistic services",
    "category.education": "Education",
    "category.education.description": "Tutoring, coaching, training, and educational services",
    "cta.title": "Ready to Get Started?",
    "cta.description": "Join thousands of people finding local jobs and services in their community.",
    "cta.signUp": "Sign Up Now",
    "cta.learnMore": "Learn More",
    explore: "Explore",
  },
  bn: {
    "hero.title": "স্থানীয় চাকরি এবং পরিষেবা খুঁজুন",
    "hero.description": "আপনার আশেপাশের সুযোগ এবং দক্ষ পেশাদারদের সাথে সংযোগ করুন",
    "hero.getStarted": "শুরু করুন",
    "hero.browseJobs": "চাকরি দেখুন",
    "howItWorks.title": "কিভাবে কাজ করে",
    "howItWorks.description": "আমাদের প্ল্যাটফর্ম স্থানীয় সুযোগের সাথে সংযোগ করা সহজ করে",
    "step1.title": "আপনার প্রোফাইল তৈরি করুন",
    "step1.description": "চাকরি প্রার্থী বা সেবা প্রদানকারী হিসাবে সাইন আপ করুন এবং আপনার প্রোফাইল তৈরি করুন",
    "step2.title": "সুযোগ খুঁজুন",
    "step2.description": "স্থানীয় চাকরি ব্রাউজ করুন বা অন্যরা আবিষ্কার করার জন্য আপনার পরিষেবাগুলি পোস্ট করুন",
    "step3.title": "সংযোগ করুন এবং উপার্জন করুন",
    "step3.description": "বার্তা পাঠান, সহযোগিতা করুন এবং আপনার স্থানীয় খ্যাতি তৈরি করুন",
    "categories.title": "জনপ্রিয় বিভাগ",
    "categories.description": "বিভিন্ন বিভাগে চাকরি এবং পরিষেবা অন্বেষণ করুন",
    "categories.viewAll": "সমস্ত বিভাগ দেখুন",
    "category.homeServices": "গৃহ পরিষেবা",
    "category.homeServices.description": "পরিষ্কার, মেরামত, বাগান, এবং অন্যান্য গৃহস্থালী পরিষেবা",
    "category.professional": "পেশাদার",
    "category.professional.description": "অ্যাকাউন্টিং, আইনি, পরামর্শ, এবং ব্যবসায়িক পরিষেবা",
    "category.creative": "সৃজনশীল",
    "category.creative.description": "ডিজাইন, লেখা, ফটোগ্রাফি, এবং শিল্প পরিষেবা",
    "category.education": "শিক্ষা",
    "category.education.description": "টিউটরিং, কোচিং, প্রশিক্ষণ, এবং শিক্ষামূলক পরিষেবা",
    "cta.title": "শুরু করতে প্রস্তুত?",
    "cta.description": "হাজার হাজার মানুষের সাথে যোগ দিন যারা তাদের সম্প্রদায়ে স্থানীয় চাকরি এবং পরিষেবা খুঁজে পাচ্ছে।",
    "cta.signUp": "এখনই সাইন আপ করুন",
    "cta.learnMore": "আরও জানুন",
    explore: "অন্বেষণ করুন",
  },
  hi: {
    "hero.title": "स्थानीय नौकरियां और सेवाएं खोजें",
    "hero.description": "अपने आस-पास के अवसरों और कुशल पेशेवरों से जुड़ें",
    "hero.getStarted": "शुरू करें",
    "hero.browseJobs": "नौकरियां ब्राउज़ करें",
    "howItWorks.title": "यह कैसे काम करता है",
    "howItWorks.description": "हमारा प्लेटफॉर्म स्थानीय अवसरों से जुड़ना आसान बनाता है",
    "step1.title": "अपना प्रोफ़ाइल बनाएं",
    "step1.description": "नौकरी खोजने वाले या सेवा प्रदाता के रूप में साइन अप करें और अपना प्रोफ़ाइल बनाएं",
    "step2.title": "अवसर खोजें",
    "step2.description": "स्थानीय नौकरियां ब्राउज़ करें या दूसरों के लिए अपनी सेवाएं पोस्ट करें",
    "step3.title": "जुड़ें और कमाएं",
    "step3.description": "संदेश भेजें, सहयोग करें, और अपनी स्थानीय प्रतिष्ठा बनाएं",
    "categories.title": "लोकप्रिय श्रेणियाँ",
    "categories.description": "विभिन्न श्रेणियों में नौकरियां और सेवाएं खोजें",
    "categories.viewAll": "सभी श्रेणियां देखें",
    "category.homeServices": "घरेलू सेवाएं",
    "category.homeServices.description": "सफाई, मरम्मत, बागवानी, और अन्य घरेलू सेवाएं",
    "category.professional": "पेशेवर",
    "category.professional.description": "लेखा, कानूनी, परामर्श, और व्यापारिक सेवाएं",
    "category.creative": "रचनात्मक",
    "category.creative.description": "डिज़ाइन, लेखन, फोटोग्राफी, और कलात्मक सेवाएं",
    "category.education": "शिक्षा",
    "category.education.description": "ट्यूटरिंग, कोचिंग, प्रशिक्षण, और शैक्षिक सेवाएं",
    "cta.title": "शुरू करने के लिए तैयार हैं?",
    "cta.description": "हजारों लोगों के साथ जुड़ें जो अपने समुदाय में स्थानीय नौकरियां और सेवाएं खोज रहे हैं।",
    "cta.signUp": "अभी साइन अप करें",
    "cta.learnMore": "अधिक जानें",
    explore: "खोजें",
  },
}

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [language, setLanguage] = useState("en")

  // Simple translation function
  const t = (key: string) => {
    return translations[language as keyof typeof translations]?.[key as keyof (typeof translations)["en"]] || key
  }

  // Handle hydration mismatch by only rendering animations after mount
  useEffect(() => {
    setMounted(true)
    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage && ["en", "bn", "hi"].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  const navigateTo = (path: string) => {
    router.push(path)
  }

  const handleCategoryHover = (index: number) => {
    setActiveCategory(index)
  }

  const handleCategoryLeave = () => {
    setActiveCategory(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
          {/* Doodle elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-24 h-24 rounded-full border-2 border-dashed border-primary/20 rotate-12"></div>
            <div className="absolute bottom-40 right-10 w-16 h-16 rounded-full border-2 border-dotted border-primary/30 -rotate-12"></div>
            <div className="absolute top-1/3 left-1/4 w-12 h-12 border-2 border-primary/20 transform rotate-45"></div>
          </div>

          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="doodle-underline inline-block">{t("hero.title")}</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">{t("hero.description")}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="lg" className="retro-button" onClick={() => navigateTo("/auth/signup")}>
                    {t("hero.getStarted")}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-black dark:border-white hover:bg-primary/20 transition-colors"
                    onClick={() => navigateTo("/dashboard/find-jobs")}
                  >
                    {t("hero.browseJobs")}
                  </Button>
                </div>
              </div>
              <div className="flex-1 relative">
                <div
                  className={`relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 max-w-md mx-auto ${
                    mounted ? "animate-[float_3s_ease-in-out_infinite]" : ""
                  }`}
                >
                  <img src="/placeholder.svg?height=400&width=500" alt="Local Jobs" className="w-full rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 doodle-underline inline-block">{t("howItWorks.title")}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("howItWorks.description")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div
                className={`relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 h-full transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.8)]`}
                onClick={() => navigateTo("/auth/signup")}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{t("step1.title")}</h3>
                <p className="text-muted-foreground">{t("step1.description")}</p>
              </div>

              {/* Step 2 */}
              <div
                className={`relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 h-full transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.8)]`}
                onClick={() => navigateTo("/dashboard/find-jobs")}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{t("step2.title")}</h3>
                <p className="text-muted-foreground">{t("step2.description")}</p>
              </div>

              {/* Step 3 */}
              <div
                className={`relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 h-full transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.8)]`}
                onClick={() => navigateTo("/dashboard/messages")}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{t("step3.title")}</h3>
                <p className="text-muted-foreground">{t("step3.description")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 doodle-underline inline-block">{t("categories.title")}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("categories.description")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category 1 */}
              <div
                className={`relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 h-full transition-all duration-300 ${
                  activeCategory === 0 ? "scale-105" : ""
                }`}
                onMouseEnter={() => handleCategoryHover(0)}
                onMouseLeave={handleCategoryLeave}
                onClick={() => navigateTo("/categories/home-services")}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <HomeIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{t("category.homeServices")}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t("category.homeServices.description")}</p>
                <div className="text-primary text-sm font-medium flex items-center">
                  {t("explore")} <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>

              {/* Category 2 */}
              <div
                className={`relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 h-full transition-all duration-300 ${
                  activeCategory === 1 ? "scale-105" : ""
                }`}
                onMouseEnter={() => handleCategoryHover(1)}
                onMouseLeave={handleCategoryLeave}
                onClick={() => navigateTo("/categories/professional")}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{t("category.professional")}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t("category.professional.description")}</p>
                <div className="text-primary text-sm font-medium flex items-center">
                  {t("explore")} <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>

              {/* Category 3 */}
              <div
                className={`relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 h-full transition-all duration-300 ${
                  activeCategory === 2 ? "scale-105" : ""
                }`}
                onMouseEnter={() => handleCategoryHover(2)}
                onMouseLeave={handleCategoryLeave}
                onClick={() => navigateTo("/categories/creative")}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{t("category.creative")}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t("category.creative.description")}</p>
                <div className="text-primary text-sm font-medium flex items-center">
                  {t("explore")} <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>

              {/* Category 4 */}
              <div
                className={`relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 h-full transition-all duration-300 ${
                  activeCategory === 3 ? "scale-105" : ""
                }`}
                onMouseEnter={() => handleCategoryHover(3)}
                onMouseLeave={handleCategoryLeave}
                onClick={() => navigateTo("/categories/education")}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{t("category.education")}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t("category.education.description")}</p>
                <div className="text-primary text-sm font-medium flex items-center">
                  {t("explore")} <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button
                variant="outline"
                className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                onClick={() => navigateTo("/categories")}
              >
                {t("categories.viewAll")}
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-primary text-black relative overflow-hidden">
          {/* Doodle elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 right-10 w-20 h-20 rounded-full border-2 border-dashed border-black/20 rotate-12"></div>
            <div className="absolute bottom-20 left-10 w-16 h-16 rounded-full border-2 border-dotted border-black/30 -rotate-12"></div>
            <div className="absolute top-1/2 right-1/4 w-12 h-12 border-2 border-black/20 transform rotate-45"></div>
          </div>

          <div className="container mx-auto relative z-10">
            <div className="relative bg-white dark:bg-gray-800 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-8 max-w-3xl mx-auto">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("cta.title")}</h2>
                <p className="text-xl text-muted-foreground mb-8">{t("cta.description")}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-black border-2 border-black"
                    onClick={() => navigateTo("/auth/signup")}
                  >
                    {t("cta.signUp")}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-black dark:border-white hover:bg-primary/20"
                    onClick={() => navigateTo("/how-it-works")}
                  >
                    {t("cta.learnMore")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <DoodleFooter />
    </div>
  )
}
