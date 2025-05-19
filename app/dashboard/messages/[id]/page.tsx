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

interface ConversationProps {
  params: {
    id: string
  }
}

export default function ConversationPage({ params }: ConversationProps) {
  const { id } = params
  const { user, getConversationById, getMessages, sendMessage } = useFirebase()
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
  }, [conversation, user, loading, router, toast])
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
        <div className="flex flex-col p-4 space-y-4 overflow-y-auto h-[calc(100%-8rem)]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              {t("noMessages")}
            </div>
          ) : (
            messages.map((message) => {
              const isSender = message.senderId === user?.uid
              const messageDate = message.timestamp?.toDate 
                ? message.timestamp.toDate() 
                : new Date(message.timestamp)
              
              return (                <div 
                  key={message.id} 
                  className={cn(
                    "max-w-[70%] p-3 rounded-lg",
                    isSender ? "ml-auto bg-yellow-300 border-2 border-black" : "bg-white border-2 border-black"
                  )}
                >                  <p>{message.content || message.text}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    isSender ? "text-gray-700" : "text-gray-500"
                  )}>
                    {formatDistance(messageDate, new Date(), { addSuffix: true })}
                  </p>
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
