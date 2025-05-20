"use client"

import { useState, useEffect } from "react"
import { LandingHeader } from "@/components/landing-header"
import { DoodleFooter } from "@/components/doodle-footer"
import { Button } from "@/components/ui/button"
import { Building, Heart, Users, Globe, Mail, MapPin, Phone, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

// Simple translations for About Us page
const translations = {
  en: {
    "hero.title": "About Us",
    "hero.description": "Connecting communities through local jobs and services",
    "mission.title": "Our Mission",
    "mission.description":
      "We're on a mission to transform how local communities connect with skilled professionals and job opportunities. By creating a platform that prioritizes local talent and neighborhood needs, we're building stronger, more self-sufficient communities.",
    "vision.title": "Our Vision",
    "vision.description":
      "A world where everyone can easily find quality local services and meaningful work opportunities within their own community.",
    "story.title": "Our Story",
    "story.description":
      "Founded in 2022, our platform began with a simple idea: make it easier for people to find trusted local help and for skilled professionals to find work in their neighborhoods.",
    "story.paragraph1":
      "What started as a small community board in one neighborhood has grown into a comprehensive platform serving thousands of communities worldwide.",
    "story.paragraph2":
      "Our founders recognized that while global marketplaces had their place, there was something special about working with people in your own community. That personal connection, accountability, and trust couldn't be replicated in anonymous global platforms.",
    "values.title": "Our Values",
    "values.community": "Community First",
    "values.community.description": "We believe in the power of local communities to support each other",
    "values.quality": "Quality Service",
    "values.quality.description": "We're committed to connecting people with skilled, reliable professionals",
    "values.accessibility": "Accessibility",
    "values.accessibility.description": "Our platform is designed to be inclusive and easy to use for everyone",
    "values.trust": "Trust & Safety",
    "values.trust.description": "We prioritize creating a secure environment for all our users",
    "team.title": "Our Team",
    "team.description": "Meet the passionate people behind our platform",
    "team.member1.name": "Sarah Johnson",
    "team.member1.role": "Founder & CEO",
    "team.member1.bio":
      "With over 15 years of experience in community development, Sarah leads our mission to strengthen local economies.",
    "team.member2.name": "David Chen",
    "team.member2.role": "CTO",
    "team.member2.bio":
      "David brings 10+ years of tech expertise, ensuring our platform is innovative, secure, and user-friendly.",
    "team.member3.name": "Priya Patel",
    "team.member3.role": "Head of Community",
    "team.member3.bio":
      "Priya works directly with communities to understand their unique needs and ensure our platform serves them effectively.",
    "team.member4.name": "Michael Rodriguez",
    "team.member4.role": "Head of Operations",
    "team.member4.bio": "Michael oversees day-to-day operations, making sure everything runs smoothly for our users.",
    "contact.title": "Get In Touch",
    "contact.description": "Have questions or feedback? We'd love to hear from you.",
    "contact.email": "Email Us",
    "contact.phone": "Call Us",
    "contact.visit": "Visit Us",
    "contact.address": "123 Community Lane, San Francisco, CA 94105",
    "cta.title": "Join Our Community",
    "cta.description": "Be part of our mission to strengthen local communities through jobs and services.",
    "cta.signUp": "Sign Up Now",
    "cta.learnMore": "Contact Us",
  },
  bn: {
    "hero.title": "আমাদের সম্পর্কে",
    "hero.description": "স্থানীয় চাকরি এবং পরিষেবার মাধ্যমে সম্প্রদায়গুলিকে সংযুক্ত করা",
    "mission.title": "আমাদের লক্ষ্য",
    "mission.description":
      "আমরা স্থানীয় সম্প্রদায়গুলি কীভাবে দক্ষ পেশাদারদের এবং চাকরির সুযোগগুলির সাথে সংযোগ করে তা পরিবর্তন করার মিশনে আছি। স্থানীয় প্রতিভা এবং আশেপাশের চাহিদাগুলিকে অগ্রাধিকার দেয় এমন একটি প্ল্যাটফর্ম তৈরি করে, আমরা আরও শক্তিশালী, আরও স্বনির্ভর সম্প্রদায় গড়ে তুলছি।",
    "vision.title": "আমাদের দৃষ্টি",
    "vision.description":
      "একটি বিশ্ব যেখানে প্রত্যেকে সহজেই তাদের নিজের সম্প্রদায়ের মধ্যে মানসম্পন্ন স্থানীয় পরিষেবা এবং অর্থপূর্ণ কাজের সুযোগ খুঁজে পেতে পারে।",
    "story.title": "আমাদের গল্প",
    "story.description":
      "২০২২ সালে প্রতিষ্ঠিত, আমাদের প্ল্যাটফর্ম একটি সহজ ধারণা দিয়ে শুরু হয়েছিল: লোকেদের জন্য বিশ্বস্ত স্থানীয় সাহায্য খুঁজে পাওয়া এবং দক্ষ পেশাদারদের জন্য তাদের আশেপাশে কাজ খুঁজে পাওয়া সহজ করে তুলুন।",
    "story.paragraph1":
      "যা একটি ছোট সম্প্রদায় বোর্ড হিসাবে শুরু হয়েছিল তা বিশ্বব্যাপী হাজার হাজার সম্প্রদায়কে সেবা প্রদানকারী একটি ব্যাপক প্ল্যাটফর্মে পরিণত হয়েছে।",
    "story.paragraph2":
      "আমাদের প্রতিষ্ঠাতারা স্বীকার করেছিলেন যে বৈশ্বিক বাজারগুলির তাদের নিজস্ব স্থান থাকলেও, আপনার নিজের সম্প্রদায়ের লোকেদের সাথে কাজ করার মধ্যে কিছু বিশেষ ছিল। সেই ব্যক্তিগত সংযোগ, জবাবদিহিতা এবং বিশ্বাস বেনামী বৈশ্বিক প্ল্যাটফর্মগুলিতে প্রতিলিপি করা যায়নি।",
    "values.title": "আমাদ��র মূল্যবোধ",
    "values.community": "সম্প্রদায় প্রথম",
    "values.community.description": "আমরা একে অপরকে সমর্থন করার জন্য স্থানীয় সম্প্রদায়ের শক্তিতে বিশ্বাস করি",
    "values.quality": "মানসম্পন্ন সেবা",
    "values.quality.description": "আমরা দক্ষ, নির্ভরযোগ্য পেশাদারদের সাথে লোকেদের সংযোগ করতে প্রতিশ্রুতিবদ্ধ",
    "values.accessibility": "অ্যাক্সেসযোগ্যতা",
    "values.accessibility.description": "আমাদের প্ল্যাটফর্ম সবার জন্য অন্তর্ভুক্তিমূলক এবং ব্যবহার করা সহজ হওয়ার জন্য ডিজাইন করা হয়েছে",
    "values.trust": "বিশ্বাস ও নিরাপত্তা",
    "values.trust.description": "আমরা আমাদের সমস্ত ব্যবহারকারীদের জন্য একটি নিরাপদ পরিবেশ তৈরি করাকে অগ্রাধিকার দিই",
    "team.title": "আমাদের টিম",
    "team.description": "আমাদের প্ল্যাটফর্মের পিছনে উত্সাহী মানুষদের সাথে দেখা করুন",
    "team.member1.name": "সারা জনসন",
    "team.member1.role": "প্রতিষ্ঠাতা ও সিইও",
    "team.member1.bio":
      "সম্প্রদায় উন্নয়নে ১৫ বছরেরও বেশি অভিজ্ঞতা নিয়ে, সারা স্থানীয় অর্থনীতিকে শক্তিশালী করার আমাদের মিশনের নেতৃত্ব দেন।",
    "team.member2.name": "ডেভিড চেন",
    "team.member2.role": "সিটিও",
    "team.member2.bio":
      "ডেভিড ১০+ বছরের প্রযুক্তিগত দক্ষতা নিয়ে আসেন, নিশ্চিত করেন যে আমাদের প্ল্যাটফর্ম উদ্ভাবনী, নিরাপদ এবং ব্যবহারকারী-বান্ধব।",
    "team.member3.name": "প্রিয়া প্যাটেল",
    "team.member3.role": "কমিউনিটি প্রধান",
    "team.member3.bio":
      "প্রিয়া সরাসরি সম্প্রদায়ের সাথে কাজ করে তাদের অনন্য চাহিদা বুঝতে এবং আমাদের প্ল্যাটফর্ম তাদের কার্যকরভাবে সেবা করে তা নিশ্চিত করে।",
    "team.member4.name": "মাইকেল রড্রিগেজ",
    "team.member4.role": "অপারেশন প্রধান",
    "team.member4.bio": "মাইকেল দৈনন্দিন কার্যক্রম তদারকি করেন, আমাদের ব্যবহারকারীদের জন্য সবকিছু সুচারুভাবে চলছে তা নিশ্চিত করেন।",
    "contact.title": "যোগাযোগ করুন",
    "contact.description": "প্রশ্ন বা মতামত আছে? আমরা আপনার কাছ থেকে শুনতে চাই।",
    "contact.email": "আমাদের ইমেইল করুন",
    "contact.phone": "আমাদের কল করুন",
    "contact.visit": "আমাদের দেখতে আসুন",
    "contact.address": "১২৩ কমিউনিটি লেন, সান ফ্রান্সিসকো, সিএ ৯৪১০৫",
    "cta.title": "আমাদের সম্প্রদায়ে যোগ দিন",
    "cta.description": "চাকরি এবং পরিষেবার মাধ্যমে স্থানীয় সম্প্রদায়কে শক্তিশালী করার আমাদের মিশনের অংশ হোন।",
    "cta.signUp": "এখনই সাইন আপ করুন",
    "cta.learnMore": "আমাদের সাথে যোগাযোগ করুন",
  },
  hi: {
    "hero.title": "हमारे बारे में",
    "hero.description": "स्थानीय नौकरियों और सेवाओं के माध्यम से समुदायों को जोड़ना",
    "mission.title": "हमारा मिशन",
    "mission.description":
      "हम स्थानीय समुदायों को कुशल पेशेवरों और नौकरी के अवसरों से जोड़ने के तरीके को बदलने के मिशन पर हैं। स्थानीय प्रतिभा और पड़ोस की जरूरतों को प्राथमिकता देने वाला एक प्लेटफॉर्म बनाकर, हम मजबूत, अधिक आत्मनिर्भर समुदाय बना रहे हैं।",
    "vision.title": "हमारा विजन",
    "vision.description":
      "एक ऐसी दुनिया जहां हर कोई अपने समुदाय के भीतर गुणवत्तापूर्ण स्थानीय सेवाओं और सार्थक काम के अवसरों को आसानी से खोज सके।",
    "story.title": "हमारी कहानी",
    "story.description":
      "2022 में स्थापित, हमारा प्लेटफॉर्म एक सरल विचार से शुरू हुआ: लोगों के लिए विश्वसनीय स्थानीय मदद खोजना और कुशल पेशेवरों के लिए अपने पड़ोस में काम खोजना आसान बनाना।",
    "story.paragraph1":
      "जो एक छोटे समुदाय बोर्ड के रूप में शुरू हुआ, वह दुनिया भर के हजारों समुदायों की सेवा करने वाले एक व्यापक प्लेटफॉर्म में विकसित हो गया है।",
    "story.paragraph2":
      "हमारे संस्थापकों ने पहचाना कि जबकि वैश्विक बाजारों का अपना स्थान था, अपने समुदाय के लोगों के साथ काम करने में कुछ खास था। वह व्यक्तिगत संबंध, जवाबदेही, और विश्वास अनाम वैश्विक प्लेटफार्मों में प्रतिकृति नहीं किया जा सकता था।",
    "values.title": "हमारे मूल्य",
    "values.community": "समुदाय पहले",
    "values.community.description": "हम एक-दूसरे का समर्थन करने के लिए स्थानीय समुदायों की शक्ति में विश्वास करते हैं",
    "values.quality": "गुणवत्ता सेवा",
    "values.quality.description": "हम लोगों को कुशल, विश्वसनीय पेशेवरों से जोड़ने के लिए प्रतिबद्ध हैं",
    "values.accessibility": "पहुंच",
    "values.accessibility.description": "हमारा प्लेटफॉर्म सभी के लिए समावेशी और उपयोग में आसान होने के लिए डिज़ाइन किया गया है",
    "values.trust": "विश्वास और सुरक्षा",
    "values.trust.description": "हम अपने सभी उपयोगकर्ताओं के लिए एक सुरक्षित वातावरण बनाने को प्राथमिकता देते हैं",
    "team.title": "हमारी टीम",
    "team.description": "हमारे प्लेटफॉर्म के पीछे जुनूनी लोगों से मिलें",
    "team.member1.name": "सारा जॉनसन",
    "team.member1.role": "संस्थापक और सीईओ",
    "team.member1.bio":
      "समुदाय विकास में 15 से अधिक वर्षों के अनुभव के साथ, सारा स्थानीय अर्थव्यवस्थाओं को मजबूत करने के हमारे मिशन का नेतृत्व करती हैं।",
    "team.member2.name": "डेविड चेन",
    "team.member2.role": "सीटीओ",
    "team.member2.bio":
      "डेविड 10+ वर्षों की तकनीकी विशेषज्ञता लाते हैं, यह सुनिश्चित करते हुए कि हमारा प्लेटफॉर्म नवीन, सुरक्षित और उपयोगकर्ता-अनुकूल है।",
    "team.member3.name": "प्रिया पटेल",
    "team.member3.role": "समुदाय प्रमुख",
    "team.member3.bio":
      "प्रिया समुदायों के साथ सीधे काम करती हैं ताकि उनकी अनूठी जरूरतों को समझ सकें और यह सुनिश्चित कर सकें कि हमारा प्लेटफॉर्म उनकी प्रभावी ढंग से सेवा करता है।",
    "team.member4.name": "माइकल रोड्रिगेज",
    "team.member4.role": "संचालन प्रमुख",
    "team.member4.bio":
      "माइकल दैनिक संचालन की देखरेख करते हैं, यह सुनिश्चित करते हुए कि हमारे उपयोगकर्ताओं के लिए सब कुछ सुचारू रूप से चलता है।",
    "contact.title": "संपर्क करें",
    "contact.description": "प्रश्न या प्रतिक्रिया है? हम आपसे सुनना पसंद करेंगे।",
    "contact.email": "हमें ईमेल करें",
    "contact.phone": "हमें कॉल करें",
    "contact.visit": "हमसे मिलें",
    "contact.address": "123 कम्युनिटी लेन, सैन फ्रांसिस्को, सीए 94105",
    "cta.title": "हमारे समुदाय में शामिल हों",
    "cta.description": "नौकरियों और सेवाओं के माध्यम से स्थानीय समुदायों को मजबूत करने के हमारे मिशन का हिस्सा बनें।",
    "cta.signUp": "अभी साइन अप करें",
    "cta.learnMore": "हमसे संपर्क करें",
  },
}

export default function AboutUs() {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
          {/* Background elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_40%)]"></div>
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-purple-100/30 to-cyan-100/30 dark:from-purple-900/10 dark:to-cyan-900/10 blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-block mb-3 px-4 py-1 bg-primary/10 text-primary rounded-full font-medium text-sm">
                Our Story
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
                {t("hero.title")}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{t("hero.description")}</p>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 mix-blend-overlay"></div>
                  <Image
                    src="/placeholder.svg?height=600&width=600"
                    alt="Our Mission"
                    width={600}
                    height={600}
                    className="w-full object-cover"
                  />
                </div>

                {/* Floating element */}
                <div
                  className={`absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs ${mounted ? "animate-[float_4s_ease-in-out_infinite]" : ""}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-bold">{t("mission.title")}</div>
                  </div>
                  <p className="text-sm text-muted-foreground">{t("vision.description")}</p>
                </div>
              </div>

              <div>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-4">{t("mission.title")}</h2>
                  <p className="text-lg text-muted-foreground">{t("mission.description")}</p>
                </div>

                <div>
                  <h2 className="text-3xl font-bold mb-4">{t("vision.title")}</h2>
                  <p className="text-lg text-muted-foreground">{t("vision.description")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 px-4 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-block mb-3 px-4 py-1 bg-primary/10 text-primary rounded-full font-medium text-sm">
                  Journey
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("story.title")}</h2>
                <p className="text-lg text-muted-foreground">{t("story.description")}</p>
              </div>

              <div className="space-y-8">
                <div className="relative pl-8 border-l-2 border-primary/30 pb-8">
                  <div className="absolute top-0 left-[-9px] h-4 w-4 rounded-full bg-primary"></div>
                  <h3 className="text-xl font-bold mb-2">2022: The Beginning</h3>
                  <p className="text-muted-foreground">{t("story.paragraph1")}</p>
                </div>

                <div className="relative pl-8 border-l-2 border-primary/30 pb-8">
                  <div className="absolute top-0 left-[-9px] h-4 w-4 rounded-full bg-primary"></div>
                  <h3 className="text-xl font-bold mb-2">2023: Growth & Expansion</h3>
                  <p className="text-muted-foreground">{t("story.paragraph2")}</p>
                </div>

                <div className="relative pl-8">
                  <div className="absolute top-0 left-[-9px] h-4 w-4 rounded-full bg-primary"></div>
                  <h3 className="text-xl font-bold mb-2">2024: Today & Beyond</h3>
                  <p className="text-muted-foreground">
                    Today, we continue to innovate and expand, bringing our platform to more communities while staying
                    true to our core mission of strengthening local connections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block mb-3 px-4 py-1 bg-primary/10 text-primary rounded-full font-medium text-sm">
                Principles
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("values.title")}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The core principles that guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Value 1 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t("values.community")}</h3>
                <p className="text-muted-foreground">{t("values.community.description")}</p>
              </div>

              {/* Value 2 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Star className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t("values.quality")}</h3>
                <p className="text-muted-foreground">{t("values.quality.description")}</p>
              </div>

              {/* Value 3 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Globe className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t("values.accessibility")}</h3>
                <p className="text-muted-foreground">{t("values.accessibility.description")}</p>
              </div>

              {/* Value 4 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Building className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t("values.trust")}</h3>
                <p className="text-muted-foreground">{t("values.trust.description")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 px-4 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <div className="reinline-block mb-3 px-4 py-1  text-primary rounded-full font-medium text-sm">
                People
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("team.title")}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("team.description")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Team Member 1 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="h-64 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=300&width=300"
                    alt={t("team.member1.name")}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold">{t("team.member1.name")}</h3>
                  <p className="text-primary font-medium mb-3">{t("team.member1.role")}</p>
                  <p className="text-sm text-muted-foreground">{t("team.member1.bio")}</p>
                </div>
              </div>

              {/* Team Member 2 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="h-64 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=300&width=300"
                    alt={t("team.member2.name")}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold">{t("team.member2.name")}</h3>
                  <p className="text-primary font-medium mb-3">{t("team.member2.role")}</p>
                  <p className="text-sm text-muted-foreground">{t("team.member2.bio")}</p>
                </div>
              </div>

              {/* Team Member 3 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="h-64 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=300&width=300"
                    alt={t("team.member3.name")}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold">{t("team.member3.name")}</h3>
                  <p className="text-primary font-medium mb-3">{t("team.member3.role")}</p>
                  <p className="text-sm text-muted-foreground">{t("team.member3.bio")}</p>
                </div>
              </div>

              {/* Team Member 4 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="h-64 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=300&width=300"
                    alt={t("team.member4.name")}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold">{t("team.member4.name")}</h3>
                  <p className="text-primary font-medium mb-3">{t("team.member4.role")}</p>
                  <p className="text-sm text-muted-foreground">{t("team.member4.bio")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block mb-3 px-4 py-1 bg-primary/10 text-primary rounded-full font-medium text-sm">
                Contact
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("contact.title")}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("contact.description")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {/* Email */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t("contact.email")}</h3>
                <p className="text-muted-foreground">hello@localservices.com</p>
              </div>

              {/* Phone */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <Phone className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t("contact.phone")}</h3>
                <p className="text-muted-foreground">+1 (555) 123-4567</p>
              </div>

              {/* Address */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t("contact.visit")}</h3>
                <p className="text-muted-foreground">{t("contact.address")}</p>
              </div>
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
                      onClick={() => navigateTo("/contact")}
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
