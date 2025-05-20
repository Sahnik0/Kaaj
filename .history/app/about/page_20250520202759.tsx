"use client"

import { useState, useEffect } from "react"
import { LandingHeader } from "@/components/landing-header"
import { DoodleFooter } from "@/components/doodle-footer"
import { Button } from "@/components/ui/button"
import { Users, Globe, Award, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

// Simple translations for essential UI elements
const translations = {
  en: {
    "about.title": "About Us",
    "about.subtitle": "Connecting communities through local opportunities",
    "about.description":
      "We're on a mission to make local jobs and services more accessible to everyone in your neighborhood.",
    "about.mission.title": "Our Mission",
    "about.mission.description":
      "To create a platform that empowers local communities by connecting skilled individuals with those who need their services.",
    "about.vision.title": "Our Vision",
    "about.vision.description":
      "A world where finding local help is seamless, and where everyone has the opportunity to share their skills and earn within their community.",
    "about.story.title": "Our Story",
    "about.story.description":
      "Founded in 2025, we started with a simple idea: make it easier for people to find and offer services locally. What began as a small project has grown into a thriving marketplace serving communities worldwide.",
    "about.values.title": "Our Values",
    "about.values.community": "Community First",
    "about.values.community.description":
      "We believe in the power of local connections and supporting neighborhood economies.",
    "about.values.accessibility": "Accessibility",
    "about.values.accessibility.description":
      "Making opportunities available to everyone, regardless of background or experience.",
    "about.values.quality": "Quality",
    "about.values.quality.description": "Maintaining high standards for all services offered on our platform.",
    "about.values.trust": "Trust",
    "about.values.trust.description": "Building a safe and reliable environment for all our users.",
    "about.team.title": "Our Team",
    "about.team.description":
      "We're a diverse group of individuals passionate about technology and community building.",
    "about.join.title": "Join Our Community",
    "about.join.description": "Become part of our growing network of professionals and service seekers.",
    "about.join.button": "Sign Up Today",
    "about.contact.button": "Contact Us",
  },
  bn: {
    "about.title": "আমাদের সম্পর্কে",
    "about.subtitle": "স্থানীয় সুযোগের মাধ্যমে সম্প্রদায়গুলিকে সংযুক্ত করা",
    "about.description": "আমরা আপনার আশেপাশের সবার জন্য স্থানীয় চাকরি এবং পরিষেবাগুলিকে আরও সহজলভ্য করার মিশনে আছি।",
    "about.mission.title": "আমাদের মিশন",
    "about.mission.description":
      "এমন একটি প্ল্যাটফর্ম তৈরি করা যা দক্ষ ব্যক্তিদের তাদের পরিষেবা প্রয়োজন এমন লোকদের সাথে সংযোগ করে স্থানীয় সম্প্রদায়কে ক্ষমতায়ন করে।",
    "about.vision.title": "আমাদের দৃষ্টি",
    "about.vision.description":
      "এমন একটি বিশ্ব যেখানে স্থানীয় সাহায্য খুঁজে পাওয়া সহজ, এবং যেখানে প্রত্যেকের তাদের দক্ষতা ভাগ করে নেওয়ার এবং তাদের সম্প্রদায়ের মধ্যে উপার্জন করার সুযোগ রয়েছে।",
    "about.story.title": "আমাদের গল্প",
    "about.story.description":
      "২০২৩ সালে প্রতিষ্ঠিত, আমরা একটি সহজ ধারণা দিয়ে শুরু করেছি: মানুষের জন্য স্থানীয়ভাবে পরিষেবা খুঁজে পাওয়া এবং অফার করা সহজ করে তুলুন। যা একটি ছোট প্রকল্প হিসাবে শুরু হয়েছিল তা বিশ্বব্যাপী সম্প্রদায়গুলিকে সেবা প্রদানকারী একটি সমৃদ্ধ বাজারে পরিণত হয়েছে।",
    "about.values.title": "আমাদের মূল্যবোধ",
    "about.values.community": "সম্প্রদায় প্রথম",
    "about.values.community.description": "আমরা স্থানীয় সংযোগের শক্তি এবং প্রতিবেশী অর্থনীতিকে সমর্থন করার বিশ্বাস করি।",
    "about.values.accessibility": "অ্যাক্সেসযোগ্যতা",
    "about.values.accessibility.description": "পটভূমি বা অভিজ্ঞতা নির্বিশেষে সবার জন্য সুযোগ উপলব্ধ করা।",
    "about.values.quality": "গুণমান",
    "about.values.quality.description": "আমাদের প্ল্যাটফর্মে অফার করা সমস্ত পরিষেবার জন্য উচ্চ মান বজায় রাখা।",
    "about.values.trust": "বিশ্বাস",
    "about.values.trust.description": "আমাদের সমস্ত ব্যবহারকারীদের জন্য একটি নিরাপদ এবং নির্ভরযোগ্য পরিবেশ তৈরি করা।",
    "about.team.title": "আমাদের টিম",
    "about.team.description": "আমরা প্রযুক্তি এবং সম্প্রদায় নির্মাণে আগ্রহী ব্যক্তিদের একটি বৈচিত্র্যময় গ্রুপ।",
    "about.join.title": "আমাদের সম্প্রদায়ে যোগ দিন",
    "about.join.description": "পেশাদার এবং সেবা সন্ধানকারীদের আমাদের ক্রমবর্ধমান নেটওয়ার্কের অংশ হন।",
    "about.join.button": "আজই সাইন আপ করুন",
    "about.contact.button": "যোগাযোগ করুন",
  },
  hi: {
    "about.title": "हमारे बारे में",
    "about.subtitle": "स्थानीय अवसरों के माध्यम से समुदायों को जोड़ना",
    "about.description": "हम आपके आस-पास के सभी के लिए स्थानीय नौकरियों और सेवाओं को अधिक सुलभ बनाने के मिशन पर हैं।",
    "about.mission.title": "हमारा मिशन",
    "about.mission.description":
      "एक ऐसा प्लेटफॉर्म बनाना जो कुशल व्यक्तियों को उनकी सेवाओं की आवश्यकता वाले लोगों से जोड़कर स्थानीय समुदायों को सशक्त बनाता है।",
    "about.vision.title": "हमारा विजन",
    "about.vision.description":
      "एक ऐसी दुनिया जहां स्थानीय मदद खोजना सहज हो, और जहां हर किसी को अपने कौशल साझा करने और अपने समुदाय के भीतर कमाने का अवसर हो।",
    "about.story.title": "हमारी कहानी",
    "about.story.description":
      "2023 में स्थापित, हमने एक सरल विचार से शुरुआत की: लोगों के लिए स्थानीय स्तर पर सेवाएं खोजना और प्रदान करना आसान बनाना। जो एक छोटे प्रोजेक्ट के रूप में शुरू हुआ, वह दुनिया भर के समुदायों की सेवा करने वाले एक समृद्ध बाजार में विकसित हो गया है।",
    "about.values.title": "हमारे मूल्य",
    "about.values.community": "समुदाय पहले",
    "about.values.community.description": "हम स्थानीय संबंधों की शक्ति और पड़ोसी अर्थव्यवस्थाओं का समर्थन करने में विश्वास करते हैं।",
    "about.values.accessibility": "पहुंच",
    "about.values.accessibility.description": "पृष्ठभूमि या अनुभव की परवाह किए बिना सभी के लिए अवसर उपलब्ध कराना।",
    "about.values.quality": "गुणवत्ता",
    "about.values.quality.description": "हमारे प्लेटफॉर्म पर प्रदान की जाने वाली सभी सेवाओं के लिए उच्च मानकों को बनाए रखना।",
    "about.values.trust": "विश्वास",
    "about.values.trust.description": "हमारे सभी उपयोगकर्ताओं के लिए एक सुरक्षित और विश्वसनीय वातावरण बनाना।",
    "about.team.title": "हमारी टीम",
    "about.team.description": "हम प्रौद्योगिकी और समुदाय निर्माण के प्रति जुनूनी व्यक्तियों का एक विविध समूह हैं।",
    "about.join.title": "हमारे समुदाय से जुड़ें",
    "about.join.description": "पेशेवरों और सेवा खोजने वालों के हमारे बढ़ते नेटवर्क का हिस्सा बनें।",
    "about.join.button": "आज ही साइन अप करें",
    "about.contact.button": "संपर्क करें",
  },
}

export default function About() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
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
  

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 md:py-20 lg:py-28">
          {/* Grid background */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Grid lines */}
            <div className="absolute inset-0 grid grid-cols-6 md:grid-cols-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`grid-col-${i}`} className="border-l border-primary/5 h-full"></div>
              ))}
            </div>
            <div className="absolute inset-0 grid grid-rows-6 md:grid-rows-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`grid-row-${i}`} className="border-t border-primary/5 w-full"></div>
              ))}
            </div>

            {/* Animated background elements */}
            <div className="absolute top-20 left-10 w-24 h-24 rounded-full border-2 border-dashed border-primary/20 rotate-12 animate-[spin_20s_linear_infinite]"></div>
            <div className="absolute bottom-40 right-10 w-16 h-16 rounded-full border-2 border-dotted border-primary/30 -rotate-12 animate-[spin_15s_linear_infinite_reverse]"></div>
            <div className="absolute top-1/3 left-1/4 w-12 h-12 border-2 border-primary/20 transform rotate-45 animate-[bounce_6s_ease-in-out_infinite]"></div>
            <div className="absolute top-1/4 right-1/3 w-20 h-20 rounded-full bg-primary/5 animate-[pulse_4s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-1/4 left-1/3 w-32 h-32 rounded-full bg-secondary/5 animate-[pulse_7s_ease-in-out_infinite]"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block mb-3 px-4 py-1 bg-primary/10 rounded-full border border-primary/20">
                <span className="text-sm font-medium text-primary">✨ {t("about.title")}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="doodle-underline inline-block relative">{t("about.subtitle")}</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{t("about.description")}</p>
            </div>
          </div>
        </section>

        {/* Mission & Vision section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Mission */}
              <div
                className={`relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.8)] p-6 h-full ${
                  mounted ? "animate-[float_6s_ease-in-out_infinite]" : ""
                }`}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">{t("about.mission.title")}</h2>
                <p className="text-muted-foreground">{t("about.mission.description")}</p>
              </div>

              {/* Vision */}
              <div
                className={`relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.8)] p-6 h-full ${
                  mounted ? "animate-[float_7s_ease-in-out_infinite]" : ""
                }`}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">{t("about.vision.title")}</h2>
                <p className="text-muted-foreground">{t("about.vision.description")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 grid grid-cols-6 md:grid-cols-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`story-grid-col-${i}`} className="border-l border-primary/5 h-full"></div>
              ))}
            </div>
            <div className="absolute inset-0 grid grid-rows-6 md:grid-rows-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`story-grid-row-${i}`} className="border-t border-primary/5 w-full"></div>
              ))}
            </div>
          </div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 doodle-underline inline-block">{t("about.story.title")}</h2>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-6">
                <div className="absolute -top-3 -right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-black">
                  2025
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg text-muted-foreground">{t("about.story.description")}</p>

                    <div className="mt-6 flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-sm font-medium">1000+ Jobs Posted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-sm font-medium">500+ Service Providers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-sm font-medium">20+ Communities</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 doodle-underline inline-block">{t("about.values.title")}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Value 1 */}
              <div className="relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.8)]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{t("about.values.community")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t("about.values.community.description")}</p>
              </div>

              {/* Value 2 */}
              <div className="relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.8)]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{t("about.values.accessibility")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t("about.values.accessibility.description")}</p>
              </div>

              {/* Value 3 */}
              <div className="relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.8)]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{t("about.values.quality")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t("about.values.quality.description")}</p>
              </div>

              {/* Value 4 */}
              <div className="relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.8)]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{t("about.values.trust")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t("about.values.trust.description")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
  {/* Grid background */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute inset-0 grid grid-cols-6 md:grid-cols-12">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={`team-grid-col-${i}`} className="border-l border-primary/5 h-full"></div>
      ))}
    </div>
    <div className="absolute inset-0 grid grid-rows-6 md:grid-rows-12">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={`team-grid-row-${i}`} className="border-t border-primary/5 w-full"></div>
      ))}
    </div>
  </div>

  <div className="container mx-auto relative z-10">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold mb-4 doodle-underline inline-block">{t("about.team.title")}</h2>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("about.team.description")}</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[ // Array of image paths in public folder
        "/sahnik1.jpg",
        "/sankalpa.jpg",
        "/S.jpg",
        "/shreyas.jpg",
      ].map((imgSrc, index) => (
        <div
          key={`team-member-${index}`}
          className="relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.8)]"
        >
          <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
            <img
              src={imgSrc}
              alt={`Team Member ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-lg font-semibold mb-1">Team Member {index + 1}</h3>
          <p className="text-sm text-primary mb-2">Co-Founder</p>
          <p className="text-sm text-muted-foreground">
            Passionate about connecting communities and building innovative solutions.
          </p>
        </div>
      ))}
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
                <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("about.join.title")}</h2>
                <p className="text-xl text-muted-foreground mb-8">{t("about.join.description")}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-black border-2 border-black"
                    onClick={() => navigateTo("/auth/signup")}
                  >
                    {t("about.join.button")}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-black dark:border-white hover:bg-primary/20"
                    onClick={() => navigateTo("/contact")}
                  >
                    {t("about.contact.button")}
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
