"use client"

import { useState, useEffect } from "react"
import { LandingHeader } from "@/components/landing-header"
import { DoodleFooter } from "@/components/doodle-footer"
import { Button } from "@/components/ui/button"
import { RetroBox } from "@/components/ui/retro-box"
import { ArrowRight, Briefcase, MessageSquare, Star } from "lucide-react"
import { HomeIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState<number | null>(null)

  // Handle hydration mismatch by only rendering animations after mount
  useEffect(() => {
    setMounted(true)
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
                  <span className="doodle-underline inline-block">Find Local Jobs</span> <br />
                  and Services
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                  Connect with local opportunities and skilled professionals in your neighborhood
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="lg" className="retro-button" onClick={() => navigateTo("/auth/signup")}>
                    Get Started
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-black dark:border-white hover:bg-primary/20 transition-colors"
                    onClick={() => navigateTo("/dashboard/find-jobs")}
                  >
                    Browse Jobs
                  </Button>
                </div>
              </div>
              <div className="flex-1 relative">
                <RetroBox
                  className={`max-w-md mx-auto ${mounted ? "animate-float" : ""}`}
                  hoverEffect="glow"
                  onClick={() => navigateTo("/dashboard/find-jobs")}
                >
                  <img src="/placeholder.svg?height=400&width=500" alt="Local Jobs" className="w-full rounded-sm" />
                </RetroBox>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 doodle-underline inline-block">How It Works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our platform makes it easy to connect with local opportunities
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <RetroBox className="h-full" hoverEffect="lift" onClick={() => navigateTo("/auth/signup")}>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Create Your Profile</h3>
                <p className="text-muted-foreground">
                  Sign up and create your profile as a job seeker or service provider
                </p>
              </RetroBox>

              {/* Step 2 */}
              <RetroBox className="h-full" hoverEffect="lift" onClick={() => navigateTo("/dashboard/find-jobs")}>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Find Opportunities</h3>
                <p className="text-muted-foreground">Browse local jobs or post your services for others to discover</p>
              </RetroBox>

              {/* Step 3 */}
              <RetroBox className="h-full" hoverEffect="lift" onClick={() => navigateTo("/dashboard/messages")}>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Connect & Earn</h3>
                <p className="text-muted-foreground">Message, collaborate, and build your local reputation</p>
              </RetroBox>
            </div>
          </div>
        </section>

        {/* Categories section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 doodle-underline inline-block">Popular Categories</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Explore jobs and services across various categories
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category 1 */}
              <RetroBox
                className={`h-full transition-all duration-300 ${activeCategory === 0 ? "scale-105" : ""}`}
                hoverEffect="lift"
                onClick={() => navigateTo("/categories/home-services")}
                onMouseEnter={() => handleCategoryHover(0)}
                onMouseLeave={handleCategoryLeave}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <HomeIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Home Services</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Cleaning, repairs, gardening, and other household services
                </p>
                <div className="text-primary text-sm font-medium flex items-center">
                  Explore <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </RetroBox>

              {/* Category 2 */}
              <RetroBox
                className={`h-full transition-all duration-300 ${activeCategory === 1 ? "scale-105" : ""}`}
                hoverEffect="lift"
                onClick={() => navigateTo("/categories/professional")}
                onMouseEnter={() => handleCategoryHover(1)}
                onMouseLeave={handleCategoryLeave}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Professional</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Accounting, legal, consulting, and business services
                </p>
                <div className="text-primary text-sm font-medium flex items-center">
                  Explore <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </RetroBox>

              {/* Category 3 */}
              <RetroBox
                className={`h-full transition-all duration-300 ${activeCategory === 2 ? "scale-105" : ""}`}
                hoverEffect="lift"
                onClick={() => navigateTo("/categories/creative")}
                onMouseEnter={() => handleCategoryHover(2)}
                onMouseLeave={handleCategoryLeave}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Creative</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Design, writing, photography, and artistic services
                </p>
                <div className="text-primary text-sm font-medium flex items-center">
                  Explore <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </RetroBox>

              {/* Category 4 */}
              <RetroBox
                className={`h-full transition-all duration-300 ${activeCategory === 3 ? "scale-105" : ""}`}
                hoverEffect="lift"
                onClick={() => navigateTo("/categories/education")}
                onMouseEnter={() => handleCategoryHover(3)}
                onMouseLeave={handleCategoryLeave}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Education</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Tutoring, coaching, training, and educational services
                </p>
                <div className="text-primary text-sm font-medium flex items-center">
                  Explore <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </RetroBox>
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" className="retro-button" onClick={() => navigateTo("/categories")}>
                View All Categories
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
            <RetroBox
              className="max-w-3xl mx-auto bg-white dark:bg-gray-800 border-4 border-black dark:border-white"
              hoverEffect="none"
            >
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Join thousands of people finding local jobs and services in their community.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-black border-2 border-black"
                    onClick={() => navigateTo("/auth/signup")}
                  >
                    Sign Up Now
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-black dark:border-white hover:bg-primary/20"
                    onClick={() => navigateTo("/how-it-works")}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </RetroBox>
          </div>
        </section>
      </main>

      <DoodleFooter />
    </div>
  )
}
