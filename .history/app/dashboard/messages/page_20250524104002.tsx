"use client"

import type React from "react"

import { PhoneCall, PhoneOff, Video } from "lucide-react"
import { useState, useRef, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// ZegoCloud types
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any
  }
}

// ZegoCloud configuration - replace with your actual credentials
const APP_ID = 1179547342 // Your ZegoCloud App ID
const SERVER_SECRET = "4b1d0991e55d2bfa10d0f452e1951fce" // Your ZegoCloud Server Secret

interface CallRecipient {
  id: string | null
  name: string | null
}

interface MessagesProps {
  user: any
  selectedConversation: any
  getOtherParticipantName: (conversation: any) => string
}

const Messages: React.FC<MessagesProps> = ({ user, selectedConversation, getOtherParticipantName }) => {
  const [callActive, setCallActive] = useState(false)
  const [callRecipient, setCallRecipient] = useState<CallRecipient>({
    id: null,
    name: null,
  })
  const [zegoInstance, setZegoInstance] = useState<any>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="flex flex-col h-full">
      {/* Call Controls */}
      <div className="flex items-center justify-end p-4">
        <Button onClick={initiateAudioCall} variant="ghost" size="icon" disabled={!window.ZegoUIKitPrebuilt}>
          <PhoneCall className="h-5 w-5" />
        </Button>
        <Button onClick={initiateVideoCall} variant="ghost" size="icon" disabled={!window.ZegoUIKitPrebuilt}>
          <Video className="h-5 w-5" />
        </Button>
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

      {/* Messages Area - Placeholder */}
      <div className="flex-grow overflow-y-auto p-4">
        <p className="text-sm text-muted-foreground">This is where the messages will be displayed.</p>
      </div>

      {/* Message Input - Placeholder */}
      <div className="p-4 border-t">
        <p className="text-sm text-muted-foreground">This is where the message input will be.</p>
      </div>
    </div>
  )
}

export default Messages
