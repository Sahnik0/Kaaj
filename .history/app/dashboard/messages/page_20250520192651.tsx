"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useFirebase } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, User, Search, X, Loader2, Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react"
import { PageContainer, PageHeader } from "@/components/dashboard/page-container"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"

// Import Zego Express Engine correctly
// Note: This is the correct import pattern for the Zego Express Engine
import ZegoExpressEngine from "zego-express-engine-webrtc"

// ==============================
// Zego Call Types and Utilities
// ==============================

type CallType = "audio" | "video"

interface CallState {
  isIncoming: boolean
  isActive: boolean
  isConnecting: boolean
  callType: CallType
  participantId: string | null
  participantName: string
  startTime: Date | null
  roomId: string | null
}

// Initial call state
const initialCallState: CallState = {
  isIncoming: false,
  isActive: false,
  isConnecting: false,
  callType: "audio",
  participantId: null,
  participantName: "",
  startTime: null,
  roomId: null,
}

// Generate a token for Zego authentication
function generateToken(appID: number, userID: string, serverSecret: string): string {
  // This is a simplified version - in production, use a server-side implementation
  // for security reasons
  const timestamp = Math.floor(Date.now() / 1000) + 3600 // Token valid for 1 hour

  // In a real implementation, you would:
  // 1. Create a nonce (random string)
  // 2. Combine the data (appId, userId, timestamp, nonce)
  // 3. Sign it with HMAC-SHA256 using the serverSecret
  // 4. Base64 encode the result

  // For demo purposes, we're returning a placeholder
  // DO NOT use this in production
  return `${appID}-${userID}-${timestamp}-${uuidv4()}`
}

