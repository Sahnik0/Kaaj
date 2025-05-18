import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container px-4 py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-kaaj-500">Kaaj</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Connecting local talent with opportunities in your community.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-kaaj-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-kaaj-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-kaaj-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-kaaj-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  Job Categories
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">For Recruiters</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/post-job" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/find-candidates" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  Find Candidates
                </Link>
              </li>
              <li>
                <Link href="/recruiter-resources" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  Recruiter Resources
                </Link>
              </li>
              <li>
                <Link href="/success-stories" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">For Candidates</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/find-jobs" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link href="/learning-resources" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  Learning Resources
                </Link>
              </li>
              <li>
                <Link href="/career-advice" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  Career Advice
                </Link>
              </li>
              <li>
                <Link href="/skill-development" className="text-sm text-muted-foreground hover:text-kaaj-500">
                  Skill Development
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Kaaj. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-kaaj-500">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-kaaj-500">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-kaaj-500">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
