"use client"

import { useEffect, useState, useRef } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { CallControls } from "./call-controls"
import type { CallState } from "@/lib/zego-service"

interface ActiveCallProps {
  callState: CallState
  isMuted: boolean
  isVideoEnabled: boolean
  onToggleMute: () => void
  onToggleVideo: () => void
  onEndCall: () => void
  localStream: MediaStream | null
  remoteStream: MediaStream | null
}

export function ActiveCall({
  callState,
  isMuted,
  isVideoEnabled,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  localStream,
  remoteStream,
}: ActiveCallProps) {
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
