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
import {
  Send,
  ArrowLeft,
  Loader2,
  MoreVertical,
  Star,
  Archive,
  Trash2,
  Phone,
  Video,
  Smile,
  Paperclip,
  ImageIcon,
  CheckCheck,
  Check,
} from "lucide-react"
import { RetroBox } from "@/components/ui/retro-box"
import { useLanguage } from "@/lib/i18n/language-context"
import { useRetroToast } from "@/hooks/use-retro-toast"
import { format, isToday, isYesterday } from "date-fns"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ConversationProps {
  params: {
    id: string
  }
}

interface Message {
  id: string
  content: string
  text?: string
  senderId: string
  timestamp: any
  read: boolean
  type?: "text" | "image" | "file"
}

interface Conversation {
  id: string
  participants: string[]
  participantNames?: Record<string, string>
  lastMessage: string
  lastMessageSenderId: string
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
  } = useFirebase()

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useRetroToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

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
        return format(date, "MMM dd, HH:mm")
      }
    } catch (error) {
      console.error("Error formatting timestamp:", error)
      return ""
    }
  }, [])

  // Helper function to update conversation read status
  const updateConversationReadStatus = useCallback(
    (isRead: boolean) => {
      if (conversation) {
        setConversation((prev) =>
          prev
            ? {
                ...prev,
                lastMessageRead: isRead,
              }
            : null,
        )
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

  // Enhanced message handling with real-time updates
  useEffect(() => {
    if (!user || !id) return () => {}

    let readStatusTimeout: NodeJS.Timeout | null = null

    // Mark conversation as read when opened
    if (conversation && conversation.lastMessageSenderId !== user.uid && !conversation.lastMessageRead) {
      updateConversationReadStatus(true)

      readStatusTimeout = setTimeout(() => {
        markAllConversationMessagesAsRead(id).catch((error) => {
          console.error("Error marking conversation as read on load:", error)
        })
      }, 100)
    }

    const unsubscribe = getMessages(id, (updatedMessages) => {
      setMessages(updatedMessages)

      const hasUnreadFromOthers = updatedMessages.some((msg) => msg.senderId !== user.uid && !msg.read)

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
        }, 300)
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
  }, [user, id, getMessages, markAllConversationMessagesAsRead, conversation, updateConversationReadStatus])

  // Access check
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

  // Auto-scroll to bottom with scroll detection
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    scrollToBottom()

    // Show scroll button if not at bottom
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

  // Enhanced message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !conversation || !otherUser) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setIsTyping(false)

    try {
      setSending(true)
      await sendMessage(otherUser.id, messageContent, conversation.jobId, conversation.jobTitle)
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
      setNewMessage(messageContent) // Restore message on error
    } finally {
      setSending(false)
    }
  }

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    setIsTyping(e.target.value.length > 0)
  }

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-[60vh]"
        >
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Loading conversation...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!conversation || !otherUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <RetroBox className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">{t("conversationNotFound")}</h2>
          <p className="text-gray-600 mb-6">This conversation may have been deleted or you don't have access to it.</p>
          <Button
            className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            onClick={() => router.push("/dashboard/messages")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToMessages")}
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
          {t("backToMessages")}
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <RetroBox className="h-[calc(100vh-12rem)] relative overflow-hidden">
          {/* Enhanced conversation header */}
          <div className="border-b-2 border-black p-6 flex items-center justify-between bg-gradient-to-r from-yellow-100 to-yellow-200">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <AvatarFallback className="bg-yellow-300 font-bold text-lg">
                  {otherUser.displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{otherUser.displayName}</h2>
                {conversation.jobTitle && (
                  <Badge variant="outline" className="mt-1 border-black">
                    Job: {conversation.jobTitle}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                <DropdownMenuContent className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <DropdownMenuItem>
                    <Star className="mr-2 h-4 w-4" />
                    Star conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Enhanced messages area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-6 h-[calc(100%-12rem)]">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center text-gray-500 mt-16"
                >
                  <Send className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-bold mb-2">{t("noMessages")}</h3>
                  <p>Start the conversation by sending a message below</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => {
                    const isSender = message.senderId === user?.uid
                    const messageDate = message.timestamp?.toDate
                      ? message.timestamp.toDate()
                      : new Date(message.timestamp)

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn("max-w-[75%] relative group", isSender ? "ml-auto" : "mr-auto")}
                      >
                        <div
                          className={cn(
                            "p-4 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative",
                            isSender ? "bg-yellow-300 ml-auto" : "bg-white",
                          )}
                        >
                          <p className="font-medium leading-relaxed">{message.content || message.text}</p>

                          <div className="flex justify-between items-center mt-3">
                            <p className={cn("text-sm font-medium", isSender ? "text-gray-700" : "text-gray-500")}>
                              {formatMessageTime(messageDate)}
                            </p>

                            {/* Enhanced read/unread status for sent messages */}
                            {isSender && (
                              <div className="flex items-center gap-2">
                                <AnimatePresence mode="wait">
                                  <motion.div
                                    key={`status-${message.id}-${message.read ? "read" : "sent"}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                    className={cn(
                                      "flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-full",
                                      message.read ? "text-green-700 bg-green-100" : "text-gray-600 bg-gray-100",
                                    )}
                                  >
                                    {message.read ? (
                                      <>
                                        <CheckCheck className="h-3 w-3" />
                                        <span>Read</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-3 w-3" />
                                        <span>Sent</span>
                                      </>
                                    )}
                                  </motion.div>
                                </AnimatePresence>
                              </div>
                            )}

                            {/* Enhanced action buttons for received messages */}
                            {!isSender && (
                              <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <AnimatePresence mode="wait">
                                  <motion.div
                                    key={`toggle-${message.id}-${message.read ? "read" : "unread"}`}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto p-2 text-xs border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                                      onClick={() => {
                                        if (message.read) {
                                          markConversationMessageAsUnread(id, message.id)
                                        } else {
                                          markConversationMessageAsRead(id, message.id)
                                        }
                                      }}
                                    >
                                      {message.read ? (
                                        <>
                                          <span className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                                          Mark unread
                                        </>
                                      ) : (
                                        <>
                                          <CheckCheck className="h-3 w-3 mr-2 text-green-600" />
                                          Mark read
                                        </>
                                      )}
                                    </Button>
                                  </motion.div>
                                </AnimatePresence>
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

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-24 right-6 z-10"
              >
                <Button
                  onClick={scrollToBottom}
                  className="rounded-full w-12 h-12 bg-yellow-400 hover:bg-yellow-500 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                >
                  ↓
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced message input */}
          <div className="border-t-2 border-black p-4 bg-gradient-to-r from-yellow-50 to-yellow-100">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
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
                        className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send image</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Input
                ref={messageInputRef}
                placeholder={t("typeMessage")}
                value={newMessage}
                onChange={handleInputChange}
                className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[1px] focus:translate-y-[1px] transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <Smile className="h-4 w-4" />
              </Button>

              <Button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed px-6"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                <span>{t("send")}</span>
              </Button>
            </form>

            <AnimatePresence>
              {isTyping && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-gray-600 mt-2 font-medium"
                >
                  Typing...
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </RetroBox>
      </motion.div>
    </div>
  )
}
