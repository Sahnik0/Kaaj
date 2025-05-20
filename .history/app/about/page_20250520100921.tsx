"use client"

import { useState, useEffect } from "react"
import { LandingHeader } from "@/components/landing-header"
import { DoodleFooter } from "@/components/doodle-footer"
import { Button } from "@/components/ui/button"
import { Building, Users, Heart, Award } from "lucide-react"
import Link from "next/link"

export default function AboutUs() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-blue-50 dark:bg-gray-900 overflow-hidden">
          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <div className="inline-block mb-3 px-4 py-1 bg-primary/10 rounded-full border border-primary/20">
                <span className="text-sm font-medium text-primary">Our Story</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                About Us
                <span className="block h-2 w-32 bg-yellow-400 mt-2 mx-auto"></span>
              </h1>
              <p className="text-xl text-muted-foreground">
                We're on a mission to connect local talent with opportunities in their community
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-16">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <span className="ml-3 text-sm text-muted-foreground">
                  <span className="font-medium">1,000+ active users</span>
                </span>
              </div>
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-yellow-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">
                  <span className="font-medium">4.9/5 rating</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="py-16 px-4 relative">
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 pointer-events-none">
            {Array.from({ length: 7 }).map((_, rowIndex) =>
              Array.from({ length: 13 }).map((_, colIndex) => (
                <div key={`${rowIndex}-${colIndex}`} className="border-[0.5px] border-gray-200 dark:border-gray-800" />
              )),
            )}
          </div>

          <div className="container mx-auto relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Our Mission
                <span className="block h-2 w-24 bg-yellow-400 mt-2 mx-auto"></span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                We believe in the power of local communities and the talent that exists within them.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className={`relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-6 h-full transition-all duration-200 ${mounted ? "hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.8)]" : ""}`}>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Connecting Communities</h3>
                <p className="text-muted-foreground">
                  Our platform bridges the gap between local talent and opportunities, fostering stronger, more
                  self-sufficient communities where skills and services can be exchanged easily.
                </p>
              </div>

              <div className={`relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-6 h-full transition-all duration-200 ${mounted ? "hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.8)]" : ""}`}>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Empowering Individuals</h3>
                <p className="text-muted-foreground">
                  We empower people to showcase their skills, find meaningful work, and build their reputation within
                  their local community, creating economic opportunities for everyone.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional sections like Our Story, Our Team, Values, etc., continue similarly... */}

      </main>

      <DoodleFooter />
    </div>
  )
}