// Custom hook for Zego call functionality
function useZegoCall(userId: string | undefined, userName = "User") {
  const [callState, setCallState] = useState<CallState>(initialCallState)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  // Refs to maintain instance across renders
  const zegoRef = useRef<any>(null)
  const roomIdRef = useRef<string | null>(null)

  // Initialize Zego engine
  useEffect(() => {
    if (!userId) return

    const appID = 181155364
    const appSign = "433ddde25f6d689c8c0a8cefb7cd9b5a2f7c0c197c5d08c0f83948a49bcce652" // Use full string in production

    // Create the engine if it doesn't exist
    if (!zegoRef.current) {
      try {
        console.log("Initializing Zego Express Engine...")

        // Make sure the ZegoExpressEngine is available
        if (!ZegoExpressEngine) {
          console.error("ZegoExpressEngine is not defined")
          return
        }

        // Try different initialization approaches
        try {
          // Approach 1: Direct instantiation
          zegoRef.current = new ZegoExpressEngine(appID, appSign)
          console.log("Zego initialized with direct instantiation")
        } catch (err1) {
          console.error("Error with direct instantiation:", err1)

          try {
            // Approach 2: Using createEngine if it exists
            if (typeof ZegoExpressEngine.createEngine === "function") {
              zegoRef.current = ZegoExpressEngine.createEngine(appID, appSign, true)
              console.log("Zego initialized with createEngine")
            } else {
              // Approach 3: Using the default export directly
              zegoRef.current = ZegoExpressEngine
              if (typeof zegoRef.current.init === "function") {
                zegoRef.current.init(appID, appSign)
                console.log("Zego initialized with init method")
              } else {
                throw new Error("No valid initialization method found")
              }
            }
          } catch (err2) {
            console.error("Error with alternative initialization:", err2)
            throw err2
          }
        }

        // Check if initialization was successful
        if (!zegoRef.current) {
          throw new Error("Failed to initialize Zego Express Engine")
        }

        console.log("Zego Express Engine initialized successfully", zegoRef.current)

        // Set up event listeners for incoming calls
        if (typeof zegoRef.current.on === "function") {
          zegoRef.current.on("roomStreamUpdate", (roomID, updateType, streamList) => {
            console.log("Room stream update:", roomID, updateType, streamList)
            if (updateType === "ADD") {
              // New stream added - could be an incoming call
              if (streamList && streamList.length > 0) {
                const stream = streamList[0]

                // If we're not in a call and this is a new stream, treat it as an incoming call
                if (!callState.isActive && !callState.isConnecting) {
                  // Extract caller info from stream
                  const callerId = stream.user.userID
                  const callerName = stream.user.userName || "Unknown User"

                  // Determine call type based on stream properties
                  const hasVideo = stream.extraInfo ? JSON.parse(stream.extraInfo).hasVideo : false

                  setCallState({
                    isIncoming: true,
                    isActive: false,
                    isConnecting: false,
                    callType: hasVideo ? "video" : "audio",
                    participantId: callerId,
                    participantName: callerName,
                    startTime: null,
                    roomId: roomID,
                  })

                  roomIdRef.current = roomID
                }

                // If we're in an active call, play the remote stream
                if (callState.isActive) {
                  zegoRef.current
                    ?.startPlayingStream(stream.streamID)
                    .then((remoteMediaStream) => {
                      setRemoteStream(remoteMediaStream)
                    })
                    .catch((error) => {
                      console.error("Error playing remote stream:", error)
                    })
                }
              }
            } else if (updateType === "DELETE") {
              // Stream removed - other participant may have left
              if (callState.isActive) {
                // End the call if the other participant left
                endCall()
              }
            }
          })

          // Handle room state updates
          zegoRef.current.on("roomStateUpdate", (roomID, state, errorCode) => {
            console.log("Room state update:", roomID, state, errorCode)
            if (state === "DISCONNECTED" && callState.isActive) {
              // Room disconnected, end the call
              endCall()
            }
          })
        } else {
          console.warn("Zego engine doesn't have 'on' method for event handling")
        }
      } catch (error) {
        console.error("Error initializing Zego Express Engine:", error)
        alert("Failed to initialize call system. Please refresh the page and try again.")
      }
    }

    return () => {
      // Clean up on unmount
      if (zegoRef.current) {
        try {
          if (roomIdRef.current) {
            if (typeof zegoRef.current.logoutRoom === "function") {
              zegoRef.current.logoutRoom(roomIdRef.current)
            }
          }

          // Properly destroy the engine
          if (typeof zegoRef.current.destroy === "function") {
            zegoRef.current.destroy()
          }
          zegoRef.current = null
        } catch (error) {
          console.error("Error cleaning up Zego Express Engine:", error)
        }
      }
    }
  }, [userId, callState.isActive])

  // Initialize a call to another user
  const initializeCall = async (participantId: string, participantName: string, callType: CallType) => {
    try {
      if (!userId) {
        throw new Error("User ID is required to make a call")
      }

      if (!zegoRef.current) {
        console.error("Zego engine not initialized, attempting to initialize now...")

        // Try to initialize the engine if it's not already initialized
        const appID = 181155364
        const appSign = "433ddde25f6d689c8c0a8cefb7cd9b5a2f7c0c..."

        try {
          zegoRef.current = new ZegoExpressEngine(appID, appSign)
          console.log("Zego initialized on demand")
        } catch (err) {
          console.error("Failed to initialize Zego on demand:", err)
          throw new Error("Could not initialize call system. Please refresh and try again.")
        }

        if (!zegoRef.current) {
          throw new Error("Failed to initialize Zego Express Engine")
        }
      }

      // Generate a unique room ID for this call
      const roomId = `call-${userId}-${participantId}-${Date.now()}`
      roomIdRef.current = roomId

      setCallState({
        isIncoming: false,
        isActive: false,
        isConnecting: true,
        callType,
        participantId,
        participantName,
        startTime: null,
        roomId,
      })

      console.log("Initializing call:", roomId, participantId, callType)

      // Generate token and login to room
      const token = generateToken(181155364, userId, "433ddde25f6d689c8c0a8cefb7cd9b5a2f7c0c...")

      // Check if loginRoom method exists
      if (typeof zegoRef.current.loginRoom !== "function") {
        throw new Error("Zego engine missing loginRoom method")
      }

      // Login to the room
      await zegoRef.current.loginRoom(roomId, token, { userID: userId, userName: userName || userId })

      // Check if createStream method exists
      if (typeof zegoRef.current.createStream !== "function") {
        throw new Error("Zego engine missing createStream method")
      }

      // Create and publish local stream
      const config = {
        camera: {
          audio: true,
          video: callType === "video",
        },
      }

      // Create the local stream
      const stream = await zegoRef.current.createStream(config)
      setLocalStream(stream)

      // Check if startPublishingStream method exists
      if (typeof zegoRef.current.startPublishingStream !== "function") {
        throw new Error("Zego engine missing startPublishingStream method")
      }

      // Publish stream to the room
      await zegoRef.current.startPublishingStream(userId, stream, {
        extraInfo: JSON.stringify({ hasVideo: callType === "video" }),
      })

      // Call connected
      setCallState((prev) => ({
        ...prev,
        isActive: true,
        isConnecting: false,
        startTime: new Date(),
      }))

      return Promise.resolve()
    } catch (error) {
      console.error("Error initializing call:", error)
      setCallState(initialCallState)
      alert(`Failed to start call: ${error.message || "Unknown error"}`)
      return Promise.reject(error)
    }
  }

  // Accept an incoming call
  const acceptCall = async () => {
    try {
      if (!userId) {
        throw new Error("User ID is required to accept a call")
      }

      if (!zegoRef.current) {
        throw new Error("Zego engine not initialized")
      }

      if (!callState.roomId || !callState.participantId) {
        throw new Error("Cannot accept call - missing room or participant information")
      }

      setCallState((prev) => ({
        ...prev,
        isConnecting: true,
      }))

      console.log("Accepting call:", callState.roomId, callState.participantId)

      // Generate token and login to room
      const token = generateToken(181155364, userId, "433ddde25f6d689c8c0a8cefb7cd9b5a2f7c0c...")

      // Check if loginRoom method exists
      if (typeof zegoRef.current.loginRoom !== "function") {
        throw new Error("Zego engine missing loginRoom method")
      }

      // Login to the room
      await zegoRef.current.loginRoom(callState.roomId, token, { userID: userId, userName: userName || userId })

      // Check if createStream method exists
      if (typeof zegoRef.current.createStream !== "function") {
        throw new Error("Zego engine missing createStream method")
      }

      // Create and publish local stream
      const config = {
        camera: {
          audio: true,
          video: callState.callType === "video",
        },
      }

      // Create the local stream
      const stream = await zegoRef.current.createStream(config)
      setLocalStream(stream)

      // Check if startPublishingStream method exists
      if (typeof zegoRef.current.startPublishingStream !== "function") {
        throw new Error("Zego engine missing startPublishingStream method")
      }

      // Publish stream to the room
      await zegoRef.current.startPublishingStream(userId, stream, {
        extraInfo: JSON.stringify({ hasVideo: callState.callType === "video" }),
      })

      // Call accepted and connected
      setCallState((prev) => ({
        ...prev,
        isIncoming: false,
        isActive: true,
        isConnecting: false,
        startTime: new Date(),
      }))

      return Promise.resolve()
    } catch (error) {
      console.error("Error accepting call:", error)
      setCallState(initialCallState)
      alert(`Failed to accept call: ${error.message || "Unknown error"}`)
      return Promise.reject(error)
    }
  }

  // Reject an incoming call
  const rejectCall = async () => {
    if (zegoRef.current && callState.roomId) {
      try {
        zegoRef.current.logoutRoom(callState.roomId)
      } catch (error) {
        console.error("Error rejecting call:", error)
      }
    }

    setCallState(initialCallState)
    return Promise.resolve()
  }

  // End an active call
  const endCall = async () => {
    if (zegoRef.current) {
      try {
        // Stop publishing and playing streams
        zegoRef.current.stopPublishingStream(userId || "")

        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop())
        }

        // Logout from the room
        if (callState.roomId) {
          zegoRef.current.logoutRoom(callState.roomId)
        }
      } catch (error) {
        console.error("Error ending call:", error)
      }
    }

    // Reset state
    setLocalStream(null)
    setRemoteStream(null)
    setCallState(initialCallState)
    setIsMuted(false)
    setIsVideoEnabled(true)

    return Promise.resolve()
  }

  // Toggle mute state
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks()
      if (audioTracks.length > 0) {
        const newMuteState = !isMuted
        audioTracks.forEach((track) => {
          track.enabled = !newMuteState
        })
        setIsMuted(newMuteState)
      }
    }
  }

  // Toggle video state
  const toggleVideo = () => {
    if (localStream && callState.callType === "video") {
      const videoTracks = localStream.getVideoTracks()
      if (videoTracks.length > 0) {
        const newVideoState = !isVideoEnabled
        videoTracks.forEach((track) => {
          track.enabled = newVideoState
        })
        setIsVideoEnabled(newVideoState)
      }
    }
  }

  return {
    callState,
    initializeCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoEnabled,
    localStream,
    remoteStream,
  }
}

