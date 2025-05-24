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
import { Switch } from "@/components/ui/switch"
import { Send, User, Search, X, Loader2, Phone, Video, PhoneOff, MoreVertical, Archive, Star, Trash2, Volume2, VolumeX, Settings, Smile, Paperclip, ImageIcon, CheckCheck, Check, Clock, Shield, Mic, MicOff, Camera, CameraOff, Users, Bell, BellOff, Pin, Reply, Forward, Copy, Download, Eye, EyeOff, Zap, Heart, ThumbsUp, Laugh, Angry, FrownIcon as Sad, Filter, SortAsc, SortDesc, Calendar, MapPin, Link, FileText, Music, PlayCircle, PauseCircle, SkipForward, SkipBack, Maximize2, Minimize2, RotateCcw, Share2, Edit3, Save, AlertCircle, CheckCircle, Info, Wifi, WifiOff } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { motion, AnimatePresence, useAnimation } from "framer-motion"
import { format, isToday, isYesterday, formatDistanceToNow, differenceInMinutes } from "date-fns"

// Zego Cloud types
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any
  }
}

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: any
  read: boolean
  type?: "text" | "image" | "file" | "voice" | "video" | "location" | "contact"
  metadata?: any
  reactions?: Record<string, string[]>
  replyTo?: string
  forwarded?: boolean
  edited?: boolean
  editedAt?: any
  priority?: "low" | "normal" | "high" | "urgent"
  encrypted?: boolean
  deliveryStatus?: "sending" | "sent" | "delivered" | "read" | "failed"
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
  isArchived?: boolean
  isStarred?: boolean
  isPinned?: boolean
  isMuted?: boolean
  unreadCount?: number
  lastSeen?: Record<string, any>
  isTyping?: Record<string, boolean>
  draft?: string
  theme?: string
  encryptionEnabled?: boolean
  autoDeleteEnabled?: boolean
  autoDeleteDuration?: number
}

interface TypingIndicator {
  userId: string
  userName: string
  timestamp: number
}

interface OnlineStatus {
  [userId: string]: {
    isOnline: boolean
    lastSeen: any
  }
}

const EMOJI_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "😡", "🔥", "👏", "🎉", "💯"]

const MESSAGE_PRIORITIES = [
  { value: "low", label: "Low", color: "text-gray-500", icon: "⬇️" },
  { value: "normal", label: "Normal", color: "text-blue-500", icon: "➡️" },
  { value: "high", label: "High", color: "text-orange-500", icon: "⬆️" },
  { value: "urgent", label: "Urgent", color: "text-red-500", icon: "🚨" },
]

