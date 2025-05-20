"use client"

import { useEffect, useRef, useState } from "react"

type WebRTCState = {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  connectionState: RTCPeerConnectionState | "disconnected"
  error: string | null
}

type WebRTCActions = {
  startCall: (recipientId: string) => Promise<void>
  answerCall: (callId: string, callerId: string) => Promise<void>
  endCall: () => void
  toggleMute: () => void
  toggleVideo: () => void
  isMuted: boolean
  isVideoEnabled: boolean
}

export function useWebRTC(
  user: any,
  firebaseDb: any,
  onCallStatusChange?: (status: string) => void,
): [WebRTCState, WebRTCActions] {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | "disconnected">("disconnected")
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [activeCallId, setActiveCallId] = useState<string | null>(null)

  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  // Validate required dependencies
  useEffect(() => {
    if (!user) {
      setError("User is not authenticated")
    }
    if (!firebaseDb) {
      setError("Database connection is not available")
    }
  }, [user, firebaseDb])

  // Initialize WebRTC
  useEffect(() => {
    // Clean up function to stop all tracks and close connection
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (peerConnection.current) {
        peerConnection.current.close()
      }
    }
  }, [])

  // Create a new RTCPeerConnection
  const createPeerConnection = async () => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      })

      // Create a new remote stream
      const newRemoteStream = new MediaStream()
      setRemoteStream(newRemoteStream)

      // Add tracks from local stream to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current)
          }
        })
      }

      // Listen for remote tracks
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          if (newRemoteStream) {
            newRemoteStream.addTrack(track)
          }
        })
      }

      // Update connection state
      pc.onconnectionstatechange = () => {
        console.log("Connection state changed:", pc.connectionState)
        setConnectionState(pc.connectionState)

        if (pc.connectionState === "connected") {
          onCallStatusChange?.("connected")
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          onCallStatusChange?.("disconnected")
        }
      }

      // Handle ICE candidate events
      pc.onicecandidate = (event) => {
        if (event.candidate && activeCallId) {
          // Add ICE candidate to the database for the other peer to use
          const candidateRef = firebaseDb.collection("calls").doc(activeCallId).collection("candidates").doc(user.uid)
          candidateRef.set(
            {
              candidates: firebaseDb.FieldValue.arrayUnion({
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
              }),
            },
            { merge: true },
          )
        }
      }

      peerConnection.current = pc
      return pc
    } catch (err) {
      console.error("Error creating peer connection:", err)
      setError("Failed to create connection")
      throw err
    }
  }

  // Get user media (camera and microphone)
  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      setLocalStream(stream)
      localStreamRef.current = stream
      return stream
    } catch (err) {
      console.error("Error getting user media:", err)
      setError("Failed to access camera or microphone")
      throw err
    }
  }

  // Start a call (caller)
  const startCall = async (recipientId: string) => {
    try {
      // Check if firebaseDb is available
      if (!firebaseDb) {
        throw new Error("Database connection is not available")
      }
      if (!user) {
        throw new Error("User is not authenticated")
      }

      // Create a new call document
      const callId = `call_${Date.now()}`
      setActiveCallId(callId)

      // Get user media
      await getUserMedia()

      // Create peer connection
      const pc = await createPeerConnection()

      // Create offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Save the offer to the database
      await firebaseDb
        .collection("calls")
        .doc(callId)
        .set({
          callerId: user.uid,
          callerName: user.displayName || "User",
          recipientId: recipientId,
          status: "calling",
          type: "video",
          timestamp: firebaseDb.FieldValue.serverTimestamp(),
          offer: {
            type: offer.type,
            sdp: offer.sdp,
          },
        })

      // Listen for answer
      const callDoc = firebaseDb.collection("calls").doc(callId)
      const unsubscribe = callDoc.onSnapshot(async (snapshot: any) => {
        const data = snapshot.data()

        if (!pc.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer)
          await pc.setRemoteDescription(answerDescription)
        }

        if (data?.status === "accepted") {
          onCallStatusChange?.("accepted")
        } else if (data?.status === "declined" || data?.status === "ended") {
          onCallStatusChange?.("ended")
          unsubscribe()
          endCall()
        }
      })

      // Listen for ICE candidates from the recipient
      const candidatesCollection = callDoc.collection("candidates").doc(recipientId)
      candidatesCollection.onSnapshot((snapshot: any) => {
        const data = snapshot.data()
        if (data?.candidates) {
          data.candidates.forEach((candidate: any) => {
            const rtcIceCandidate = new RTCIceCandidate({
              candidate: candidate.candidate,
              sdpMid: candidate.sdpMid,
              sdpMLineIndex: candidate.sdpMLineIndex,
            })
            pc.addIceCandidate(rtcIceCandidate)
          })
        }
      })

      onCallStatusChange?.("calling")
    } catch (err) {
      console.error("Error starting call:", err)
      setError("Failed to start call")
      endCall()
    }
  }

  // Answer a call (recipient)
  const answerCall = async (callId: string, callerId: string) => {
    try {
      setActiveCallId(callId)

      // Get user media
      await getUserMedia()

      // Create peer connection
      const pc = await createPeerConnection()

      // Get the call document
      const callDoc = firebaseDb.collection("calls").doc(callId)
      const callData = (await callDoc.get()).data()

      // Set remote description (the offer)
      if (callData?.offer) {
        const offerDescription = new RTCSessionDescription(callData.offer)
        await pc.setRemoteDescription(offerDescription)
      }

      // Create answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // Save the answer to the database
      await callDoc.update({
        status: "accepted",
        answer: {
          type: answer.type,
          sdp: answer.sdp,
        },
      })

      // Listen for ICE candidates from the caller
      const candidatesCollection = callDoc.collection("candidates").doc(callerId)
      candidatesCollection.onSnapshot((snapshot: any) => {
        const data = snapshot.data()
        if (data?.candidates) {
          data.candidates.forEach((candidate: any) => {
            const rtcIceCandidate = new RTCIceCandidate({
              candidate: candidate.candidate,
              sdpMid: candidate.sdpMid,
              sdpMLineIndex: candidate.sdpMLineIndex,
            })
            pc.addIceCandidate(rtcIceCandidate)
          })
        }
      })

      // Listen for call status changes
      const unsubscribe = callDoc.onSnapshot((snapshot: any) => {
        const data = snapshot.data()
        if (data?.status === "ended") {
          onCallStatusChange?.("ended")
          unsubscribe()
          endCall()
        }
      })

      onCallStatusChange?.("accepted")
    } catch (err) {
      console.error("Error answering call:", err)
      setError("Failed to answer call")
      endCall()
    }
  }

  // End the call
  const endCall = () => {
    // Update call status in the database
    if (activeCallId) {
      firebaseDb
        .collection("calls")
        .doc(activeCallId)
        .update({
          status: "ended",
        })
        .catch((err: any) => {
          console.error("Error updating call status:", err)
        })
    }

    // Stop all tracks in the local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }

    // Close the peer connection
    if (peerConnection.current) {
      peerConnection.current.close()
    }

    // Reset state
    setLocalStream(null)
    setRemoteStream(null)
    setConnectionState("disconnected")
    setActiveCallId(null)
    localStreamRef.current = null
    peerConnection.current = null

    onCallStatusChange?.("ended")
  }

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  return [
    { localStream, remoteStream, connectionState, error },
    { startCall, answerCall, endCall, toggleMute, toggleVideo, isMuted, isVideoEnabled },
  ]
}
