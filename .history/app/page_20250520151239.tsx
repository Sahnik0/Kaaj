"use client"

import { useState, useEffect, useRef } from "react"
import { LandingHeader } from "@/components/landing-header"
import { DoodleFooter } from "@/components/doodle-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Briefcase, MessageSquare, Star, ChevronLeft, ChevronRight, Quote, HomeIcon, Sparkles, Users, Clock, Search, MapPin, CheckCircle, Zap, Award, Heart, TrendingUp, Palette, GraduationCap, ArrowUpRight } from 'lucide-react'
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useMobile } from "@/hooks/use-mobile"
import { motion } from "framer-motion"

// Simple translations for essential UI elements
const translations = {
  en: {
    "hero.title": "Find Local Jobs and Services",
    "hero.subtitle": "Connect with your community",
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
    "explore": "Explore",
    "stats.title": "Trusted by thousands",
    "stats.users": "Active Users",
    "stats.jobs": "Jobs Posted",
    "stats.services": "Services Offered",
    "stats.communities": "Communities",
    "featured.title": "Featured Opportunities",
    "featured.description": "Discover the latest jobs and services in your area",
    "featured.viewAll": "View All Opportunities",
    "testimonials.title": "What Our Users Say",
    "testimonials.description": "Hear from people who have found success on our platform",
    "search.placeholder": "Search jobs, services, or skills...",
    "search.location": "Location",
    "search.button": "Search",
    "trending.title": "Trending Now",
    "trending.viewAll": "View All",
    "app.download": "Download Our App",
    "app.description": "Take your job search on the go with our mobile app",
    "app.ios": "Download on iOS",
    "app.android": "Get it on Android",
  },
  bn: {
    "hero.title": "স্থানীয় চাকরি এবং পরিষেবা খুঁজুন",
    "hero.subtitle": "আপনার সম্প্রদায়ের সাথে সংযোগ করুন",
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
    "explore": "অন্বেষণ করুন",
    "stats.title": "হাজার হাজার দ্বারা বিশ্বস্ত",
    "stats.users": "সক্রিয় ব্যবহারকারী",
    "stats.jobs": "পোস্ট করা চাকরি",
    "stats.services": "প্রদত্ত পরিষেবা",
    "stats.communities": "সম্প্রদায়",
    "featured.title": "বৈশিষ্ট্যযুক্ত সুযোগ",
    "featured.description": "আপনার এলাকায় সর্বশেষ চাকরি এবং পরিষেবা আবিষ্কার করুন",
    "featured.viewAll": "সমস্ত সুযোগ দেখুন",
    "testimonials.title": "আমাদের ব্যবহারকারীরা কী বলেন",
    "testimonials.description": "আমাদের প্ল্যাটফর্মে সাফল্য পেয়েছেন এমন মানুষদের কাছ থেকে শুনুন",
    "search.placeholder": "চাকরি, পরিষেবা, বা দক্ষতা অনুসন্ধান করুন...",
    "search.location": "অবস্থান",
    "search.button": "অনুসন্ধান",
    "trending.title": "এখন ট্রেন্ডিং",
    "trending.viewAll": "সব দেখুন",
    "app.download": "আমাদের অ্যাপ ডাউনলোড করুন",
    "app.description": "আমাদের মোবাইল অ্যাপের সাথে আপনার চাকরির সন্ধান চালিয়ে যান",
    "app.ios": "iOS এ ডাউনলোড করুন",
    "app.android": "Android এ পান",
  },
  hi: {
    "hero.title": "स्थानीय नौकरियां और सेवाएं खोजें",
    "hero.subtitle": "अपने समुदाय से जुड़ें",
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
    "explore": "खोजें",
    "stats.title": "हजारों द्वारा विश्वसनीय",
    "stats.users": "सक्रिय उपयोगकर्ता",
    "stats.jobs": "पोस्ट की गई नौकरियां",
    "stats.services": "प्रदान की गई सेवाएं",
    "stats.communities": "समुदाय",
    "featured.title": "विशेष अवसर",
    "featured.description": "अपने क्षेत्र में नवीनतम नौकरियां और सेवाएं खोजें",
    "featured.viewAll": "सभी अवसर देखें",
    "testimonials.title": "हमारे उपयोगकर्ता क्या कहते हैं",
    "testimonials.description": "उन लोगों से सुनें जिन्होंने हमारे प्लेटफॉर्म पर सफलता पाई है",
    "search.placeholder": "नौकरियां, सेवाएं, या कौशल खोजें...",
    "search.location": "स्थान",
    "search.button": "खोजें",
    "trending.title": "अभी ट्रेंडिंग",
    "trending.viewAll": "सभी देखें",
    "app.download": "हमारा ऐप डाउनलोड करें",
    "app.description": "हमारे मोबाइल ऐप के साथ अपनी नौकरी की खोज को जारी रखें",
    "app.ios": "iOS पर डाउनलोड करें",
    "app.android": "Android पर प्राप्त करें",
  },
}

