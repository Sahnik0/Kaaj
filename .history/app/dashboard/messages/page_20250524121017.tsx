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
import {
  Send,
  User,
  Search,
  X,
  Loader2,
  Phone,
  Video,
  PhoneOff,
  MoreVertical,
  Archive,
  Trash2,
  Pin,
  PinOff,
  Smile,
  MessageCircle,
  Clock,
  CheckCheck,
  Check,
  Mic,
  MicOff,
  VideoOff,
  Settings,
  Users,
  Maximize,
  Minimize,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
    pinConversation,
    unpinConversation,
    archiveConversation,
    deleteConversation,
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
  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "ended">("connecting")
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const zegoContainerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

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

  const formatCallDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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

  // Call timer
  useEffect(() => {
    if (callActive && callStatus === "connected") {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }
  }, [callActive, callStatus])

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
        const updatedData = data.map(ensureParticipantNames).filter((conv) => !conv.isArchived) // Filter out archived conversations

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

  // Enhanced conversation management
  const handlePinConversation = useCallback(
    async (conversationId: string) => {
      try {
        const conversation = conversations.find((c) => c.id === conversationId)
        if (!conversation) return

        if (conversation.isPinned) {
          await unpinConversation?.(conversationId)
        } else {
          await pinConversation?.(conversationId)
        }

        // Update local state
        const updateConvo = (conv: Conversation) =>
          conv.id === conversationId ? { ...conv, isPinned: !conv.isPinned } : conv

        setConversations((prev) => prev.map(updateConvo))
        setFilteredConversations((prev) => prev.map(updateConvo))

        if (selectedConversation?.id === conversationId) {
          setSelectedConversation((prev) => (prev ? updateConvo(prev) : null))
        }
      } catch (error) {
        console.error("Error pinning/unpinning conversation:", error)
      }
    },
    [conversations, pinConversation, unpinConversation, selectedConversation],
  )

  const handleArchiveConversation = useCallback(
    async (conversationId: string) => {
      try {
        await archiveConversation?.(conversationId)

        // Remove from local state
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
        setFilteredConversations((prev) => prev.filter((conv) => conv.id !== conversationId))

        if (selectedConversation?.id === conversationId) {
          const remainingConversations = conversations.filter((conv) => conv.id !== conversationId)
          setSelectedConversation(remainingConversations.length > 0 ? remainingConversations[0] : null)
        }
      } catch (error) {
        console.error("Error archiving conversation:", error)
      }
    },
    [archiveConversation, conversations, selectedConversation],
  )

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation?.(conversationId)

      // Remove from local state
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
      setFilteredConversations((prev) => prev.filter((conv) => conv.id !== conversationId))

      if (selectedConversation?.id === conversationId) {
        const remainingConversations = conversations.filter((conv) => conv.id !== conversationId)
        setSelectedConversation(remainingConversations.length > 0 ? remainingConversations[0] : null)
      }

      setDeleteDialogOpen(false)
      setConversationToDelete(null)
    } catch (error) {
      console.error("Error deleting conversation:", error)
    }
  }

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
      setCallStatus("connecting")
      setCallDuration(0)
      setIsMuted(false)
      setIsVideoEnabled(type === "video")

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
            showMyCameraToggleButton: false,
            showMyMicrophoneToggleButton: false,
            showAudioVideoSettingsButton: false,
            showScreenSharingButton: false,
            showTextChat: false,
            showUserList: false,
            maxUsers: 2,
            layout: "Auto",
            showLayoutButton: false,
            onJoinRoom: () => {
              console.log("Joined Zego room successfully")
              setCallStatus("connected")
            },
            onLeaveRoom: () => endCall(),
          })
        }
      }, 100)
    },
    [selectedConversation, user, getOtherParticipantName],
  )

  const toggleMute = useCallback(() => {
    if (zegoInstance) {
      zegoInstance.setMicrophoneState(!isMuted)
      setIsMuted(!isMuted)
    }
  }, [zegoInstance, isMuted])

  const toggleVideo = useCallback(() => {
    if (zegoInstance && callType === "video") {
      zegoInstance.setCameraState(!isVideoEnabled)
      setIsVideoEnabled(!isVideoEnabled)
    }
  }, [zegoInstance, isVideoEnabled, callType])

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
    setCallStatus("connecting")
    setCallDuration(0)
    setIsMuted(false)
    setIsVideoEnabled(true)
    setIsFullscreen(false)
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex items-center gap-3 p-4 cursor-pointer transition-all duration-300 relative group rounded-lg mx-2 my-1",
              isSelected
                ? "bg-gradient-to-r from-kaaj-100 to-kaaj-200 border-l-4 border-kaaj-500 shadow-md"
                : "hover:bg-kaaj-50 hover:shadow-sm",
              hasUnread && "bg-blue-50/70 border-l-4 border-blue-400",
              conversation.isPinned && "bg-yellow-50/50",
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
              <Avatar className="h-12 w-12 border-2 border-kaaj-200 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-kaaj-100 to-kaaj-300 text-kaaj-800 font-bold text-sm">
                  {otherParticipantName.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              {conversation.isPinned && (
                <Pin className="absolute -top-1 -right-1 w-4 h-4 text-yellow-600 fill-yellow-300 drop-shadow-sm" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3
                  className={cn(
                    "font-semibold truncate text-sm",
                    hasUnread ? "text-kaaj-900" : "text-kaaj-800",
                    isSelected && "text-kaaj-900",
                  )}
                >
                  {otherParticipantName}
                </h3>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs text-kaaj-500 whitespace-nowrap">
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
                        className="h-5 min-w-[20px] px-1.5 text-xs rounded-full bg-red-500 hover:bg-red-500"
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
                  hasUnread ? "text-kaaj-800 font-medium" : "text-kaaj-600",
                )}
              >
                {conversation.lastMessage || "No messages yet"}
              </p>

              {conversation.jobTitle && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-kaaj-400 rounded-full"></div>
                  <p className="text-xs text-kaaj-500 truncate">{conversation.jobTitle}</p>
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-kaaj-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePinConversation(conversation.id)
                  }}
                >
                  {conversation.isPinned ? (
                    <>
                      <PinOff className="h-4 w-4" />
                      Unpin Conversation
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4" />
                      Pin Conversation
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleArchiveConversation(conversation.id)
                  }}
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 text-red-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConversationToDelete(conversation.id)
                    setDeleteDialogOpen(true)
                  }}
                >
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
      handlePinConversation,
      handleArchiveConversation,
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
              <Loader2 className="h-16 w-16 animate-spin text-kaaj-500" />
              <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-kaaj-200 opacity-20"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-kaaj-800 mb-2">Loading Messages</h3>
              <p className="text-kaaj-600">Connecting to your conversations...</p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const totalUnreadCount = conversations.filter((c) => c.lastMessageSenderId !== user?.uid && !c.lastMessageRead).length

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-kaaj-800 mb-2 flex items-center gap-3">
              <MessageCircle className="h-10 w-10 text-kaaj-600" />
              Messages
              {totalUnreadCount > 0 && (
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  {totalUnreadCount} new
                </Badge>
              )}
            </h1>
            <p className="text-kaaj-600 text-lg">Stay connected with your professional network</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Enhanced Conversations List */}
        <Card className="border-kaaj-200 lg:col-span-1 h-full overflow-hidden flex flex-col shadow-xl bg-white">
          <CardHeader className="px-6 py-5 border-b border-kaaj-200 bg-gradient-to-r from-kaaj-50 via-white to-kaaj-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-kaaj-800 flex items-center gap-3">
                <div className="w-3 h-3 bg-kaaj-500 rounded-full animate-pulse"></div>
                Conversations
                {totalUnreadCount > 0 && (
                  <Badge variant="outline" className="text-xs bg-kaaj-100 text-kaaj-700 border-kaaj-300">
                    {totalUnreadCount} unread
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>

          <div className="p-4 border-b border-kaaj-100 bg-kaaj-25">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-kaaj-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-kaaj-300 focus-visible:ring-kaaj-500 bg-white shadow-sm rounded-lg"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 rounded-full bg-kaaj-200 hover:bg-kaaj-300 flex items-center justify-center transition-colors"
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
                      <Search className="h-20 w-20 text-kaaj-300 mb-6" />
                      <h3 className="text-xl font-semibold text-kaaj-700 mb-3">No matching conversations</h3>
                      <p className="text-sm text-kaaj-500 mb-6 max-w-sm">
                        We couldn't find any conversations matching "{searchQuery}". Try a different search term.
                      </p>
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
                      <MessageCircle className="h-20 w-20 text-kaaj-300 mb-6" />
                      <h3 className="text-xl font-semibold text-kaaj-700 mb-3">No conversations yet</h3>
                      <p className="text-sm text-kaaj-500 max-w-sm">
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
        <Card className="border-kaaj-200 lg:col-span-2 h-full overflow-hidden flex flex-col shadow-xl bg-white">
          {selectedConversation ? (
            <>
              <CardHeader className="px-6 py-5 border-b border-kaaj-200 bg-gradient-to-r from-kaaj-50 via-white to-kaaj-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-kaaj-200 shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-kaaj-100 to-kaaj-300 text-kaaj-800 font-bold">
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <CardTitle className="text-xl text-kaaj-800">
                        {getOtherParticipantName(selectedConversation)}
                      </CardTitle>
                      {selectedConversation.jobTitle && (
                        <p className="text-sm text-kaaj-600 flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 bg-kaaj-400 rounded-full"></div>
                          {selectedConversation.jobTitle}
                        </p>
                      )}
                      <p className="text-xs text-kaaj-500 flex items-center gap-1 mt-1">
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
                            className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700 shadow-sm"
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
                            className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700 shadow-sm"
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

              <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-white to-kaaj-25">
                <AnimatePresence>
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center py-20"
                    >
                      <div className="relative mb-6">
                        <Send className="h-20 w-20 text-kaaj-300" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-kaaj-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✨</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-semibold text-kaaj-700 mb-3">Start the conversation</h3>
                      <p className="text-kaaj-500 max-w-md">
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
                              <Avatar className="h-8 w-8 border border-kaaj-200 shadow-sm">
                                <AvatarFallback className="bg-kaaj-100 text-kaaj-700 text-sm font-semibold">
                                  {getOtherParticipantName(selectedConversation).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {!isSender && !showAvatar && <div className="w-8" />}

                            <div className={cn("max-w-[75%] group", isSender && "order-first")}>
                              <div
                                className={cn(
                                  "px-4 py-3 rounded-2xl shadow-sm border transition-all duration-200 relative",
                                  isSender
                                    ? "bg-kaaj-500 text-white border-kaaj-600 rounded-br-md"
                                    : "bg-white text-kaaj-800 border-kaaj-200 rounded-bl-md",
                                  "hover:shadow-md transform hover:scale-[1.02]",
                                  isOptimistic && "opacity-70",
                                )}
                              >
                                <div className="break-words leading-relaxed">{message.content}</div>
                                <div className="flex justify-between items-center mt-2">
                                  <div className={cn("text-xs", isSender ? "text-white/70" : "text-kaaj-500")}>
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

              <div className="p-6 bg-white border-t border-kaaj-100">
                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      className="pr-16 border-kaaj-300 focus-visible:ring-kaaj-500 bg-kaaj-50/50 rounded-full py-3 px-4 text-sm shadow-sm"
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
                            className="h-8 w-8 p-0 text-kaaj-500 hover:text-kaaj-600 hover:bg-kaaj-100 rounded-full"
                          >
                            <Smile className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 border-kaaj-200 shadow-xl">
                          <div className="grid grid-cols-8 gap-2 p-3">
                            {[
                              "😀",
                              "😃",
                              "😄",
                              "😁",
                              "😆",
                              "😅",
                              "😂",
                              "🤣",
                              "😊",
                              "😇",
                              "🙂",
                              "🙃",
                              "😉",
                              "😌",
                              "😍",
                              "🥰",
                              "😘",
                              "😗",
                              "😙",
                              "😚",
                              "😋",
                              "😛",
                              "😝",
                              "😜",
                              "🤪",
                              "🤨",
                              "🧐",
                              "🤓",
                              "😎",
                              "🤩",
                              "🥳",
                              "😏",
                              "👍",
                              "👎",
                              "👌",
                              "✌️",
                              "🤞",
                              "🤟",
                              "🤘",
                              "🤙",
                              "👏",
                              "🙌",
                              "🤝",
                              "🙏",
                              "❤️",
                              "🧡",
                              "💛",
                              "💚",
                              "💙",
                              "💜",
                              "🖤",
                              "🤍",
                              "🤎",
                              "💔",
                              "❣️",
                              "💕",
                              "💞",
                              "💓",
                              "💗",
                              "💖",
                              "💘",
                              "💝",
                              "💟",
                              "🔥",
                              "💯",
                              "💢",
                              "💥",
                              "💫",
                              "💦",
                              "💨",
                              "💣",
                              "💬",
                            ].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className="p-2 hover:bg-kaaj-100 rounded-lg text-lg transition-colors hover:scale-110 transform"
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
                    className="bg-kaaj-500 hover:bg-kaaj-600 h-12 w-12 p-0 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </form>

                {isTyping && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xs text-kaaj-500 mt-2 flex items-center gap-2"
                  >
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0 }}
                        className="w-1 h-1 bg-kaaj-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.2 }}
                        className="w-1 h-1 bg-kaaj-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.4 }}
                        className="w-1 h-1 bg-kaaj-400 rounded-full"
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
              className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-b from-white to-kaaj-25"
            >
              <div className="relative mb-8">
                <MessageCircle className="h-24 w-24 text-kaaj-300" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-kaaj-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">💬</span>
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-kaaj-700 mb-3">Select a conversation</h3>
              <p className="text-kaaj-500 max-w-md">
                Choose a conversation from the list to start messaging and build meaningful professional connections.
              </p>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Enhanced Call Dialog */}
      <Dialog open={callActive} onOpenChange={(open) => !open && endCall()}>
        <DialogContent
          className={cn(
            "p-0 border-kaaj-200 bg-gray-900 text-white overflow-hidden",
            isFullscreen
              ? "w-screen h-screen max-w-none"
              : "sm:max-w-[900px] md:max-w-[1100px] lg:max-w-[1300px] h-[85vh]",
          )}
        >
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {callType === "audio" ? (
                    <div className="p-3 bg-green-600 rounded-full">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-600 rounded-full">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-xl text-white">
                      {callType === "audio" ? "Audio Call" : "Video Call"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-300">{callRecipient?.name}</DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        callStatus === "connecting"
                          ? "bg-yellow-500 animate-pulse"
                          : callStatus === "connected"
                            ? "bg-green-500"
                            : "bg-red-500",
                      )}
                    />
                    <span className="text-sm text-gray-300 capitalize">{callStatus}</span>
                  </div>

                  {callStatus === "connected" && (
                    <div className="text-sm text-gray-300 font-mono">{formatCallDuration(callDuration)}</div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => setIsFullscreen(!isFullscreen)}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 relative">
            <div
              ref={zegoContainerRef}
              className="w-full h-full bg-gray-900"
              style={{ minHeight: isFullscreen ? "calc(100vh - 200px)" : "500px" }}
            />

            {/* Call Status Overlay */}
            {callStatus === "connecting" && (
              <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-xl mx-auto">
                      <AvatarFallback className="bg-gradient-to-br from-kaaj-100 to-kaaj-300 text-kaaj-800 font-bold text-2xl">
                        {callRecipient?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 border-4 border-white rounded-full animate-ping opacity-30"></div>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-2">Connecting...</h3>
                  <p className="text-gray-300">Calling {callRecipient?.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Call Controls */}
          <div className="p-6 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700">
            <div className="flex items-center justify-center gap-4">
              {/* Mute Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={toggleMute}
                      variant="outline"
                      size="lg"
                      className={cn(
                        "h-14 w-14 rounded-full border-2 transition-all",
                        isMuted
                          ? "bg-red-600 border-red-500 hover:bg-red-700 text-white"
                          : "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white",
                      )}
                    >
                      {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Video Toggle (only for video calls) */}
              {callType === "video" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={toggleVideo}
                        variant="outline"
                        size="lg"
                        className={cn(
                          "h-14 w-14 rounded-full border-2 transition-all",
                          !isVideoEnabled
                            ? "bg-red-600 border-red-500 hover:bg-red-700 text-white"
                            : "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white",
                        )}
                      >
                        {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isVideoEnabled ? "Turn off camera" : "Turn on camera"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* End Call Button */}
              <Button
                onClick={endCall}
                variant="destructive"
                size="lg"
                className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 border-2 border-red-500 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>

              {/* Settings Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 w-14 rounded-full border-2 bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
                    >
                      <Settings className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Participants Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 w-14 rounded-full border-2 bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
                    >
                      <Users className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Participants</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone and all messages will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setConversationToDelete(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => conversationToDelete && handleDeleteConversation(conversationToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
