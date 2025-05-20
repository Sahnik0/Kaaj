"use client"

import { Button } from "@/components/ui/button"
import { Mic, MicOff, Phone, Video, VideoOff } from "lucide-react"
import type { CallType } from "@/lib/zego-service"

interface CallControlsProps {
  callType: CallType
  isMuted: boolean
  isVideoEnabled: boolean
  onToggleMute: () => void
  onToggleVideo: () => void
  onEndCall: () => void
}

export function CallControls({
  callType,
  isMuted,
  isVideoEnabled,
  onToggleMute,
  onToggleVideo,
  onEndCall,
}: CallControlsProps) {
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
        <Phone className="h-5 w-5 rotate-135" />
      </Button>
    </div>
  )
}