// Testimonial data
const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Freelance Designer",
    avatar: "/placeholder.svg?height=80&width=80",
    content:
      "This platform completely changed how I find local clients. The interface is intuitive and I've been able to grow my business significantly in just a few months.",
    rating: 5,
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Home Service Provider",
    avatar: "/placeholder.svg?height=80&width=80",
    content:
      "As a plumber, finding consistent work used to be challenging. Now I have a steady stream of local jobs and my customer base has expanded tremendously.",
    rating: 5,
  },
  {
    id: 3,
    name: "Priya Sharma",
    role: "Tutor",
    avatar: "/placeholder.svg?height=80&width=80",
    content:
      "The platform made it easy to connect with students in my neighborhood. The verification process gives clients confidence, and the payment system is seamless.",
    rating: 4,
  },
  {
    id: 4,
    name: "David Wilson",
    role: "Small Business Owner",
    avatar: "/placeholder.svg?height=80&width=80",
    content:
      "I've hired multiple professionals through this platform for various projects. The quality of service has been consistently excellent, saving me time and money.",
    rating: 5,
  },
  {
    id: 5,
    name: "Emma Rodriguez",
    role: "Freelance Writer",
    avatar: "/placeholder.svg?height=80&width=80",
    content:
      "The platform's interface is so user-friendly! I've been able to find interesting writing projects in my community that I wouldn't have discovered otherwise.",
    rating: 5,
  },
]

// Featured jobs data
const featuredJobs = [
  {
    id: 1,
    title: "Web Developer",
    type: "Full-time",
    description: "Looking for an experienced web developer to join our growing team. Remote work available.",
    salary: "$40-60/hr",
    company: "TechSolutions Inc.",
    location: "San Francisco, CA",
    postedDays: 2,
    logo: "/placeholder.svg?height=60&width=60",
    skills: ["React", "Node.js", "TypeScript"],
  },
  {
    id: 2,
    title: "House Cleaning Service",
    type: "Part-time",
    description: "Professional house cleaning service available for weekly or bi-weekly appointments.",
    salary: "$25-35/hr",
    company: "CleanHome Services",
    location: "Chicago, IL",
    postedDays: 1,
    logo: "/placeholder.svg?height=60&width=60",
    skills: ["Cleaning", "Organization", "Attention to Detail"],
  },
  {
    id: 3,
    title: "Math Tutor",
    type: "Contract",
    description: "Experienced math tutor available for high school and college students. In-person or online.",
    salary: "$30-45/hr",
    company: "EduMentor",
    location: "Boston, MA",
    postedDays: 3,
    logo: "/placeholder.svg?height=60&width=60",
    skills: ["Calculus", "Algebra", "Statistics"],
  },
  {
    id: 4,
    title: "Graphic Designer",
    type: "Freelance",
    description: "Creative graphic designer needed for branding project. Experience with logo design required.",
    salary: "$50-70/hr",
    company: "BrandWorks",
    location: "Remote",
    postedDays: 4,
    logo: "/placeholder.svg?height=60&width=60",
    skills: ["Adobe Creative Suite", "Branding", "Typography"],
  },
  {
    id: 5,
    title: "Personal Trainer",
    type: "Part-time",
    description: "Certified personal trainer for one-on-one fitness coaching. Flexible schedule.",
    salary: "$40-55/hr",
    company: "FitLife Gym",
    location: "Austin, TX",
    postedDays: 2,
    logo: "/placeholder.svg?height=60&width=60",
    skills: ["Fitness", "Nutrition", "Motivation"],
  },
  {
    id: 6,
    title: "Content Writer",
    type: "Contract",
    description: "Experienced content writer for tech blog. Knowledge of SaaS industry preferred.",
    salary: "$35-50/hr",
    company: "ContentHub",
    location: "Remote",
    postedDays: 5,
    logo: "/placeholder.svg?height=60&width=60",
    skills: ["SEO", "Copywriting", "Research"],
  },
]

