"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useFirebase } from "@/lib/firebase/firebase-provider"

type FirebaseReadyContextType = {
  isReady: boolean
  db: any
}

const FirebaseReadyContext = createContext<FirebaseReadyContextType>({
  isReady: false,
  db: null,
})

export function FirebaseReadyProvider({ children }: { children: React.ReactNode }) {
  const { db } = useFirebase()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check if db is available and properly initialized
    const checkDbReady = async () => {
      if (!db) {
        console.log("Firebase DB not available yet")
        return false
      }

      try {
        // Try a simple operation to verify the database is working
        await db.collection("_connection_test").doc("test").set({
          timestamp: new Date(),
        })
        
        // If we get here, the database is working
        console.log("Firebase DB connection verified")
        return true
      } catch (error) {
        console.error("Firebase DB connection test failed:", error)
        return false
      }
    }

    // Set up a check with retry logic
    let attempts = 0
    const maxAttempts = 5
    
    const attemptConnection = async () => {
      attempts++
      console.log(`Attempting to verify Firebase connection (${attempts}/${maxAttempts})`)
      
      const ready = await checkDbReady()
      if (ready) {
        setIsReady(true)
      } else if (attempts < maxAttempts) {
        // Retry with exponential backoff
        setTimeout(attemptConnection, 1000 * Math.pow(2, attempts - 1))
      } else {
        console.error("Failed to establish Firebase connection after multiple attempts")
      }
    }

    // Start the connection verification process
    if (db && !isReady) {
      attemptConnection()
    }

    // Cleanup
    return () => {
      // Any cleanup if needed
    }
  }, [db, isReady])

  return (
    <FirebaseReadyContext.Provider value={{ isReady, db }}>
      {children}
    </FirebaseReadyContext.Provider>
  )
}

export function useFirebaseReady() {
  return useContext(FirebaseReadyContext)
}