// ==============================
// Call UI Components
// ==============================

// Call Controls Component
function CallControls({
  callType,
  isMuted,
  isVideoEnabled,
  onToggleMute,
  onToggleVideo,
  onEndCall,
}: {
  callType: CallType
  isMuted: boolean
  isVideoEnabled: boolean
  onToggleMute: () => void
  onToggleVideo: () => void
  onEndCall: () => void
}) {
  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-black/10 rounded-full backdrop-blur-sm">
      <Button
        onClick={onToggleMute}
        variant="outline"
        size="icon"
        className={`rounded-full ${isMuted ? "bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700" : "bg-white/90 hover:bg-white"}`}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>

      {callType === "video" && (
        <Button
          onClick={onToggleVideo}
          variant="outline"
          size="icon"
          className={`rounded-full ${!isVideoEnabled ? "bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700" : "bg-white/90 hover:bg-white"}`}
        >
          {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
      )}

      <Button
        onClick={onEndCall}
        variant="destructive"
        size="icon"
        className="rounded-full bg-red-600 hover:bg-red-700"
      >
        <Phone className="h-5 w-5" style={{ transform: "rotate(135deg)" }} />
      </Button>
    </div>
  )
}

// Incoming Call Component
function IncomingCall({
  callerName,
  callType,
  onAccept,
  onReject,
}: {
  callerName: string
  callType: CallType
  onAccept: () => void
  onReject: () => void
}) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAccept = async () => {
    setIsProcessing(true)
    await onAccept()
    setIsProcessing(false)
  }

  const handleReject = async () => {
    setIsProcessing(true)
    await onReject()
    setIsProcessing(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 border-kaaj-200" style={{ animation: "bounce-slow 2s infinite" }}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-kaaj-200">
                <AvatarFallback className="bg-kaaj-100 text-kaaj-700 text-2xl">
                  {callerName.charAt(0).toUpperCase() || <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              {callType === "video" ? (
                <Video className="absolute -right-1 -bottom-1 h-8 w-8 p-1.5 bg-kaaj-500 text-white rounded-full" />
              ) : (
                <Phone className="absolute -right-1 -bottom-1 h-8 w-8 p-1.5 bg-kaaj-500 text-white rounded-full" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-kaaj-800">Incoming {callType} call</h3>
              <p className="text-kaaj-600">{callerName}</p>
            </div>

            <div className="flex items-center justify-center gap-4 w-full mt-4">
              <Button
                onClick={handleReject}
                variant="outline"
                size="lg"
                className="rounded-full border-red-200 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700"
                disabled={isProcessing}
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                Decline
              </Button>

              <Button
                onClick={handleAccept}
                variant="default"
                size="lg"
                className="rounded-full bg-green-600 hover:bg-green-700"
                disabled={isProcessing}
              >
                <Phone className="h-5 w-5 mr-2" />
                Accept
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Connecting Call Component
function ConnectingCall({
  participantName,
  callType,
  onCancel,
}: {
  participantName: string
  callType: CallType
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-kaaj-900 to-black flex flex-col items-center justify-center z-50 p-6">
      <div className="flex flex-col items-center justify-center space-y-6">
        <Avatar className="h-24 w-24 border-2 border-white/20">
          <AvatarFallback className="bg-kaaj-700 text-white text-3xl">
            {participantName.charAt(0).toUpperCase() || <User className="h-12 w-12" />}
          </AvatarFallback>
        </Avatar>

        <div className="text-center space-y-1">
          <h2 className="text-white text-xl font-medium">{participantName}</h2>
          <div className="flex items-center justify-center gap-2 text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Connecting {callType} call...</p>
          </div>
        </div>

        <Button
          onClick={onCancel}
          variant="outline"
          size="lg"
          className="rounded-full border-red-200 bg-red-600 text-white hover:bg-red-700 mt-8"
        >
          <PhoneOff className="h-5 w-5 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  )
}

// Active Call Component
function ActiveCall({
  callState,
  isMuted,
  isVideoEnabled,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  localStream,
  remoteStream,
}: {
  callState: CallState
  isMuted: boolean
  isVideoEnabled: boolean
  onToggleMute: () => void
  onToggleVideo: () => void
  onEndCall: () => void
  localStream: MediaStream | null
  remoteStream: MediaStream | null
}) {
  const [callDuration, setCallDuration] = useState("00:00")
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Update call duration timer
  useEffect(() => {
    if (!callState.startTime) return

    const intervalId = setInterval(() => {
      const now = new Date()
      const diffMs = now.getTime() - callState.startTime!.getTime()
      const diffSec = Math.floor(diffMs / 1000)
      const minutes = Math.floor(diffSec / 60)
        .toString()
        .padStart(2, "0")
      const seconds = (diffSec % 60).toString().padStart(2, "0")
      setCallDuration(`${minutes}:${seconds}`)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [callState.startTime])

  // Attach local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-kaaj-900 to-black flex flex-col items-center justify-between z-50 p-6">
      {/* Call type and duration */}
      <div className="text-center pt-8">
        <p className="text-white/80 text-sm">{callState.callType === "video" ? "Video Call" : "Voice Call"}</p>
        <p className="text-white text-lg font-medium">{callDuration}</p>
      </div>

      {/* Participant info and video */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {callState.callType === "video" ? (
          <div className="relative w-full h-full max-h-[60vh] rounded-2xl overflow-hidden bg-black/30 flex items-center justify-center">
            {remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-kaaj-800/20 to-black/40 flex items-center justify-center">
                <Avatar className="h-32 w-32 border-2 border-white/20">
                  <AvatarFallback className="bg-kaaj-700 text-white text-4xl">
                    {callState.participantName.charAt(0).toUpperCase() || <User className="h-16 w-16" />}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Self view (small picture-in-picture) */}
            {callState.callType === "video" && localStream && (
              <div className="absolute bottom-4 right-4 w-24 h-32 bg-kaaj-800 rounded-lg overflow-hidden border border-white/20">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        ) : (
          <Avatar className="h-32 w-32 border-2 border-white/20">
            <AvatarFallback className="bg-kaaj-700 text-white text-4xl">
              {callState.participantName.charAt(0).toUpperCase() || <User className="h-16 w-16" />}
            </AvatarFallback>
          </Avatar>
        )}

        <h2 className="text-white text-xl font-medium mt-6">{callState.participantName}</h2>
      </div>

      {/* Call controls */}
      <div className="pb-8">
        <CallControls
          callType={callState.callType}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          onToggleMute={onToggleMute}
          onToggleVideo={onToggleVideo}
          onEndCall={onEndCall}
        />
      </div>
    </div>
  )
}

// ==============================
// Main Messages Component
// ==============================

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

  // Initialize Zego for calls
  const zegoCall = useZegoCall(user?.uid, user?.displayName || "User")

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

  // Handle initiating a call
  const handleInitiateCall = async (callType: CallType) => {
    if (!selectedConversation || !user) return

    // Get the recipient ID (the other participant in the conversation)
    const recipientId = selectedConversation.participants.find((id: string) => id !== user.uid)

    if (!recipientId) {
      console.error("Could not find recipient ID")
      return
    }

    // Get recipient name
    const recipientName = getOtherParticipantName(selectedConversation)

    // Initialize call with Zego
    try {
      await zegoCall.initializeCall(recipientId, recipientName, callType)
    } catch (error) {
      console.error("Error initiating call:", error)
      alert(`Failed to start ${callType} call. Please try again.`)
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

  // Render call UI components based on call state
  const renderCallUI = () => {
    const { callState } = zegoCall

    if (callState.isIncoming) {
      return (
        <IncomingCall
          callerName={callState.participantName}
          callType={callState.callType}
          onAccept={zegoCall.acceptCall}
          onReject={zegoCall.rejectCall}
        />
      )
    }

    if (callState.isConnecting) {
      return (
        <ConnectingCall
          participantName={callState.participantName}
          callType={callState.callType}
          onCancel={zegoCall.endCall}
        />
      )
    }

    if (callState.isActive) {
      return (
        <ActiveCall
          callState={zegoCall.callState}
          isMuted={zegoCall.isMuted}
          isVideoEnabled={zegoCall.isVideoEnabled}
          onToggleMute={zegoCall.toggleMute}
          onToggleVideo={zegoCall.toggleVideo}
          onEndCall={zegoCall.endCall}
          localStream={zegoCall.localStream}
          remoteStream={zegoCall.remoteStream}
        />
      )
    }

    return null
  }

  return (
    <PageContainer>
      <PageHeader title="Messages" description="Communicate securely with recruiters and candidates." />

      {/* Render call UI components */}
      {renderCallUI()}

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
                <div className="flex items-center justify-between">
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

                  {/* Call buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleInitiateCall("audio")}
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-kaaj-50 border-kaaj-200"
                    >
                      <Phone className="h-4 w-4 mr-1.5" />
                      Call
                    </Button>
                    <Button
                      onClick={() => handleInitiateCall("video")}
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-kaaj-50 border-kaaj-200"
                    >
                      <Video className="h-4 w-4 mr-1.5" />
                      Video
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
    </PageContainer>
  )
}
