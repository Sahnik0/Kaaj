"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, User } from "lucide-react"

export default function Messages() {
  const { user, getConversations, getMessages, sendMessage } = useFirebase()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations()
        setConversations(data)

        // Select the first conversation by default if available
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0])
        }
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [getConversations, selectedConversation])

  useEffect(() => {
    let unsubscribe = () => {}

    if (selectedConversation) {
      unsubscribe = getMessages(selectedConversation.id, (data) => {
        setMessages(data)
      })
    }

    return () => unsubscribe()
  }, [selectedConversation, getMessages])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !selectedConversation) return

    try {
      // Get the recipient ID (the other participant in the conversation)
      const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)

      await sendMessage(recipientId, newMessage)
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const getOtherParticipantName = (conversation: any) => {
    if (!user) return ""

    const otherParticipantId = conversation.participants.find((id: string) => id !== user.uid)
    return conversation.participantNames[otherParticipantId] || "Unknown User"
  }

  const formatTime = (timestamp: Date) => {
    if (!timestamp) return ""

    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kaaj-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Communicate securely with recruiters and candidates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Conversations List */}
        <Card className="border-kaaj-100 md:col-span-1 h-full overflow-hidden flex flex-col">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <div className="flex-1 overflow-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <p className="text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  When you connect with someone, you'll see your conversations here
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors ${
                      selectedConversation?.id === conversation.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <Avatar className="h-10 w-10 border border-kaaj-100">
                      <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium truncate">{getOtherParticipantName(conversation)}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {conversation.lastMessageTime ? formatTime(conversation.lastMessageTime) : ""}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                      {conversation.jobTitle && (
                        <p className="text-xs text-kaaj-500 truncate">Re: {conversation.jobTitle}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Messages */}
        <Card className="border-kaaj-100 md:col-span-2 h-full overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-kaaj-100">
                    <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{getOtherParticipantName(selectedConversation)}</CardTitle>
                    {selectedConversation.jobTitle && (
                      <p className="text-xs text-muted-foreground">Job: {selectedConversation.jobTitle}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Send a message to start the conversation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`chat-bubble ${message.senderId === user?.uid ? "sent" : "received"}`}
                      >
                        <div>{message.content}</div>
                        <div className="chat-time">{formatTime(message.timestamp)}</div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </CardContent>
              <div className="p-3 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 border-kaaj-200 focus-visible:ring-kaaj-500"
                  />
                  <Button type="submit" size="icon" className="bg-kaaj-500 hover:bg-kaaj-600">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