// Trending searches
const trendingSearches = [
  "Remote work",
  "Part-time",
  "Web development",
  "Graphic design",
  "Home cleaning",
  "Tutoring",
  "Freelance writing",
  "Dog walking",
]

// Categories with icons
const categories = [
  {
    id: 1,
    name: "Home Services",
    description: "Cleaning, repairs, gardening, and other household services",
    icon: HomeIcon,
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
  },
  {
    id: 2,
    name: "Professional",
    description: "Accounting, legal, consulting, and business services",
    icon: Briefcase,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  {
    id: 3,
    name: "Creative",
    description: "Design, writing, photography, and artistic services",
    icon: Palette,
    color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    borderColor: "border-pink-200 dark:border-pink-800",
  },
  {
    id: 4,
    name: "Education",
    description: "Tutoring, coaching, training, and educational services",
    icon: GraduationCap,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  {
    id: 5,
    name: "Technology",
    description: "Software development, IT support, and tech services",
    icon: Zap,
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
    borderColor: "border-cyan-200 dark:border-cyan-800",
  },
  {
    id: 6,
    name: "Health & Wellness",
    description: "Fitness, nutrition, therapy, and wellness services",
    icon: Heart,
    color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800",
  },
]

// Stats data
const stats = [
  { id: 1, value: "10,000+", label: "stats.users", icon: Users },
  { id: 2, value: "5,000+", label: "stats.jobs", icon: Briefcase },
  { id: 3, value: "8,000+", label: "stats.services", icon: Zap },
  { id: 4, value: "500+", label: "stats.communities", icon: HomeIcon },
]

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
}

export default function Home() {
  const router = useRouter()
  const isMobile = useMobile()
  const [mounted, setMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [language, setLanguage] = useState("en")
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("")
  const [visibleJobs, setVisibleJobs] = useState(3)
  const testimonialsRef = useRef<HTMLDivElement>(null)

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

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/search?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`)
  }

  const showMoreJobs = () => {
    setVisibleJobs(featuredJobs.length)
  }

  // Auto-scroll testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      nextTestimonial()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 py-16 md:py-24 lg:py-32">
          {/* Animated background elements */}
          {mounted && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-20 left-10 w-24 h-24 rounded-full border-2 border-dashed border-primary/20 rotate-12 animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute bottom-40 right-10 w-16 h-16 rounded-full border-2 border-dotted border-primary/30 -rotate-12 animate-[spin_15s_linear_infinite_reverse]"></div>
              <div className="absolute top-1/3 left-1/4 w-12 h-12 border-2 border-primary/20 transform rotate-45 animate-[bounce_6s_ease-in-out_infinite]"></div>
              <div className="absolute top-1/4 right-1/3 w-20 h-20 rounded-full bg-primary/5 animate-[pulse_4s_ease-in-out_infinite]"></div>
              <div className="absolute bottom-1/4 left-1/3 w-32 h-32 rounded-full bg-secondary/5 animate-[pulse_7s_ease-in-out_infinite]"></div>
            </div>
          )}

          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="flex flex-col lg:flex-row items-center gap-12"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div 
                className="flex-1 text-center lg:text-left max-w-2xl mx-auto lg:mx-0"
                variants={fadeIn}
              >
                <Badge className="mb-4 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 rounded-full">
                  <Sparkles className="w-4 h-4 mr-1" /> {t("hero.subtitle")}
                </Badge>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
                  <span className="relative inline-block">
                    {t("hero.title")}
                    <span className="absolute -top-6 right-0 text-5xl transform rotate-12 opacity-70">🔍</span>
                    <span className="absolute bottom-0 w-full h-1 bg-primary"></span>
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8 max-w-xl">{t("hero.description")}</p>
                
                {/* Search form */}
                <motion.div 
                  className="mb-8 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800"
                  variants={fadeIn}
                >
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          type="text"
                          placeholder={t("search.placeholder")}
                          className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="md:w-1/3 relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          type="text"
                          placeholder={t("search.location")}
                          className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
                        {t("search.button")}
                      </Button>
                    </div>
                    
                    {/* Trending searches */}
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="text-muted-foreground">{t("trending.title")}:</span>
                      {trendingSearches.slice(0, isMobile ? 3 : 5).map((term, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSearchQuery(term)}
                          className="text-primary hover:underline"
                        >
                          {term}
                        </button>
                      ))}
                      {!isMobile && (
                        <button
                          type="button"
                          onClick={() => navigateTo("/trending")}
                          className="text-primary font-medium hover:underline flex items-center"
                        >
                          {t("trending.viewAll")} <ArrowRight className="ml-1 h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </form>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                  variants={fadeIn}
                >
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white group relative overflow-hidden"
                    onClick={() => navigateTo("/auth/signup")}
                  >
                    <span className="relative z-10 flex items-center">
                      {t("hero.getStarted")}
                      <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    onClick={() => navigateTo("/dashboard/find-jobs")}
                  >
                    <span className="relative z-10 flex items-center">
                      {t("hero.browseJobs")}
                      <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </motion.div>

                {/* Trust indicators */}
                <motion.div 
                  className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-6"
                  variants={fadeIn}
                >
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium"
                        >
                          <Image 
                            src={`/placeholder.svg?height=32&width=32`} 
                            alt={`User ${i}`} 
                            width={32} 
                            height={32} 
                            className="rounded-full"
                          />
                        </div>
                      ))}
                    </div>
                    <span className="ml-3 text-sm text-muted-foreground">
                      <span className="font-medium">10,000+</span> active users
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-muted-foreground">
                      <span className="font-medium">4.9/5</span> rating
                    </span>
                  </div>
                </motion.div>

                {/* Language selector */}
                <motion.div 
                  className="mt-6 flex items-center justify-center lg:justify-start gap-2"
                  variants={fadeIn}
                >
                  <button
                    onClick={() => {
                      setLanguage("en")
                      localStorage.setItem("language", "en")
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      language === "en"
                        ? "bg-primary text-white"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      setLanguage("bn")
                      localStorage.setItem("language", "bn")
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      language === "bn"
                        ? "bg-primary text-white"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    onClick={() => {
                      setLanguage("hi")
                      localStorage.setItem("language", "hi")
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      language === "hi"
                        ? "bg-primary text-white"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    हिन्दी
                  </button>
                </motion.div>
              </motion.div>

              <motion.div 
                className="flex-1 relative"
                variants={fadeIn}
              >
                <div className="absolute -top-10 -left-10 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>

                <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden max-w-md mx-auto">
                  <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    NEW
                  </div>
                  
                  <div className="p-1">
                    <Image 
                      src="/placeholder.svg?height=400&width=600" 
                      alt="Local Jobs Platform" 
                      width={600} 
                      height={400}
                      className="w-full rounded-xl object-cover"
                    />
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Popular Near You</h3>
                      <Badge variant="outline" className="font-normal">
                        <MapPin className="h-3 w-3 mr-1" /> 2 miles
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div 
                          key={item} 
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Image 
                              src={`/placeholder.svg?height=40&width=40`} 
                              alt="Service provider" 
                              width={40} 
                              height={40}
                              className="rounded-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item === 1 ? "House Cleaning Service" : item === 2 ? "Web Developer" : "Math Tutor"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item === 1 ? "CleanHome Services" : item === 2 ? "TechSolutions Inc." : "EduMentor"}
                            </p>
                          </div>
                          <Badge className={`${
                            item === 1 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : 
                            item === 2 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : 
                            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          } text-xs`}>
                            {item === 1 ? "Service" : item === 2 ? "Full-time" : "Part-time"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 border-gray-200 dark:border-gray-700 text-primary"
                      onClick={() => navigateTo("/dashboard/find-jobs")}
                    >
                      View All Nearby
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold">{t("stats.title")}</h2>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {stats.map((stat) => (
                <motion.div 
                  key={stat.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm border border-gray-200 dark:border-gray-700"
                  variants={itemVariant}
                >
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground">{t(stat.label)}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works section */}
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-2 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 rounded-full">
                Simple Process
              </Badge>
              <h2 className="text-3xl font-bold mb-4">{t("howItWorks.title")}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("howItWorks.description")}</p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {/* Step 1 */}
              <motion.div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                variants={itemVariant}
                onClick={() => navigateTo("/auth/signup")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{t("step1.title")}</h3>
                <p className="text-muted-foreground">{t("step1.description")}</p>
                <div className="absolute top-6 right-6">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                variants={itemVariant}
                onClick={() => navigateTo("/dashboard/find-jobs")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{t("step2.title")}</h3>
                <p className="text-muted-foreground">{t("step2.description")}</p>
                <div className="absolute top-6 right-6">
                  <Search className="h-6 w-6 text-primary" />
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                variants={itemVariant}
                onClick={() => navigateTo("/dashboard/messages")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{t("step3.title")}</h3>
                <p className="text-muted-foreground">{t("step3.description")}</p>
                <div className="absolute top-6 right-6">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Categories section */}
        <section className="py-16 md:py-24 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-2 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 rounded-full">
                Explore Options
              </Badge>
              <h2 className="text-3xl font-bold mb-4">{t("categories.title")}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("categories.description")}</p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-md border ${category.borderColor} p-6 h-full transition-all duration-300 hover:shadow-lg cursor-pointer ${
                    activeCategory === index ? "scale-105" : ""
                  }`}
                  variants={itemVariant}
                  onMouseEnter={() => handleCategoryHover(index)}
                  onMouseLeave={handleCategoryLeave}
                  onClick={() => navigateTo(`/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`h-12 w-12 rounded-full ${category.color} flex items-center justify-center`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                    </div>
                  </div>
                  <div className="text-primary text-sm font-medium flex items-center mt-4">
                    {t("explore")} <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button
                variant="outline"
                className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => navigateTo("/categories")}
              >
                {t("categories.viewAll")}
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Featured Jobs Section */}
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-2 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 rounded-full">
                Latest Opportunities
              </Badge>
              <h2 className="text-3xl font-bold mb-4">{t("featured.title")}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("featured.description")}
              </p>
            </motion.div>

            <Tabs defaultValue="all" className="mb-8">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="gigs">Gigs</TabsTrigger>
              </TabsList>
            </Tabs>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {featuredJobs.slice(0, visibleJobs).map((job) => (
                <motion.div 
                  key={job.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  variants={itemVariant}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={`px-3 py-1 ${
                      job.type === "Full-time" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      job.type === "Part-time" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      job.type === "Contract" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {job.type}
                    </Badge>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" /> Posted {job.postedDays} days ago
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      <Image 
                        src={job.logo || "/placeholder.svg"} 
                        alt={job.company} 
                        width={40} 
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {job.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-50 dark:bg-gray-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-muted-foreground">{job.location}</span>
                    </div>
                    <div className="text-sm font-medium">{job.salary}</div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <Button variant="outline" size="sm" className="text-primary border-primary/20 hover:bg-primary/5">
                      Save
                    </Button>
                    <Button size="sm">
                      Apply Now
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {visibleJobs < featuredJobs.length && (
              <motion.div 
                className="text-center mt-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button
                  variant="outline"
                  className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={showMoreJobs}
                >
                  Show More
                </Button>
              </motion.div>
            )}

            <motion.div 
              className="text-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => navigateTo("/dashboard/find-jobs")}
              >
                {t("featured.viewAll")}
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Mobile App Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900 overflow-hidden">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <motion.div 
                className="flex-1 text-center lg:text-left"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Badge className="mb-2 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 rounded-full">
                  Mobile Experience
                </Badge>
                <h2 className="text-3xl font-bold mb-4">{t("app.download")}</h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                  {t("app.description")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.5,1.5h-11c-2.761,0-5,2.239-5,5v11c0,2.761,2.239,5,5,5h11c2.761,0,5-2.239,5-5v-11C22.5,3.739,20.261,1.5,17.5,1.5z M12,17.5c-3.038,0-5.5-2.462-5.5-5.5s2.462-5.5,5.5-5.5s5.5,2.462,5.5,5.5S15.038,17.5,12,17.5z M18.5,6.5c-0.552,0-1-0.448-1-1s0.448-1,1-1s1,0.448,1,1S19.052,6.5,18.5,6.5z" />
                    <span>{t("app.ios")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.9,2.4c-0.1,0.3-0.1,0.6-0.1,0.9v13.4c0,0.3,0,0.6,0.1,0.9l0.1,0.1l7.5-7.5v-0.1L17.9,2.4L17.9,2.4z M23.8,12.3l-2.5-2.5l-2.5-2.5l-0.1,0.1l-0.1,0.1l2.5,2.5l2.5,2.5L23.8,12.3z M10.4,8.1L10.4,8.1l5,2.8l0.1-0.1l7.5-7.5l0,0L10.4,8.1z M15.5,13.1l-5,2.8c0.3,0.3,0.6,0.5,1,0.5l12.7,4.8l0,0L15.5,13.1z" />
                    </svg>
                    <span>{t("app.android")}</span>
                  </Button>
                </div>
                
                <div className="mt-8 flex items-center justify-center lg:justify-start gap-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    <span className="font-medium">4.8/5</span> on App Store
                  </span>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex-1 relative"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="relative h-[500px] w-[250px] mx-auto">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[40px] blur-xl"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-white dark:bg-gray-800 rounded-[40px] border-8 border-gray-800 dark:border-gray-700 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 dark:bg-gray-700 flex justify-center items-center">
                      <div className="w-16 h-1 bg-gray-600 dark:bg-gray-500 rounded-full"></div>
                    </div>
                    <div className="pt-6 h-full">
                      <Image 
                        src="/placeholder.svg?height=800&width=400" 
                        alt="Mobile App" 
                        width={400} 
                        height={800}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 px-4 bg-white dark:bg-gray-800 relative overflow-hidden">
          {/* Decorative elements */}
          {mounted && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-20 left-10 w-24 h-24 rounded-full border-2 border-dashed border-primary/20 rotate-12 animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute bottom-40 right-10 w-16 h-16 rounded-full border-2 border-dotted border-primary/30 -rotate-12 animate-[spin_15s_linear_infinite_reverse]"></div>
            </div>
          )}

          <div className="container mx-auto relative z-10">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-2 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 rounded-full">
                Success Stories
              </Badge>
              <h2 className="text-3xl font-bold mb-4">{t("testimonials.title")}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("testimonials.description")}
              </p>
            </motion.div>

            <motion.div 
              className="relative max-w-4xl mx-auto"
              ref={testimonialsRef}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {/* Testimonial slider */}
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                >
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                      <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                        <CardContent className="p-6 md:p-8 relative">
                          <div className="absolute -top-5 -left-5 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <Quote className="h-5 w-5 text-white" />
                          </div>
                          <div className="mb-6">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-5 h-5 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-lg mb-6 italic">{testimonial.content}</p>
                          <div className="flex items-center">
                            <Image
                              src={testimonial.avatar || "/placeholder.svg"}
                              alt={testimonial.name}
                              width={48}
                              height={48}
                              className="rounded-full border-2 border-primary mr-4"
                            />
                            <div>
                              <h4 className="font-bold">{testimonial.name}</h4>
                              <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation buttons */}
              <button
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Dots indicator */}
              <div className="flex justify-center mt-8 gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentTestimonial === index ? "bg-primary w-6" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-4 bg-primary/10 relative overflow-hidden">
          {/* Doodle elements */}
          {mounted && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-10 right-10 w-20 h-20 rounded-full border-2 border-dashed border-primary/20 rotate-12 animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute bottom-20 left-10 w-16 h-16 rounded-full border-2 border-dotted border-primary/30 -rotate-12 animate-[spin_15s_linear_infinite_reverse]"></div>
              <div className="absolute top-1/2 right-1/4 w-12 h-12 border-2 border-primary/20 transform rotate-45 animate-[bounce_6s_ease-in-out_infinite]"></div>
            </div>
          )}

          <div className="container mx-auto relative z-10">
            <motion.div 
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 md:p-12 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="absolute -top-6 -right-6">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("cta.title")}</h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{t("cta.description")}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white"
                    onClick={() => navigateTo("/auth/signup")}
                  >
                    {t("cta.signUp")}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => navigateTo("/how-it-works")}
                  >
                    {t("cta.learnMore")}
                  </Button>
                </div>
                
                <div className="mt-8 flex flex-wrap justify-center gap-6">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm">Trusted Platform</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm">Verified Professionals</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm">Growing Community</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <DoodleFooter />

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          className="bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all"
          onClick={() => navigateTo("/dashboard/messages")}
          aria-label="Chat with us"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
