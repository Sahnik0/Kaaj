"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, ArrowLeft, Loader2 } from "lucide-react"
import { RetroBox } from "@/components/ui/retro-box"
import { useLanguage } from "@/lib/i18n/language-context"
import { useRetroToast } from "@/hooks/use-retro-toast"
import { formatDistance } from "date-fns"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface ConversationProps {
  params: {
    id: string
  }
}

export default function ConversationPage({ params }: ConversationProps) {
  const { id } = params
  const { user, getConversationById, getMessages, sendMessage, markAllConversationMessagesAsRead, markConversationMessageAsRead, markConversationMessageAsUnread } = useFirebase()
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useRetroToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Fetch conversation and messages
  useEffect(() => {
    async function fetchData() {
      if (!user) return
      
      try {
        // Get conversation details
        const conversationData = await getConversationById(id)
        
        if (!conversationData) {
          toast({
            title: "Error",
            description: "Conversation not found",
            variant: "destructive"
          })
          router.push("/dashboard/messages")
          return
        }
        
        setConversation(conversationData)
        
        // Find the other participant
        const otherParticipantId = conversationData.participants.find(
          (participantId: string) => participantId !== user.uid
        )
        
        if (otherParticipantId) {
          setOtherUser({
            id: otherParticipantId,
            displayName: conversationData.participantNames?.[otherParticipantId] || "User"
          })
        }
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching conversation:", error)
        toast({
          title: "Error",
          description: "Failed to load conversation",
          variant: "destructive"
        })
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, id, getConversationById, router, toast])

  // Set up real-time listener for new messages
  useEffect(() => {
    if (!user || !id) return () => {}
    
    const unsubscribe = getMessages(id, (updatedMessages) => {
      setMessages(updatedMessages)
    })
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [user, id, getMessages])
  
  // Access check - only participants should see this conversation
  useEffect(() => {
    if (!loading && conversation && user) {
      const isParticipant = conversation.participants.includes(user.uid)
      
      if (!isParticipant) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this conversation",
          variant: "destructive"
        })
        router.push("/dashboard/messages")
      }
    }
  }, [conversation, user, loading, router, toast])  // Mark messages as read when the user opens the conversation - only once when conversation data is loaded
  useEffect(() => {
    if (user && id && conversation) {
      // Only call mark as read if there are unread messages (lastMessageRead is false)
      if (conversation.lastMessageSenderId !== user.uid && conversation.lastMessageRead === false) {
        markAllConversationMessagesAsRead(id)
          .catch(error => {
            console.error("Error marking messages as read:", error);
          });
      }
    }
  }, [user, id, conversation, markAllConversationMessagesAsRead]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !conversation || !otherUser) return
    
    try {
      setSending(true)
      // Use the correct parameter order for sendMessage (recipientId, content, jobId, jobTitle)
      await sendMessage(otherUser.id, newMessage.trim(), conversation.jobId, conversation.jobTitle)
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  if (!conversation || !otherUser) {
    return (
      <RetroBox className="p-6 text-center">
        <p>{t("conversationNotFound")}</p>
        <Button 
          className="mt-4 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          onClick={() => router.push("/dashboard/messages")}
        >
          {t("backToMessages")}
        </Button>
      </RetroBox>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        className="mb-6 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        onClick={() => router.push("/dashboard/messages")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("backToMessages")}
      </Button>

      <RetroBox className="h-[calc(100vh-12rem)]">
        {/* Conversation header */}
        <div className="border-b-2 border-black p-4 flex items-center">
          <Avatar className="mr-2 h-10 w-10 border-2 border-black">
            <AvatarFallback className="bg-yellow-300">
              {otherUser.displayName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-bold">{otherUser.displayName}</h2>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex flex-col p-4 space-y-4 overflow-y-auto h-[calc(100%-8rem)]">          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              {t("noMessages")}
            </div>
          ) : (
            messages.map((message) => {
              const isSender = message.senderId === user?.uid
              const messageDate = message.timestamp?.toDate 
                ? message.timestamp.toDate() 
                : new Date(message.timestamp)
              
              return (                
                <div 
                  key={message.id} 
                  className={cn(
                    "max-w-[70%] p-3 rounded-lg relative group",
                    isSender 
                      ? "ml-auto bg-yellow-300 border-2 border-black" 
                      : "bg-white border-2 border-black"
                  )}
                >                  
                  <p>{message.content || message.text}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className={cn(
                      "text-xs",
                      isSender ? "text-gray-700" : "text-gray-500"
                    )}>
                      {formatDistance(messageDate, new Date(), { addSuffix: true })}
                    </p>                    {/* Read/unread status for messages I sent */}
                    {isSender && (
                      <div className="flex items-center gap-1">
                        <motion.span 
                          key={`status-${message.id}-${message.read ? 'read' : 'sent'}`}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "text-xs flex items-center gap-1",
                            message.read ? "text-green-600" : "text-gray-500"
                          )}
                        >
                          {message.read ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                              <span>Read</span>
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" />
                              </svg>
                              <span>Sent</span>
                            </>
                          )}
                        </motion.span>
                      </div>
                    )}                    {/* Action to toggle read/unread for messages I received */}
                    {!isSender && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`toggle-${message.id}-${message.read ? 'read' : 'unread'}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto text-xs text-gray-500 hover:text-black hover:bg-yellow-100 rounded-full flex items-center gap-1"
                              onClick={() => {
                                if (message.read) {
                                  markConversationMessageAsUnread(id, message.id);
                                } else {
                                  markConversationMessageAsRead(id, message.id);
                                }
                              }}
                            >
                              {message.read ? (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                  </svg>
                                  <span>Mark as unread</span>
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <path d="m9 11 3 3L22 4" />
                                  </svg>
                                  <span>Mark as read</span>
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <form onSubmit={handleSendMessage} className="border-t-2 border-black p-3 flex">
          <Input
            placeholder={t("typeMessage")}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 mr-2 border-2 border-black"
          />
          <Button 
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-2">{t("send")}</span>
          </Button>
        </form>
      </RetroBox>
    </div>
  )
}
