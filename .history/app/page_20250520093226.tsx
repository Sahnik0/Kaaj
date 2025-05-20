"use client"

import { useState, useEffect } from "react"
import { LandingHeader } from "@/components/landing-header"
import { DoodleFooter } from "@/components/doodle-footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Briefcase, MessageSquare, Star, HomeIcon, CheckCircle2, Users, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

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
    "stats.title": "Trusted by thousands",
    "stats.users": "Active Users",
    "stats.jobs": "Jobs Posted",
    "stats.services": "Services Offered",
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
    "stats.title": "হাজার হাজার দ্বারা বিশ্বস্ত",
    "stats.users": "সক্রিয় ব্যবহারকারী",
    "stats.jobs": "পোস্ট করা চাকরি",
    "stats.services": "অফার করা পরিষেবা",
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
    "stats.title": "हजारों द्वारा विश्वसनीय",
    "stats.users": "सक्रिय उपयोगकर्ता",
    "stats.jobs": "पोस्ट की गई नौकरियां",
    "stats.services": "प्रदान की गई सेवाएं",
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
          {/* Background elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_40%)]"></div>
            <div className="absolute top-1/2 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_60%,rgba(120,119,198,0.1),transparent_30%)]"></div>
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-purple-100/30 to-cyan-100/30 dark:from-purple-900/10 dark:to-cyan-900/10 blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-yellow-100/30 to-pink-100/30 dark:from-yellow-900/10 dark:to-pink-900/10 blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-block mb-3 px-4 py-1 bg-primary/10 text-primary rounded-full font-medium text-sm">
                  Local Marketplace
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
                  {t("hero.title")}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                  {t("hero.description")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
                    onClick={() => navigateTo("/auth/signup")}
                  >
                    {t("hero.getStarted")}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border-2 hover:bg-primary/5 transition-colors"
                    onClick={() => navigateTo("/dashboard/find-jobs")}
                  >
                    {t("hero.browseJobs")}
                  </Button>
                </div>

                {/* Stats */}
                <div className="mt-12 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary">10K+</div>
                    <div className="text-sm text-muted-foreground">{t("stats.users")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary">5K+</div>
                    <div className="text-sm text-muted-foreground">{t("stats.jobs")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary">8K+</div>
                    <div className="text-sm text-muted-foreground">{t("stats.services")}</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 mix-blend-overlay"></div>
                  <Image
                    src="/placeholder.svg?height=600&width=600"
                    alt="Local Jobs"
                    width={600}
                    height={600}
                    className="w-full object-cover"
                  />
                </div>

                {/* Floating elements */}
                <div
                  className={`absolute -top-6 -left-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 ${mounted ? "animate-[float_4s_ease-in-out_infinite]" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Job Completed</div>
                      <div className="text-xs text-muted-foreground">Home Cleaning</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 ${mounted ? "animate-[float_3s_ease-in-out_infinite_0.5s]" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Star className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">New Review</div>
                      <div className="text-xs text-muted-foreground">5.0 ★★★★★</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block mb-3 px-4 py-1 bg-primary/10 text-primary rounded-full font-medium text-sm">
                Simple Process
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("howItWorks.title")}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("howItWorks.description")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connection lines */}
              <div className="hidden md:block absolute top-1/3 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-primary/50 to-primary/50 z-0"></div>
              <div className="hidden md:block absolute top-1/3 left-2/3 w-1/3 h-0.5 bg-gradient-to-r from-primary/50 to-primary/50 z-0"></div>

              {/* Step 1 */}
              <div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl p-8 h-full transition-all duration-300 hover:-translate-y-1 z-10"
                onClick={() => navigateTo("/auth/signup")}
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t("step1.title")}</h3>
                <p className="text-muted-foreground">{t("step1.description")}</p>
                <div className="absolute top-8 right-8 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                  1
                </div>
              </div>

              {/* Step 2 */}
              <div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl p-8 h-full transition-all duration-300 hover:-translate-y-1 z-10"
                onClick={() => navigateTo("/dashboard/find-jobs")}
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Briefcase className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t("step2.title")}</h3>
                <p className="text-muted-foreground">{t("step2.description")}</p>
                <div className="absolute top-8 right-8 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                  2
                </div>
              </div>

              {/* Step 3 */}
              <div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl p-8 h-full transition-all duration-300 hover:-translate-y-1 z-10"
                onClick={() => navigateTo("/dashboard/messages")}
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t("step3.title")}</h3>
                <p className="text-muted-foreground">{t("step3.description")}</p>
                <div className="absolute top-8 right-8 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                  3
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories section */}
        <section className="py-20 px-4 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block mb-3 px-4 py-1 bg-primary/10 text-primary rounded-full font-medium text-sm">
                Discover
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("categories.title")}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("categories.description")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category 1 */}
              <div
                className={`group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${
                  activeCategory === 0 ? "scale-[1.02]" : ""
                }`}
                onMouseEnter={() => handleCategoryHover(0)}
                onMouseLeave={handleCategoryLeave}
                onClick={() => navigateTo("/categories/home-services")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-purple-600/80 opacity-0 group-hover:opacity-90 transition-opacity duration-300 z-10"></div>
                <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
                  <Image
                    src="/placeholder.svg?height=200&width=400"
                    alt="Home Services"
                    width={400}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 relative z-20">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <HomeIcon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-white transition-colors">
                      {t("category.homeServices")}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 group-hover:text-white/90 transition-colors">
                    {t("category.homeServices.description")}
                  </p>
                  <div className="text-primary text-sm font-medium flex items-center group-hover:text-white transition-colors">
                    {t("explore")}{" "}
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>

              {/* Category 2 */}
              <div
                className={`group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${
                  activeCategory === 1 ? "scale-[1.02]" : ""
                }`}
                onMouseEnter={() => handleCategoryHover(1)}
                onMouseLeave={handleCategoryLeave}
                onClick={() => navigateTo("/categories/professional")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-purple-600/80 opacity-0 group-hover:opacity-90 transition-opacity duration-300 z-10"></div>
                <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
                  <Image
                    src="/placeholder.svg?height=200&width=400"
                    alt="Professional Services"
                    width={400}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 relative z-20">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Briefcase className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-white transition-colors">
                      {t("category.professional")}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 group-hover:text-white/90 transition-colors">
                    {t("category.professional.description")}
                  </p>
                  <div className="text-primary text-sm font-medium flex items-center group-hover:text-white transition-colors">
                    {t("explore")}{" "}
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>

              {/* Category 3 */}
              <div
                className={`group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${
                  activeCategory === 2 ? "scale-[1.02]" : ""
                }`}
                onMouseEnter={() => handleCategoryHover(2)}
                onMouseLeave={handleCategoryLeave}
                onClick={() => navigateTo("/categories/creative")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-purple-600/80 opacity-0 group-hover:opacity-90 transition-opacity duration-300 z-10"></div>
                <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
                  <Image
                    src="/placeholder.svg?height=200&width=400"
                    alt="Creative Services"
                    width={400}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 relative z-20">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Star className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-white transition-colors">
                      {t("category.creative")}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 group-hover:text-white/90 transition-colors">
                    {t("category.creative.description")}
                  </p>
                  <div className="text-primary text-sm font-medium flex items-center group-hover:text-white transition-colors">
                    {t("explore")}{" "}
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>

              {/* Category 4 */}
              <div
                className={`group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${
                  activeCategory === 3 ? "scale-[1.02]" : ""
                }`}
                onMouseEnter={() => handleCategoryHover(3)}
                onMouseLeave={handleCategoryLeave}
                onClick={() => navigateTo("/categories/education")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-purple-600/80 opacity-0 group-hover:opacity-90 transition-opacity duration-300 z-10"></div>
                <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
                  <Image
                    src="/placeholder.svg?height=200&width=400"
                    alt="Education Services"
                    width={400}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 relative z-20">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <MessageSquare className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-white transition-colors">
                      {t("category.education")}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 group-hover:text-white/90 transition-colors">
                    {t("category.education.description")}
                  </p>
                  <div className="text-primary text-sm font-medium flex items-center group-hover:text-white transition-colors">
                    {t("explore")}{" "}
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button
                variant="outline"
                className="rounded-full px-6 hover:bg-primary/5 transition-colors"
                onClick={() => navigateTo("/categories")}
              >
                {t("categories.viewAll")}
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 blur-3xl"></div>
          </div>

          <div className="container mx-auto relative z-10">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500"></div>
              <div className="p-8 md:p-12">
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("cta.title")}</h2>
                  <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">{t("cta.description")}</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
                      onClick={() => navigateTo("/auth/signup")}
                    >
                      {t("cta.signUp")}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full hover:bg-primary/5 transition-colors"
                      onClick={() => navigateTo("/how-it-works")}
                    >
                      {t("cta.learnMore")}
                    </Button>
                  </div>
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