export default function Messages() {
  const { user, getConversations, getMessages, sendMessage, createConversation, markAllConversationMessagesAsRead } =
    useFirebase()

  // Core state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [processingRecipient, setProcessingRecipient] = useState(false)

  // Enhanced UI state
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>({})
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"time" | "name" | "unread">("time")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [messageSearchQuery, setMessageSearchQuery] = useState("")
  const [showMessageSearch, setShowMessageSearch] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [messagePriority, setMessagePriority] = useState<"low" | "normal" | "high" | "urgent">("normal")
  const [scheduleMessage, setScheduleMessage] = useState<Date | null>(null)
  const [voiceRecording, setVoiceRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "connecting">("online")
  const [encryptionEnabled, setEncryptionEnabled] = useState(true)
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false)
  const [autoDeleteDuration, setAutoDeleteDuration] = useState(24)

  // Call state
  const [callType, setCallType] = useState<"audio" | "video" | null>(null)
  const [callActive, setCallActive] = useState(false)
  const [callRecipient, setCallRecipient] = useState<any>(null)
  const [zegoInstance, setZegoInstance] = useState<any>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [isCallMuted, setIsCallMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callQuality, setCallQuality] = useState<"excellent" | "good" | "fair" | "poor">("excellent")

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const zegoContainerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const voiceRecorderRef = useRef<MediaRecorder | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Animation controls
  const messageAnimation = useAnimation()
  const conversationAnimation = useAnimation()

  // Zego Cloud configuration
  const ZEGO_APP_ID = 1179547342
  const ZEGO_SERVER_SECRET = "4b1d0991e55d2bfa10d0f452e1951fce"

  // Enhanced filtered and sorted conversations
  const filteredAndSortedConversations = useMemo(() => {
    let filtered = conversations

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = conversations.filter((conversation) => {
        const otherParticipantName = getOtherParticipantName(conversation).toLowerCase()
        const lastMessage = (conversation.lastMessage || "").toLowerCase()
        const jobTitle = (conversation.jobTitle || "").toLowerCase()
        return otherParticipantName.includes(query) || lastMessage.includes(query) || jobTitle.includes(query)
      })
    }

    // Apply online filter
    if (showOnlineOnly) {
      filtered = filtered.filter((conversation) => {
        const otherParticipantId = conversation.participants.find((id) => id !== user?.uid)
        return otherParticipantId && onlineStatus[otherParticipantId]?.isOnline
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "time":
          const timeA = a.lastMessageTimeDate?.toDate?.() || new Date(a.lastMessageTimeDate || 0)
          const timeB = b.lastMessageTimeDate?.toDate?.() || new Date(b.lastMessageTimeDate || 0)
          comparison = timeB.getTime() - timeA.getTime()
          break
        case "name":
          const nameA = getOtherParticipantName(a).toLowerCase()
          const nameB = getOtherParticipantName(b).toLowerCase()
          comparison = nameA.localeCompare(nameB)
          break
        case "unread":
          const unreadA = a.unreadCount || 0
          const unreadB = b.unreadCount || 0
          comparison = unreadB - unreadA
          break
      }

      return sortOrder === "desc" ? comparison : -comparison
    })

    // Prioritize pinned conversations
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    })
  }, [searchQuery, conversations, showOnlineOnly, sortBy, sortOrder, onlineStatus, user?.uid])

  // Enhanced filtered messages
  const filteredMessages = useMemo(() => {
    if (!messageSearchQuery) return messages

    const query = messageSearchQuery.toLowerCase()
    return messages.filter((message) => message.content.toLowerCase().includes(query))
  }, [messages, messageSearchQuery])

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

  // Enhanced participant name handling
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

  // Get other participant name with online status
  const getOtherParticipantName = useCallback(
    (conversation: Conversation) => {
      if (!conversation?.participants || !Array.isArray(conversation.participants)) {
        return "Unknown User"
      }

      const otherParticipantId = conversation.participants.find((id: string) => id !== user?.uid)

      if (!conversation.participantNames) {
        conversation.participantNames = {}
      }

      if (!otherParticipantId || !conversation.participantNames[otherParticipantId]) {
        return otherParticipantId ? `User ${otherParticipantId.substring(0, 5)}...` : "Unknown User"
      }

      return conversation.participantNames[otherParticipantId]
    },
    [user?.uid],
  )

  // Get other participant ID
  const getOtherParticipantId = useCallback(
    (conversation: Conversation) => {
      return conversation.participants.find((id: string) => id !== user?.uid)
    },
    [user?.uid],
  )

  // Enhanced time formatting with relative times
  const formatMessageTime = useCallback((timestamp: any, detailed = false) => {
    if (!timestamp) return ""

    try {
      let date = timestamp
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate()
      } else if (!(timestamp instanceof Date)) {
        date = new Date(timestamp)
      }

      if (isNaN(date.getTime())) return ""

      if (detailed) {
        return format(date, "PPpp")
      }

      const now = new Date()
      const diffInMinutes = differenceInMinutes(now, date)

      if (diffInMinutes < 1) return "Just now"
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      if (isToday(date)) return format(date, "HH:mm")
      if (isYesterday(date)) return "Yesterday"
      if (diffInMinutes < 7 * 24 * 60) return format(date, "EEE")
      return format(date, "MMM dd")
    } catch (error) {
      console.error("Error formatting timestamp:", error)
      return ""
    }
  }, [])

  // Enhanced typing indicator
  const handleTyping = useCallback(() => {
    setIsTyping(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 2000)
  }, [])

  // Voice recording functions
  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      voiceRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        // Handle voice message upload here
        console.log("Voice recording completed", blob)
      }

      mediaRecorder.start()
      setVoiceRecording(true)

      // Start recording timer
      const timer = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)

      mediaRecorder.onstop = () => {
        clearInterval(timer)
        setRecordingDuration(0)
        setVoiceRecording(false)
        stream.getTracks().forEach((track) => track.stop())
      }
    } catch (error) {
      console.error("Error starting voice recording:", error)
    }
  }, [])

  const stopVoiceRecording = useCallback(() => {
    if (voiceRecorderRef.current && voiceRecording) {
      voiceRecorderRef.current.stop()
    }
  }, [voiceRecording])

  // Enhanced message reactions
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    // Implementation for adding reactions
    console.log("Adding reaction:", messageId, emoji)
  }, [])

  // Message actions
  const replyToMessage = useCallback((message: Message) => {
    setReplyingTo(message)
    messageInputRef.current?.focus()
  }, [])

  const forwardMessage = useCallback((message: Message) => {
    // Implementation for forwarding messages
    console.log("Forwarding message:", message)
  }, [])

  const editMessage = useCallback((message: Message) => {
    setEditingMessage(message)
    setNewMessage(message.content)
    messageInputRef.current?.focus()
  }, [])

  const deleteMessage = useCallback(async (messageId: string) => {
    // Implementation for deleting messages
    console.log("Deleting message:", messageId)
  }, [])

  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content)
    // Show toast notification
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
        const updatedData = data.map((convo) => ensureParticipantNames(convo))
        setConversations(updatedData)

        const recipientConversation = updatedData.find((convo) => convo.participants.includes(recipientId))

        if (recipientConversation) {
          const updatedRecipientConversation = ensureParticipantNames(recipientConversation)
          setSelectedConversation(updatedRecipientConversation)
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
  }, [searchParams, user, loading, createConversation, getConversations, ensureParticipantNames, processingRecipient])

  // Fetch conversations with enhanced features
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations()
        const updatedData = data.map((convo) => ensureParticipantNames(convo))
        setConversations(updatedData)

        if (updatedData.length > 0 && !selectedConversation) {
          setSelectedConversation(updatedData[0])
        }
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchConversations()
    }
  }, [getConversations, selectedConversation, ensureParticipantNames, user])

  // Enhanced message handling with real-time updates
  useEffect(() => {
    let unsubscribe = () => {}
    let readStatusUpdateTimeout: NodeJS.Timeout | null = null

    if (selectedConversation && user) {
      // Mark conversation as read when selected
      if (selectedConversation.lastMessageSenderId !== user.uid && !selectedConversation.lastMessageRead) {
        updateConversationReadStatus(selectedConversation.id, true)
      }

      unsubscribe = getMessages(selectedConversation.id, (data) => {
        setMessages(data)

        // Auto-mark messages as read with debouncing
        if (
          selectedConversation.lastMessageSenderId !== user.uid &&
          (!selectedConversation.lastMessageRead || data.some((msg) => msg.senderId !== user.uid && !msg.read))
        ) {
          if (readStatusUpdateTimeout) {
            clearTimeout(readStatusUpdateTimeout)
          }

          readStatusUpdateTimeout = setTimeout(() => {
            updateConversationReadStatus(selectedConversation.id, true)
            markAllConversationMessagesAsRead(selectedConversation.id).catch((error) => {
              console.error("Error marking conversation messages as read:", error)
            })
          }, 500)
        }

        // Play notification sound for new messages
        if (soundEnabled && data.length > messages.length) {
          // Play sound effect
        }
      })
    }

    return () => {
      if (readStatusUpdateTimeout) {
        clearTimeout(readStatusUpdateTimeout)
      }
      unsubscribe()
    }
  }, [selectedConversation, getMessages, user, markAllConversationMessagesAsRead, soundEnabled, messages.length])

  // Auto-scroll to bottom with scroll detection
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    scrollToBottom()

    const handleScroll = () => {
      if (scrollAreaRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100
        setShowScrollButton(!isAtBottom)
      }
    }

    scrollAreaRef.current?.addEventListener("scroll", handleScroll)

    return () => {
      scrollAreaRef.current?.removeEventListener("scroll", handleScroll)
    }
  }, [messages])

  // Enhanced message sending with advanced features
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!newMessage.trim() && !replyingTo) || !selectedConversation) return

    const messageContent = newMessage.trim()
    const isEditing = editingMessage !== null

    // Handle editing
    if (isEditing && editingMessage) {
      // Implementation for editing messages
      setEditingMessage(null)
      setNewMessage("")
      return
    }

    setNewMessage("")
    setIsTyping(false)
    setReplyingTo(null)

    try {
      const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)

      if (!recipientId) {
        console.error("Could not find recipient ID")
        return
      }

      // Enhanced message with metadata
      const messageData = {
        content: messageContent,
        type: "text" as const,
        priority: messagePriority,
        replyTo: replyingTo?.id,
        encrypted: encryptionEnabled,
        scheduledFor: scheduleMessage,
      }

      await sendMessage(recipientId, messageContent, selectedConversation.jobId, selectedConversation.jobTitle)

      // Reset message priority and schedule
      setMessagePriority("normal")
      setScheduleMessage(null)

      // Play send sound if enabled
      if (soundEnabled) {
        // Play send sound effect
      }

      // Animate message send
      messageAnimation.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.3 },
      })
    } catch (error) {
      console.error("Error sending message:", error)
      // Restore message on error
      setNewMessage(messageContent)
    }
  }

  // Update conversation read status
  const updateConversationReadStatus = useCallback(
    (conversationId: string, isRead: boolean) => {
      const updateConvo = (conversation: Conversation) => {
        if (conversation.id === conversationId) {
          return {
            ...conversation,
            lastMessageRead: isRead,
            unreadCount: isRead ? 0 : conversation.unreadCount || 0,
          }
        }
        return conversation
      }

      if (selectedConversation && selectedConversation.id === conversationId) {
        setSelectedConversation((prev) => (prev ? updateConvo(prev) : null))
      }

      setConversations((prev) => prev.map(updateConvo))
    },
    [selectedConversation],
  )

  // Enhanced call functionality
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
      setCallDuration(0)

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

      // Start call duration timer
      const durationTimer = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)

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
            onJoinRoom: () => {
              console.log("Joined Zego room successfully")
              setCallQuality("excellent")
            },
            onLeaveRoom: () => {
              console.log("Left Zego room")
              clearInterval(durationTimer)
              endCall()
            },
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
    setCallDuration(0)
    setIsCallMuted(false)
    setIsVideoEnabled(true)
    setIsScreenSharing(false)
  }, [zegoInstance])

  // Toggle call controls
  const toggleCallMute = useCallback(() => {
    setIsCallMuted((prev) => !prev)
    // Implement actual mute toggle with Zego
  }, [])

  const toggleCallVideo = useCallback(() => {
    setIsVideoEnabled((prev) => !prev)
    // Implement actual video toggle with Zego
  }, [])

  const toggleScreenShare = useCallback(() => {
    setIsScreenSharing((prev) => !prev)
    // Implement actual screen share toggle with Zego
  }, [])

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    handleTyping()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        handleSendMessage(e as any)
      }

      // Escape to cancel reply/edit
      if (e.key === "Escape") {
        setReplyingTo(null)
        setEditingMessage(null)
        setIsSelectionMode(false)
        setSelectedMessages(new Set())
      }

      // Ctrl/Cmd + F to search messages
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault()
        setShowMessageSearch(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Format call duration
  const formatCallDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-500 opacity-20" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Loading messages...</p>
              <p className="text-sm text-gray-500">Connecting to secure servers</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Shield className="h-4 w-4" />
              <span>End-to-end encrypted</span>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("container mx-auto px-4 py-8 transition-colors duration-300", darkMode && "dark")}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
              Messages
              <Badge variant="outline" className="ml-3 text-xs">
                {connectionStatus === "online" ? (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                    Online
                  </div>
                ) : connectionStatus === "offline" ? (
                  <div className="flex items-center">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Connecting
                  </div>
                )}
              </Badge>
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Communicate securely with recruiters and candidates.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMessageSearch(!showMessageSearch)}
                    className={cn(showMessageSearch && "bg-blue-50 border-blue-200")}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search messages (Ctrl+F)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Message Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="p-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-toggle" className="text-sm font-medium">
                      Sound notifications
                    </Label>
                    <Switch
                      id="sound-toggle"
                      checked={soundEnabled}
                      onCheckedChange={setSoundEnabled}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications-toggle" className="text-sm font-medium">
                      Push notifications
                    </Label>
                    <Switch
                      id="notifications-toggle"
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode-toggle" className="text-sm font-medium">
                      Dark mode
                    </Label>
                    <Switch
                      id="dark-mode-toggle"
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="compact-mode-toggle" className="text-sm font-medium">
                      Compact mode
                    </Label>
                    <Switch
                      id="compact-mode-toggle"
                      checked={compactMode}
                      onCheckedChange={setCompactMode}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="encryption-toggle" className="text-sm font-medium">
                      End-to-end encryption
                    </Label>
                    <Switch
                      id="encryption-toggle"
                      checked={encryptionEnabled}
                      onCheckedChange={setEncryptionEnabled}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-delete-toggle" className="text-sm font-medium">
                      Auto-delete messages
                    </Label>
                    <Switch
                      id="auto-delete-toggle"
                      checked={autoDeleteEnabled}
                      onCheckedChange={setAutoDeleteEnabled}
                      className="data-[state=checked]:bg-red-500"
                    />
                  </div>

                  {autoDeleteEnabled && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Auto-delete after (hours)</Label>
                      <Slider
                        value={[autoDeleteDuration]}
                        onValueChange={(value) => setAutoDeleteDuration(value[0])}
                        max={168}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 text-center">{autoDeleteDuration} hours</div>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* Enhanced message search */}
      <AnimatePresence>
        {showMessageSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search messages in current conversation..."
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={() => setShowMessageSearch(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {messageSearchQuery && (
                <div className="mt-2 text-sm text-gray-500">
                  Found {filteredMessages.length} message(s) matching "{messageSearchQuery}"
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Enhanced Conversations List */}
        <Card className="lg:col-span-1 h-full overflow-hidden flex flex-col shadow-xl border-0 bg-white dark:bg-gray-900">
          <CardHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center">
                <span>Conversations</span>
                {conversations.filter((c) => !c.lastMessageRead && c.lastMessageSenderId !== user?.uid).length > 0 && (
                  <Badge variant="destructive" className="ml-2 animate-pulse">
                    {conversations.filter((c) => !c.lastMessageRead && c.lastMessageSenderId !== user?.uid).length}
                  </Badge>
                )}
              </CardTitle>

              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filter & Sort</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={showOnlineOnly}
                      onCheckedChange={setShowOnlineOnly}
                    >
                      Show online only
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                      <DropdownMenuRadioItem value="time">Last message</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="unread">Unread count</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                      <DropdownMenuRadioItem value="desc">
                        <SortDesc className="h-4 w-4 mr-2" />
                        Descending
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="asc">
                        <SortAsc className="h-4 w-4 mr-2" />
                        Ascending
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setIsSelectionMode(!isSelectionMode)}>
                      <Users className="h-4 w-4 mr-2" />
                      {isSelectionMode ? "Exit selection" : "Select conversations"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive all read
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark all as read
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <AnimatePresence>
              {filteredAndSortedConversations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full p-6 text-center"
                >
                  {searchQuery ? (
                    <>
                      <Search className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-700 dark:text-gray-300 font-medium">No matching conversations</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search query</p>
                      <Button onClick={() => setSearchQuery("")} variant="outline" className="mt-4">
                        <X className="h-4 w-4 mr-2" /> Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <User className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-700 dark:text-gray-300 font-medium">No conversations yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        When you connect with someone, you'll see your conversations here
                      </p>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredAndSortedConversations.map((conversation, index) => {
                    const otherParticipantId = getOtherParticipantId(conversation)
                    const isOnline = otherParticipantId ? onlineStatus[otherParticipantId]?.isOnline : false
                    const lastSeen = otherParticipantId ? onlineStatus[otherParticipantId]?.lastSeen : null

                    return (
                      <ContextMenu key={conversation.id}>
                        <ContextMenuTrigger>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 relative group",
                              selectedConversation?.id === conversation.id
                                ? "bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800",
                              conversation.lastMessageSenderId !== user?.uid &&
                                !conversation.lastMessageRead &&
                                "bg-blue-25 dark:bg-blue-900/10",
                              conversation.isPinned && "border-l-4 border-yellow-400",
                              conversation.isMuted && "opacity-60",
                              compactMode && "p-2",
                            )}
                            onClick={async () => {
                              const updatedConversation = ensureParticipantNames(conversation)

                              if (conversation.lastMessageSenderId !== user?.uid && !conversation.lastMessageRead) {
                                updateConversationReadStatus(conversation.id, true)
                              }

                              setSelectedConversation({
                                ...updatedConversation,
                                lastMessageRead: true,
                              })

                              if (conversation.lastMessageSenderId !== user?.uid && !conversation.lastMessageRead) {
                                try {
                                  await markAllConversationMessagesAsRead(conversation.id)
                                } catch (error) {
                                  console.error("Error marking conversation as read:", error)
                                  updateConversationReadStatus(conversation.id, false)
                                }
                              }
                            }}
                          >
                            <div className="relative">
                              <Avatar className={cn("border-2 border-white shadow-sm", compactMode ? "h-8 w-8" : "h-12 w-12")}>
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                                  {getOtherParticipantName(conversation).charAt(0).toUpperCase() || (
                                    <User className={cn(compactMode ? "h-3 w-3" : "h-5 w-5")} />
                                  )}
                                </AvatarFallback>
                              </Avatar>

                              {/* Online status indicator */}
                              <div
                                className={cn(
                                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                                  isOnline ? "bg-green-500" : "bg-gray-400",
                                  compactMode && "w-3 h-3",
                                )}
                              />

                              {/* Unread indicator */}
                              {conversation.lastMessageSenderId !== user?.uid && !conversation.lastMessageRead && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                              )}

                              {/* Typing indicator */}
                              {conversation.isTyping?.[otherParticipantId || ""] && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white">
                                  <div className="w-full h-full rounded-full bg-blue-500 animate-ping" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center space-x-2">
                                  <p
                                    className={cn(
                                      "font-semibold truncate text-gray-900 dark:text-white",
                                      conversation.lastMessageSenderId !== user?.uid &&
                                        !conversation.lastMessageRead &&
                                        "font-bold",
                                      compactMode && "text-sm",
                                    )}
                                  >
                                    {getOtherParticipantName(conversation)}
                                  </p>

                                  {/* Status badges */}
                                  <div className="flex items-center space-x-1">
                                    {conversation.isPinned && (
                                      <Pin className="h-3 w-3 text-yellow-500" />
                                    )}
                                    {conversation.isStarred && (
                                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    )}
                                    {conversation.isMuted && (
                                      <BellOff className="h-3 w-3 text-gray-400" />
                                    )}
                                    {conversation.encryptionEnabled && (
                                      <Shield className="h-3 w-3 text-green-500" />
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end space-y-1">
                                  <span className={cn("text-xs text-gray-500 whitespace-nowrap", compactMode && "text-xs")}>
                                    {conversation.lastMessageTimeDate
                                      ? formatMessageTime(conversation.lastMessageTimeDate)
                                      : ""}
                                  </span>

                                  {conversation.unreadCount && conversation.unreadCount > 0 && (
                                    <Badge variant="destructive" className="text-xs px-1 py-0 min-w-[1.25rem] h-5">
                                      {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <p
                                  className={cn(
                                    "text-sm truncate text-gray-600 dark:text-gray-400",
                                    conversation.lastMessageSenderId !== user?.uid &&
                                      !conversation.lastMessageRead &&
                                      "font-medium text-gray-900 dark:text-white",
                                    compactMode && "text-xs",
                                  )}
                                >
                                  {conversation.isTyping?.[otherParticipantId || ""] ? (
                                    <span className="text-blue-500 italic">Typing...</span>
                                  ) : (
                                    conversation.lastMessage || "No messages yet"
                                  )}
                                </p>

                                {/* Message status for sent messages */}
                                {conversation.lastMessageSenderId === user?.uid && (
                                  <div className="ml-2">
                                    {conversation.lastMessageRead ? (
                                      <CheckCheck className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      <Check className="h-3 w-3 text-gray-400" />
                                    )}
                                  </div>
                                )}
                              </div>

                              {conversation.jobTitle && (
                                <p className={cn("text-xs text-blue-600 dark:text-blue-400 truncate mt-1 font-medium", compactMode && "text-xs")}>
                                  Re: {conversation.jobTitle}
                                </p>
                              )}

                              {/* Online status text */}
                              {!compactMode && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {isOnline ? (
                                    "Online"
                                  ) : lastSeen ? (
                                    `Last seen ${formatDistanceToNow(lastSeen.toDate?.() || lastSeen, { addSuffix: true })}`
                                  ) : (
                                    "Offline"
                                  )}
                                </p>
                              )}
                            </div>

                            {/* Selection checkbox */}
                            <AnimatePresence>
                              {isSelectionMode && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="ml-2"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedMessages.has(conversation.id)}
                                    onChange={(e) => {
                                      const newSelected = new Set(selectedMessages)
                                      if (e.target.checked) {
                                        newSelected.add(conversation.id)
                                      } else {
                                        newSelected.delete(conversation.id)
                                      }
                                      setSelectedMessages(newSelected)
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </ContextMenuTrigger>

                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => replyToMessage(messages[messages.length - 1])}>
                            <Reply className="h-4 w-4 mr-2" />
                            Reply
                            <ContextMenuShortcut>R</ContextMenuShortcut>
                          </ContextMenuItem>
                          <ContextMenuItem>
                            <Pin className="h-4 w-4 mr-2" />
                            {conversation.isPinned ? "Unpin" : "Pin"}
                            <ContextMenuShortcut>P</ContextMenuShortcut>
                          </ContextMenuItem>
                          <ContextMenuItem>
                            <Star className="h-4 w-4 mr-2" />
                            {conversation.isStarred ? "Unstar" : "Star"}
                            <ContextMenuShortcut>S</ContextMenuShortcut>
                          </ContextMenuItem>
                          <ContextMenuItem>
                            {conversation.isMuted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                            {conversation.isMuted ? "Unmute" : "Mute"}
                            <ContextMenuShortcut>M</ContextMenuShortcut>
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                            <ContextMenuShortcut>A</ContextMenuShortcut>
                          </ContextMenuItem>
                          <ContextMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                            <ContextMenuShortcut>Del</ContextMenuShortcut>
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    )
                  })}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Bulk actions for selection mode */}
          <AnimatePresence>
            {isSelectionMode && selectedMessages.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-4 border-t bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedMessages.size} conversation(s) selected
                  </span>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Archive className="h-4 w-4 mr-1" />
                      Archive
                    </Button>
                    <Button size="sm" variant="outline">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark read
                    </Button>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Enhanced Messages Area */}
        <Card className="lg:col-span-2 h-full overflow-hidden flex flex-col shadow-xl border-0 dark:bg-gray-900">
          {selectedConversation ? (
            <>
              <CardHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                          {getOtherParticipantName(selectedConversation).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Online status */}
                      <div
                        className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                          onlineStatus[getOtherParticipantId(selectedConversation) || ""]?.isOnline
                            ? "bg-green-500"
                            : "bg-gray-400",
                        )}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                        {getOtherParticipantName(selectedConversation)}
                        {selectedConversation.encryptionEnabled && (
                          <Shield className="h-4 w-4 ml-2 text-green-500" />
                        )}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        {selectedConversation.jobTitle && (
                          <Badge variant="outline" className="text-xs">
                            Job: {selectedConversation.jobTitle}
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {onlineStatus[getOtherParticipantId(selectedConversation) || ""]?.isOnline
                            ? "Online"
                            : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => initiateCall("audio")}
                            variant="outline"
                            size="sm"
                            className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:hover:bg-green-900/40"
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
                            className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/40"
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Start video call</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" />
                          {selectedConversation.isStarred ? "Unstar" : "Star"} conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pin className="h-4 w-4 mr-2" />
                          {selectedConversation.isPinned ? "Unpin" : "Pin"} conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {selectedConversation.isMuted ? (
                            <Bell className="h-4 w-4 mr-2" />
                          ) : (
                            <BellOff className="h-4 w-4 mr-2" />
                          )}
                          {selectedConversation.isMuted ? "Unmute" : "Mute"} notifications
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          {selectedConversation.encryptionEnabled ? "Disable" : "Enable"} encryption
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete conversation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Typing indicator */}
                <AnimatePresence>
                  {typingUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 text-sm text-blue-500 italic"
                    >
                      {typingUsers.map((user) => user.userName).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardHeader>

              <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
                <AnimatePresence>
                  {(showMessageSearch ? filteredMessages : messages).length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center"
                    >
                      {showMessageSearch && messageSearchQuery ? (
                        <>
                          <Search className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-gray-700 dark:text-gray-300 font-medium">No messages found</p>
                          <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
                        </>
                      ) : (
                        <>
                          <Send className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-gray-700 dark:text-gray-300 font-medium">No messages yet</p>
                          <p className="text-sm text-gray-500 mt-1">Send a message to start the conversation</p>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {(showMessageSearch ? filteredMessages : messages).map((message, index) => {
                        const isSender = message.senderId === user?.uid
                        const showReadStatus = isSender && typeof message.read !== "undefined"
                        const isHighlighted = showMessageSearch && messageSearchQuery && 
                          message.content.toLowerCase().includes(messageSearchQuery.toLowerCase())

                        return (
                          <ContextMenu key={message.id}>
                            <ContextMenuTrigger>
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={cn("flex", isSender ? "justify-end" : "justify-start")}
                              >
                                <div
                                  className={cn(
                                    "max-w-[75%] px-4 py-3 rounded-2xl shadow-sm relative group transition-all duration-200",
                                    isSender
                                      ? "bg-blue-500 text-white rounded-br-md"
                                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md",
                                    isHighlighted && "ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
                                    message.priority === "urgent" && "border-l-4 border-red-500",
                                    message.priority === "high" && "border-l-4 border-orange-500",
                                    message.encrypted && "border border-green-200 dark:border-green-800",
                                  )}
                                >
                                  {/* Reply indicator */}
                                  {message.replyTo && (
                                    <div className={cn(
                                      "text-xs opacity-75 mb-2 p-2 rounded border-l-2",
                                      isSender ? "border-white/30 bg-white/10" : "border-gray-300 bg-gray-50 dark:bg-gray-700"
                                    )}>
                                      <div className="flex items-center">
                                        <Reply className="h-3 w-3 mr-1" />
                                        Replying to message
                                      </div>
                                    </div>
                                  )}

                                  {/* Message content */}
                                  <div className="break-words">
                                    {message.content}
                                    {message.edited && (
                                      <span className={cn(
                                        "text-xs ml-2 opacity-60",
                                        isSender ? "text-blue-100" : "text-gray-500"
                                      )}>
                                        (edited)
                                      </span>
                                    )}
                                  </div>

                                  {/* Message reactions */}
                                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {Object.entries(message.reactions).map(([emoji, users]) => (
                                        <button
                                          key={emoji}
                                          onClick={() => addReaction(message.id, emoji)}
                                          className={cn(
                                            "flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors",
                                            users.includes(user?.uid || "")
                                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                          )}
                                        >
                                          <span>{emoji}</span>
                                          <span>{users.length}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Message metadata */}
                                  <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center space-x-2">
                                      <div className={cn("text-xs", isSender ? "text-blue-100" : "text-gray-500")}>
                                        {formatMessageTime(message.timestamp)}
                                      </div>

                                      {/* Priority indicator */}
                                      {message.priority && message.priority !== "normal" && (
                                        <Badge variant="outline" className="text-xs px-1 py-0">
                                          {MESSAGE_PRIORITIES.find(p => p.value === message.priority)?.icon}
                                        </Badge>
                                      )}

                                      {/* Encryption indicator */}
                                      {message.encrypted && (
                                        <Shield className="h-3 w-3 text-green-500" />
                                      )}

                                      {/* Forwarded indicator */}
                                      {message.forwarded && (
                                        <Forward className="h-3 w-3 text-gray-400" />
                                      )}
                                    </div>

                                    {/* Read status for sent messages */}
                                    {showReadStatus && (
                                      <div className="flex items-center ml-2">
                                        <AnimatePresence mode="wait">
                                          <motion.div
                                            key={`status-${message.read}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            {message.read ? (
                                              <CheckCheck className="h-4 w-4 text-blue-200" />
                                            ) : (
                                              <Check className="h-4 w-4 text-blue-300" />
                                            )}
                                          </motion.div>
                                        </AnimatePresence>
                                      </div>
                                    )}
                                  </div>

                                  {/* Quick reaction buttons */}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 right-0 flex space-x-1">
                                    {EMOJI_REACTIONS.slice(0, 3).map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => addReaction(message.id, emoji)}
                                        className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-sm hover:scale-110 transition-transform"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            </ContextMenuTrigger>

                            <ContextMenuContent>
                              <ContextMenuItem onClick={() => replyToMessage(message)}>
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                                <ContextMenuShortcut>R</ContextMenuShortcut>
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => forwardMessage(message)}>
                                <Forward className="h-4 w-4 mr-2" />
                                Forward
                                <ContextMenuShortcut>F</ContextMenuShortcut>
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => copyMessage(message.content)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                                <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
                              </ContextMenuItem>
                              {isSender && (
                                <ContextMenuItem onClick={() => editMessage(message)}>
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Edit
                                  <ContextMenuShortcut>E</ContextMenuShortcut>
                                </ContextMenuItem>
                              )}
                              <ContextMenuSeparator />
                              <ContextMenuItem>
                                <Star className="h-4 w-4 mr-2" />
                                Star message
                                <ContextMenuShortcut>S</ContextMenuShortcut>
                              </ContextMenuItem>
                              <ContextMenuItem>
                                <Pin className="h-4 w-4 mr-2" />
                                Pin message
                                <ContextMenuShortcut>P</ContextMenuShortcut>
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              {isSender && (
                                <ContextMenuItem onClick={() => deleteMessage(message.id)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                  <ContextMenuShortcut>Del</ContextMenuShortcut>
                                </ContextMenuItem>
                              )}
                            </ContextMenuContent>
                          </ContextMenu>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>

              {/* Scroll to bottom button */}
              <AnimatePresence>
                {showScrollButton && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute bottom-32 right-6 z-10"
                  >
                    <Button
                      onClick={scrollToBottom}
                      className="rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                    >
                      ↓
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reply/Edit indicator */}
              <AnimatePresence>
                {(replyingTo || editingMessage) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="px-6 py-3 border-t bg-blue-50 dark:bg-blue-900/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {replyingTo ? (
                          <>
                            <Reply className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Replying to: {replyingTo.content.substring(0, 50)}...
                            </span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                              Editing message
                            </span>
                          </>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null)
                          setEditingMessage(null)
                          setNewMessage("")
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced message input */}
              <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
                {/* Message priority and options */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <span className="mr-1">
                            {MESSAGE_PRIORITIES.find(p => p.value === messagePriority)?.icon}
                          </span>
                          {MESSAGE_PRIORITIES.find(p => p.value === messagePriority)?.label}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48" align="start">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Message Priority</Label>
                          {MESSAGE_PRIORITIES.map((priority) => (
                            <button
                              key={priority.value}
                              onClick={() => setMessagePriority(priority.value as any)}
                              className={cn(
                                "w-full flex items-center space-x-2 p-2 rounded text-sm transition-colors",
                                messagePriority === priority.value
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
                              )}
                            >
                              <span>{priority.icon}</span>
                              <span className={priority.color}>{priority.label}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {encryptionEnabled && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Encrypted
                      </Badge>
                    )}

                    {scheduleMessage && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Scheduled
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Schedule message</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share location</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
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
                          <Button type="button" variant="outline" size="sm">
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send image</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={voiceRecording ? stopVoiceRecording : startVoiceRecording}
                            className={cn(voiceRecording && "bg-red-50 border-red-200 text-red-700")}
                          >
                            {voiceRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {voiceRecording ? `Recording... ${recordingDuration}s` : "Record voice message"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="flex-1 relative">
                    <Textarea
                      ref={messageInputRef}
                      placeholder={
                        editingMessage
                          ? "Edit your message..."
                          : replyingTo
                          ? "Reply to message..."
                          : "Type a message..."
                      }
                      value={newMessage}
                      onChange={handleInputChange}
                      className="min-h-[44px] max-h-32 resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage(e as any)
                        }
                      }}
                    />
                    
                    {/* Character count */}
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {newMessage.length}/1000
                    </div>
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="grid grid-cols-8 gap-2 p-2">
                        {EMOJI_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => setNewMessage(prev => prev + emoji)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6"
                    disabled={!newMessage.trim() && !replyingTo}
                  >
                    {editingMessage ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </form>

                {/* Voice recording indicator */}
                <AnimatePresence>
                  {voiceRecording && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-3 flex items-center justify-center space-x-2 text-red-600"
                    >
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Recording... {recordingDuration}s</span>
                      <Button
                        onClick={stopVoiceRecording}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                      >
                        Stop
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-gray-500 dark:text-gray-400 mt-2"
                    >
                      Typing...
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full p-6 text-center"
            >
              <div className="relative mb-6">
                <User className="h-20 w-20 text-gray-300 dark:text-gray-600" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Send className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">Select a conversation</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Choose a conversation from the list to start messaging
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Shield className="h-4 w-4" />
                <span>All messages are end-to-end encrypted</span>
              </div>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Enhanced Call Dialog */}
      <Dialog open={callActive} onOpenChange={(open) => !open && endCall()}>
        <DialogContent className="sm:max-w-[1000px] h-[85vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  {callType === "audio" ? (
                    <Phone className="h-6 w-6 text-green-600" />
                  ) : (
                    <Video className="h-6 w-6 text-blue-600" />
                  )}
                  {callType === "audio" ? "Audio Call" : "Video Call"} with {callRecipient?.name}
                </DialogTitle>
                <DialogDescription className="flex items-center space-x-4 mt-2">
                  <span>Duration: {formatCallDuration(callDuration)}</span>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    callQuality === "excellent" && "text-green-600 border-green-200",
                    callQuality === "good" && "text-blue-600 border-blue-200",
                    callQuality === "fair" && "text-yellow-600 border-yellow-200",
                    callQuality === "poor" && "text-red-600 border-red-200"
                  )}>
                    {callQuality} quality
                  </Badge>
                </DialogDescription>
              </div>

              <div className="flex items-center space-x-2">
                {callType === "video" && (
                  <Button
                    onClick={toggleCallVideo}
                    variant="outline"
                    size="sm"
                    className={cn(
                      !isVideoEnabled && "bg-red-50 border-red-200 text-red-700"
                    )}
                  >
                    {isVideoEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                  </Button>
                )}

                <Button
                  onClick={toggleCallMute}
                  variant="outline"
                  size="sm"
                  className={cn(
                    isCallMuted && "bg-red-50 border-red-200 text-red-700"
                  )}
                >
                  {isCallMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>

                {callType === "video" && (
                  <Button
                    onClick={toggleScreenShare}
                    variant="outline"
                    size="sm"
                    className={cn(
                      isScreenSharing && "bg-blue-50 border-blue-200 text-blue-700"
                    )}
                  >
                    {isScreenSharing ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 p-6 pt-0">
            <div
              ref={zegoContainerRef}
              className="w-full h-full bg-gray-900 rounded-lg overflow-hidden shadow-inner"
              style={{ minHeight: "500px" }}
            />
          </div>

          <DialogFooter className="p-6 pt-0">
            <div className="flex justify-center space-x-4">
              <Button onClick={endCall} variant="destructive" className="bg-red-600 hover:bg-red-700 px-8">
                <PhoneOff className="h-4 w-4 mr-2" />
                End Call
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          // Handle file upload
          console.log("Files selected:", e.target.files)
        }}
      />
    </div>
  )
}
