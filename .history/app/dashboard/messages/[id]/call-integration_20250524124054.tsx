"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff, Settings, Users, Maximize, Minimize } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Zego Cloud types
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any
  }
}

interface CallIntegrationProps {
  recipientId: string
  recipientName: string
  onCallEnd?: () => void
}

export function CallIntegration({ recipientId, recipientName, onCallEnd }: CallIntegrationProps) {
  // Call state
  const [callType, setCallType] = useState<"audio" | "video" | null>(null)
  const [callActive, setCallActive] = useState(false)
  const [zegoInstance, setZegoInstance] = useState<any>(null)
  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "ended">("connecting")
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  // Refs
  const zegoContainerRef = useRef<HTMLDivElement>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Zego Cloud configuration
  const ZEGO_APP_ID = 1179547342
  const ZEGO_SERVER_SECRET = "4b1d0991e55d2bfa10d0f452e1951fce"

  // Load Zego Cloud SDK
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js"
    script.async = true
    script.onload = () => {
      console.log("Zego SDK loaded successfully")
    }
    script.onerror = () => {
      console.error("Failed to load Zego SDK")
    }
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // Call timer
  useEffect(() => {
    if (callActive && callStatus === "connected") {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }
  }, [callActive, callStatus])

  const formatCallDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  const initiateCall = useCallback(
    (type: "audio" | "video") => {
      if (!window.ZegoUIKitPrebuilt) {
        console.error("Zego SDK not loaded")
        return
      }

      const roomId = `call_${recipientId}_${Date.now()}`
      console.log("Initiating call:", { type, roomId, recipientId })

      setCallType(type)
      setCallActive(true)
      setCallStatus("connecting")
      setCallDuration(0)
      setIsMuted(false)
      setIsVideoEnabled(type === "video")

      const userID = Math.floor(Math.random() * 10000).toString()
      const userName = `User ${userID.substring(0, 5)}`

      try {
        const kitToken = window.ZegoUIKitPrebuilt.generateKitTokenForTest(
          ZEGO_APP_ID,
          ZEGO_SERVER_SECRET,
          roomId,
          userID,
          userName,
        )

        setTimeout(() => {
          if (zegoContainerRef.current && window.ZegoUIKitPrebuilt) {
            const zp = window.ZegoUIKitPrebuilt.create(kitToken)
            setZegoInstance(zp)

            zp.joinRoom({
              container: zegoContainerRef.current,
              scenario: {
                mode: type === "video" ? window.ZegoUIKitPrebuilt.VideoCall : window.ZegoUIKitPrebuilt.VoiceCall,
              },
              turnOnMicrophoneWhenJoining: true,
              turnOnCameraWhenJoining: type === "video",
              showMyCameraToggleButton: false,
              showMyMicrophoneToggleButton: false,
              showAudioVideoSettingsButton: false,
              showScreenSharingButton: false,
              showTextChat: false,
              showUserList: false,
              maxUsers: 2,
              layout: "Auto",
              showLayoutButton: false,
              onJoinRoom: () => {
                console.log("Successfully joined Zego room")
                setCallStatus("connected")
              },
              onLeaveRoom: () => {
                console.log("Left Zego room")
                endCall()
              },
            })
          }
        }, 500)
      } catch (error) {
        console.error("Error joining call:", error)
        endCall()
      }
    },
    [recipientId],
  )

  const toggleMute = useCallback(() => {
    if (zegoInstance) {
      zegoInstance.setMicrophoneState(!isMuted)
      setIsMuted(!isMuted)
    }
  }, [zegoInstance, isMuted])

  const toggleVideo = useCallback(() => {
    if (zegoInstance && callType === "video") {
      zegoInstance.setCameraState(!isVideoEnabled)
      setIsVideoEnabled(!isVideoEnabled)
    }
  }, [zegoInstance, isVideoEnabled, callType])

  const endCall = useCallback(() => {
    console.log("Ending call...")

    if (zegoInstance) {
      try {
        zegoInstance.destroy()
      } catch (error) {
        console.error("Error destroying Zego instance:", error)
      }
    }

    setCallActive(false)
    setCallType(null)
    setZegoInstance(null)
    setCallStatus("connecting")
    setCallDuration(0)
    setIsMuted(false)
    setIsVideoEnabled(true)
    setIsFullscreen(false)

    onCallEnd?.()
  }, [zegoInstance, onCallEnd])

  return (
    <>
      {/* Call Buttons */}
      <div className="flex gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => initiateCall("audio")}
                variant="outline"
                size="sm"
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-green-100 hover:bg-green-200 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start audio call</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => initiateCall("video")}
                variant="outline"
                size="sm"
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-blue-100 hover:bg-blue-200 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Video className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start video call</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Call Dialog */}
      <Dialog open={callActive} onOpenChange={(open) => !open && endCall()}>
        <DialogContent
          className={cn(
            "p-0 border-2 border-black bg-gray-900 text-white overflow-hidden",
            isFullscreen
              ? "w-screen h-screen max-w-none"
              : "sm:max-w-[900px] md:max-w-[1100px] lg:max-w-[1300px] h-[85vh]",
          )}
        >
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {callType === "audio" ? (
                    <div className="p-3 bg-green-600 rounded-full">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-600 rounded-full">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-xl text-white">
                      {callType === "audio" ? "Audio Call" : "Video Call"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-300">{recipientName}</DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        callStatus === "connecting"
                          ? "bg-yellow-500 animate-pulse"
                          : callStatus === "connected"
                            ? "bg-green-500"
                            : "bg-red-500",
                      )}
                    />
                    <span className="text-sm text-gray-300 capitalize">{callStatus}</span>
                  </div>

                  {callStatus === "connected" && (
                    <div className="text-sm text-gray-300 font-mono">{formatCallDuration(callDuration)}</div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => setIsFullscreen(!isFullscreen)}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 relative">
            <div
              ref={zegoContainerRef}
              className="w-full h-full bg-gray-900"
              style={{ minHeight: isFullscreen ? "calc(100vh - 200px)" : "500px" }}
            />

            {/* Call Status Overlay */}
            {callStatus === "connecting" && (
              <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-xl mx-auto">
                      <AvatarFallback className="bg-gradient-to-br from-yellow-100 to-yellow-300 text-black font-bold text-2xl">
                        {recipientName.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 border-4 border-white rounded-full animate-ping opacity-30"></div>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-2">Connecting...</h3>
                  <p className="text-gray-300">Setting up call with {recipientName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="p-6 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700">
            <div className="flex items-center justify-center gap-4">
              {/* Mute Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={toggleMute}
                      variant="outline"
                      size="lg"
                      className={cn(
                        "h-14 w-14 rounded-full border-2 transition-all",
                        isMuted
                          ? "bg-red-600 border-red-500 hover:bg-red-700 text-white"
                          : "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white",
                      )}
                    >
                      {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Video Toggle (only for video calls) */}
              {callType === "video" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={toggleVideo}
                        variant="outline"
                        size="lg"
                        className={cn(
                          "h-14 w-14 rounded-full border-2 transition-all",
                          !isVideoEnabled
                            ? "bg-red-600 border-red-500 hover:bg-red-700 text-white"
                            : "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white",
                        )}
                      >
                        {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isVideoEnabled ? "Turn off camera" : "Turn on camera"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* End Call Button */}
              <Button
                onClick={endCall}
                variant="destructive"
                size="lg"
                className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 border-2 border-red-500 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>

              {/* Settings Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 w-14 rounded-full border-2 bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
                    >
                      <Settings className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Participants Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 w-14 rounded-full border-2 bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
                    >
                      <Users className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Participants</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
