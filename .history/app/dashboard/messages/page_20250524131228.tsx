"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Send, User, Search, X, Loader2, Phone, Video, PhoneOff, MoreVertical, Archive, Trash2, Pin, Smile, MessageCircle, Clock, CheckCheck, Check, PlusCircle } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { motion, AnimatePresence } from "framer-motion"
import { isToday, isYesterday, format, formatDistanceToNow } from "date-fns"

// Enhanced types
interface Message {
  id: string
  content: string
  senderId: string
  timestamp: any
  read: boolean
}

interface Conversation {
  id: string
  participants: string[]
  participantNames: Record<string, string>
  lastMessage: string
  lastMessageSenderId: string
  lastMessageTimeDate: any
  lastMessageRead: boolean
  jobId?: string
  jobTitle?: string
  isPinned?: boolean
  isArchived?: boolean
  unreadCount?: number
}

// Zego Cloud types
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any
  }
}

export default function EnhancedMessages() {
  const {
    user,
    getConversations,
    getMessages,
    sendMessage,
    createConversation,
    markAllConversationMessagesAsRead,
  } = useFirebase()

  // State management
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [processingRecipient, setProcessingRecipient] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // Call state
  const [callType, setCallType] = useState<"audio" | "video" | null>(null)
  const [callActive, setCallActive] = useState(false)
  const [callRecipient, setCallRecipient] = useState<any>(null)
  const [zegoInstance, setZegoInstance] = useState<any>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const zegoContainerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Zego Cloud configuration
  const ZEGO_APP_ID = 1179547342
  const ZEGO_SERVER_SECRET = "4b1d0991e55d2bfa10d0f452e1951fce"

  // Enhanced conversation utilities
  const ensureParticipantNames = useCallback((conversation: Conversation): Conversation => {
    if (!conversation) return conversation

    const conversationCopy = { ...conversation }
    if (!conversationCopy.participantNames) {
      conversationCopy.participantNames = {}
    }

    if (conversationCopy.participants) {
      for (const participantId of conversationCopy.participants) {
        if (!conversationCopy.participantNames[participantId]) {
          conversationCopy.participantNames[participantId] = `User ${participantId.substring(0, 8)}`
        }
      }
    }

    return conversationCopy
  }, [])

  const getOtherParticipantName = useCallback(
    (conversation: Conversation) => {
      if (!conversation?.participants) return "Unknown User"

      const otherParticipantId = conversation.participants.find((id: string) => id !== user?.uid)
      if (!otherParticipantId || !conversation.participantNames?.[otherParticipantId]) {
        return otherParticipantId ? `User ${otherParticipantId.substring(0, 8)}` : "Unknown User"
      }

      return conversation.participantNames[otherParticipantId]
    },
    [user?.uid],
  )

  // Enhanced time formatting
  const formatMessageTime = useCallback((timestamp: any) => {
    if (!timestamp) return ""

    try {
      let date = timestamp
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate()
      } else if (!(timestamp instanceof Date)) {
        date = new Date(timestamp)
      }

      if (isNaN(date.getTime())) return ""

      if (isToday(date)) {
        return format(date, "HH:mm")
      } else if (isYesterday(date)) {
        return "Yesterday"
      } else {
        return format(date, "MMM dd")
      }
    } catch (error) {
      console.error("Error formatting timestamp:", error)
      return ""
    }
  }, [])

  const formatLastSeen = useCallback((timestamp: any) => {
    if (!timestamp) return ""

    try {
      let date = timestamp
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate()
      } else if (!(timestamp instanceof Date)) {
        date = new Date(timestamp)
      }

      if (isNaN(date.getTime())) return ""

      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return ""
    }
  }, [])

  // Load Zego Cloud SDK
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js"
    script.async = true
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // Handle recipient query parameter
  useEffect(() => {
    const handleRecipientParam = async () => {
      try {
        const recipientId = searchParams.get("recipient")
        if (!recipientId || !user || processingRecipient) return

        setProcessingRecipient(true)
        await createConversation(recipientId, "", "")

        const data = await getConversations()
        const updatedData = data.map(ensureParticipantNames)
        setConversations(updatedData)
        setFilteredConversations(updatedData)

        const recipientConversation = updatedData.find((convo) => convo.participants.includes(recipientId))

        if (recipientConversation) {
          setSelectedConversation(recipientConversation)
        }
      } catch (error) {
        console.error("Error processing recipient parameter:", error)
      } finally {
        setProcessingRecipient(false)
      }
    }

    if (!loading && user) {
      handleRecipientParam()
    }
  }, [searchParams, user, loading, createConversation, getConversations, ensureParticipantNames])

  // Fetch conversations with enhanced sorting
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations()
        const updatedData = data.map(ensureParticipantNames)

        // Enhanced sorting: pinned first, then unread, then by last message time
        const sortedData = updatedData.sort((a, b) => {
          // Pinned conversations first
          if (a.isPinned && !b.isPinned) return -1
          if (!a.isPinned && b.isPinned) return 1

          // Then unread conversations
          const aUnread = a.lastMessageSenderId !== user?.uid && !a.lastMessageRead
          const bUnread = b.lastMessageSenderId !== user?.uid && !b.lastMessageRead
          if (aUnread && !bUnread) return -1
          if (!aUnread && bUnread) return 1

          // Finally by last message time
          const aTime = a.lastMessageTimeDate?.toDate?.() || new Date(a.lastMessageTimeDate || 0)
          const bTime = b.lastMessageTimeDate?.toDate?.() || new Date(b.lastMessageTimeDate || 0)
          return bTime.getTime() - aTime.getTime()
        })

        setConversations(sortedData)
        setFilteredConversations(sortedData)

        if (sortedData.length > 0 && !selectedConversation) {
          setSelectedConversation(sortedData[0])
        }
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [getConversations, selectedConversation, ensureParticipantNames, user?.uid])

  // Enhanced search with debouncing and better filtering
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredConversations(conversations)
        return
      }

      const query = searchQuery.toLowerCase().trim()
      const filtered = conversations.filter((conversation) => {
        const convo = ensureParticipantNames(conversation)
        const otherParticipantName = getOtherParticipantName(convo).toLowerCase()
        const lastMessage = (convo.lastMessage || "").toLowerCase()
        const jobTitle = (convo.jobTitle || "").toLowerCase()

        return (
          otherParticipantName.includes(query) ||
          lastMessage.includes(query) ||
          jobTitle.includes(query) ||
          query.split(" ").every((word) => otherParticipantName.includes(word))
        )
      })

      setFilteredConversations(filtered)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, conversations, ensureParticipantNames, getOtherParticipantName])

  // Enhanced messages listener with better read status management
  useEffect(() => {
    let unsubscribe = () => {}
    let readStatusUpdateTimeout: NodeJS.Timeout | null = null

    if (selectedConversation) {
      unsubscribe = getMessages(selectedConversation.id, (data) => {
        setMessages(data)

        if (readStatusUpdateTimeout) {
          clearTimeout(readStatusUpdateTimeout)
        }

        const hasUnreadFromOthers = data.some((msg) => msg.senderId !== user?.uid && msg.read === false)

        if (hasUnreadFromOthers) {
          readStatusUpdateTimeout = setTimeout(() => {
            updateConversationReadStatus(selectedConversation.id, true)
            markAllConversationMessagesAsRead(selectedConversation.id).catch((error) => {
              console.error("Error marking conversation messages as read:", error)
            })
          }, 1000)
        }
      })
    }

    return () => {
      if (readStatusUpdateTimeout) {
        clearTimeout(readStatusUpdateTimeout)
      }
      unsubscribe()
    }
  }, [selectedConversation, getMessages, user, markAllConversationMessagesAsRead])

  // Auto-scroll to bottom with smooth animation
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, 100)

    return () => clearTimeout(timer)
  }, [messages])

  // Enhanced typing indicator
  const handleTyping = useCallback((value: string) => {
    setNewMessage(value)
    setIsTyping(value.length > 0)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 2000)
  }, [])

  // Enhanced message sending with optimistic updates
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !selectedConversation || sending) return

    const messageContent = newMessage.trim()
    const tempId = `temp-${Date.now()}`

    // Optimistic update
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      senderId: user?.uid || "",
      timestamp: new Date(),
      read: false,
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setNewMessage("")
    setIsTyping(false)
    setSending(true)

    try {
      const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)
      if (!recipientId) {
        throw new Error("Could not find recipient ID")
      }

      await sendMessage(recipientId, messageContent, selectedConversation.jobId, selectedConversation.jobTitle)
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      // Restore message content
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  // Conversation actions
  const updateConversationReadStatus = useCallback(
    (conversationId: string, isRead: boolean) => {
      const updateConvo = (conversation: Conversation) => {
        if (conversation.id === conversationId) {
          return {
            ...conversation,
            lastMessageRead: isRead,
            unreadCount: isRead ? 0 : conversation.unreadCount,
          }
        }
        return conversation
      }

      if (selectedConversation && selectedConversation.id === conversationId) {
        setSelectedConversation((prev) => (prev ? updateConvo(prev) : null))
      }

      setConversations((prev) => prev.map(updateConvo))
      setFilteredConversations((prev) => prev.map(updateConvo))
    },
    [selectedConversation],
  )

  // Enhanced calling functionality
  const initiateCall = useCallback(
    (type: "audio" | "video") => {
      if (!selectedConversation || !window.ZegoUIKitPrebuilt) return

      const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)
      if (!recipientId) {
        console.error("Could not find recipient ID")
        return
      }

      setCallType(type)
      setCallRecipient({
        id: recipientId,
        name: getOtherParticipantName(selectedConversation),
      })
      setCallActive(true)

      const roomID = `room_${selectedConversation.id}`
      const userID = user?.uid || Math.floor(Math.random() * 10000).toString()
      const userName = user?.displayName || `User ${userID.substring(0, 5)}`

      const kitToken = window.ZegoUIKitPrebuilt.generateKitTokenForTest(
        ZEGO_APP_ID,
        ZEGO_SERVER_SECRET,
        roomID,
        userID,
        userName,
      )

      setTimeout(() => {
        if (zegoContainerRef.current && window.ZegoUIKitPrebuilt) {
          const zp = window.ZegoUIKitPrebuilt.create(kitToken)
          setZegoInstance(zp)

          zp.joinRoom({
            container: zegoContainerRef.current,
            scenario: {
              mode: type === "video" ? window.ZegoUIKitPrebuilt.VideoCall : window.ZegoUIKitPrebuilt.VoiceCall,
            },
            turnOnMicrophoneWhenJoining: true,
            turnOnCameraWhenJoining: type === "video",
            showMyCameraToggleButton: type === "video",
            showMyMicrophoneToggleButton: true,
            showAudioVideoSettingsButton: true,
            showScreenSharingButton: type === "video",
            showTextChat: false,
            showUserList: false,
            maxUsers: 2,
            layout: "Auto",
            showLayoutButton: false,
            onJoinRoom: () => console.log("Joined Zego room successfully"),
            onLeaveRoom: () => endCall(),
          })
        }
      }, 100)
    },
    [selectedConversation, user, getOtherParticipantName],
  )

  const endCall = useCallback(() => {
    if (zegoInstance) {
      try {
        zegoInstance.destroy()
      } catch (error) {
        console.error("Error destroying Zego instance:", error)
      }
    }

    setCallActive(false)
    setCallType(null)
    setCallRecipient(null)
    setZegoInstance(null)
  }, [zegoInstance])

  // Memoized conversation item for performance
  const ConversationItem = useMemo(
    () =>
      ({ conversation }: { conversation: Conversation }) => {
        const isSelected = selectedConversation?.id === conversation.id
        const hasUnread = conversation.lastMessageSenderId !== user?.uid && !conversation.lastMessageRead
        const otherParticipantName = getOtherParticipantName(conversation)
        const unreadCount = hasUnread ? (conversation.unreadCount || 1) : 0

        return (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "flex items-center gap-3 p-4 cursor-pointer transition-all duration-300 relative group rounded-xl mx-2 my-1",
              isSelected
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-lg"
                : "hover:bg-gray-50 hover:shadow-md",
              hasUnread && "bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300",
              conversation.isPinned && "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200",
            )}
            onClick={async () => {
              const updatedConversation = ensureParticipantNames(conversation)
              setSelectedConversation(updatedConversation)

              if (hasUnread) {
                updateConversationReadStatus(conversation.id, true)
                try {
                  await markAllConversationMessagesAsRead(conversation.id)
                } catch (error) {
                  console.error("Error marking conversation as read:", error)
                }
              }
            }}
          >
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-white shadow-lg ring-2 ring-gray-100">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                  {otherParticipantName.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              {conversation.isPinned && (
                <Pin className="absolute -top-1 -right-1 w-4 h-4 text-amber-600 fill-amber-300 drop-shadow-sm" />
              )}
              {hasUnread && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3
                  className={cn(
                    "font-semibold truncate text-sm",
                    hasUnread ? "text-gray-900" : "text-gray-700",
                    isSelected && "text-blue-900",
                  )}
                >
                  {otherParticipantName}
                </h3>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatMessageTime(conversation.lastMessageTimeDate)}
                  </span>
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center"
                    >
                      <Badge
                        variant="destructive"
                        className="h-5 min-w-[20px] px-1.5 text-xs rounded-full bg-blue-500 hover:bg-blue-500 text-white"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </div>

              <p
                className={cn(
                  "text-sm truncate leading-relaxed",
                  hasUnread ? "text-gray-800 font-medium" : "text-gray-600",
                )}
              >
                {conversation.lastMessage || "No messages yet"}
              </p>

              {conversation.jobTitle && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <p className="text-xs text-gray-500 truncate">{conversation.jobTitle}</p>
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-gray-200 rounded-full"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="flex items-center gap-2">
                  <Pin className="h-4 w-4" />
                  {conversation.isPinned ? "Unpin" : "Pin"} Conversation
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )
      },
    [
      selectedConversation,
      user,
      getOtherParticipantName,
      ensureParticipantNames,
      updateConversationReadStatus,
      markAllConversationMessagesAsRead,
      formatMessageTime,
    ],
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
              <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-blue-200 opacity-20"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Messages</h3>
              <p className="text-gray-600">Connecting to your conversations...</p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const totalUnreadCount = conversations.filter(
    (c) => c.lastMessageSenderId !== user?.uid && !c.lastMessageRead,
  ).length

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              Messages
              {totalUnreadCount > 0 && (
                <Badge variant="destructive" className="text-sm px-3 py-1 bg-blue-500">
                  {totalUnreadCount} new
                </Badge>
              )}
            </h1>
            <p className="text-gray-600 text-lg">Stay connected with your professional network</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Enhanced Conversations List */}
        <Card className="lg:col-span-1 h-full overflow-hidden flex flex-col shadow-xl bg-white border-0 rounded-2xl">
          <CardHeader className="px-6 py-5 border-b bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-gray-800 flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                Conversations
                {totalUnreadCount > 0 && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {totalUnreadCount} unread
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>

          <div className="p-4 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus-visible:ring-blue-500 bg-white shadow-sm rounded-xl"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <AnimatePresence mode="popLayout">
              {filteredConversations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full p-8 text-center"
                >
                  {searchQuery ? (
                    <>
                      <Search className="h-20 w-20 text-gray-300 mb-6" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-3">No matching conversations</h3>
                      <p className="text-sm text-gray-500 mb-6 max-w-sm">
                        We couldn't find any conversations matching "{searchQuery}". Try a different search term.
                      </p>
                      <Button
                        onClick={() => setSearchQuery("")}
                        variant="outline"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 mr-2" /> Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-20 w-20 text-gray-300 mb-6" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-3">No conversations yet</h3>
                      <p className="text-sm text-gray-500 max-w-sm">
                        Start networking and connecting with professionals to see your conversations here.
                      </p>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="py-2">
                  {filteredConversations.map((conversation) => (
                    <ConversationItem key={conversation.id} conversation={conversation} />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </Card>

        {/* Enhanced Messages Panel */}
        <Card className="lg:col-span-2 h-full overflow-hidden flex flex-col shadow-xl bg-white border-0 rounded-2xl">
          {selectedConversation ? (
            <>
              <CardHeader className="px-6 py-5 border-b bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-lg ring-2 ring-gray-100">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-800">
                        {getOtherParticipantName(selectedConversation)}
                      </CardTitle>
                      {selectedConversation.jobTitle && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          {selectedConversation.jobTitle}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Last seen {formatLastSeen(selectedConversation.lastMessageTimeDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => initiateCall("audio")}
                            variant="outline"
                            size="sm"
                            className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700 shadow-sm rounded-xl"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Start audio call</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => initiateCall("video")}
                            variant="outline"
                            size="sm"
                            className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700 shadow-sm rounded-xl"
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Start video call</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-white to-gray-50">
                <AnimatePresence>
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center py-20"
                    >
                      <div className="relative mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <Send className="h-10 w-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-black text-xs">✨</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-700 mb-3">Start the conversation</h3>
                      <p className="text-gray-500 max-w-md">
                        Send a message to {getOtherParticipantName(selectedConversation)} and begin your professional
                        conversation.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-6">
                      {messages.map((message, index) => {
                        const isSender = message.senderId === user?.uid
                        const showReadStatus = isSender && typeof message.read !== "undefined"
                        const prevMessage = messages[index - 1]
                        const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId
                        const isOptimistic = message.id.startsWith("temp-")

                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={cn("flex gap-3", isSender ? "justify-end" : "justify-start")}
                          >
                            {!isSender && showAvatar && (
                              <Avatar className="h-8 w-8 border border-gray-200 shadow-sm">
                                <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-semibold">
                                  {getOtherParticipantName(selectedConversation).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {!isSender && !showAvatar && <div className="w-8" />}

                            <div className={cn("max-w-[75%] group", isSender && "order-first")}>
                              <div
                                className={cn(
                                  "px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 relative",
                                  isSender
                                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md"
                                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-md",
                                  "hover:shadow-md transform hover:scale-[1.02]",
                                  isOptimistic && "opacity-70",
                                )}
                              >
                                <div className="break-words leading-relaxed">{message.content}</div>
                                <div className="flex justify-between items-center mt-2">
                                  <div className={cn("text-xs", isSender ? "text-white/70" : "text-gray-500")}>
                                    {formatMessageTime(message.timestamp)}
                                  </div>

                                  {showReadStatus && !isOptimistic && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="flex items-center gap-1 ml-3"
                                    >
                                      {message.read ? (
                                        <div className="flex items-center gap-1 text-green-300">
                                          <CheckCheck className="h-3 w-3" />
                                          <span className="text-xs">Read</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 text-white/50">
                                          <Check className="h-3 w-3" />
                                          <span className="text-xs">Sent</span>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}

                                  {isOptimistic && (
                                    <div className="flex items-center gap-1 ml-3 text-white/50">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span className="text-xs">Sending...</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>

              <Separator />

              <div className="p-6 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      className="pr-16 border-gray-200 focus-visible:ring-blue-500 bg-gray-50 rounded-full py-3 px-4 text-sm shadow-sm"
                      disabled={sending}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage(e)
                        }
                      }}
                    />

                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                          >
                            <Smile className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 border-gray-200 shadow-xl rounded-2xl">
                          <div className="grid grid-cols-8 gap-2 p-3">
                            {[
                              "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
                              "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
                              "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
                              "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏",
                              "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙",
                              "👏", "🙌", "🤝", "🙏", "❤️", "🧡", "💛", "💚",
                              "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕",
                              "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🔥",
                              "💯", "💢", "💥", "💫", "💦", "💨", "💣", "💬",
                            ].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className="p-2 hover:bg-gray-100 rounded-lg text-lg transition-colors hover:scale-110 transform"
                                onClick={() => setNewMessage((prev) => prev + emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-12 w-12 p-0 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </form>

                {isTyping && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xs text-gray-500 mt-2 flex items-center gap-2"
                  >
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0 }}
                        className="w-1 h-1 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.2 }}
                        className="w-1 h-1 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.4 }}
                        className="w-1 h-1 bg-gray-400 rounded-full"
                      />
                    </div>
                    You are typing...
                  </motion.p>
                )}
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-b from-white to-gray-50"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <MessageCircle className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black text-sm">💬</span>
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">Select a conversation</h3>
              <p className="text-gray-500 max-w-md">
                Choose a conversation from the list to start messaging and build meaningful professional connections.
              </p>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Enhanced Call Dialog */}
      <Dialog open={callActive} onOpenChange={(open) => !open && endCall()}>
        <DialogContent className="sm:max-w-[900px] md:max-w-[1100px] lg:max-w-[1300px] h-[85vh] p-0 border-0 rounded-2xl">
          <DialogHeader className="p-6 pb-0 bg-gradient-to-r from-gray-50 to-white">
            <DialogTitle className="flex items-center gap-3 text-xl">
              {callType === "audio" ? (
                <div className="p-2 bg-green-100 rounded-full">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-blue-100 rounded-full">
                  <Video className="h-5 w-5 text-blue-600" />
                </div>
              )}
              {callType === "audio" ? "Audio Call" : "Video Call"} with {callRecipient?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              High-quality {callType} call powered by Zego Cloud
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 p-6 pt-0">
            <div
              ref={zegoContainerRef}
              className="w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl"
              style={{ minHeight: "500px" }}
            />
          </div>

          <div className="flex justify-center p-6 pt-0 bg-gradient-to-r from-gray-50 to-white">
            <Button
              onClick={endCall}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              End Call
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
