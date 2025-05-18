"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  MessageSquare,
  Bell,
  BookOpen,
  Star,
  AlertTriangle,
  User,
  Settings,
  PlusCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { useTranslation } from "@/lib/i18n/language-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { db } from "@/lib/firebase/firebase-config"
import { collection, where, query, onSnapshot } from "firebase/firestore"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useFirebase()
  const [userRole, setUserRole] = useState<string | null>(null)
  const { t } = useTranslation()
  const { isMobile } = useSidebar()
  const [searchQuery, setSearchQuery] = useState("")
  const [collapsibleStates, setCollapsibleStates] = useState({
    main: true,
    jobs: true,
    communication: false,
    other: false,
  })
  
  // Real-time notification and message counts
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem("userRole")
    setUserRole(role)
    
    // Load saved sidebar state from localStorage
    const savedCollapsibleStates = localStorage.getItem("sidebarCollapsibleStates")
    if (savedCollapsibleStates) {
      setCollapsibleStates(JSON.parse(savedCollapsibleStates))
    }
  }, [])
  
  // Listen for unread notifications
  useEffect(() => {
    if (!user) return
    
    // Set up listener for unread notifications
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    )
      const unsubscribe = onSnapshot(notificationsQuery, (snapshot: any) => {
      setUnreadNotifications(snapshot.docs.length)
    }, (error: Error) => {
      console.error("Error listening for notifications:", error)
    })
    
    return () => unsubscribe()
  }, [user])
  
  // Listen for unread messages
  useEffect(() => {
    if (!user) return
    
    // Get all conversations where user is a participant
    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid)
    )
      const unsubscribe = onSnapshot(conversationsQuery, (snapshot: any) => {
      // Track conversations with unread messages
      let unreadCount = 0
      
      snapshot.docs.forEach((doc: any) => {
        const conversation = doc.data()
        // Check if the last message is not from the current user and is unread
        if (conversation.lastMessageSenderId && 
            conversation.lastMessageSenderId !== user.uid && 
            conversation.lastMessageRead === false) {
          unreadCount++
        }
      })
      
      setUnreadMessages(unreadCount)
    }, (error: Error) => {
      console.error("Error listening for messages:", error)
    })
    
    return () => unsubscribe()
  }, [user])
  
  useEffect(() => {
    // Save collapsible states to localStorage when they change
    localStorage.setItem("sidebarCollapsibleStates", JSON.stringify(collapsibleStates))
  }, [collapsibleStates])

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }
  
  const toggleSection = (section: keyof typeof collapsibleStates) => {
    setCollapsibleStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Group menu items by categories
  const mainItems = [
    {
      title: t("dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
      show: true,
    },
  ]
  
  const jobItems = [
    {
      title: t("myJobs"),
      icon: Briefcase,
      href: "/dashboard/jobs",
      show: userRole === "recruiter",
    },
    {
      title: t("postJob"),
      icon: PlusCircle,
      href: "/dashboard/post-job",
      show: userRole === "recruiter",
    },
    {
      title: t("findJobs"),
      icon: Briefcase,
      href: "/dashboard/find-jobs",
      show: userRole === "candidate",
    },
    {
      title: t("applications"),
      icon: Briefcase,
      href: "/dashboard/applications",
      show: userRole === "candidate",
    },
    {
      title: t("candidates"),
      icon: Users,
      href: "/dashboard/candidates",
      show: userRole === "recruiter",
    },
  ]
  
  const communicationItems = [
    {
      title: t("messages"),
      icon: MessageSquare,
      href: "/dashboard/messages",
      show: true,
      badge: unreadMessages > 0 ? unreadMessages : null,
    },
    {
      title: t("notifications"),
      icon: Bell,
      href: "/dashboard/notifications",
      show: true,
      badge: unreadNotifications > 0 ? unreadNotifications : null,
    },
  ]
  
  const otherItems = [
    {
      title: t("learningPath"),
      icon: BookOpen,
      href: "/dashboard/learning",
      show: true,
    },
    {
      title: t("ratingsReviews"),
      icon: Star,
      href: "/dashboard/ratings",
      show: true,
    },
    {
      title: t("reportIssue"),
      icon: AlertTriangle,
      href: "/dashboard/reports",
      show: true,
    },
    {
      title: t("admin"),
      icon: Settings,
      href: "/dashboard/admin",
      show: userRole === "admin",
    },
  ]

  const profileItems = [
    {
      title: t("profile"),
      icon: User,
      href: "/dashboard/profile",
    },
    {
      title: t("settings"),
      icon: Settings,
      href: "/dashboard/settings",
    },
  ]
  
  // Filter menu items based on search query
  const filterItems = (items: any[]) => {
    if (!searchQuery) return items.filter(item => item.show)
    
    return items
      .filter(item => item.show && item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }
  
  // Render menu section
  const renderMenuSection = (
    items: any[], 
    sectionKey: keyof typeof collapsibleStates, 
    sectionTitle: string
  ) => {
    const filteredItems = filterItems(items)
    if (filteredItems.length === 0) return null
      return (
      <Collapsible open={collapsibleStates[sectionKey]} className="mb-4">
        <CollapsibleTrigger
          onClick={() => toggleSection(sectionKey)}
          className="flex w-full items-center justify-between py-2 px-3 text-sm font-medium uppercase tracking-wider text-gray-600 hover:text-black bg-gray-50/50 rounded-md"
        >
          {sectionTitle}
          <div className="h-5 w-5 flex items-center justify-center">
            {collapsibleStates[sectionKey] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-1">
            {filteredItems.map((item) => (
              <SidebarMenuItem key={item.href} className="px-0.5 py-0.5">
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  className={cn(
                    "border-l-4 border-transparent hover:border-black data-[active=true]:border-black data-[active=true]:bg-yellow-300",
                    "transition-all duration-200 rounded w-full"
                  )}
                >
                  <Link href={item.href} className="flex justify-between items-center w-full px-3 py-2">
                    <div className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    {item.badge && (
                      <Badge className={cn(
                        "ml-2", 
                        typeof item.badge === 'number' ? "bg-red-500 text-white" : "bg-secondary"
                      )}>
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }
  return (
    <Sidebar className="border-r-2 border-black">
      <SidebarHeader className="border-b-2 border-black py-5 px-4">
        <Link href="/" className="flex items-center justify-center gap-2">
          <span className="font-bold text-2xl">Kaaj</span>
        </Link>
      </SidebarHeader><SidebarContent className="px-4 py-4">
        {/* Search input */}
        <div className="pb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t("search") || "Search..."}
              className="pl-8 bg-transparent border-black/10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <SidebarMenu className="space-y-2">
          {renderMenuSection(mainItems, "main", t("main") || "Main")}
          {renderMenuSection(jobItems, "jobs", t("jobsAndCandidates") || "Jobs & Candidates")}
          {renderMenuSection(communicationItems, "communication", t("communication") || "Communication")}
          {renderMenuSection(otherItems, "other", t("other") || "Other")}
        </SidebarMenu>
      </SidebarContent>      <SidebarFooter className="border-t-2 border-black px-4 py-4">
        <SidebarMenu className="space-y-1">
          {profileItems.map((item) => (
            <SidebarMenuItem key={item.href} className="px-0.5 py-0.5">
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                className="border-l-4 border-transparent hover:border-black data-[active=true]:border-black data-[active=true]:bg-yellow-300 transition-all duration-200 rounded w-full"
              >
                <Link href={item.href} className="px-3 py-2 w-full flex items-center">
                  <item.icon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          <SidebarMenuItem className="px-0.5 py-0.5">
            <SidebarMenuButton 
              onClick={() => signOut()} 
              className="border-l-4 border-transparent hover:border-black hover:text-red-600 transition-all duration-200 rounded px-3 py-2 w-full"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="font-medium">{t("signOut")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {user && (
          <div className="mt-6 py-3 px-3 border-t-2 border-black/10 rounded-md bg-yellow-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center border-2 border-black/10">
                {user.email ? user.email[0].toUpperCase() : "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-gray-600 capitalize">{userRole || "User"}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
