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
import { Send, User, Search, X, Loader2, Phone, Video, PhoneOff, MoreVertical, Archive, Trash2, Pin, Smile, MessageCircle, Clock, CheckCheck, Check, PlusCircle, Paperclip, Mic, ImageIcon, Heart, ThumbsUp, Laugh, Angry, FrownIcon as Sad, Reply, Star, Zap, Sparkles, Volume2, VolumeX, Settings, Filter, SortDesc } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion"
import { isToday, isYesterday, format, formatDistanceToNow } from "date-fns"

// Enhanced types with reactions and threading
interface MessageReaction {
  emoji: string
  users: string[]
  count: number
}

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: any
  read: boolean
  reactions?: MessageReaction[]
  replyTo?: string
  type?: 'text' | 'image' | 'voice' | 'file'
  isEdited?: boolean
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
  isTyping?: boolean
  lastSeen?: any
  isOnline?: boolean
}

// Zego Cloud types
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any
  }
}

export default function OutstandingMessages() {
  const { user, getConversations, getMessages, sendMessage, createConversation, markAllConversationMessagesAsRead } =
    useFirebase()

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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'pinned'>('all')

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
  const messageInputRef = useRef<HTMLInputElement>(null)

  // Animation values
  const messageCount = useSpring(0, { stiffness: 100, damping: 30 })
  const unreadCount = useTransform(messageCount, (value) => Math.round(value))

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

  // Enhanced search and filtering
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let filtered = conversations

      // Apply filter
      if (selectedFilter === 'unread') {
        filtered = filtered.filter(c => c.lastMessageSenderId !== user?.uid && !c.lastMessageRead)
      } else if (selectedFilter === 'pinned') {
        filtered = filtered.filter(c => c.isPinned)
      }

      // Apply search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        filtered = filtered.filter((conversation) => {
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
      }

      setFilteredConversations(filtered)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, conversations, selectedFilter, ensureParticipantNames, getOtherParticipantName, user?.uid])

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
      replyTo: replyingTo?.id,
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setNewMessage("")
    setIsTyping(false)
    setReplyingTo(null)
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

  // Message reactions
  const handleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || []
        const existingReaction = reactions.find(r => r.emoji === emoji)
        
        if (existingReaction) {
          if (existingReaction.users.includes(user?.uid || '')) {
            // Remove reaction
            existingReaction.users = existingReaction.users.filter(id => id !== user?.uid)
            existingReaction.count = existingReaction.users.length
            if (existingReaction.count === 0) {
              return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) }
            }
          } else {
            // Add reaction
            existingReaction.users.push(user?.uid || '')
            existingReaction.count = existingReaction.users.length
          }
        } else {
          // New reaction
          reactions.push({
            emoji,
            users: [user?.uid || ''],
            count: 1
          })
        }
        
        return { ...msg, reactions: [...reactions] }
      }
      return msg
    }))
  }, [user?.uid])

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
        const unreadCount = hasUnread ? conversation.unreadCount || 1 : 0

        return (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative flex items-center gap-4 p-4 cursor-pointer transition-all duration-500 rounded-2xl mx-3 my-2 group",
              "backdrop-blur-xl border border-white/20",
              isSelected
                ? "bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-pink-500/20 shadow-2xl shadow-purple-500/25 border-purple-300/30"
                : "hover:bg-gradient-to-r hover:from-blue-500/10 hover:via-purple-500/10 hover:to-pink-500/10 hover:shadow-xl hover:shadow-blue-500/20",
              hasUnread && "bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/15 border-blue-300/30",
              conversation.isPinned && "bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-orange-500/15 border-amber-300/30",
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
            {/* Animated background glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: isSelected 
                  ? "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))"
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))"
              }}
            />

            <div className="relative z-10 flex items-center gap-4 w-full">
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="relative"
                >
                  <Avatar className="h-14 w-14 border-2 border-white/30 shadow-xl ring-4 ring-white/10 backdrop-blur-sm">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white font-bold text-lg">
                      {otherParticipantName.charAt(0).toUpperCase() || <User className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Online status */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 border-3 border-white rounded-full shadow-lg"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-full h-full bg-green-400 rounded-full"
                    />
                  </motion.div>

                  {/* Pin indicator */}
                  {conversation.isPinned && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Pin className="w-3 h-3 text-white" />
                    </motion.div>
                  )}

                  {/* Unread pulse */}
                  {hasUnread && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                    />
                  )}
                </motion.div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <motion.h3
                    className={cn(
                      "font-bold truncate text-base",
                      hasUnread ? "text-gray-900" : "text-gray-700",
                      isSelected && "text-purple-900",
                    )}
                    whileHover={{ x: 2 }}
                  >
                    {otherParticipantName}
                  </motion.h3>
                  
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-xs text-gray-500 whitespace-nowrap font-medium">
                      {formatMessageTime(conversation.lastMessageTimeDate)}
                    </span>
                    {unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        className="flex items-center justify-center"
                      >
                        <Badge className="h-6 min-w-[24px] px-2 text-xs rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg border-0">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                </div>

                <p
                  className={cn(
                    "text-sm truncate leading-relaxed mb-1",
                    hasUnread ? "text-gray-800 font-semibold" : "text-gray-600",
                  )}
                >
                  {conversation.lastMessage || "No messages yet"}
                </p>

                {conversation.jobTitle && (
                  <motion.div 
                    className="flex items-center gap-2 mt-2"
                    whileHover={{ x: 2 }}
                  >
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                    <p className="text-xs text-gray-500 truncate font-medium">{conversation.jobTitle}</p>
                  </motion.div>
                )}

                {/* Typing indicator */}
                {conversation.isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-2"
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-blue-600 font-medium">typing...</span>
                  </motion.div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-all duration-300 h-8 w-8 p-0 hover:bg-white/20 rounded-full backdrop-blur-sm"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 backdrop-blur-xl bg-white/90 border border-white/20 shadow-2xl rounded-2xl">
                  <DropdownMenuItem className="flex items-center gap-2 rounded-xl">
                    <Pin className="h-4 w-4" />
                    {conversation.isPinned ? "Unpin" : "Pin"} Conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 rounded-xl">
                    <Archive className="h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 text-red-600 rounded-xl">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex h-[calc(100vh-200px)] items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 w-20 h-20 bg-purple-500/20 rounded-full"
                />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-3">Loading Messages</h3>
                <p className="text-purple-200">Connecting to your conversations...</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  const totalUnreadCount = conversations.filter((c) => c.lastMessageSenderId !== user?.uid && !c.lastMessageRead).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                className="text-5xl font-bold text-white mb-3 flex items-center gap-4"
                whileHover={{ scale: 1.02 }}
              >
                <motion.div 
                  className="p-4 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageCircle className="h-10 w-10 text-white" />
                </motion.div>
                Messages
                {totalUnreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-xl border-0 rounded-2xl">
                      {totalUnreadCount} new
                    </Badge>
                  </motion.div>
                )}
              </motion.h1>
              <p className="text-purple-200 text-xl">Stay connected with your professional network</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-2xl border-0 rounded-2xl px-6 py-3 text-lg font-semibold">
                <PlusCircle className="h-5 w-5 mr-2" />
                New Message
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-220px)]">
          {/* Outstanding Conversations List */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="lg:col-span-1 h-full overflow-hidden flex flex-col shadow-2xl bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl">
              <CardHeader className="px-6 py-6 border-b border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-4">
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                    />
                    Conversations
                    {totalUnreadCount > 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-200 border-blue-300/30 backdrop-blur-sm">
                        {totalUnreadCount} unread
                      </Badge>
                    )}
                  </CardTitle>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>

                {/* Enhanced search and filters */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-white/20 focus-visible:ring-purple-500 bg-white/10 backdrop-blur-sm rounded-2xl text-white placeholder:text-white/50"
                    />
                    <AnimatePresence>
                      {searchQuery && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-3 w-3 text-white" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Filter buttons */}
                  <div className="flex gap-2">
                    {[
                      { key: 'all', label: 'All', icon: MessageCircle },
                      { key: 'unread', label: 'Unread', icon: Zap },
                      { key: 'pinned', label: 'Pinned', icon: Pin },
                    ].map(({ key, label, icon: Icon }) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedFilter(key as any)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                          selectedFilter === key
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                            : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </CardHeader>

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
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Search className="h-24 w-24 text-white/30 mb-6" />
                          </motion.div>
                          <h3 className="text-xl font-semibold text-white mb-3">No matching conversations</h3>
                          <p className="text-sm text-white/60 mb-6 max-w-sm">
                            We couldn't find any conversations matching "{searchQuery}". Try a different search term.
                          </p>
                          <Button
                            onClick={() => setSearchQuery("")}
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/10 rounded-xl"
                          >
                            <X className="h-4 w-4 mr-2" /> Clear Search
                          </Button>
                        </>
                      ) : (
                        <>
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <MessageCircle className="h-24 w-24 text-white/30 mb-6" />
                          </motion.div>
                          <h3 className="text-xl font-semibold text-white mb-3">No conversations yet</h3>
                          <p className="text-sm text-white/60 max-w-sm">
                            Start networking and connecting with professionals to see your conversations here.
                          </p>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <div className="py-3">
                      {filteredConversations.map((conversation, index) => (
                        <motion.div
                          key={conversation.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <ConversationItem conversation={conversation} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </Card>
          </motion.div>

          {/* Outstanding Messages Panel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="h-full overflow-hidden flex flex-col shadow-2xl bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl">
              {selectedConversation ? (
                <>
                  <CardHeader className="px-6 py-6 border-b border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="relative"
                          >
                            <Avatar className="h-14 w-14 border-2 border-white/30 shadow-xl ring-4 ring-white/10 backdrop-blur-sm">
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white font-bold text-lg">
                                <User className="h-7 w-7" />
                              </AvatarFallback>
                            </Avatar>
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 border-3 border-white rounded-full"
                            />
                          </motion.div>
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-white">
                            {getOtherParticipantName(selectedConversation)}
                          </CardTitle>
                          {selectedConversation.jobTitle && (
                            <p className="text-sm text-purple-200 flex items-center gap-2 mt-1">
                              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                              {selectedConversation.jobTitle}
                            </p>
                          )}
                          <p className="text-xs text-white/60 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            Last seen {formatLastSeen(selectedConversation.lastMessageTimeDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  onClick={() => initiateCall("audio")}
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-500/20 border-green-400/30 hover:bg-green-500/30 text-green-300 shadow-lg rounded-2xl backdrop-blur-sm"
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </TooltipTrigger>
                            <TooltipContent>Start audio call</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  onClick={() => initiateCall("video")}
                                  variant="outline"
                                  size="sm"
                                  className="bg-blue-500/20 border-blue-400/30 hover:bg-blue-500/30 text-blue-300 shadow-lg rounded-2xl backdrop-blur-sm"
                                >
                                  <Video className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </TooltipTrigger>
                            <TooltipContent>Start video call</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardHeader>

                  <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-transparent to-black/10">
                    <AnimatePresence>
                      {messages.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center h-full text-center py-20"
                        >
                          <motion.div
                            animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="relative mb-8"
                          >
                            <div className="w-24 h-24 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                              <Send className="h-12 w-12 text-white" />
                            </div>
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                            >
                              <Sparkles className="h-4 w-4 text-white" />
                            </motion.div>
                          </motion.div>
                          <h3 className="text-3xl font-bold text-white mb-4">Start the conversation</h3>
                          <p className="text-purple-200 max-w-md text-lg">
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
                            const replyToMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null

                            return (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={cn("flex gap-3 group", isSender ? "justify-end" : "justify-start")}
                              >
                                {!isSender && showAvatar && (
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                  >
                                    <Avatar className="h-8 w-8 border border-white/20 shadow-lg backdrop-blur-sm">
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                                        {getOtherParticipantName(selectedConversation).charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  </motion.div>
                                )}
                                {!isSender && !showAvatar && <div className="w-8" />}

                                <div className={cn("max-w-[75%] group relative", isSender && "order-first")}>
                                  {/* Reply indicator */}
                                  {replyToMessage && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className={cn(
                                        "mb-2 p-2 rounded-xl border-l-4 text-xs",
                                        isSender 
                                          ? "bg-white/10 border-white/30 text-white/70" 
                                          : "bg-black/10 border-purple-400 text-gray-600"
                                      )}
                                    >
                                      <p className="font-medium">Replying to:</p>
                                      <p className="truncate">{replyToMessage.content}</p>
                                    </motion.div>
                                  )}

                                  <motion.div
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    className={cn(
                                      "px-6 py-4 rounded-3xl shadow-xl transition-all duration-300 relative backdrop-blur-xl",
                                      isSender
                                        ? "bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white rounded-br-lg shadow-purple-500/25"
                                        : "bg-white/90 text-gray-800 border border-white/20 rounded-bl-lg shadow-black/10",
                                      isOptimistic && "opacity-70",
                                    )}
                                  >
                                    <div className="break-words leading-relaxed font-medium">{message.content}</div>
                                    
                                    {/* Message reactions */}
                                    {message.reactions && message.reactions.length > 0 && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex gap-1 mt-3 flex-wrap"
                                      >
                                        {message.reactions.map((reaction) => (
                                          <motion.button
                                            key={reaction.emoji}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleReaction(message.id, reaction.emoji)}
                                            className={cn(
                                              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
                                              reaction.users.includes(user?.uid || '')
                                                ? "bg-purple-500/30 text-purple-200 border border-purple-400/30"
                                                : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/20"
                                            )}
                                          >
                                            <span>{reaction.emoji}</span>
                                            <span>{reaction.count}</span>
                                          </motion.button>
                                        ))}
                                      </motion.div>
                                    )}

                                    <div className="flex justify-between items-center mt-3">
                                      <div className={cn("text-xs", isSender ? "text-white/60" : "text-gray-500")}>
                                        {formatMessageTime(message.timestamp)}
                                        {message.isEdited && <span className="ml-1">(edited)</span>}
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
                                          <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                          >
                                            <Loader2 className="h-3 w-3" />
                                          </motion.div>
                                          <span className="text-xs">Sending...</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Message actions */}
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 0, scale: 0.8 }}
                                      whileHover={{ opacity: 1, scale: 1 }}
                                      className="absolute -top-3 right-4 flex gap-1 bg-white/90 backdrop-blur-xl rounded-full p-1 shadow-lg border border-white/20"
                                    >
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 hover:bg-purple-100 rounded-full"
                                              onClick={() => setReplyingTo(message)}
                                            >
                                              <Reply className="h-3 w-3" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Reply</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-purple-100 rounded-full"
                                          >
                                            <Smile className="h-3 w-3" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-2 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl">
                                          <div className="flex gap-1">
                                            {['❤️', '👍', '😂', '😮', '😢', '😡'].map((emoji) => (
                                              <motion.button
                                                key={emoji}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleReaction(message.id, emoji)}
                                                className="p-2 hover:bg-purple-100 rounded-lg text-lg transition-all"
                                              >
                                                {emoji}
                                              </motion.button>
                                            ))}
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </motion.div>
                                  </motion.div>
                                </div>
                              </motion.div>
                            )
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </AnimatePresence>
                  </ScrollArea>

                  <Separator className="border-white/20" />

                  <div className="p-6 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl">
                    {/* Reply indicator */}
                    <AnimatePresence>
                      {replyingTo && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mb-4 p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-white/60 mb-1">Replying to:</p>
                              <p className="text-sm text-white truncate">{replyingTo.content}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyingTo(null)}
                              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleSendMessage} className="space-y-4">
                      <div className="flex gap-3 items-end">
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-12 w-12 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded-2xl backdrop-blur-sm"
                                  >
                                    <Paperclip className="h-5 w-5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>Attach file</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-12 w-12 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded-2xl backdrop-blur-sm"
                                  >
                                    <ImageIcon className="h-5 w-5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>Send image</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onMouseDown={() => setIsRecording(true)}
                                    onMouseUp={() => setIsRecording(false)}
                                    onMouseLeave={() => setIsRecording(false)}
                                    className={cn(
                                      "h-12 w-12 p-0 rounded-2xl backdrop-blur-sm transition-all",
                                      isRecording
                                        ? "bg-red-500/30 text-red-300 scale-110"
                                        : "text-white/60 hover:text-white hover:bg-white/10"
                                    )}
                                  >
                                    {isRecording ? <Volume2 className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isRecording ? "Recording..." : "Hold to record voice message"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <div className="flex-1 relative">
                          <Input
                            ref={messageInputRef}
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => handleTyping(e.target.value)}
                            className="pr-16 border-white/20 focus-visible:ring-purple-500 bg-white/10 backdrop-blur-sm rounded-3xl py-4 px-6 text-white placeholder:text-white/50 shadow-xl"
                            disabled={sending}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSendMessage(e)
                              }
                            }}
                          />

                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                              <PopoverTrigger asChild>
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                                  >
                                    <Smile className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 border-white/20 shadow-2xl rounded-3xl bg-white/90 backdrop-blur-xl">
                                <div className="grid grid-cols-8 gap-2 p-4 max-h-64 overflow-y-auto">
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
                                    "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🌟", "⭐",
                                  ].map((emoji) => (
                                    <motion.button
                                      key={emoji}
                                      whileHover={{ scale: 1.2 }}
                                      whileTap={{ scale: 0.9 }}
                                      type="button"
                                      className="p-3 hover:bg-purple-100 rounded-2xl text-xl transition-all transform hover:shadow-lg"
                                      onClick={() => {
                                        setNewMessage((prev) => prev + emoji)
                                        setShowEmojiPicker(false)
                                        messageInputRef.current?.focus()
                                      }}
                                    >
                                      {emoji}
                                    </motion.button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 h-12 w-12 p-0 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sending ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Loader2 className="h-5 w-5" />
                              </motion.div>
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </Button>
                        </motion.div>
                      </div>

                      {/* Quick reactions */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 justify-center items-center"
                      >
                        <span className="text-xs text-white/60 font-medium">Quick reactions:</span>
                        {["👍", "❤️", "😂", "😮", "👏", "🔥", "💯", "🎉"].map((emoji, index) => (
                          <motion.button
                            key={emoji}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.3, y: -2 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            className="text-xl hover:bg-white/10 rounded-full p-2 border border-transparent hover:border-white/20 transition-all backdrop-blur-sm"
                            onClick={() => {
                              setNewMessage((prev) => prev + emoji)
                              messageInputRef.current?.focus()
                            }}
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </motion.div>

                      {/* Enhanced typing indicator */}
                      <AnimatePresence>
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-xs text-white/60 flex items-center gap-3 justify-center"
                          >
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                                  className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                                />
                              ))}
                            </div>
                            <span className="font-medium">You are typing...</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-b from-transparent to-black/10"
                >
                  <motion.div
                    animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="relative mb-8"
                  >
                    <div className="w-32 h-32 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                      <MessageCircle className="h-16 w-16 text-white" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl"
                    >
                      <Sparkles className="h-6 w-6 text-white" />
                    </motion.div>
                  </motion.div>
                  <h3 className="text-4xl font-bold text-white mb-4">Select a conversation</h3>
                  <p className="text-purple-200 max-w-md text-xl">
                    Choose a conversation from the list to start messaging and build meaningful professional connections.
                  </p>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Outstanding Call Dialog */}
        <Dialog open={callActive} onOpenChange={(open) => !open && endCall()}>
          <DialogContent className="sm:max-w-[900px] md:max-w-[1100px] lg:max-w-[1300px] h-[85vh] p-0 border-0 rounded-3xl bg-black/90 backdrop-blur-2xl">
            <DialogHeader className="p-8 pb-0 bg-gradient-to-r from-black/50 to-black/30 backdrop-blur-xl">
              <DialogTitle className="flex items-center gap-4 text-2xl text-white">
                {callType === "audio" ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl"
                  >
                    <Phone className="h-6 w-6 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl"
                  >
                    <Video className="h-6 w-6 text-white" />
                  </motion.div>
                )}
                {callType === "audio" ? "Audio Call" : "Video Call"} with {callRecipient?.name}
              </DialogTitle>
              <DialogDescription className="text-purple-200 text-lg">
                High-quality {callType} call powered by Zego Cloud
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 p-8 pt-0">
              <div
                ref={zegoContainerRef}
                className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                style={{ minHeight: "500px" }}
              />
            </div>

            <div className="flex justify-center p-8 pt-0 bg-gradient-to-r from-black/50 to-black/30 backdrop-blur-xl">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={endCall}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-8 py-4 rounded-2xl shadow-2xl hover:shadow-red-500/50 transform transition-all text-lg font-semibold"
                >
                  <PhoneOff className="h-6 w-6 mr-3" />
                  End Call
                </Button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
