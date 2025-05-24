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
  Paperclip,
  ImageIcon,
  Mic,
  MicOff,
} from "lucide-react"
import { RetroBox } from "@/components/ui/retro-box"
import { useLanguage } from "@/lib/i18n/language-context"
import { useRetroToast } from "@/hooks/use-retro-toast"
import { format, isToday, isYesterday } from "date-fns"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  type?: "text" | "image" | "file" | "audio"
  reactions?: Record<string, string[]>
  edited?: boolean
  editedAt?: any
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
    addMessageReaction,
    removeMessageReaction,
  } = useFirebase()

  // State management
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")

  // Refs
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useRetroToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Fetch conversation and messages
  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        const conversationData = await getConversationById(id)

        if (!conversationData) {
          toast({
            title: "Error",
            description: "Conversation not found",
            variant: "destructive",
          })
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
            displayName: conversationData.participantNames?.[otherParticipantId] || "User",
          })
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching conversation:", error)
        toast({
          title: "Error",
          description: "Failed to load conversation",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchData()
  }, [user, id, getConversationById, router, toast])

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
        }, 500)
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
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this conversation",
          variant: "destructive",
        })
        router.push("/dashboard/messages")
      }
    }
  }, [conversation, user, loading, router, toast])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Enhanced message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !conversation || !otherUser) return

    try {
      setSending(true)
      await sendMessage(otherUser.id, newMessage.trim(), conversation.jobId, conversation.jobTitle)
      setNewMessage("")
      setIsTyping(false)
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  // Message reactions
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      if (!user) return

      const message = messages.find((m) => m.id === messageId)
      if (!message) return

      const userReactions = message.reactions?.[emoji] || []
      const hasReacted = userReactions.includes(user.uid)

      if (hasReacted) {
        await removeMessageReaction?.(id, messageId, emoji, user.uid)
      } else {
        await addMessageReaction?.(id, messageId, emoji, user.uid)
      }
    } catch (error) {
      console.error("Error handling reaction:", error)
    }
  }

  // Message editing
  const startEditing = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditingContent(content)
  }

  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditingContent("")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
          <p className="text-lg font-medium">Loading conversation...</p>
        </motion.div>
      </div>
    )
  }

  if (!conversation || !otherUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <RetroBox className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Conversation not found</h2>
          <p className="mb-6">This conversation may have been deleted or you don't have access to it.</p>
          <Button
            className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            onClick={() => router.push("/dashboard/messages")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Button>
        </RetroBox>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
        <Button
          variant="outline"
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          onClick={() => router.push("/dashboard/messages")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Messages
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <RetroBox className="h-[calc(100vh-12rem)] flex flex-col">
          {/* Enhanced conversation header */}
          <div className="border-b-2 border-black p-4 bg-gradient-to-r from-yellow-100 to-yellow-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <AvatarFallback className="bg-yellow-300 text-black font-bold text-lg">
                    {otherUser.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{otherUser.displayName}</h2>
                  {conversation.jobTitle && (
                    <p className="text-sm text-gray-700 flex items-center gap-1">💼 {conversation.jobTitle}</p>
                  )}
                  {isTyping && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-gray-600 italic flex items-center gap-1"
                    >
                      <span className="flex gap-1">
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0 }}
                        >
                          •
                        </motion.span>
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.2 }}
                        >
                          •
                        </motion.span>
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.4 }}
                        >
                          •
                        </motion.span>
                      </span>
                      typing
                    </motion.p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-green-100 hover:bg-green-200"
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
                        className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-blue-100 hover:bg-blue-200"
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
                      className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Block User</DropdownMenuItem>
                    <DropdownMenuItem>Report</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Enhanced messages area */}
          <ScrollArea className="flex-1 p-4">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-500 mt-8 space-y-4"
                >
                  <div className="text-6xl">💬</div>
                  <h3 className="text-lg font-semibold">No messages yet</h3>
                  <p className="text-sm">Start the conversation by sending a message below</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isSender = message.senderId === user?.uid
                    const prevMessage = messages[index - 1]
                    const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId
                    const isEditing = editingMessageId === message.id

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("group relative", isSender ? "flex justify-end" : "flex justify-start")}
                      >
                        <div className={cn("max-w-[75%] flex gap-3", isSender ? "flex-row-reverse" : "flex-row")}>
                          {!isSender && showAvatar && (
                            <Avatar className="h-8 w-8 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                              <AvatarFallback className="bg-blue-200 text-black font-semibold text-sm">
                                {otherUser.displayName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!isSender && !showAvatar && <div className="w-8" />}

                          <div className="space-y-1">
                            <div
                              className={cn(
                                "relative p-3 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200",
                                isSender ? "bg-yellow-300 text-black ml-auto" : "bg-white text-black",
                                "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
                              )}
                            >
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    className="border-2 border-black"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        // Handle edit save
                                        cancelEditing()
                                      } else if (e.key === "Escape") {
                                        cancelEditing()
                                      }
                                    }}
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={cancelEditing}>
                                      Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelEditing}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="break-words">{message.content}</p>
                                  {message.edited && <p className="text-xs text-gray-600 italic mt-1">(edited)</p>}
                                </>
                              )}

                              {/* Message reactions */}
                              {message.reactions && Object.keys(message.reactions).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {Object.entries(message.reactions).map(([emoji, users]) => (
                                    <motion.button
                                      key={emoji}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-full border border-black text-xs",
                                        users.includes(user?.uid || "")
                                          ? "bg-yellow-200"
                                          : "bg-gray-100 hover:bg-gray-200",
                                      )}
                                      onClick={() => handleReaction(message.id, emoji)}
                                    >
                                      <span>{emoji}</span>
                                      <span>{users.length}</span>
                                    </motion.button>
                                  ))}
                                </div>
                              )}

                              {/* Message actions */}
                              <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-1 bg-white border-2 border-black rounded-lg p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Smile className="h-3 w-3" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-2">
                                      <div className="grid grid-cols-6 gap-1">
                                        {["❤️", "👍", "😂", "😮", "😢", "😡"].map((emoji) => (
                                          <button
                                            key={emoji}
                                            className="p-2 hover:bg-gray-100 rounded text-lg"
                                            onClick={() => handleReaction(message.id, emoji)}
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>

                                  {isSender && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => startEditing(message.id, message.content)}
                                    >
                                      ✏️
                                    </Button>
                                  )}

                                  {!isSender && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
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
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center px-2">
                              <p className="text-xs text-gray-600">{formatMessageTime(message.timestamp)}</p>

                              {/* Enhanced read status for sent messages */}
                              {isSender && (
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
                                        className="text-xs bg-green-100 text-green-700 border-green-300"
                                      >
                                        ✓✓ Read
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-gray-100 text-gray-600 border-gray-300"
                                      >
                                        ✓ Sent
                                      </Badge>
                                    )}
                                  </motion.div>
                                </AnimatePresence>
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

          <Separator className="border-black border-t-2" />

          {/* Enhanced message input */}
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="flex gap-3 items-end">
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
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
                          variant="outline"
                          size="sm"
                          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
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
                          className={cn(
                            "border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                            isRecording ? "bg-red-200" : "",
                          )}
                          onClick={() => setIsRecording(!isRecording)}
                        >
                          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isRecording ? "Stop recording" : "Record voice message"}</TooltipContent>
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
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] pr-20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                  />

                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="grid grid-cols-8 gap-2 p-2">
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
                            "😒",
                            "😞",
                            "😔",
                            "😟",
                            "😕",
                            "🙁",
                            "☹️",
                            "😣",
                            "😖",
                            "😫",
                            "😩",
                            "🥺",
                            "😢",
                            "😭",
                            "😤",
                            "😠",
                            "😡",
                            "🤬",
                            "🤯",
                            "😳",
                            "🥵",
                            "🥶",
                            "😱",
                            "😨",
                            "😰",
                            "😥",
                            "😓",
                            "🤗",
                            "🤔",
                            "🤭",
                            "🤫",
                            "🤥",
                            "😶",
                            "😐",
                            "😑",
                            "😬",
                            "🙄",
                            "😯",
                            "😦",
                            "😧",
                            "😮",
                            "😲",
                            "🥱",
                            "😴",
                            "🤤",
                            "😪",
                            "😵",
                            "🤐",
                            "🥴",
                            "🤢",
                            "🤮",
                            "🤧",
                            "😷",
                            "🤒",
                            "🤕",
                          ].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="p-2 hover:bg-yellow-100 rounded text-lg transition-colors"
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
                  className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>

              {/* Quick reactions */}
              <div className="flex gap-2 justify-center">
                <span className="text-xs text-gray-600 mr-2">Quick reactions:</span>
                {["👍", "❤️", "😂", "😮", "👏", "🔥"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-lg hover:scale-110 transition-transform"
                    onClick={() => setNewMessage((prev) => prev + emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </form>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,application/pdf,.doc,.docx,.txt"
            onChange={(e) => {
              // Handle file upload
              console.log("Files selected:", e.target.files)
            }}
          />
        </RetroBox>
      </motion.div>
    </div>
  )
}
