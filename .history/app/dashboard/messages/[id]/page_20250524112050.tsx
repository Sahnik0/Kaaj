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
  Star,
  Trash2,
  Volume2,
  VolumeX,
  Settings,
  Smile,
  Paperclip,
  ImageIcon,
  CheckCheck,
  Check,
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
import { motion, AnimatePresence } from "framer-motion"
import { format, isToday, isYesterday } from "date-fns"

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
  type?: "text" | "image" | "file"
  metadata?: any
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
  unreadCount?: number
}

export default function EnhancedMessages() {
  const { user, getConversations, getMessages, sendMessage, createConversation, markAllConversationMessagesAsRead } =
    useFirebase()

  // State management
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [processingRecipient, setProcessingRecipient] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Call state
  const [callType, setCallType] = useState<"audio" | "video" | null>(null)
  const [callActive, setCallActive] = useState(false)
  const [callRecipient, setCallRecipient] = useState<any>(null)
  const [zegoInstance, setZegoInstance] = useState<any>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const zegoContainerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()

  // Zego Cloud configuration
  const ZEGO_APP_ID = 1179547342
  const ZEGO_SERVER_SECRET = "4b1d0991e55d2bfa10d0f452e1951fce"

  // Memoized filtered conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations

    const query = searchQuery.toLowerCase()
    return conversations.filter((conversation) => {
      const otherParticipantName = getOtherParticipantName(conversation).toLowerCase()
      const lastMessage = (conversation.lastMessage || "").toLowerCase()
      const jobTitle = (conversation.jobTitle || "").toLowerCase()

      return otherParticipantName.includes(query) || lastMessage.includes(query) || jobTitle.includes(query)
    })
  }, [searchQuery, conversations])

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

  // Get other participant name
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

  // Fetch conversations
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

  // Enhanced message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !selectedConversation) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setIsTyping(false)

    try {
      const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)

      if (!recipientId) {
        console.error("Could not find recipient ID")
        return
      }

      await sendMessage(recipientId, messageContent, selectedConversation.jobId, selectedConversation.jobTitle)

      // Play send sound if enabled
      if (soundEnabled) {
        // You can add a sound effect here
      }
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
            onLeaveRoom: () => {
              console.log("Left Zego room")
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
  }, [zegoInstance])

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    setIsTyping(e.target.value.length > 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-3"
          >
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-600 font-medium">Loading messages...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Communicate securely with recruiters and candidates.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Enhanced Conversations List */}
        <Card className="lg:col-span-1 h-full overflow-hidden flex flex-col shadow-lg border-0 bg-white">
          <CardHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-gray-900 flex items-center">
                <span>Conversations</span>
                {conversations.filter((c) => !c.lastMessageRead && c.lastMessageSenderId !== user?.uid).length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {conversations.filter((c) => !c.lastMessageRead && c.lastMessageSenderId !== user?.uid).length}
                  </Badge>
                )}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSoundEnabled(!soundEnabled)}>
                    {soundEnabled ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                    {soundEnabled ? "Disable sounds" : "Enable sounds"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
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
              {filteredConversations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full p-6 text-center"
                >
                  {searchQuery ? (
                    <>
                      <Search className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-700 font-medium">No matching conversations</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search query</p>
                      <Button onClick={() => setSearchQuery("")} variant="outline" className="mt-4">
                        <X className="h-4 w-4 mr-2" /> Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <User className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-700 font-medium">No conversations yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        When you connect with someone, you'll see your conversations here
                      </p>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredConversations.map((conversation, index) => (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 relative group",
                        selectedConversation?.id === conversation.id
                          ? "bg-blue-50 border-r-4 border-blue-500"
                          : "hover:bg-gray-50",
                        conversation.lastMessageSenderId !== user?.uid && !conversation.lastMessageRead && "bg-blue-25",
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
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                            {getOtherParticipantName(conversation).charAt(0).toUpperCase() || (
                              <User className="h-5 w-5" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.lastMessageSenderId !== user?.uid && !conversation.lastMessageRead && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p
                            className={cn(
                              "font-semibold truncate text-gray-900",
                              conversation.lastMessageSenderId !== user?.uid &&
                                !conversation.lastMessageRead &&
                                "font-bold",
                            )}
                          >
                            {getOtherParticipantName(conversation)}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {conversation.lastMessageTimeDate
                              ? formatMessageTime(conversation.lastMessageTimeDate)
                              : ""}
                          </span>
                        </div>

                        <p
                          className={cn(
                            "text-sm truncate text-gray-600",
                            conversation.lastMessageSenderId !== user?.uid &&
                              !conversation.lastMessageRead &&
                              "font-medium text-gray-900",
                          )}
                        >
                          {conversation.lastMessage || "No messages yet"}
                        </p>

                        {conversation.jobTitle && (
                          <p className="text-xs text-blue-600 truncate mt-1 font-medium">Re: {conversation.jobTitle}</p>
                        )}
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Star className="h-4 w-4 mr-2" />
                              {conversation.isStarred ? "Unstar" : "Star"}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </Card>

        {/* Enhanced Messages Area */}
        <Card className="lg:col-span-2 h-full overflow-hidden flex flex-col shadow-lg border-0">
          {selectedConversation ? (
            <>
              <CardHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                        {getOtherParticipantName(selectedConversation).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg text-gray-900">
                        {getOtherParticipantName(selectedConversation)}
                      </CardTitle>
                      {selectedConversation.jobTitle && (
                        <p className="text-sm text-blue-600 font-medium">Job: {selectedConversation.jobTitle}</p>
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" />
                          Star conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                      <Send className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-700 font-medium">No messages yet</p>
                      <p className="text-sm text-gray-500 mt-1">Send a message to start the conversation</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isSender = message.senderId === user?.uid
                        const showReadStatus = isSender && typeof message.read !== "undefined"

                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn("flex", isSender ? "justify-end" : "justify-start")}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] px-4 py-3 rounded-2xl shadow-sm relative group",
                                isSender
                                  ? "bg-blue-500 text-white rounded-br-md"
                                  : "bg-gray-100 text-gray-900 rounded-bl-md",
                              )}
                            >
                              <div className="break-words">{message.content}</div>
                              <div className="flex justify-between items-center mt-2">
                                <div className={cn("text-xs", isSender ? "text-blue-100" : "text-gray-500")}>
                                  {formatMessageTime(message.timestamp)}
                                </div>

                                {showReadStatus && (
                                  <div className="flex items-center ml-2">
                                    {message.read ? (
                                      <CheckCheck className="h-4 w-4 text-blue-200" />
                                    ) : (
                                      <Check className="h-4 w-4 text-blue-300" />
                                    )}
                                  </div>
                                )}
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

              <div className="p-4 border-t bg-gray-50">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
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
                  </div>

                  <Input
                    ref={messageInputRef}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleInputChange}
                    className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                  />

                  <Button type="button" variant="outline" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>

                  <Button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6"
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>

                <AnimatePresence>
                  {isTyping && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs text-gray-500 mt-2"
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
              <User className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">Select a conversation</p>
              <p className="text-gray-500">Choose a conversation to start messaging</p>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Enhanced Call Dialog */}
      <Dialog open={callActive} onOpenChange={(open) => !open && endCall()}>
        <DialogContent className="sm:max-w-[900px] h-[80vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-3">
              {callType === "audio" ? (
                <Phone className="h-5 w-5 text-green-600" />
              ) : (
                <Video className="h-5 w-5 text-blue-600" />
              )}
              {callType === "audio" ? "Audio Call" : "Video Call"} with {callRecipient?.name}
            </DialogTitle>
            <DialogDescription>High-quality {callType} call powered by Zego Cloud</DialogDescription>
          </DialogHeader>

          <div className="flex-1 p-6 pt-0">
            <div
              ref={zegoContainerRef}
              className="w-full h-full bg-gray-900 rounded-lg overflow-hidden"
              style={{ minHeight: "400px" }}
            />
          </div>

          <div className="flex justify-center p-6 pt-0">
            <Button onClick={endCall} variant="destructive" className="bg-red-600 hover:bg-red-700 px-8">
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
