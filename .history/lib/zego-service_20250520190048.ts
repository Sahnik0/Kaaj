"use client"

import { useEffect, useState, useRef } from "react"
import ZegoExpressEngine from "zego-express-engine-webrtc"
import { v4 as uuidv4 } from "uuid"
import { ZegoExpressEngine } from "zego-express-engine-webrtc"

// Define types for our Zego implementation
export type CallType = "audio" | "video"

export interface CallState {
  isIncoming: boolean
  isActive: boolean
  isConnecting: boolean
  callType: CallType
  participantId: string | null
  participantName: string
  startTime: Date | null
  roomId: string | null
}

export interface ZegoHook {
  callState: CallState
  initializeCall: (participantId: string, participantName: string, callType: CallType) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => Promise<void>
  endCall: () => Promise<void>
  toggleMute: () => void
  toggleVideo: () => void
  isMuted: boolean
  isVideoEnabled: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
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
export function generateToken(appID: number, userID: string, serverSecret: string): string {
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

export function useZegoCall(userId: string | undefined, userName = "User"): ZegoHook {
  const [callState, setCallState] = useState<CallState>(initialCallState)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  // Refs to maintain instance across renders
  const zegoRef = useRef<ZegoExpressEngine | null>(null)
  const roomIdRef = useRef<string | null>(null)

  // Initialize Zego engine
  useEffect(() => {
    if (!userId) return

    const appID = 181155364
    const server = "wss://webliveroom181155364-api.coolzcloud.com/ws"
    const appSign = "433ddde25f6d689c8c0a8cefb7cd9b5a2f7c0c..." // Use full string in production

    // Create the engine if it doesn't exist
    if (!zegoRef.current) {
      zegoRef.current = ZegoExpressEngine.createEngine(appID, server, true) // true = isTestEnvironment

      // Set up event listeners for incoming calls
      zegoRef.current.on("roomStreamUpdate", (roomID, updateType, streamList) => {
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
        if (state === "DISCONNECTED" && callState.isActive) {
          // Room disconnected, end the call
          endCall()
        }
      })
    }

    return () => {
      // Clean up on unmount
      if (zegoRef.current) {
        zegoRef.current.logoutRoom(roomIdRef.current || "")
        ZegoExpressEngine.destroyEngine()
        zegoRef.current = null
      }
    }
  }, [userId, callState.isActive])

  // Initialize a call to another user
  const initializeCall = async (participantId: string, participantName: string, callType: CallType) => {
    try {
      if (!userId || !zegoRef.current) {
        throw new Error("Zego engine not initialized")
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

      // Generate token and login to room
      const token = generateToken(181155364, userId, "433ddde25f6d689c8c0a8cefb7cd9b5a2f7c0c...")
      await zegoRef.current.loginRoom(roomId, token, { userID: userId, userName })

      // Create and publish local stream
      const config = {
        camera: {
          audio: true,
          video: callType === "video",
        },
      }

      const stream = await zegoRef.current.createStream(config)
      setLocalStream(stream)

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
      return Promise.reject(error)
    }
  }

  // Accept an incoming call
  const acceptCall = async () => {
    try {
      if (!userId || !zegoRef.current || !callState.roomId || !callState.participantId) {
        throw new Error("Cannot accept call - missing information")
      }

      setCallState((prev) => ({
        ...prev,
        isConnecting: true,
      }))

      // Generate token and login to room
      const token = generateToken(181155364, userId, "433ddde25f6d689c8c0a8cefb7cd9b5a2f7c0c...")
      await zegoRef.current.loginRoom(callState.roomId, token, { userID: userId, userName })

      // Create and publish local stream
      const config = {
        camera: {
          audio: true,
          video: callState.callType === "video",
        },
      }

      const stream = await zegoRef.current.createStream(config)
      setLocalStream(stream)

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
      return Promise.reject(error)
    }
  }

  // Reject an incoming call
  const rejectCall = async () => {
    if (zegoRef.current && callState.roomId) {
      zegoRef.current.logoutRoom(callState.roomId)
    }

    setCallState(initialCallState)
    return Promise.resolve()
  }

  // End an active call
  const endCall = async () => {
    if (zegoRef.current) {
      // Stop publishing and playing streams
      zegoRef.current.stopPublishingStream(userId || "")

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }

      // Logout from the room
      if (callState.roomId) {
        zegoRef.current.logoutRoom(callState.roomId)
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
