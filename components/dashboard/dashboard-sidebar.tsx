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
  ChevronLeft,
  Menu,
  X
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
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AnimatePresence, motion } from "framer-motion"

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
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // Real-time notification and message counts
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get user role from localStorage
      const role = localStorage.getItem("userRole")
      setUserRole(role)
      
      // Load saved sidebar state from localStorage
      const savedCollapsibleStates = localStorage.getItem("sidebarCollapsibleStates")
      if (savedCollapsibleStates) {
        try {
          setCollapsibleStates(JSON.parse(savedCollapsibleStates))
        } catch (e) {
          console.error("Error parsing saved collapsible states:", e)
        }
      }
      
      // Load saved collapsed state from localStorage
      const savedCollapsedState = localStorage.getItem("sidebarCollapsed")
      if (savedCollapsedState) {
        try {
          setCollapsed(JSON.parse(savedCollapsedState))
        } catch (e) {
          console.error("Error parsing saved collapsed state:", e)
        }
      }
    }
  }, [])
  // Listen for unread notifications with debouncing to prevent flickering
  useEffect(() => {
    if (!user) return
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Set up listener for unread notifications
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    )
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      // Clear any pending timeout to avoid unnecessary updates
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Debounce the update to avoid rapid UI changes
      timeoutId = setTimeout(() => {
        setUnreadNotifications(snapshot.docs.length)
      }, 300); // 300ms debounce
    }, (error) => {
      console.error("Error listening for notifications:", error)
    })
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      unsubscribe();
    }
  }, [user])
  
  // Listen for unread messages with debouncing to prevent flickering
  useEffect(() => {
    if (!user) return
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Get all conversations where user is a participant
    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid)
    )
    
    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      // Clear any pending timeout to avoid unnecessary updates
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Debounce the update to avoid rapid UI changes
      timeoutId = setTimeout(() => {
        // Track conversations with unread messages
        let unreadCount = 0
        
        snapshot.docs.forEach((doc) => {
          const conversation = doc.data()
          // Check if the last message is not from the current user and is unread
          if (conversation.lastMessageSenderId && 
              conversation.lastMessageSenderId !== user.uid && 
              conversation.lastMessageRead === false) {
            unreadCount++
          }
        })
        
        setUnreadMessages(unreadCount)
      }, 300); // 300ms debounce
    }, (error) => {
      console.error("Error listening for messages:", error)
    })
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      unsubscribe();
    }
  }, [user])
  
  useEffect(() => {
    // Save collapsible states to localStorage when they change
    localStorage.setItem("sidebarCollapsibleStates", JSON.stringify(collapsibleStates))
  }, [collapsibleStates])
  
  useEffect(() => {
    // Save collapsed state to localStorage when it changes
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed))
  }, [collapsed])

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }
  
  const toggleSection = (section: keyof typeof collapsibleStates) => {
    setCollapsibleStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  
  const toggleCollapse = () => {
    setCollapsed(prev => !prev)
  }
  
  const toggleMobile = () => {
    setMobileOpen(prev => !prev)
  }

  // Group menu items by categories
  const mainItems = [
    {
      title: t("Dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
      show: true,
    },
  ]
  
  const jobItems = [
    {
      title: t("My Jobs"),
      icon: Briefcase,
      href: "/dashboard/jobs",
      show: userRole === "recruiter",
    },
    {
      title: t("Post Job"),
      icon: PlusCircle,
      href: "/dashboard/post-job",
      show: userRole === "recruiter",
    },
    {
      title: t("Find Jobs"),
      icon: Briefcase,
      href: "/dashboard/find-jobs",
      show: userRole === "candidate",
    },
    {
      title: t("Applications"),
      icon: Briefcase,
      href: "/dashboard/applications",
      show: userRole === "candidate",
    },
    {
      title: t("Candidates"),
      icon: Users,
      href: "/dashboard/candidates",
      show: userRole === "recruiter",
    },
  ]
  
  const communicationItems = [
    {
      title: t("Messages"),
      icon: MessageSquare,
      href: "/dashboard/messages",
      show: true,
      badge: unreadMessages > 0 ? unreadMessages : null,
      badgeColor: "bg-red-500 hover:bg-red-600 text-white font-semibold", // Removed animate-pulse to eliminate flickering
      badgeTooltip: unreadMessages === 1 ? "1 unread message" : `${unreadMessages} unread messages`,
      hasUnread: unreadMessages > 0,
    },
    {
      title: t("Notifications"),
      icon: Bell,
      href: "/dashboard/notifications",
      show: true,
      badge: unreadNotifications > 0 ? unreadNotifications : null,
      badgeColor: "bg-red-500 hover:bg-red-600 text-white font-semibold", // Removed animate-pulse to eliminate flickering
      badgeTooltip: unreadNotifications === 1 ? "1 unread notification" : `${unreadNotifications} unread notifications`,
      hasUnread: unreadNotifications > 0,
    },
  ]
  
  const otherItems = [
    {
      title: t("Learning Path"),
      icon: BookOpen,
      href: "/dashboard/learning",
      show: true,
    },
    {
      title: t("Ratings & Reviews"),
      icon: Star,
      href: "/dashboard/ratings",
      show: true,
    },
    {
      title: t("Report Issue"),
      icon: AlertTriangle,
      href: "/dashboard/reports",
      show: true,
    },
    {
      title: t("Admin"),
      icon: Settings,
      href: "/dashboard/admin",
      show: userRole === "admin",
    },
  ]

  const profileItems = [
    {
      title: t("Profile"),
      icon: User,
      href: "/dashboard/profile",
    },
    {
      title: t("Settings"),
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
  
  // Render menu section for expanded view
  const renderMenuSection = (
    items: any[], 
    sectionKey: keyof typeof collapsibleStates, 
    sectionTitle: string
  ) => {
    const filteredItems = filterItems(items)
    if (filteredItems.length === 0) return null
    
    return (
      <Collapsible 
        open={!collapsed && collapsibleStates[sectionKey]} 
        className={cn("mb-4", collapsed && "mb-2")}
      >
        <CollapsibleTrigger
          onClick={() => !collapsed && toggleSection(sectionKey)}
          className={cn(
            "flex w-full items-center justify-between py-2 px-3 text-sm font-medium uppercase tracking-wider text-gray-600 hover:text-black rounded-md group",
            collapsed ? "bg-transparent pointer-events-none" : "bg-gray-50/50"
          )}
        >
          <span className={cn("transition-opacity duration-200", collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto")}>{sectionTitle}</span>
          <div className={cn("h-5 w-5 flex items-center justify-center transition-opacity duration-200", collapsed ? "opacity-0" : "opacity-100")}>
            {collapsibleStates[sectionKey] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className={cn("mt-2 space-y-1", collapsed && "mt-0")}>
            {filteredItems.map((item) => (
              <SidebarMenuItem key={item.href} className="px-0.5 py-0.5">
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
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
                            <item.icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")} />
                            <span className={cn(
                              "font-medium transition-all duration-200", 
                              collapsed ? "w-0 opacity-0 absolute" : "w-auto opacity-100 relative"
                            )}>
                              {item.title}
                            </span>                          </div>                          <AnimatePresence>
                            {item.badge && (                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }} 
                                animate={{ 
                                  scale: [1, 1.1, 1],
                                  opacity: 1
                                }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ 
                                  duration: 0.5, 
                                  repeat: item.hasUnread ? Infinity : 0,
                                  repeatType: "reverse",
                                  repeatDelay: 2
                                }}
                              >
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className={cn(
                                        "transition-all duration-200 font-bold", 
                                        collapsed ? "opacity-0 absolute" : "opacity-100 relative",
                                        item.badgeColor || "bg-secondary"
                                      )}>
                                        {item.badge}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                      <p>{item.badgeTooltip || `${item.badge} unread items`}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>                    {collapsed && (
                      <TooltipContent side="right" className="z-50">
                        <div className="flex flex-col">
                          <span>{item.title}</span>                          <AnimatePresence>
                            {item.badge && (
                              <motion.span
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
                                className={cn(
                                  "text-xs font-bold",
                                  item.hasUnread ? "text-red-500" : "text-gray-500"
                                )}
                              >
                                {item.badgeTooltip || `${item.badge} unread`}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenuItem>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }
  
  // Mobile menu button for small screens
  const MobileTrigger = () => (
    <Button 
      variant="outline" 
      size="icon" 
      className="fixed top-4 left-4 z-50 md:hidden border-2 border-black bg-white"
      onClick={toggleMobile}
    >
      {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  )
  
  // Calculate sidebar width based on collapsed state
  const sidebarWidth = collapsed ? "w-14" : "w-64"
  const sidebarClass = cn(
    "border-r-2 border-black overflow-hidden",
    // Mobile styles
    "fixed left-0 top-0 h-full z-40 bg-white transform md:translate-x-0",
    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
  )
  
  // Content margin based on sidebar state - only apply on desktop
  const contentMargin = "md:ml-0" // We'll handle this with Framer Motion now
    
  return (
    <>
      <MobileTrigger />
      
      <motion.div 
        className={cn(
          sidebarClass,
          "flex flex-col h-full"
        )}
        animate={{ 
          width: collapsed ? "3.5rem" : "16rem" 
        }}
        transition={{ 
          duration: 0.3, 
          ease: "easeInOut" 
        }}
      >
        <SidebarHeader className="border-b-2 border-black py-5 px-4 flex justify-between items-center flex-shrink-0">
          {!collapsed && (
            <Link href="/" className="flex items-center justify-center gap-2">
              <span className="font-bold text-2xl">Kaaj</span>
            </Link>
          )}
          {collapsed && (
            <div className="w-8">
              {/* Empty placeholder for layout when collapsed */}
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCollapse} 
            className="hover:bg-yellow-100"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </SidebarHeader>
        
        <SidebarContent className={cn("px-4 py-4 overflow-y-auto flex-grow", collapsed ? "flex flex-col items-center px-1" : "")}>
          {/* Search input - hide when collapsed */}
          {!collapsed && (
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
          )}
          
          <SidebarMenu className={cn("space-y-2", collapsed ? "w-full" : "")}>
            {renderMenuSection(mainItems, "main", t("main") || "Main")}
            {renderMenuSection(jobItems, "jobs", t("jobsAndCandidates") || "Jobs & Candidates")}
            {renderMenuSection(communicationItems, "communication", t("communication") || "Communication")}
            {renderMenuSection(otherItems, "other", t("other") || "Other")}
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className={cn(
          "border-t-2 border-black px-4 py-4",
          collapsed ? "flex flex-col items-center" : "",
          "flex flex-col justify-between mt-auto"
        )}>
          <div className="flex-grow">
            <SidebarMenu className="space-y-1 w-full">
              {profileItems.map((item) => (
                <SidebarMenuItem key={item.href} className="px-0.5 py-0.5">
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.href)}
                          className="border-l-4 border-transparent hover:border-black data-[active=true]:border-black data-[active=true]:bg-yellow-300 transition-all duration-200 rounded w-full"
                        >
                          <Link href={item.href} className={cn("px-3 py-2 w-full flex items-center", collapsed && "justify-center")}>
                            <item.icon className={cn("h-5 w-5", collapsed ? "mx-0" : "mr-3")} />
                            <span className={cn(
                              "font-medium transition-all duration-200", 
                              collapsed ? "w-0 opacity-0 absolute" : "w-auto opacity-100 relative"
                            )}>
                              {item.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right" className="z-50">
                          <span>{item.title}</span>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem className="px-0.5 py-0.5">
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        onClick={() => signOut()} 
                        className={cn("border-l-4 border-transparent hover:border-black hover:text-red-600 transition-all duration-200 rounded px-3 py-2 w-full", 
                          collapsed && "flex justify-center")}
                      >
                        <LogOut className={cn("h-5 w-5", collapsed ? "mx-0" : "mr-3")} />
                        <span className={cn(
                          "font-medium transition-all duration-200", 
                          collapsed ? "w-0 opacity-0 absolute" : "w-auto opacity-100 relative"
                        )}>
                          {t("Sign Out")}
                        </span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="z-50">
                        <span>{t("signOut")}</span>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
          
            {user && !collapsed && (
              <div className="mt-6 py-3 px-3 border-t-2 border-black/10 rounded-md bg-yellow-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center border-2 border-black/10">
                    {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.displayName || "User"}</p>
                    <p className="text-xs text-gray-600 capitalize">{userRole || "User"}</p>
                  </div>
                </div>
              </div>
            )}

            {user && collapsed && (
              <div className="mt-6">
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div className="w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center border-2 border-black/10 cursor-pointer">
                        {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="z-50 p-2">
                      <div>
                        <p className="text-sm font-medium">{user.displayName || "User"}</p>
                        <p className="text-xs text-gray-600 capitalize">{userRole || "User"}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
        </SidebarFooter>
      </motion.div>
        {/* Main content container with adjusted margin */}
      <motion.div 
        className={cn(contentMargin, "pt-14 md:pt-0")}
        animate={{ 
          marginLeft: collapsed ? "3.5rem" : "16rem" 
        }}
        transition={{ 
          duration: 0.3, 
          ease: "easeInOut" 
        }}
      >
        {/* Page content goes here */}
      </motion.div>
      
      {/* Overlay for mobile menu */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden" 
          onClick={toggleMobile}
        />
      )}
    </>
  )
}