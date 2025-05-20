"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, User } from "lucide-react"
import type { CallType } from "@/lib/zego-service"
import { Button } from "@/components/ui/button"
import { PhoneOff } from "lucide-react"

interface ConnectingCallProps {
  participantName: string
  callType: CallType
  onCancel: () => void
}

export function ConnectingCall({ participantName, callType, onCancel }: ConnectingCallProps) {
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
