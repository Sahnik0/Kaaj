"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LandingHeader } from "@/components/landing-header"
import { DoodleFooter } from "@/components/doodle-footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Briefcase, MessageSquare, Star, HomeIcon, Search, TrendingUp, Users, MapPin } from 'lucide-react'

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
    "stats.title": "Trusted by Thousands",
    "stats.users": "Active Users",
    "stats.jobs": "Jobs Posted",
    "stats.services": "Services Offered",
    "stats.communities": "Communities",
    "featured.title": "Featured Opportunities",
    "featured.viewAll": "View All",
    "featured.location": "Location",
    "featured.category": "Category",
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
    "stats.communities": "সম্প্রদায়",
    "featured.title": "বৈশিষ্ট্যযুক্ত সুযোগ",
    "featured.viewAll": "সব দেখুন",
    "featured.location": "অবস্থান",
    "featured.category": "বিভাগ",
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
    "stats.communities": "समुदाय",
    "featured.title": "विशेष अवसर",
    "featured.viewAll": "सभी देखें",
    "featured.location": "स्थान",
    "featured.category": "श्रेणी",
    explore: "खोजें",
  },
}

// Featured jobs/services data
const featuredItems = [
  {
    id: 1,
    title: "Home Cleaning Service",
    description: "Professional home cleaning services for all your needs",
    category: "Home Services",
    location: "New York, NY",
    image: "/placeholder.svg?height=100&width=100",
    price: "$25/hr",
    rating: 4.8,
  },
  {
    id: 2,
    title: "Web Developer Needed",
    description: "Looking for an experienced web developer for a 3-month project",
    category: "Professional",
    location: "Remote",
    image: "/placeholder.svg?height=100&width=100",
    price: "$45/hr",
    rating: 4.5,
  },
  {
    id: 3,
    title: "Math Tutor",
    description: "Experienced math tutor for high school and college students",
    category: "Education",
    location: "Chicago, IL",
    image: "/placeholder.svg?height=100&width=100",
    price: "$30/hr",
    rating: 4.9,
  },
]

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
        <section className="relative py-20 overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
          {/* Background elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-0 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-block px-3 py-1 mb-6 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">
                  Local Opportunities Marketplace
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="relative">
                    {t("hero.title")}
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-yellow-300/30 -z-10"></span>
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">{t("hero.description")}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-full px-8"
                    onClick={() => navigateTo("/auth/signup")}
                  >
                    {t("hero.getStarted")}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-8"
                    onClick={() => navigateTo("/dashboard/find-jobs")}
                  >
                    {t("hero.browseJobs")}
                  </Button>
                </div>
              </div>
              <div className="flex-1 relative">
                <div className="relative bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="absolute inset-0 bg-grid-gray-200/20 [mask-image:linear-gradient(0deg,white,transparent)]"></div>
                  <Image
                    src="/placeholder.svg?height=400&width=500"
                    width={500}
                    height={400}
                    alt="Local Jobs Platform"
                    className="w-full object-cover"
                  />
                </div>

                {/* Floating elements */}
                <div
                  className={`absolute -top-6 -left-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 ${mounted ? "animate-float" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Top Rated</div>
                      <div className="text-xs text-muted-foreground">Local Services</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 ${mounted ? "animate-float-delayed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">5,000+</div>
                      <div className="text-xs text-muted-foreground">Jobs Posted</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white dark:bg-gray-900 border-y border-border/40">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">{t("stats.title")}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-2">10K+</div>
                <div className="text-sm text-muted-foreground">{t("stats.users")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-2">5K+</div>
                <div className="text-sm text-muted-foreground">{t("stats.jobs")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-2">8K+</div>
                <div className="text-sm text-muted-foreground">{t("stats.services")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-2">200+</div>
                <div className="text-sm text-muted-foreground">{t("stats.communities")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-block px-3 py-1 mb-4 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">
                Simple Process
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("howItWorks.title")}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("howItWorks.description")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500"></div>

              {/* Step 1 */}
              <div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                onClick={() => navigateTo("/auth/signup")}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold text-xl shadow-lg">
                  1
                </div>
                <div className="pt-6 text-center">
                  <h3 className="text-xl font-semibold mb-4">{t("step1.title")}</h3>
                  <p className="text-muted-foreground">{t("step1.description")}</p>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                onClick={() => navigateTo("/dashboard/find-jobs")}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold text-xl shadow-lg">
                  2
                </div>
                <div className="pt-6 text-center">
                  <h3 className="text-xl font-semibold mb-4">{t("step2.title")}</h3>
                  <p className="text-muted-foreground">{t("step2.description")}</p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                onClick={() => navigateTo("/dashboard/messages")}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold text-xl shadow-lg">
                  3
                </div>
                <div className="pt-6 text-center">
                  <h3 className="text-xl font-semibold mb-4">{t("step3.title")}</h3>
                  <p className="text-muted-foreground">{t("step3.description")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div>
                <div className="inline-block px-3 py-1 mb-4 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">
                  Discover
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">{t("featured.title")}</h2>
              </div>
              <Button variant="ghost" className="text-yellow-500" onClick={() => navigateTo("/featured")}>
                {t("featured.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  onClick={() => navigateTo(`/item/${item.id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      width={400}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-full px-3 py-1 text-sm font-medium">
                      {item.price}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{item.category}</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{item.rating}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{item.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-block px-3 py-1 mb-4 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">
                Browse
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("categories.title")}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("categories.description")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category 1 */}
              <div
                className={`group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                  activeCategory === 0 ? "scale-105" : ""
                }`}
                onMouseEnter={() => handleCategoryHover(0)}
                onMouseLeave={handleCategoryLeave}
                onClick={() => navigateTo("/categories/home-services")}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="h-40 bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                  <HomeIcon className="h-16 w-16 text-yellow-500" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{t("category.homeServices")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t("category.homeServices.description")}</p>
                  <div className="text-yellow-500 text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                    {t("explore")} <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>

              {/* Category 2 */}
              <div
                className={`group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                  activeCategory === 1 ? "scale-105" : ""
                }`}
                onMouseEnter={() => handleCategoryHover(1)}
                onMouseLeave={handleCategoryLeave}
                onClick={() => navigateTo("/categories/professional")}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="h-40 bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Briefcase className="h-16 w-16 text-blue-500" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{t("category.professional")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t("category.professional.description")}</p>
                  <div className="text-yellow-500 text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                    {t("explore")} <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>

              {/* Category 3 */}
              <div
                className={`group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                  activeCategory === 2 ? "scale-105" : ""
                }`}
                onMouseEnter={() => handleCategoryHover(2)}
                onMouseLeave={handleCategoryLeave}
                onClick={() => navigateTo("/categories/creative")}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="h-40 bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Star className="h-16 w-16 text-purple-500" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{t("category.creative")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t("category.creative.description")}</p>
                  <div className="text-yellow-500 text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                    {t("explore")} <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>

              {/* Category 4 */}
              <div
                className={`group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                  activeCategory === 3 ? "scale-105" : ""
                }`}
                onMouseEnter={() => handleCategoryHover(3)}
                onMouseLeave={handleCategoryLeave}
                onClick={() => navigateTo("/categories/education")}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="h-40 bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <MessageSquare className="h-16 w-16 text-green-500" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{t("category.education")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t("category.education.description")}</p>
                  <div className="text-yellow-500 text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                    {t("explore")} <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" className="rounded-full px-8" onClick={() => navigateTo("/categories")}>
                {t("categories.viewAll")}
              </Button>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-20 relative overflow-hidden bg-gray-50 dark:bg-gray-900/50">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 right-0 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">{t("cta.title")}</h2>
                <p className="text-muted-foreground">{t("cta.description")}</p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search for jobs or services..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <Button
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                  onClick={() => navigateTo("/search")}
                >
                  Search
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-full px-8"
                  onClick={() => navigateTo("/auth/signup")}
                >
                  {t("cta.signUp")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8"
                  onClick={() => navigateTo("/how-it-works")}
                >
                  {t("cta.learnMore")}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <DoodleFooter />
    </div>
  )
}
