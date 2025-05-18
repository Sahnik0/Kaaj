"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, User, Search, X, Loader2 } from "lucide-react"
import { PageContainer, PageHeader } from "@/components/dashboard/page-container"
import { cn } from "@/lib/utils"

export default function Messages() {
  const { user, getConversations, getMessages, sendMessage, createConversation } = useFirebase()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filteredConversations, setFilteredConversations] = useState<any[]>([])
  const [updatingNames, setUpdatingNames] = useState(false)
  const [processingRecipient, setProcessingRecipient] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  
  // Handle recipient query parameter
  useEffect(() => {
    const handleRecipientParam = async () => {
      try {
        const recipientId = searchParams.get('recipient')
        if (!recipientId || !user || processingRecipient) return
        
        setProcessingRecipient(true)        // Find or create conversation without sending an initial empty message
        // This will create the conversation if it doesn't exist yet
        await createConversation(recipientId, "", "")
        
        // Refresh conversations list (the empty message will have created a new conversation if needed)
        const data = await getConversations()
        const updatedData = data.map(convo => ensureParticipantNames(convo))
        setConversations(updatedData)
        setFilteredConversations(updatedData)
        
        // Find the conversation with this recipient
        const recipientConversation = updatedData.find(convo => 
          convo.participants.includes(recipientId)
        )
        
        // Select the conversation with this recipient
        if (recipientConversation) {
          // Make sure recipient conversation has proper participant names
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
  }, [searchParams, user, loading, createConversation, getConversations])

  // Add a function to ensure participant names are displayed correctly
  const ensureParticipantNames = (conversation: any) => {
    if (!conversation) return conversation
    
    // Make a copy so we don't mutate the original object
    const conversationCopy = { ...conversation }
    
    // Make sure participantNames exists
    if (!conversationCopy.participantNames) {
      conversationCopy.participantNames = {}
    }
    
    // Create names for missing participants based on IDs
    if (conversationCopy.participants) {
      for (const participantId of conversationCopy.participants) {
        if (!conversationCopy.participantNames[participantId]) {
          conversationCopy.participantNames[participantId] = `User ${participantId.substring(0, 5)}...`
        }
      }
    }
    
    return conversationCopy
  }
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations()
        
        // Ensure all conversations have properly initialized participant names
        const updatedData = data.map(convo => ensureParticipantNames(convo))
        
        setConversations(updatedData)
        setFilteredConversations(updatedData)

        // Select the first conversation by default if available
        if (updatedData.length > 0 && !selectedConversation) {
          setSelectedConversation(updatedData[0])
        }
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [getConversations, selectedConversation])
  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredConversations(conversations)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = conversations.filter((conversation) => {
      // Ensure all conversations have participant names before filtering
      const convo = ensureParticipantNames(conversation)
      
      const otherParticipantName = getOtherParticipantName(convo).toLowerCase()
      const lastMessage = (convo.lastMessage || "").toLowerCase()
      const jobTitle = (convo.jobTitle || "").toLowerCase()
      
      return otherParticipantName.includes(query) || 
             lastMessage.includes(query) ||
             jobTitle.includes(query)
    })
    
    setFilteredConversations(filtered)
  }, [searchQuery, conversations])
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

    // Store message content before clearing input
    const messageContent = newMessage
    setNewMessage("") // Clear input immediately for better UX
    
    try {
      // Get the recipient ID (the other participant in the conversation)
      const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)

      if (!recipientId) {
        console.error("Could not find recipient ID")
        return
      }

      // Pass the jobId and jobTitle if available to maintain context
      await sendMessage(
        recipientId, 
        messageContent, 
        selectedConversation.jobId, 
        selectedConversation.jobTitle
      )
    } catch (error) {
      console.error("Error sending message:", error)
      
      // If message sending fails, try once more
      try {
        if (selectedConversation) {
          const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)
          if (recipientId) {
            await sendMessage(
              recipientId, 
              messageContent, 
              selectedConversation.jobId, 
              selectedConversation.jobTitle
            )
          }
        }
      } catch (retryError) {
        console.error("Error resending message:", retryError)
        alert("Failed to send message. Please try again.")
      }
    }
    }
  
  const getOtherParticipantName = (conversation: any) => {
    if (!conversation) return "Unknown User"
    
    // Make sure participants array exists
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      return "Unknown User"
    }
    
    // Find the other participant
    const otherParticipantId = conversation.participants.find(
      (id: string) => id !== user?.uid
    )
    
    // Make sure participantNames exists
    if (!conversation.participantNames) {
      conversation.participantNames = {}
    }
    
    // If name is missing, return a placeholder
    if (!otherParticipantId || !conversation.participantNames[otherParticipantId]) {
      return otherParticipantId ? `User ${otherParticipantId.substring(0, 5)}...` : "Unknown User"
    }
    
    return conversation.participantNames[otherParticipantId]
  }
  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""
    
    try {
      // Handle different timestamp formats (Date object, Firestore timestamp, string, etc.)
      let date = timestamp;
      
      // If it has a toDate method (Firestore Timestamp)
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } 
      // If it's already a Date object, use it directly
      else if (!(timestamp instanceof Date)) {
        // Otherwise try to convert from string/number
        date = new Date(timestamp);
      }
      
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return "";
      }
      
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  }
  // Show loading state if conversations are being loaded
  if (loading) {
    return (
      <PageContainer>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-kaaj-500" />
          <p className="ml-2 text-kaaj-600">Loading messages...</p>
        </div>
      </PageContainer>
    )
  }
  return (
    <PageContainer>
      <PageHeader
        title="Messages"
        description="Communicate securely with recruiters and candidates."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Conversations List */}
        <Card className="border-kaaj-100 md:col-span-1 h-full overflow-hidden flex flex-col shadow-sm">
          <CardHeader className="px-4 py-3 border-b border-kaaj-100 bg-gradient-to-br from-kaaj-50 to-kaaj-100/60">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg text-kaaj-800">Conversations</CardTitle>
            </div>
          </CardHeader>
          
          <div className="p-3 border-b border-kaaj-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-kaaj-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-kaaj-200 focus-visible:ring-kaaj-500"
              />
              {searchQuery && (                
                <Button
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-kaaj-400 hover:text-kaaj-500 bg-transparent hover:bg-transparent border-none"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {filteredConversations.length === 0 ? (              
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                {searchQuery ? (
                  <>
                    <Search className="h-12 w-12 text-kaaj-300 mb-2" />
                    <p className="text-kaaj-700 font-medium">No matching conversations</p>                    <p className="text-xs text-kaaj-500 mt-1">
                      Try adjusting your search query
                    </p>
                    <Button 
                      onClick={() => setSearchQuery("")}
                      className="mt-4 border-kaaj-200 text-kaaj-600 hover:bg-kaaj-50 bg-white text-sm py-1"
                    >
                      <X className="h-4 w-4 mr-2" /> Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <User className="h-12 w-12 text-kaaj-300 mb-2" />
                    <p className="text-kaaj-700 font-medium">No conversations yet</p>
                    <p className="text-xs text-kaaj-500 mt-1">
                      When you connect with someone, you'll see your conversations here
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y divide-kaaj-100">
                {filteredConversations.map((conversation) => (                  
                  <div
                    key={conversation.id}
                    className={cn(
                      "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                      selectedConversation?.id === conversation.id 
                        ? "bg-kaaj-100/60 hover:bg-kaaj-100" 
                        : "hover:bg-kaaj-50"
                    )}
                    onClick={() => {
                      const updatedConversation = ensureParticipantNames(conversation);
                      setSelectedConversation(updatedConversation);
                    }}
                  >                    
                    <Avatar className="h-10 w-10 border border-kaaj-100">
                      <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                        {getOtherParticipantName(conversation).charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">                        
                        <p className="font-medium truncate text-kaaj-800">{getOtherParticipantName(conversation)}</p>                        <span className="text-xs text-kaaj-500 whitespace-nowrap">
                          {conversation.lastMessageTimeDate ? formatTime(conversation.lastMessageTimeDate) : ""}
                        </span>
                      </div>
                      <p className="text-sm text-kaaj-600 truncate">
                        {conversation.lastMessage || "No messages yet"}
                      </p>
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
              <CardHeader className="px-4 py-3 border-b border-kaaj-100 bg-gradient-to-br from-kaaj-50 to-kaaj-100/60">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-kaaj-100">
                    <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg text-kaaj-800">{getOtherParticipantName(selectedConversation)}</CardTitle>
                    {selectedConversation.jobTitle && (
                      <p className="text-xs text-kaaj-600">Job: {selectedConversation.jobTitle}</p>
                    )}
                  </div>
                </div>
              </CardHeader>              
              <CardContent className="flex-1 overflow-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Send className="h-12 w-12 text-kaaj-300 mb-2" />
                    <p className="text-kaaj-700 font-medium">No messages yet</p>
                    <p className="text-xs text-kaaj-500 mt-1">Send a message to start the conversation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (                      
                      <div
                        key={message.id}
                        className={cn(
                          "chat-bubble px-4 py-3 rounded-lg max-w-[80%]",
                          message.senderId === user?.uid 
                            ? "sent bg-kaaj-500 text-white ml-auto" 
                            : "received bg-kaaj-100 text-kaaj-800"
                        )}
                      >
                        <div>{message.content}</div>                        <div className={cn(
                          "chat-time text-xs mt-1",
                          message.senderId === user?.uid 
                            ? "text-kaaj-800" 
                            : "text-kaaj-600"
                        )}>
                          {formatTime(message.timestamp)}</div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </CardContent>              
              <div className="p-3 border-t border-kaaj-100">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 border-kaaj-200 focus-visible:ring-kaaj-500"
                  />
                  <Button 
                    type="submit" 
                    className="bg-kaaj-500 hover:bg-kaaj-600 h-10 w-10 p-0 text-white"
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (            
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <User className="h-12 w-12 text-kaaj-300 mb-2" />
              <p className="text-kaaj-700 font-medium">Select a conversation</p>
              <p className="text-xs text-kaaj-500 mt-1">Choose a conversation to start messaging</p>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  )
}
