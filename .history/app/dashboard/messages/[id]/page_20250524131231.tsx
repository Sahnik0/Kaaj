"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Send,
  ArrowLeft,
  Loader2,
  MoreVertical,
  Phone,
  Video,
  Smile,
  MessageCircle,
  Clock,
  CheckCheck,
  Check,
  Pin,
  PinOff,
  Archive,
  Trash2,
} from "lucide-react"
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { Card } from "@/components/ui/card"

interface ConversationProps {
  params: {
    id: string
  }
}

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
}

export default function EnhancedConversationPage({ params }: ConversationProps) {
  const { id } = params
  const {
    user,
    getConversationById,
    getMessages,
    sendMessage,
    markAllConversationMessagesAsRead,
    markConversationMessageAsRead,
    markConversationMessageAsUnread,
    pinConversation,
    unpinConversation,
    archiveConversation,
    deleteConversation,
  } = useFirebase()

  // State management
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Refs
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
        return "Yesterday " + format(date, "HH:mm")
      } else {
        return format(date, "MMM dd, HH:mm")
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

  // Update conversation read status
  const updateConversationReadStatus = useCallback(
    (isRead: boolean) => {
      if (conversation) {
        setConversation((prev: any) => ({
          ...prev,
          lastMessageRead: isRead,
        }))
      }
    },
    [conversation],
  )

  // Conversation management functions
  const handlePinConversation = async () => {
    if (!conversation) return

    try {
      if (conversation.isPinned) {
        await unpinConversation?.(conversation.id)
        setConversation((prev) => (prev ? { ...prev, isPinned: false } : null))
      } else {
        await pinConversation?.(conversation.id)
        setConversation((prev) => (prev ? { ...prev, isPinned: true } : null))
      }
    } catch (error) {
      console.error("Error pinning/unpinning conversation:", error)
    }
  }

  const handleArchiveConversation = async () => {
    if (!conversation) return

    try {
      await archiveConversation?.(conversation.id)
      router.push("/dashboard/messages")
    } catch (error) {
      console.error("Error archiving conversation:", error)
    }
  }

  const handleDeleteConversation = async () => {
    if (!conversation) return

    try {
      await deleteConversation?.(conversation.id)
      router.push("/dashboard/messages")
    } catch (error) {
      console.error("Error deleting conversation:", error)
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  // Fetch conversation and messages
  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        const conversationData = await getConversationById(id)

        if (!conversationData) {
          router.push("/dashboard/messages")
          return
        }

        setConversation(conversationData)

        const otherParticipantId = conversationData.participants.find(
          (participantId: string) => participantId !== user.uid,
        )

        if (otherParticipantId) {
          setOtherUser({
            id: otherParticipantId,
            displayName:
              conversationData.participantNames?.[otherParticipantId] || `User ${otherParticipantId.substring(0, 8)}`,
          })
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching conversation:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [user, id, getConversationById, router])

  // Real-time messages listener with enhanced read status management
  useEffect(() => {
    if (!user || !id) return () => {}

    let readStatusTimeout: NodeJS.Timeout | null = null

    const unsubscribe = getMessages(id, (updatedMessages) => {
      setMessages(updatedMessages)

      const hasUnreadFromOthers = updatedMessages.some((msg) => msg.senderId !== user.uid && msg.read === false)

      if (hasUnreadFromOthers) {
        if (readStatusTimeout) {
          clearTimeout(readStatusTimeout)
        }

        updateConversationReadStatus(true)

        readStatusTimeout = setTimeout(() => {
          markAllConversationMessagesAsRead(id)
            .then(() => {
              console.log("Automatically marked incoming messages as read")
            })
            .catch((error) => {
              console.error("Error automatically marking messages as read:", error)
            })
        }, 1000)
      }
    })

    return () => {
      if (readStatusTimeout) {
        clearTimeout(readStatusTimeout)
      }
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [user, id, getMessages, markAllConversationMessagesAsRead, updateConversationReadStatus])

  // Access control
  useEffect(() => {
    if (!loading && conversation && user) {
      const isParticipant = conversation.participants.includes(user.uid)

      if (!isParticipant) {
        router.push("/dashboard/messages")
      }
    }
  }, [conversation, user, loading, router])

  // Auto-scroll to bottom
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

    if (!newMessage.trim() || !conversation || !otherUser || sending) return

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
      await sendMessage(otherUser.id, messageContent, conversation.jobId, conversation.jobTitle)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
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
            <h3 className="text-xl font-bold mb-2">Loading conversation...</h3>
            <p className="text-gray-600">Please wait while we fetch your messages...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!conversation || !otherUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center shadow-xl rounded-2xl border-0">
          <div className="mb-6">
            <MessageCircle className="h-20 w-20 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Conversation not found</h2>
            <p className="text-gray-600 mb-6">
              This conversation may have been deleted or you don't have access to it.
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
            onClick={() => router.push("/dashboard/messages")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
        <Button
          variant="outline"
          className="border-gray-200 shadow-sm hover:shadow-md transition-all rounded-xl"
          onClick={() => router.push("/dashboard/messages")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Messages
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="h-[calc(100vh-12rem)] flex flex-col shadow-xl rounded-2xl border-0 overflow-hidden">
          {/* Enhanced conversation header */}
          <div className="border-b p-6 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-white shadow-lg ring-2 ring-gray-100">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                      {otherUser.displayName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                  {conversation.isPinned && (
                    <Pin className="absolute -top-1 -left-1 w-4 h-4 text-amber-600 fill-amber-300 drop-shadow-sm" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{otherUser.displayName}</h2>
                  {conversation.jobTitle && (
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      {conversation.jobTitle}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    Last seen {formatLastSeen(conversation.lastMessageTimeDate)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 shadow-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-xl"
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
                        variant="outline"
                        size="sm"
                        className="border-gray-200 shadow-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Start video call</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-200 shadow-sm hover:shadow-md rounded-xl"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-gray-200 shadow-xl rounded-xl">
                    <DropdownMenuItem onClick={handlePinConversation}>
                      {conversation.isPinned ? (
                        <>
                          <PinOff className="h-4 w-4 mr-2" />
                          Unpin Conversation
                        </>
                      ) : (
                        <>
                          <Pin className="h-4 w-4 mr-2" />
                          Pin Conversation
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleArchiveConversation}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Enhanced messages area */}
          <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-white to-gray-50">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
                      <MessageCircle className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-black text-sm font-bold">✨</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">No messages yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Start the conversation by sending a message to {otherUser.displayName} below.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => {
                    const isSender = message.senderId === user?.uid
                    const prevMessage = messages[index - 1]
                    const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId
                    const isOptimistic = message.id.startsWith("temp-")

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn("group relative", isSender ? "flex justify-end" : "flex justify-start")}
                      >
                        <div className={cn("max-w-[80%] flex gap-3", isSender ? "flex-row-reverse" : "flex-row")}>
                          {!isSender && showAvatar && (
                            <Avatar className="h-8 w-8 border border-gray-200 shadow-sm">
                              <AvatarFallback className="bg-gray-100 text-gray-700 font-bold text-sm">
                                {otherUser.displayName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!isSender && !showAvatar && <div className="w-8" />}

                          <div className="space-y-2">
                            <div
                              className={cn(
                                "relative p-4 rounded-2xl shadow-sm transition-all duration-200",
                                isSender
                                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-auto rounded-br-md"
                                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-md",
                                "hover:shadow-md hover:scale-[1.02]",
                                isOptimistic && "opacity-70",
                              )}
                            >
                              <p className="break-words leading-relaxed font-medium">{message.content}</p>

                              {/* Message actions for received messages */}
                              {!isSender && (
                                <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-lg">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-gray-100 rounded"
                                            onClick={() => {
                                              if (message.read) {
                                                markConversationMessageAsUnread(id, message.id)
                                              } else {
                                                markConversationMessageAsRead(id, message.id)
                                              }
                                            }}
                                          >
                                            {message.read ? "📖" : "📩"}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {message.read ? "Mark as unread" : "Mark as read"}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center px-2">
                              <p className="text-xs text-gray-600 font-medium">
                                {formatMessageTime(message.timestamp)}
                              </p>

                              {/* Enhanced read status for sent messages */}
                              {isSender && !isOptimistic && (
                                <AnimatePresence mode="wait">
                                  <motion.div
                                    key={`status-${message.id}-${message.read ? "read" : "sent"}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1"
                                  >
                                    {message.read ? (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-green-50 text-green-700 border-green-200 shadow-sm"
                                      >
                                        <CheckCheck className="h-3 w-3 mr-1" />
                                        Read
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-gray-50 text-gray-600 border-gray-200 shadow-sm"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Sent
                                      </Badge>
                                    )}
                                  </motion.div>
                                </AnimatePresence>
                              )}

                              {isOptimistic && (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span className="text-xs font-medium">Sending...</span>
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

          {/* Enhanced message input */}
          <div className="p-6 bg-white">
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    className="border-gray-200 focus-visible:ring-blue-500 pr-16 py-3 px-4 text-sm bg-gray-50 rounded-xl shadow-sm"
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
                          className="h-8 w-8 p-0 hover:bg-gray-200 rounded-full"
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 border-gray-200 shadow-xl rounded-2xl bg-white">
                        <div className="grid grid-cols-8 gap-2 p-3 max-h-64 overflow-y-auto">
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
                              className="p-2 hover:bg-gray-100 rounded-lg text-lg transition-all hover:scale-110 transform border border-transparent hover:border-gray-200"
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
                  disabled={sending || !newMessage.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all h-12 px-6 rounded-xl"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>

              {/* Quick reactions */}
              <div className="flex gap-3 justify-center items-center">
                <span className="text-xs text-gray-600 font-medium">Quick reactions:</span>
                {["👍", "❤️", "😂", "😮", "👏", "🔥", "💯", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-lg hover:scale-125 transition-transform hover:bg-gray-100 rounded-full p-1 border border-transparent hover:border-gray-200"
                    onClick={() => setNewMessage((prev) => prev + emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xs text-gray-600 flex items-center gap-2 justify-center"
                  >
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0 }}
                        className="w-1.5 h-1.5 bg-gray-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-gray-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-gray-500 rounded-full"
                      />
                    </div>
                    <span className="font-medium">You are typing...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-gray-200 shadow-xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete this conversation with {otherUser?.displayName}? This action cannot be
              undone and all messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-gray-200 shadow-sm hover:shadow-md rounded-xl"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl rounded-xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
