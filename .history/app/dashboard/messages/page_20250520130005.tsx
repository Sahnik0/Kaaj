"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, User, Search, X, Loader2, Video, PhoneOff, Mic, MicOff, Camera, CameraOff } from "lucide-react"
import { PageContainer, PageHeader } from "@/components/dashboard/page-container"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import AgoraRTC from "agora-rtc-sdk-ng"

export default function Messages() {
  const { user, getConversations, getMessages, sendMessage, createConversation, markAllConversationMessagesAsRead } =
    useFirebase()
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
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const [agoraClient, setAgoraClient] = useState<any>(null)
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null)
  const [remoteUsers, setRemoteUsers] = useState<any[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  // Agora configuration
  const appId = "6735fb3aa0194e2e898bf71a01e96598" // Using the app ID provided
  // In a production app, you would generate this dynamically for each call
  const generateChannelName = (conversationId: string) => {
    return `call_${conversationId}`
  }

  // Initialize Agora client
  const initializeAgoraClient = () => {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
    setAgoraClient(client)
    return client
  }

  // Start a video call
  const startVideoCall = async () => {
    if (!selectedConversation) return

    try {
      // Get the recipient ID (the other participant in the conversation)
      const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)

      if (!recipientId) {
        console.error("Could not find recipient ID")
        return
      }

      // Initialize Agora client if not already initialized
      const client = agoraClient || initializeAgoraClient()

      // Set up event listeners for remote users
      client.on("user-published", async (user: any, mediaType: string) => {
        await client.subscribe(user, mediaType)

        if (mediaType === "video") {
          setRemoteUsers((prevUsers) => {
            // Check if user already exists
            if (prevUsers.find((u) => u.uid === user.uid)) {
              return prevUsers.map((u) => (u.uid === user.uid ? user : u))
            }
            return [...prevUsers, user]
          })

          if (remoteVideoRef.current) {
            user.videoTrack.play(remoteVideoRef.current)
          }
        }

        if (mediaType === "audio") {
          user.audioTrack.play()
        }
      })

      client.on("user-unpublished", (user: any, mediaType: string) => {
        if (mediaType === "video") {
          setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid))
        }
      })

      client.on("user-left", (user: any) => {
        setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid))
      })

      // Generate a channel name based on conversation ID
      const channelName = generateChannelName(selectedConversation.id)

      // Generate a temporary token (this is for testing only)
      // In production, you should get this from your server
      const uid = user?.uid
        ? Number.parseInt(user.uid.substring(0, 8), 16) % 100000
        : Math.floor(Math.random() * 100000)

      try {
        // Try joining with a token first
        // For testing, we'll use a workaround by trying different approaches
        console.log("Joining channel:", channelName, "with UID:", uid)

        // First attempt: Try joining with app certificate security
        try {
          await client.join(appId, channelName, null, uid)
        } catch (error) {
          console.log("First join attempt failed, trying alternative approach:", error)

          // Second attempt: Try with a different channel name format
          const alternativeChannel = `channel_${selectedConversation.id.substring(0, 8)}`
          console.log("Trying alternative channel name:", alternativeChannel)

          try {
            await client.join(appId, alternativeChannel, null, uid)
            // If this works, update our channel name
            console.log("Alternative channel name worked!")
          } catch (secondError) {
            console.log("Second join attempt failed:", secondError)

            // Third attempt: Try with a very simple channel name
            const simpleChannel = "test_channel"
            console.log("Trying simple channel name:", simpleChannel)
            await client.join(appId, simpleChannel, null, uid)
            console.log("Simple channel name worked!")
          }
        }
      } catch (joinError) {
        console.error("All join attempts failed:", joinError)
        throw new Error("Could not join Agora channel. Please check your app configuration.")
      }

      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
      setLocalAudioTrack(audioTrack)
      setLocalVideoTrack(videoTrack)

      await client.publish([audioTrack, videoTrack])

      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current)
      }

      // Update UI state
      setIsVideoCallActive(true)

      // For now, send a message to notify the other user
      await sendMessage(
        recipientId,
        `I started a video call. Join the same channel: ${channelName}`,
        selectedConversation.jobId,
        selectedConversation.jobTitle,
      )
    } catch (error) {
      console.error("Error starting video call:", error)
      alert("Could not start video call. Please check your Agora configuration and try again.")
    }
  }

  // Fallback to WebRTC if Agora fails
  const startWebRTCCall = async () => {
    if (!selectedConversation) return

    try {
      // Get the recipient ID (the other participant in the conversation)
      const recipientId = selectedConversation.participants.find((id: string) => id !== user?.uid)

      if (!recipientId) {
        console.error("Could not find recipient ID")
        return
      }

      // Request access to user's camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      // Set local stream
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Update UI state
      setIsVideoCallActive(true)

      // Send a message to notify the other user
      await sendMessage(
        recipientId,
        `I started a video call. Please refresh your page to join.`,
        selectedConversation.jobId,
        selectedConversation.jobTitle,
      )
    } catch (error) {
      console.error("Error starting WebRTC call:", error)
      alert("Could not access camera or microphone. Please check permissions.")
    }
  }

  // End the video call
  const endVideoCall = async () => {
    try {
      // Stop and close local tracks
      if (localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
      }

      if (localVideoTrack) {
        localVideoTrack.stop()
        localVideoTrack.close()
      }

      // Leave the channel
      if (agoraClient) {
        await agoraClient.leave()
      }

      // Stop WebRTC stream
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
        setLocalStream(null)
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop())
        setRemoteStream(null)
      }
    } catch (error) {
      console.error("Error ending call:", error)
    } finally {
      // Reset state
      setLocalAudioTrack(null)
      setLocalVideoTrack(null)
      setRemoteUsers([])
      setIsVideoCallActive(false)
      setIsMuted(false)
      setIsCameraOff(false)
    }
  }

  // Toggle microphone
  const toggleMicrophone = async () => {
    if (localAudioTrack) {
      if (isMuted) {
        await localAudioTrack.setEnabled(true)
      } else {
        await localAudioTrack.setEnabled(false)
      }
      setIsMuted(!isMuted)
    }
  }

  // Toggle camera
  const toggleCamera = async () => {
    if (localVideoTrack) {
      if (isCameraOff) {
        await localVideoTrack.setEnabled(true)
      } else {
        await localVideoTrack.setEnabled(false)
      }
      setIsCameraOff(!isCameraOff)
    }
  }

  // Handle recipient query parameter
  useEffect(() => {
    const handleRecipientParam = async () => {
      try {
        const recipientId = searchParams.get("recipient")
        if (!recipientId || !user || processingRecipient) return

        setProcessingRecipient(true) // Find or create conversation without sending an initial empty message
        // This will create the conversation if it doesn't exist yet
        await createConversation(recipientId, "", "")

        // Refresh conversations list (the empty message will have created a new conversation if needed)
        const data = await getConversations()
        const updatedData = data.map((convo) => ensureParticipantNames(convo))
        setConversations(updatedData)
        setFilteredConversations(updatedData)

        // Find the conversation with this recipient
        const recipientConversation = updatedData.find((convo) => convo.participants.includes(recipientId))

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
        const updatedData = data.map((convo) => ensureParticipantNames(convo))

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

      return otherParticipantName.includes(query) || lastMessage.includes(query) || jobTitle.includes(query)
    })

    setFilteredConversations(filtered)
  }, [searchQuery, conversations])
  useEffect(() => {
    let unsubscribe = () => {}
    let messageLoadCompleted = false
    let readStatusUpdateTimeout: NodeJS.Timeout | null = null

    if (selectedConversation) {
      // First, immediately update the UI to mark as read (for best UX)
      if (selectedConversation.lastMessageSenderId !== user?.uid && selectedConversation.lastMessageRead === false) {
        // Update local state first before even loading messages
        updateConversationReadStatus(selectedConversation.id, true)
      }

      unsubscribe = getMessages(selectedConversation.id, (data) => {
        setMessages(data)
        messageLoadCompleted = true

        // Clear any pending timeout to avoid duplicate calls
        if (readStatusUpdateTimeout) {
          clearTimeout(readStatusUpdateTimeout)
        }

        // After messages are loaded, if there were unread messages from the other user,
        // ensure they're marked as read both in local state and on the server
        if (
          selectedConversation.lastMessageSenderId !== user?.uid &&
          (selectedConversation.lastMessageRead === false ||
            data.some((msg) => msg.senderId !== user?.uid && msg.read === false))
        ) {
          // Add a small delay to ensure UI rendering is complete
          readStatusUpdateTimeout = setTimeout(() => {
            // Update conversation in the local state again for redundancy
            updateConversationReadStatus(selectedConversation.id, true)

            // Call the Firebase function to persist changes and remove notifications
            markAllConversationMessagesAsRead(selectedConversation.id).catch((error) => {
              console.error("Error marking conversation messages as read:", error)
            })
          }, 100) // Short delay for better UI experience
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
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // When messages are loaded, if any unread messages are detected and the conversation is selected,
  // mark them as read automatically in real-time
  useEffect(() => {
    if (!selectedConversation || !user || messages.length === 0) return

    // Check for unread messages from the other user
    const hasUnreadMessages = messages.some((msg) => msg.senderId !== user.uid && msg.read === false)

    // If there are unread messages from the other user, mark them as read
    if (hasUnreadMessages) {
      const timeout = setTimeout(async () => {
        try {
          await markAllConversationMessagesAsRead(selectedConversation.id)

          // Update the local conversation state to reflect read status
          updateConversationReadStatus(selectedConversation.id, true)
        } catch (error) {
          console.error("Error automatically marking conversation messages as read:", error)
        }
      }, 300) // Small delay for better UX

      return () => clearTimeout(timeout)
    }
  }, [messages, selectedConversation, user, markAllConversationMessagesAsRead])

  useEffect(() => {
    // Mark messages as read when a conversation is selected
    const markMessagesAsReadOnSelection = async () => {
      if (!selectedConversation || !user) return

      // Only mark as read if there are unread messages from the other person
      if (selectedConversation.lastMessageSenderId !== user.uid && selectedConversation.lastMessageRead === false) {
        try {
          // Mark messages as read
          await markAllConversationMessagesAsRead(selectedConversation.id)

          // Update the conversation in state to reflect read status
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
      await sendMessage(recipientId, messageContent, selectedConversation.jobId, selectedConversation.jobTitle)
    } catch (error) {
      console.error("Error sending message:", error)

      // If message sending fails, try once more
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

  // Clean up Agora resources when component unmounts
  useEffect(() => {
    return () => {
      if (localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
      }
      if (localVideoTrack) {
        localVideoTrack.stop()
        localVideoTrack.close()
      }
      if (agoraClient) {
        agoraClient.leave()
      }
    }
  }, [agoraClient, localAudioTrack, localVideoTrack])

  const getOtherParticipantName = (conversation: any) => {
    if (!conversation) return "Unknown User"

    // Make sure participants array exists
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      return "Unknown User"
    }

    // Find the other participant
    const otherParticipantId = conversation.participants.find((id: string) => id !== user?.uid)

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
      let date = timestamp

      // If it has a toDate method (Firestore Timestamp)
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate()
      }
      // If it's already a Date object, use it directly
      else if (!(timestamp instanceof Date)) {
        // Otherwise try to convert from string/number
        date = new Date(timestamp)
      }

      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return ""
      }

      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (error) {
      console.error("Error formatting timestamp:", error)
      return ""
    }
  }
  // Helper function to update conversation read status in local state
  const updateConversationReadStatus = (conversationId: string, isRead: boolean) => {
    // Create a consistent update function to avoid duplication
    const updateConvo = (conversation: any) => {
      if (conversation.id === conversationId) {
        return {
          ...conversation,
          lastMessageRead: isRead,
          // Add a local timestamp to ensure UI updates immediately
          _lastUpdated: Date.now(),
        }
      }
      return conversation
    }

    // Update selected conversation if it's the one being marked as read
    if (selectedConversation && selectedConversation.id === conversationId) {
      setSelectedConversation((prev: any) => updateConvo(prev))
    }

    // Update all conversations list
    setConversations((prev: any[]) => prev.map(updateConvo))

    // Also update filtered conversations
    setFilteredConversations((prev: any[]) => prev.map(updateConvo))
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
      <PageHeader title="Messages" description="Communicate securely with recruiters and candidates." />

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
                    <p className="text-kaaj-700 font-medium">No matching conversations</p>{" "}
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

                      // Immediately update UI before server call for better UX
                      // If the conversation has unread messages, mark it as read in state first
                      if (conversation.lastMessageSenderId !== user?.uid && conversation.lastMessageRead === false) {
                        // Update local state first for immediate feedback
                        updateConversationReadStatus(conversation.id, true)
                      }

                      // Set as selected conversation
                      setSelectedConversation({
                        ...updatedConversation,
                        lastMessageRead: true, // Ensure it appears as read in the UI
                      })

                      // Then, perform the server update
                      if (conversation.lastMessageSenderId !== user?.uid && conversation.lastMessageRead === false) {
                        try {
                          // Mark messages as read in this conversation
                          await markAllConversationMessagesAsRead(conversation.id)
                        } catch (error) {
                          console.error("Error marking conversation as read:", error)
                          // If the server update fails, revert the UI
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

                      {/* New message indicator */}
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
                  <div className="ml-auto">
                    <Button
                      onClick={async () => {
                        try {
                          await startVideoCall()
                        } catch (error) {
                          console.error("Agora call failed, falling back to WebRTC:", error)
                          await startWebRTCCall()
                        }
                      }}
                      className="bg-kaaj-500 hover:bg-kaaj-600 h-8 w-8 p-0 text-white rounded-full"
                      title="Start video call"
                    >
                      <Video className="h-4 w-4" />
                    </Button>
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
                    {" "}
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

                              {/* Read status indicator */}
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
      <Dialog open={isVideoCallActive} onOpenChange={(open) => !open && endVideoCall()}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-black">
          <DialogHeader className="p-4 bg-kaaj-800 text-white">
            <DialogTitle className="flex items-center justify-between">
              <span>
                Video Call with {selectedConversation ? getOtherParticipantName(selectedConversation) : "User"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleMicrophone}
                  className={cn(
                    "h-8 w-8 p-0 rounded-full",
                    isMuted ? "bg-red-500 hover:bg-red-600" : "bg-kaaj-600 hover:bg-kaaj-700",
                  )}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={toggleCamera}
                  className={cn(
                    "h-8 w-8 p-0 rounded-full",
                    isCameraOff ? "bg-red-500 hover:bg-red-600" : "bg-kaaj-600 hover:bg-kaaj-700",
                  )}
                >
                  {isCameraOff ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                </Button>
                <Button onClick={endVideoCall} className="bg-red-500 hover:bg-red-600 h-8 w-8 p-0 rounded-full">
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="relative h-[500px] w-full bg-kaaj-900">
            {/* Remote video (full size) */}
            <div ref={remoteVideoRef} className="absolute inset-0 w-full h-full object-cover"></div>

            {/* For WebRTC fallback */}
            <video
              ref={(el) => {
                if (el && !remoteUsers.length) {
                  el.srcObject = remoteStream
                }
              }}
              autoPlay
              playsInline
              className={cn("absolute inset-0 w-full h-full object-cover", remoteUsers.length > 0 ? "hidden" : "")}
            />

            {/* Local video (picture-in-picture) */}
            <div
              ref={localVideoRef}
              className="absolute bottom-4 right-4 w-1/4 h-1/4 object-cover rounded-lg border-2 border-white shadow-lg overflow-hidden"
            ></div>

            {/* For WebRTC fallback */}
            <video
              ref={(el) => {
                if (el && !localVideoTrack) {
                  el.srcObject = localStream
                  el.muted = true
                }
              }}
              autoPlay
              playsInline
              muted
              className={cn(
                "absolute bottom-4 right-4 w-1/4 h-auto object-cover rounded-lg border-2 border-white shadow-lg z-10",
                localVideoTrack ? "hidden" : "",
              )}
            />

            {/* Placeholder for when remote user hasn't joined */}
            {remoteUsers.length === 0 && !remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <User className="h-20 w-20 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Connecting to call...</p>
                  <p className="text-sm opacity-70 mt-2">Waiting for the other person to join</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
