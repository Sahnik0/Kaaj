"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, User, Search, X, Loader2, Phone, Video, PhoneOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// ZegoCloud types
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any
  }
}

export default function MessagesWithVideo() {
  const { user, getConversations, getMessages, sendMessage, createConversation, markAllConversationMessagesAsRead } =
    useFirebase()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filteredConversations, setFilteredConversations] = useState<any[]>([])
  const [processingRecipient, setProcessingRecipient] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  // Video call states
  const [callActive, setCallActive] = useState(false)
  const [callRecipient, setCallRecipient] = useState<any>(null)
  const [zegoInstance, setZegoInstance] = useState<any>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  // ZegoCloud configuration
  const APP_ID = 1179547342 // Your ZegoCloud App ID
  const SERVER_SECRET = "4b1d0991e55d2bfa10d0f452e1951fce" // Your ZegoCloud Server Secret

  // Load ZegoCloud SDK
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js"
    script.async = true
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
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
        setFilteredConversations(updatedData)

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
  }, [searchParams, user, loading, createConversation, getConversations])

  const ensureParticipantNames = (conversation: any) => {
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
  }

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations()
        const updatedData = data.map((convo) => ensureParticipantNames(convo))
        setConversations(updatedData)
        setFilteredConversations(updatedData)

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

  useEffect(() => {
    if (!searchQuery) {
      setFilteredConversations(conversations)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = conversations.filter((conversation) => {
      const convo = ensureParticipantNames(conversation)
      const otherParticipantName = getOtherParticipantName(convo).toLowerCase()
      const lastMessage = (convo.lastMessage || "").toLowerCase()
      const jobTitle = (convo.jobTitle || "").toLowerCase()

      return otherParticipantName.includes(query) || lastMessage.includes(query) || jobTitle.includes(query)
    })

    setFilteredConversations(filtered)
  }, [searchQuery, conversations])

  useEffect(() => {
    let unsubscribe = () => {}
    let messageLoadCompleted = false
    let readStatusUpdateTimeout: NodeJS.Timeout | null = null

    if (selectedConversation) {
      if (selectedConversation.lastMessageSenderId !== user?.uid && selectedConversation.lastMessageRead === false) {
        updateConversationReadStatus(selectedConversation.id, true)
      }

      unsubscribe = getMessages(selectedConversation.id, (data) => {
        setMessages(data)
        messageLoadCompleted = true

        if (readStatusUpdateTimeout) {
          clearTimeout(readStatusUpdateTimeout)
        }

        if (
          selectedConversation.lastMessageSenderId !== user?.uid &&
          (selectedConversation.lastMessageRead === false ||
            data.some((msg) => msg.senderId !== user?.uid && msg.read === false))
        ) {
          readStatusUpdateTimeout = setTimeout(() => {
            updateConversationReadStatus(selectedConversation.id, true)
            markAllConversationMessagesAsRead(selectedConversation.id).catch((error) => {
              console.error("Error marking conversation messages as read:", error)
            })
          }, 100)
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!selectedConversation || !user || messages.length === 0) return

    const hasUnreadMessages = messages.some((msg) => msg.senderId !== user.uid && msg.read === false)

    if (hasUnreadMessages) {
      const timeout = setTimeout(async () => {
        try {
          await markAllConversationMessagesAsRead(selectedConversation.id)
          updateConversationReadStatus(selectedConversation.id, true)
        } catch (error) {
          console.error("Error automatically marking conversation messages as read:", error)
        }
      }, 300)

      return () => clearTimeout(timeout)
    }
  }, [messages, selectedConversation, user, markAllConversationMessagesAsRead])

  useEffect(() => {
    const markMessagesAsReadOnSelection = async () => {
      if (!selectedConversation || !user) return

      if (selectedConversation.lastMessageSenderId !== user.uid && selectedConversation.lastMessageRead === false) {
        try {
          await markAllConversationMessagesAsRead(selectedConversation.id)
          updateConversationReadStatus(selectedConversation.id, true)
        } catch (error) {
          console.error("Error marking messages as read:", error)
        }
      }
    }

    markMessagesAsReadOnSelection()
  }, [selectedConversation, user, markAllConversationMessagesAsRead])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !selectedConversation) return

    const messageContent = newMessage
    setNewMessage("")

    try {
      const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)

      if (!recipientId) {
        console.error("Could not find recipient ID")
        return
      }

      await sendMessage(recipientId, messageContent, selectedConversation.jobId, selectedConversation.jobTitle)
    } catch (error) {
      console.error("Error sending message:", error)

      try {
        if (selectedConversation) {
          const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)
          if (recipientId) {
            await sendMessage(recipientId, messageContent, selectedConversation.jobId, selectedConversation.jobTitle)
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

    if (!conversation.participants || !Array.isArray(conversation.participants)) {
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
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""

    try {
      let date = timestamp

      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate()
      } else if (!(timestamp instanceof Date)) {
        date = new Date(timestamp)
      }

      if (isNaN(date.getTime())) {
        return ""
      }

      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (error) {
      console.error("Error formatting timestamp:", error)
      return ""
    }
  }

  const updateConversationReadStatus = (conversationId: string, isRead: boolean) => {
    const updateConvo = (conversation: any) => {
      if (conversation.id === conversationId) {
        return {
          ...conversation,
          lastMessageRead: isRead,
          _lastUpdated: Date.now(),
        }
      }
      return conversation
    }

    if (selectedConversation && selectedConversation.id === conversationId) {
      setSelectedConversation((prev: any) => updateConvo(prev))
    }

    setConversations((prev: any[]) => prev.map(updateConvo))
    setFilteredConversations((prev: any[]) => prev.map(updateConvo))
  }

  const initiateVideoCall = () => {
    if (!selectedConversation || !window.ZegoUIKitPrebuilt) return

    const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)
    if (!recipientId) {
      console.error("Could not find recipient ID")
      return
    }

    // Generate unique room ID for this conversation
    const roomID = `${selectedConversation.id}_${Date.now()}`
    const userID = user?.uid || Math.floor(Math.random() * 10000).toString()
    const userName = user?.displayName || `User ${userID.substring(0, 5)}`

    // Generate kit token
    const kitToken = window.ZegoUIKitPrebuilt.generateKitTokenForTest(APP_ID, SERVER_SECRET, roomID, userID, userName)

    setCallRecipient({
      id: recipientId,
      name: getOtherParticipantName(selectedConversation),
    })
    setCallActive(true)

    // Initialize ZegoCloud video call
    setTimeout(() => {
      if (videoContainerRef.current && window.ZegoUIKitPrebuilt) {
        const zp = window.ZegoUIKitPrebuilt.create(kitToken)
        setZegoInstance(zp)

        zp.joinRoom({
          container: videoContainerRef.current,
          sharedLinks: [
            {
              name: "Join Call",
              url: `${window.location.origin}${window.location.pathname}?roomID=${roomID}`,
            },
          ],
          scenario: {
            mode: window.ZegoUIKitPrebuilt.VideoConference,
          },
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: true,
          showTextChat: false, // Disable since we have our own chat
          showUserList: true,
          maxUsers: 2,
          layout: "Auto",
          showLayoutButton: false,
          onLeaveRoom: () => {
            endCall()
          },
        })
      }
    }, 100)
  }

  const initiateAudioCall = () => {
    if (!selectedConversation || !window.ZegoUIKitPrebuilt) return

    const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)
    if (!recipientId) {
      console.error("Could not find recipient ID")
      return
    }

    // Generate unique room ID for this conversation
    const roomID = `audio_${selectedConversation.id}_${Date.now()}`
    const userID = user?.uid || Math.floor(Math.random() * 10000).toString()
    const userName = user?.displayName || `User ${userID.substring(0, 5)}`

    // Generate kit token
    const kitToken = window.ZegoUIKitPrebuilt.generateKitTokenForTest(APP_ID, SERVER_SECRET, roomID, userID, userName)

    setCallRecipient({
      id: recipientId,
      name: getOtherParticipantName(selectedConversation),
    })
    setCallActive(true)

    // Initialize ZegoCloud audio call
    setTimeout(() => {
      if (videoContainerRef.current && window.ZegoUIKitPrebuilt) {
        const zp = window.ZegoUIKitPrebuilt.create(kitToken)
        setZegoInstance(zp)

        zp.joinRoom({
          container: videoContainerRef.current,
          sharedLinks: [
            {
              name: "Join Call",
              url: `${window.location.origin}${window.location.pathname}?roomID=${roomID}`,
            },
          ],
          scenario: {
            mode: window.ZegoUIKitPrebuilt.OneONoneCall,
          },
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: false, // Audio only
          showMyCameraToggleButton: false,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: false,
          showTextChat: false,
          showUserList: false,
          maxUsers: 2,
          layout: "Auto",
          showLayoutButton: false,
          onLeaveRoom: () => {
            endCall()
          },
        })
      }
    }, 100)
  }

  const endCall = () => {
    if (zegoInstance) {
      try {
        zegoInstance.destroy()
      } catch (error) {
        console.error("Error destroying Zego instance:", error)
      }
    }

    setCallActive(false)
    setCallRecipient(null)
    setZegoInstance(null)

    // Clear the video container
    if (videoContainerRef.current) {
      videoContainerRef.current.innerHTML = ""
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-kaaj-500" />
          <p className="ml-2 text-kaaj-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-kaaj-800">Messages</h1>
        <p className="text-kaaj-600">Communicate securely with recruiters and candidates.</p>
      </div>

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
                    <p className="text-kaaj-700 font-medium">No matching conversations</p>
                    <p className="text-xs text-kaaj-500 mt-1">Try adjusting your search query</p>
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
                      "flex items-center gap-3 p-3 cursor-pointer transition-colors relative",
                      selectedConversation?.id === conversation.id
                        ? "bg-kaaj-100/60 hover:bg-kaaj-100"
                        : "hover:bg-kaaj-50",
                      conversation.lastMessageSenderId !== user?.uid &&
                        conversation.lastMessageRead === false &&
                        "border-l-4 border-red-500",
                    )}
                    onClick={async () => {
                      const updatedConversation = ensureParticipantNames(conversation)

                      if (conversation.lastMessageSenderId !== user?.uid && conversation.lastMessageRead === false) {
                        updateConversationReadStatus(conversation.id, true)
                      }

                      setSelectedConversation({
                        ...updatedConversation,
                        lastMessageRead: true,
                      })

                      if (conversation.lastMessageSenderId !== user?.uid && conversation.lastMessageRead === false) {
                        try {
                          await markAllConversationMessagesAsRead(conversation.id)
                        } catch (error) {
                          console.error("Error marking conversation as read:", error)
                          updateConversationReadStatus(conversation.id, false)
                        }
                      }
                    }}
                  >
                    <Avatar className="h-10 w-10 border border-kaaj-100">
                      <AvatarFallback className="bg-kaaj-100 text-kaaj-700">
                        {getOtherParticipantName(conversation).charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p
                          className={cn(
                            "font-medium truncate",
                            conversation.lastMessageSenderId !== user?.uid && conversation.lastMessageRead === false
                              ? "text-kaaj-900 font-bold"
                              : "text-kaaj-800",
                          )}
                        >
                          {getOtherParticipantName(conversation)}
                        </p>
                        <span className="text-xs text-kaaj-500 whitespace-nowrap">
                          {conversation.lastMessageTimeDate ? formatTime(conversation.lastMessageTimeDate) : ""}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-sm truncate",
                          conversation.lastMessageSenderId !== user?.uid && conversation.lastMessageRead === false
                            ? "text-kaaj-900 font-medium"
                            : "text-kaaj-600",
                        )}
                      >
                        {conversation.lastMessage || "No messages yet"}
                      </p>
                      {conversation.jobTitle && (
                        <p className="text-xs text-kaaj-500 truncate">Re: {conversation.jobTitle}</p>
                      )}

                      {conversation.lastMessageSenderId !== user?.uid && conversation.lastMessageRead === false && (
                        <div className="absolute right-3 top-3 w-3 h-3 bg-red-500 rounded-full"></div>
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
                    <CardTitle className="text-lg text-kaaj-800">
                      {getOtherParticipantName(selectedConversation)}
                    </CardTitle>
                    {selectedConversation.jobTitle && (
                      <p className="text-xs text-kaaj-600">Job: {selectedConversation.jobTitle}</p>
                    )}
                  </div>
                </div>
                {selectedConversation && (
                  <div className="flex gap-2 mt-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={initiateAudioCall}
                            variant="outline"
                            size="sm"
                            className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                            disabled={!window.ZegoUIKitPrebuilt}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Audio Call</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Start audio call</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={initiateVideoCall}
                            variant="outline"
                            size="sm"
                            className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                            disabled={!window.ZegoUIKitPrebuilt}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Video Call</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Start video call</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
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
                    {messages.map((message, index) => {
                      const isSender = message.senderId === user?.uid
                      const showReadStatus = isSender && typeof message.read !== "undefined"

                      return (
                        <div key={message.id} className={cn("relative group")}>
                          <div
                            className={cn(
                              "chat-bubble px-4 py-3 rounded-lg max-w-[80%] border shadow-sm",
                              isSender
                                ? "sent bg-kaaj-500 text-white ml-auto border-kaaj-600"
                                : "received bg-kaaj-100 text-kaaj-800 border-kaaj-200",
                            )}
                          >
                            <div>{message.content}</div>
                            <div className="flex justify-between items-center mt-1">
                              <div className={cn("chat-time text-xs", isSender ? "text-white/70" : "text-kaaj-600")}>
                                {formatTime(message.timestamp)}
                              </div>

                              {showReadStatus && (
                                <div className="flex items-center gap-1 ml-2">
                                  <span
                                    className={cn(
                                      "text-[10px] flex items-center",
                                      message.read ? "text-green-300" : "text-white/50",
                                    )}
                                  >
                                    {message.read ? (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="10"
                                          height="10"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="10"
                                          height="10"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="M5 12h14" />
                                        </svg>
                                      </>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
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

      {/* Video Call Dialog */}
      <Dialog open={callActive} onOpenChange={(open) => !open && endCall()}>
        <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] md:max-w-[80vw] md:max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Call with {callRecipient?.name}</DialogTitle>
            <DialogDescription>ZegoCloud Video Conference</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center">
            {/* ZegoCloud Video Container */}
            <div
              ref={videoContainerRef}
              className="w-full h-[60vh] bg-black rounded-lg overflow-hidden"
              style={{ minHeight: "400px" }}
            />

            {/* End Call Button */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button onClick={endCall} variant="destructive" size="lg" className="rounded-full px-6">
                <PhoneOff className="h-5 w-5 mr-2" />
                End Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
