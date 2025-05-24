"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Send, User, Search, X, Loader2, Phone, Video, PhoneOff, MoreVertical, Archive, Trash2, Pin, Smile, Paperclip, ImageIcon, Mic, MicOff } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns"

// Enhanced types
interface Message {
  id: string
  content: string
  senderId: string
  timestamp: any
  read: boolean
  type?: 'text' | 'image' | 'file' | 'audio'
  attachments?: any[]
  reactions?: Record<string, string[]>
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
    deleteConversation,
    archiveConversation,
    pinConversation
  } = useFirebase()

  // State management
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [processingRecipient, setProcessingRecipient] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [isRecording, setIsRecording] = useState(false)
  
  // Call state
  const [callType, setCallType] = useState<"audio" | "video" | null>(null)
  const [callActive, setCallActive] = useState(false)
  const [callRecipient, setCallRecipient] = useState<any>(null)
  const [zegoInstance, setZegoInstance] = useState<any>(null)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const zegoContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()

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
          conversationCopy.participantNames[participantId] = `User ${participantId.substring(0, 5)}...`
        }
      }
    }

    return conversationCopy
  }, [])

  const getOtherParticipantName = useCallback((conversation: Conversation) => {
    if (!conversation?.participants) return "Unknown User"
    
    const otherParticipantId = conversation.participants.find((id: string) => id !== user?.uid)
    if (!otherParticipantId || !conversation.participantNames?.[otherParticipantId]) {
      return otherParticipantId ? `User ${otherParticipantId.substring(0, 5)}...` : "Unknown User"
    }
    
    return conversation.participantNames[otherParticipantId]
  }, [user?.uid])

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

        const recipientConversation = updatedData.find((convo) => 
          convo.participants.includes(recipientId)
        )

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

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations()
        const updatedData = data.map(ensureParticipantNames)
        
        // Sort conversations: pinned first, then by last message time
        const sortedData = updatedData.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1
          if (!a.isPinned && b.isPinned) return 1
          
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
  }, [getConversations, selectedConversation, ensureParticipantNames])

  // Enhanced search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchQuery) {
        setFilteredConversations(conversations)
        return
      }

      const query = searchQuery.toLowerCase()
      const filtered = conversations.filter((conversation) => {
        const convo = ensureParticipantNames(conversation)
        const otherParticipantName = getOtherParticipantName(convo).toLowerCase()
        const lastMessage = (convo.lastMessage || "").toLowerCase()
        const jobTitle = (convo.jobTitle || "").toLowerCase()

        return otherParticipantName.includes(query) || 
               lastMessage.includes(query) || 
               jobTitle.includes(query)
      })

      setFilteredConversations(filtered)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, conversations, ensureParticipantNames, getOtherParticipantName])

  // Messages listener with enhanced read status management
  useEffect(() => {
    let unsubscribe = () => {}
    let readStatusUpdateTimeout: NodeJS.Timeout | null = null

    if (selectedConversation) {
      unsubscribe = getMessages(selectedConversation.id, (data) => {
        setMessages(data)

        if (readStatusUpdateTimeout) {
          clearTimeout(readStatusUpdateTimeout)
        }

        const hasUnreadFromOthers = data.some(
          (msg) => msg.senderId !== user?.uid && msg.read === false
        )

        if (hasUnreadFromOthers) {
          readStatusUpdateTimeout = setTimeout(() => {
            updateConversationReadStatus(selectedConversation.id, true)
            markAllConversationMessagesAsRead(selectedConversation.id).catch((error) => {
              console.error("Error marking conversation messages as read:", error)
            })
          }, 500)
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Enhanced message sending with typing indicators
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !selectedConversation) return

    const messageContent = newMessage
    setNewMessage("")
    setIsTyping(false)

    try {
      const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)
      if (!recipientId) {
        console.error("Could not find recipient ID")
        return
      }

      await sendMessage(recipientId, messageContent, selectedConversation.jobId, selectedConversation.jobTitle)
    } catch (error) {
      console.error("Error sending message:", error)
      // Restore message on error
      setNewMessage(messageContent)
    }
  }

  // Conversation actions
  const updateConversationReadStatus = useCallback((conversationId: string, isRead: boolean) => {
    const updateConvo = (conversation: Conversation) => {
      if (conversation.id === conversationId) {
        return {
          ...conversation,
          lastMessageRead: isRead,
          unreadCount: isRead ? 0 : conversation.unreadCount
        }
      }
      return conversation
    }

    if (selectedConversation && selectedConversation.id === conversationId) {
      setSelectedConversation((prev) => prev ? updateConvo(prev) : null)
    }

    setConversations((prev) => prev.map(updateConvo))
    setFilteredConversations((prev) => prev.map(updateConvo))
  }, [selectedConversation])

  const handlePinConversation = async (conversationId: string) => {
    try {
      await pinConversation?.(conversationId)
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, isPinned: !conv.isPinned } : conv
      ))
    } catch (error) {
      console.error("Error pinning conversation:", error)
    }
  }

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await archiveConversation?.(conversationId)
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null)
      }
    } catch (error) {
      console.error("Error archiving conversation:", error)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation?.(conversationId)
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null)
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
    }
  }

  // Enhanced calling functionality
  const initiateCall = useCallback((type: "audio" | "video") => {
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
  }, [selectedConversation, user, getOtherParticipantName])

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

  // Memoized components for performance
  const ConversationItem = useMemo(() => ({ conversation }: { conversation: Conversation }) => {
    const isSelected = selectedConversation?.id === conversation.id
    const hasUnread = conversation.lastMessageSenderId !== user?.uid && !conversation.lastMessageRead
    const otherParticipantName = getOtherParticipantName(conversation)
    const isOnline = onlineUsers.has(conversation.participants.find(id => id !== user?.uid) || '')

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 relative group",
          isSelected
            ? "bg-kaaj-100/80 border-l-4 border-kaaj-500"
            : "hover:bg-kaaj-50",
          hasUnread && "bg-blue-50/50",
          conversation.isPinned && "bg-yellow-50/30"
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
          <Avatar className="h-12 w-12 border-2 border-kaaj-100">
            <AvatarFallback className="bg-gradient-to-br from-kaaj-100 to-kaaj-200 text-kaaj-700 font-semibold">
              {otherParticipantName.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          )}
          {conversation.isPinned && (
            <Pin className="absolute -top-1 -right-1 w-4 h-4 text-yellow-600 fill-yellow-200" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <p className={cn(
              "font-medium truncate text-sm",
              hasUnread ? "text-kaaj-900 font-bold" : "text-kaaj-800"
            )}>
              {otherParticipantName}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-kaaj-500 whitespace-nowrap">
                {formatMessageTime(conversation.lastMessageTimeDate)}
              </span>
              {hasUnread && (
                <Badge variant="destructive" className="h-5 w-5 p-0 text-xs rounded-full">
                  {conversation.unreadCount || 1}
                </Badge>
              )}
            </div>
          </div>

          <p className={cn(
            "text-sm truncate",
            hasUnread ? "text-kaaj-900 font-medium" : "text-kaaj-600"
          )}>
            {conversation.lastMessage || "No messages yet"}
          </p>

          {conversation.jobTitle && (
            <p className="text-xs text-kaaj-500 truncate mt-1">
              💼 {conversation.jobTitle}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handlePinConversation(conversation.id)}>
              <Pin className="h-4 w-4 mr-2" />
              {conversation.isPinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleArchiveConversation(conversation.id)}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteConversation(conversation.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    )
  }, [selectedConversation, user, getOtherParticipantName, onlineUsers, ensureParticipantNames, updateConversationReadStatus, markAllConversationMessagesAsRead])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="h-12 w-12 animate-spin text-kaaj-500" />
            <p className="text-kaaj-600 font-medium">Loading your conversations...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-kaaj-800 mb-2">Messages</h1>
        <p className="text-kaaj-600">Stay connected with your professional network</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Enhanced Conversations List */}
        <Card className="border-kaaj-200 lg:col-span-1 h-full overflow-hidden flex flex-col shadow-lg">
          <CardHeader className="px-4 py-4 border-b border-kaaj-200 bg-gradient-to-r from-kaaj-50 to-kaaj-100">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-kaaj-800 flex items-center gap-2">
                💬 Conversations
                {conversations.filter(c => c.lastMessageSenderId !== user?.uid && !c.lastMessageRead).length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {conversations.filter(c => c.lastMessageSenderId !== user?.uid && !c.lastMessageRead).length}
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>

          <div className="p-4 border-b border-kaaj-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-kaaj-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-kaaj-300 focus-visible:ring-kaaj-500 bg-white"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full bg-kaaj-200 hover:bg-kaaj-300 flex items-center justify-center transition-colors"
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
                      <Search className="h-16 w-16 text-kaaj-300 mb-4" />
                      <h3 className="text-lg font-semibold text-kaaj-700 mb-2">No matching conversations</h3>
                      <p className="text-sm text-kaaj-500 mb-4">Try adjusting your search query</p>
                      <Button
                        onClick={() => setSearchQuery("")}
                        variant="outline"
                        className="border-kaaj-300 text-kaaj-600 hover:bg-kaaj-50"
                      >
                        <X className="h-4 w-4 mr-2" /> Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <User className="h-16 w-16 text-kaaj-300 mb-4" />
                      <h3 className="text-lg font-semibold text-kaaj-700 mb-2">No conversations yet</h3>
                      <p className="text-sm text-kaaj-500">
                        Start networking to see your conversations here
                      </p>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="divide-y divide-kaaj-100">
                  {filteredConversations.map((conversation) => (
                    <ConversationItem key={conversation.id} conversation={conversation} />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </Card>

        {/* Enhanced Messages Panel */}
        <Card className="border-kaaj-200 lg:col-span-2 h-full overflow-hidden flex flex-col shadow-lg">
          {selectedConversation ? (
            <>
              <CardHeader className="px-6 py-4 border-b border-kaaj-200 bg-gradient-to-r from-kaaj-50 to-kaaj-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-kaaj-200">
                        <AvatarFallback className="bg-gradient-to-br from-kaaj-100 to-kaaj-200 text-kaaj-700 font-semibold">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      {onlineUsers.has(selectedConversation.participants.find(id => id !== user?.uid) || '') && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-kaaj-800">
                        {getOtherParticipantName(selectedConversation)}
                      </CardTitle>
                      {selectedConversation.jobTitle && (
                        <p className="text-sm text-kaaj-600">💼 {selectedConversation.jobTitle}</p>
                      )}
                      {isTyping && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-kaaj-500 italic"
                        >
                          typing...
                        </motion.p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => initiateCall("audio")}
                            variant="outline"
                            size="sm"
                            className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
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
                            className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
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

              <ScrollArea className="flex-1 p-6">
                <AnimatePresence>
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center"
                    >
                      <Send className="h-16 w-16 text-kaaj-300 mb-4" />
                      <h3 className="text-lg font-semibold text-kaaj-700 mb-2">Start the conversation</h3>
                      <p className="text-sm text-kaaj-500">Send a message to break the ice</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isSender = message.senderId === user?.uid
                        const showReadStatus = isSender && typeof message.read !== "undefined"
                        const prevMessage = messages[index - 1]
                        const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId

                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn("flex gap-3", isSender ? "justify-end" : "justify-start")}
                          >
                            {!isSender && showAvatar && (
                              <Avatar className="h-8 w-8 border border-kaaj-200">
                                <AvatarFallback className="bg-kaaj-100 text-kaaj-700 text-sm">
                                  {getOtherParticipantName(selectedConversation).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {!isSender && !showAvatar && <div className="w-8" />}

                            <div className={cn("max-w-[70%] group", isSender && "order-first")}>
                              <div
                                className={cn(
                                  "px-4 py-3 rounded-2xl shadow-sm border transition-all duration-200",
                                  isSender
                                    ? "bg-kaaj-500 text-white border-kaaj-600 rounded-br-md"
                                    : "bg-white text-kaaj-800 border-kaaj-200 rounded-bl-md",
                                  "hover:shadow-md"
                                )}
                              >
                                <div className="break-words">{message.content}</div>
                                <div className="flex justify-between items-center mt-2">
                                  <div className={cn(
                                    "text-xs",
                                    isSender ? "text-white/70" : "text-kaaj-500"
                                  )}>
                                    {formatMessageTime(message.timestamp)}
                                  </div>

                                  {showReadStatus && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="flex items-center gap-1 ml-2"
                                    >
                                      <span className={cn(
                                        "text-xs flex items-center",
                                        message.read ? "text-green-300" : "text-white/50"
                                      )}>
                                        {message.read ? "✓✓" : "✓"}
                                      </span>
                                    </motion.div>
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

              <div className="p-4 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 text-kaaj-500 hover:text-kaaj-600 hover:bg-kaaj-50"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Attach file</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 text-kaaj-500 hover:text-kaaj-600 hover:bg-kaaj-50"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send image</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        setIsTyping(e.target.value.length > 0)
                      }}
                      className="pr-20 border-kaaj-300 focus-visible:ring-kaaj-500 bg-kaaj-50/50 rounded-full"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage(e)
                        }
                      }}
                    />
                    
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-kaaj-500 hover:text-kaaj-600"
                          >
                            <Smile className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="grid grid-cols-8 gap-2 p-2">
                            {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className="p-2 hover:bg-kaaj-100 rounded text-lg"
                                onClick={() => setNewMessage(prev => prev + emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 transition-colors",
                          isRecording ? "text-red-500 hover:text-red-600" : "text-kaaj-500 hover:text-kaaj-600"
                        )}
                        onClick={() => setIsRecording(!isRecording)}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-kaaj-500 hover:bg-kaaj-600 h-10 w-10 p-0 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*,application/pdf,.doc,.docx"
              />
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full p-8 text-center"
            >
              <User className="h-20 w-20 text-kaaj-300 mb-6" />
              <h3 className="text-xl font-semibold text-kaaj-700 mb-2">Select a conversation</h3>
              <p className="text-kaaj-500">Choose a conversation from the list to start messaging</p>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Enhanced Call Dialog */}
      <Dialog open={callActive} onOpenChange={(open) => !open && endCall()}>
        <DialogContent className="sm:max-w-[900px] md:max-w-[1100px] lg:max-w-[1300px] h-[85vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-3">
              {callType === "audio" ? (
                <Phone className="h-5 w-5 text-green-600" />
              ) : (
                <Video className="h-5 w-5 text-blue-600" />
              )}
              {callType === "audio" ? "Audio Call" : "Video Call"} with {callRecipient?.name}
            </DialogTitle>
            <DialogDescription>
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

          <div className="flex justify-center p-6 pt-0">
            <Button 
              onClick={endCall} 
              variant="destructive" 
              className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full shadow-lg"
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
