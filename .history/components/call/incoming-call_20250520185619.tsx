"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, PhoneOff, User, Video } from "lucide-react"
import type { CallType } from "@/lib/zego-service"

interface IncomingCallProps {
  callerName: string
  callType: CallType
  onAccept: () => void
  onReject: () => void
}

export function IncomingCall({ callerName, callType, onAccept, onReject }: IncomingCallProps) {
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
      <Card className="w-full max-w-md mx-4 border-kaaj-200 animate-bounce-slow">
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
