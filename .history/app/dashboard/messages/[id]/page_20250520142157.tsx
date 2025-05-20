"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, ArrowLeft, Loader2, Video, PhoneCall, Mic, MicOff, VideoOff } from "lucide-react"
import { RetroBox } from "@/components/ui/retro-box"
import { useLanguage } from "@/lib/i18n/language-context"
import { useRetroToast } from "@/hooks/use-retro-toast"
import { formatDistance } from "date-fns"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useWebRTC } from "@/lib/use-webrtc"

interface ConversationProps {
  params: {
    id: string
  }
}

export default function ConversationPage({ params }: ConversationProps) {
  const { id } = params
  const {
    user,
    getConversationById,
    getMessages,
    sendMessage,
    markAllConversationMessagesAsRead,
    markConversationMessageAsRead,
    markConversationMessageAsUnread,
    db,
  } = useFirebase()
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isInVideoCall, setIsInVideoCall] = useState(false)
  const [activeCall, setActiveCall] = useState<any>(null)
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [callStatus, setCallStatus] = useState<string>("disconnected")
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useRetroToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize WebRTC hook
  const [
    { localStream, remoteStream, connectionState, error },
    { startCall, answerCall, endCall, toggleMute, toggleVideo, isMuted, isVideoEnabled },
  ] = useWebRTC(user, db, (status) => {
    setCallStatus(status)
    if (status === "ended") {
      setIsInVideoCall(false)
      setActiveCall(null)
    }
  })

  // Video elements refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Connect streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Helper function to update conversation read status
  const updateConversationReadStatus = (isRead: boolean) => {
    if (conversation) {
      setConversation((prev: any) => ({
        ...prev,
        lastMessageRead: isRead,
      }))
    }
  }

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
            variant: "destructive",
          })
          router.push("/dashboard/messages")
          return
        }

        setConversation(conversationData)

        // Find the other participant
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

  // Mark messages as read when the component mounts or conversation changes
  useEffect(() => {
    if (user && id && conversation) {
      // If the last message is from the other user and is unread
      if (conversation.lastMessageSenderId !== user.uid && conversation.lastMessageRead === false) {
        // Update local state first for immediate feedback
        updateConversationReadStatus(true)

        // Call server function with a small delay to avoid too many calls
        const timer = setTimeout(() => {
          markAllConversationMessagesAsRead(id).catch((error) => {
            console.error("Error marking messages as read:", error)
            // Revert UI if operation fails
            updateConversationReadStatus(false)
          })
        }, 200)

        return () => clearTimeout(timer)
      }
    }
  }, [user, id, conversation, markAllConversationMessagesAsRead])

  // Set up real-time listener for new messages with automatic read status updating
  useEffect(() => {
    if (!user || !id) return () => {}

    let readStatusTimeout: NodeJS.Timeout | null = null

    // Immediately mark conversation as read when it's opened
    if (conversation && conversation.lastMessageSenderId !== user.uid && conversation.lastMessageRead === false) {
      // Update local state first for immediate visual feedback
      setConversation((prev: any) => ({
        ...prev,
        lastMessageRead: true,
      }))

      // Then update in Firebase (with small delay for better UX)
      readStatusTimeout = setTimeout(() => {
        markAllConversationMessagesAsRead(id).catch((error) => {
          console.error("Error marking conversation as read on load:", error)
        })
      }, 100)
    }

    const unsubscribe = getMessages(id, (updatedMessages) => {
      setMessages(updatedMessages)

      // If there are any unread messages from the other person, mark them as read
      const hasUnreadFromOthers = updatedMessages.some((msg) => msg.senderId !== user.uid && msg.read === false)

      if (hasUnreadFromOthers) {
        // Clear any previous timeout
        if (readStatusTimeout) {
          clearTimeout(readStatusTimeout)
        }
        // Update conversation state immediately for better UX
        setConversation((prev: any) => ({
          ...prev,
          lastMessageRead: true,
        }))

        // Use a small delay to ensure the UI updates first
        readStatusTimeout = setTimeout(() => {
          markAllConversationMessagesAsRead(id)
            .then(() => {
              // Messages marked as read successfully
              console.log("Automatically marked incoming messages as read")
            })
            .catch((error) => {
              console.error("Error automatically marking messages as read:", error)
            })
        }, 300) // Short delay for better UI experience
      }
    })

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [user, id, getMessages, markAllConversationMessagesAsRead])

  // Access check - only participants should see this conversation
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
  // Mark messages as read when the user opens the conversation - only once when conversation data loads
  // Plus mark messages as read when new messages arrive and the conversation is open
  useEffect(() => {
    if (user && id && conversation) {
      // Only call mark as read if:
      // 1. The last message is from the other user (not current user)
      // 2. The last message is marked as unread
      if (conversation.lastMessageSenderId !== user.uid && conversation.lastMessageRead === false) {
        // Immediately update conversation state to give instant visual feedback
        setConversation((prevConversation: any) => ({
          ...prevConversation,
          lastMessageRead: true,
        }))

        // Then send the update to server
        markAllConversationMessagesAsRead(id).catch((error) => {
          console.error("Error marking messages as read:", error)
          // Revert UI if operation fails
          setConversation((prevConversation) => ({
            ...prevConversation,
            lastMessageRead: false,
          }))
        })
      }
    }
  }, [user, id, conversation, markAllConversationMessagesAsRead])

  // Enhanced version: Mark messages as read when new messages arrive and user is currently viewing the conversation
  useEffect(() => {
    if (user && id && messages.length > 0 && !loading) {
      // Find unread messages from the other user
      const unreadMessages = messages.filter((msg) => msg.senderId !== user.uid && msg.read === false)

      // If there are unread messages, mark them as read immediately in the UI
      if (unreadMessages.length > 0) {
        // Update messages locally first for immediate visual feedback
        setMessages((prevMessages) =>
          prevMessages.map((msg) => (msg.senderId !== user.uid && msg.read === false ? { ...msg, read: true } : msg)),
        )
        // Update conversation state too
        setConversation((prevConversation) => ({
          ...prevConversation,
          lastMessageRead: true,
        }))

        // Add debouncing to prevent rapid consecutive API calls to the server
        const debounceTimeout = setTimeout(() => {
          markAllConversationMessagesAsRead(id)
            .then(() => {
              // Successfully marked messages as read - notifications should be deleted automatically
              console.log(`Marked ${unreadMessages.length} messages as read`)
            })
            .catch((error) => {
              console.error("Error marking new messages as read:", error)
            })
        }, 300) // 300ms debounce

        // Cleanup timeout on component unmount or when dependencies change
        return () => {
          clearTimeout(debounceTimeout)
        }
      }
    }
  }, [user, id, messages, loading, markAllConversationMessagesAsRead])

  // Listen for incoming calls
  useEffect(() => {
    if (!user || !db) return () => {}

    // Set up a listener for incoming calls
    const callsRef = db.collection("calls")
    const query = callsRef
      .where("recipientId", "==", user.uid)
      .where("status", "==", "calling")
      .orderBy("timestamp", "desc")
      .limit(1)

    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const call = { id: change.doc.id, ...change.doc.data() }
            // Only set incoming call if we're not already in a call
            if (!isInVideoCall && !activeCall) {
              setIncomingCall(call)
            }
          }
        })
      },
      (error) => {
        console.error("Error listening for calls:", error)
      },
    )

    return () => unsubscribe()
  }, [user, db, isInVideoCall, activeCall])

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
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleStartVideoCall = async () => {
    if (!otherUser) return

    try {
      // Create a call object
      const callId = `call_${Date.now()}`
      const call = {
        id: callId,
        callerId: user?.uid,
        callerName: user?.displayName || "User",
        recipientId: otherUser.id,
        status: "calling", // calling, accepted, declined, ended
        type: "video", // video or audio
        timestamp: new Date(),
        conversationId: id,
      }

      // Set local state to show calling UI
      setActiveCall(call)
      setIsInVideoCall(true)
      setCallStatus("calling")

      // Start the WebRTC call
      await startCall(otherUser.id)
    } catch (error) {
      console.error("Error starting call:", error)
      setIsInVideoCall(false)
      setActiveCall(null)
      toast({
        title: "Error",
        description: "Failed to start video call",
        variant: "destructive",
      })
    }
  }

  const handleEndVideoCall = async () => {
    // End the WebRTC call
    endCall()

    setIsInVideoCall(false)
    setActiveCall(null)
    setCallStatus("disconnected")
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

  // Incoming call notification UI
  const renderIncomingCallNotification = () => {
    if (!incomingCall) return null

    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 w-80">
        <div className="flex items-center mb-3">
          <Avatar className="h-10 w-10 mr-3 border-2 border-black">
            <AvatarFallback className="bg-yellow-300 text-black">
              {incomingCall.callerName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-black">{incomingCall.callerName}</p>
            <p className="text-sm">Incoming {incomingCall.type} call...</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            onClick={() => {
              // Update call status in the database
              db.collection("calls").doc(incomingCall.id).update({
                status: "declined",
              })
              setIncomingCall(null)
            }}
          >
            Decline
          </Button>
          <Button
            className="flex-1 bg-green-500 hover:bg-green-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            onClick={async () => {
              try {
                // Set up the call UI
                setActiveCall(incomingCall)
                setIsInVideoCall(true)
                setCallStatus("accepted")

                // Answer the WebRTC call
                await answerCall(incomingCall.id, incomingCall.callerId)

                // Clear the incoming call notification
                setIncomingCall(null)
              } catch (error) {
                console.error("Error accepting call:", error)
                toast({
                  title: "Error",
                  description: "Failed to accept call",
                  variant: "destructive",
                })
              }
            }}
          >
            Accept
          </Button>
        </div>
      </div>
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

      <RetroBox className="h-[calc(100vh-12rem)] relative">
        {isInVideoCall && (
          <div className="absolute inset-0 z-10 bg-black flex flex-col">
            <div className="flex justify-between items-center p-4 bg-black text-white border-b-2 border-yellow-400">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-yellow-400">
                  <AvatarFallback className="bg-yellow-400 text-black font-bold">
                    {otherUser.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-bold">
                    {callStatus === "connected" || callStatus === "accepted" ? "Video call with" : "Calling"}{" "}
                    {otherUser.displayName}
                  </span>
                  {(callStatus === "calling" || callStatus === "disconnected") && (
                    <p className="text-xs text-yellow-400">
                      {callStatus === "calling" ? "Waiting for answer..." : "Connecting..."}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndVideoCall}
                className="bg-red-600 hover:bg-red-700 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                End Call
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center relative">
              {/* Main video (remote user) */}
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                {callStatus === "connected" || callStatus === "accepted" ? (
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-16 w-16 text-yellow-400 animate-spin mb-4" />
                    <p className="text-yellow-400 font-bold">
                      {callStatus === "calling" ? `Calling ${otherUser.displayName}...` : "Connecting..."}
                    </p>
                  </div>
                )}
              </div>

              {/* Self video (picture-in-picture) */}
              <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-yellow-400 flex items-center justify-center">
                {isVideoEnabled ? (
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center">
                    <VideoOff className="h-8 w-8 text-yellow-400 mb-2" />
                    <span className="text-xs text-yellow-400">Camera off</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-black flex justify-center gap-4 border-t-2 border-yellow-400">
              <Button
                variant={isMuted ? "default" : "outline"}
                size="icon"
                className={`rounded-full h-12 w-12 ${isMuted ? "bg-red-600" : "bg-gray-800"} border-2 border-yellow-400 hover:bg-gray-700`}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="text-white" /> : <Mic className="text-white" />}
              </Button>
              <Button
                variant={isVideoEnabled ? "outline" : "default"}
                size="icon"
                className={`rounded-full h-12 w-12 ${isVideoEnabled ? "bg-gray-800" : "bg-red-600"} border-2 border-yellow-400 hover:bg-gray-700`}
                onClick={toggleVideo}
              >
                {isVideoEnabled ? <Video className="text-white" /> : <VideoOff className="text-white" />}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full h-12 w-12 bg-red-600 hover:bg-red-700 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                onClick={handleEndVideoCall}
              >
                <PhoneCall className="text-white" />
              </Button>
            </div>
          </div>
        )}
        <div className="border-b-2 border-black p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="mr-2 h-10 w-10 border-2 border-black">
              <AvatarFallback className="bg-yellow-300">{otherUser.displayName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-bold">{otherUser.displayName}</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
              onClick={handleStartVideoCall}
            >
              <PhoneCall className="h-4 w-4" />
              <span className="hidden sm:inline">Call</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
              onClick={handleStartVideoCall}
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex flex-col p-4 space-y-4 overflow-y-auto h-[calc(100%-8rem)]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">{t("noMessages")}</div>
          ) : (
            messages.map((message) => {
              const isSender = message.senderId === user?.uid
              const messageDate = message.timestamp?.toDate ? message.timestamp.toDate() : new Date(message.timestamp)
              return (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[70%] p-3 rounded-lg relative group",
                    isSender
                      ? "ml-auto bg-yellow-300 border-2 border-black shadow-sm"
                      : "bg-white border-2 border-black shadow-sm",
                  )}
                >
                  <p>{message.content || message.text}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className={cn("text-xs", isSender ? "text-gray-700" : "text-gray-500")}>
                      {formatDistance(messageDate, new Date(), { addSuffix: true })}
                    </p>
                    {/* Read/unread status for messages I sent - Enhanced version with better visuals */}
                    {isSender && (
                      <div className="flex items-center gap-1">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={`status-${message.id}-${message.read ? "read" : "sent"}`}
                            initial={{ opacity: 0, y: 5, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.9 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className={cn(
                              "text-xs flex items-center gap-1 font-medium rounded-full",
                              message.read ? "text-green-600" : "text-gray-500",
                            )}
                          >
                            {message.read ? (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-green-600"
                                >
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                                <span className="font-medium">Read</span>
                              </>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                                <span className="font-medium">Sent</span>
                              </>
                            )}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    )}
                    {/* Action to toggle read/unread for messages I received */}
                    {!isSender && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`toggle-${message.id}-${message.read ? "read" : "unread"}`}
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
                                  markConversationMessageAsUnread(id, message.id)
                                } else {
                                  markConversationMessageAsRead(id, message.id)
                                }
                              }}
                            >
                              {message.read ? (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                  </svg>
                                  <span>Mark as unread</span>
                                </>
                              ) : (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
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
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-2">{t("send")}</span>
          </Button>
        </form>
      </RetroBox>
      {renderIncomingCallNotification()}
    </div>
  )
}
