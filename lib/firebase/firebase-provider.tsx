"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { initializeApp, getApps } from "firebase/app"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { firebaseConfig } from "./firebase-config"
import {
  getAuth,
  onAuthStateChanged,
  type User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth"
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
  onSnapshot,
  orderBy,
  deleteDoc,
  Timestamp,
} from "firebase/firestore"

// Define interfaces for better type safety
interface Conversation extends DocumentData {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  lastMessage?: string;
  lastMessageTime?: Timestamp;
  lastMessageTimeDate?: Date | null;
  formattedLastMessageTime?: string;
  jobId?: string;
  jobTitle?: string;
  createdAt?: Timestamp;
  createdAtDate?: Date | null;
  formattedCreatedAt?: string;
  updatedAt?: Timestamp;
}

interface Message extends DocumentData {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  timestamp: Timestamp | Date;
  formattedTime?: string;
  formattedDate?: string;
  formattedFullDateTime?: string;
  smartTime?: string;
}

interface Rating extends DocumentData {
  id: string;
  raterId: string;
  raterName: string;
  ratedUserId: string;
  ratedUserName: string;
  jobId: string;
  jobTitle: string;
  rating: number;
  review: string;
  createdAt: Timestamp;
}

interface Notification extends DocumentData {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  readAt?: Timestamp;
  [key: string]: any; // For additional properties
}

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

type UserRole = "recruiter" | "candidate" | "admin" | null
type UserProfile = DocumentData | null

interface FirebaseContextType {
  user: FirebaseUser | null
  userRole: UserRole
  userProfile: UserProfile
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  setUserRole: (role: UserRole) => Promise<void>
  updateUserProfile: (data: any) => Promise<void>
  createJob: (jobData: any) => Promise<string>
  getUserJobs: () => Promise<any[]>
  getAllJobs: (filters?: any) => Promise<any[]>
  getJob: (jobId: string) => Promise<any>
  updateJob: (jobId: string, data: any) => Promise<void>
  deleteJob: (jobId: string) => Promise<void>
  applyToJob: (jobId: string, jobTitle?: string) => Promise<string>
  checkUserAppliedToJob: (jobId: string) => Promise<boolean>
  getApplications: (jobId: string) => Promise<any[]>
  getUserApplications: () => Promise<any[]>
  updateApplicationStatus: (applicationId: string, status: string) => Promise<void>
  getConversations: () => Promise<any[]>
  getMessages: (conversationId: string, callback: (messages: any[]) => void) => () => void
  sendMessage: (recipientId: string, content: string, jobId?: string, jobTitle?: string) => Promise<void>
  getLearningResources: () => Promise<any[]>
  addLearningResource: (resourceData: any) => Promise<string>
  getUserRatings: () => Promise<any[]>
  getRatingsByUser: () => Promise<any[]>
  submitRating: (ratingData: any) => Promise<void>
  getUsers: () => Promise<any[]>
  getCandidates: () => Promise<any[]>
  getRecruiters: () => Promise<any[]>
  getUserById: (userId: string) => Promise<any>
  getReportedContent: () => Promise<any[]>
  submitReport: (reportData: any) => Promise<string>
  getJobStats: () => Promise<any>
  getUserStats: () => Promise<any>
  updateUserStatus: (userId: string, status: string, reason: string) => Promise<void>
  uploadProfileImage: (file: File) => Promise<string>
  getNotifications: () => Promise<any[]>
  markNotificationAsRead: (notificationId: string) => Promise<void>
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined)

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userRole, setUserRoleState] = useState<UserRole>(null)
  const [userProfile, setUserProfile] = useState<UserProfile>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        try {
          // Get user role and profile
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUserRoleState(userData.role as UserRole)
            setUserProfile(userData)
            setIsAdmin(userData.role === "admin")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        setUserRoleState(null)
        setUserProfile(null)
        setIsAdmin(false)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName })

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        displayName,
        createdAt: serverTimestamp(),
        status: "active",
        verified: false,
      })
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const setUserRole = async (role: UserRole) => {
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, { role })
      setUserRoleState(role)
    } catch (error) {
      console.error("Error setting user role:", error)
      throw error
    }
  }

  const updateUserProfile = async (data: any) => {
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() })

      // Update local state
      const updatedProfile = { ...userProfile, ...data }
      setUserProfile(updatedProfile)
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  }

  const createJob = async (jobData: any) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const jobRef = await addDoc(collection(db, "jobs"), {
        ...jobData,
        recruiterId: user.uid,
        recruiterName: user.displayName,
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return jobRef.id
    } catch (error) {
      console.error("Error creating job:", error)
      throw error
    }
  }

  const getUserJobs = async () => {
    if (!user) return []

    try {
      const q = query(collection(db, "jobs"), where("recruiterId", "==", user.uid))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting user jobs:", error)
      return [] // Return empty array instead of throwing
    }
  }
    const getAllJobs = async (filters?: any) => {
    try {
      console.log("getAllJobs called with filters:", filters);
      
      // Start with a base query for all jobs
      let q = query(collection(db, "jobs"));
      
      if (filters) {
        console.log("Status filter:", filters.status);
        
        // Apply explicit status filter if provided
        if (filters.status === "open") {
          console.log("Filtering for open jobs only");
          q = query(q, where("status", "==", "open"));
        } else if (filters.status === "closed") {
          console.log("Filtering for closed jobs only");
          q = query(q, where("status", "==", "closed"));
        } else {
          console.log("No status filtering, showing all jobs");
          // No status filter applied - show all jobs
        }
        
        // Apply other filters
        if (filters.category && filters.category !== "All Categories") {
          q = query(q, where("category", "==", filters.category))
        }
        if (filters.locationType && filters.locationType !== "all") {
          q = query(q, where("locationType", "==", filters.locationType))
        }
        if (filters.jobType && filters.jobType !== "all") {
          q = query(q, where("jobType", "==", filters.jobType))
        }
      } else {
        // When no filters provided, for candidates show only open jobs, for others show all
        if (userRole === "candidate") {
          console.log("No filters provided, candidate user - defaulting to open jobs only");
          q = query(q, where("status", "==", "open"));
        } else {
          console.log("No filters provided, non-candidate user - showing all jobs");
        }
      }
      
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(`Retrieved ${results.length} jobs from Firestore`);
      return results;
    } catch (error) {
      console.error("Error getting all jobs:", error);
      return []; // Return empty array instead of throwing
    }
  };

  const getJob = async (jobId: string) => {
    try {
      const jobDoc = await getDoc(doc(db, "jobs", jobId))
      if (!jobDoc.exists()) throw new Error("Job not found")

      return {
        id: jobDoc.id,
        ...jobDoc.data(),
      }
    } catch (error) {
      console.error("Error getting job:", error)
      throw error
    }
  }

  const updateJob = async (jobId: string, data: any) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const jobRef = doc(db, "jobs", jobId)
      const jobDoc = await getDoc(jobRef)

      if (!jobDoc.exists()) throw new Error("Job not found")

      // Check if user is the job creator or an admin
      const jobData = jobDoc.data()
      if (jobData.recruiterId !== user.uid && userRole !== "admin") {
        throw new Error("Unauthorized to update this job")
      }

      await updateDoc(jobRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating job:", error)
      throw error
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const jobRef = doc(db, "jobs", jobId)
      const jobDoc = await getDoc(jobRef)

      if (!jobDoc.exists()) throw new Error("Job not found")

      // Check if user is the job creator or an admin
      const jobData = jobDoc.data()
      if (jobData.recruiterId !== user.uid && userRole !== "admin") {
        throw new Error("Unauthorized to delete this job")
      }

      // Delete all applications for this job
      const applicationsQuery = query(collection(db, "applications"), where("jobId", "==", jobId))
      const applicationsSnapshot = await getDocs(applicationsQuery)

      const deletePromises = applicationsSnapshot.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // Delete the job
      await deleteDoc(jobRef)
    } catch (error) {
      console.error("Error deleting job:", error)
      throw error
    }
  }

  const applyToJob = async (jobId: string, jobTitle?: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      // Get job details if jobTitle is not provided
      let title = jobTitle
      let jobData: any = {}

      const jobDoc = await getDoc(doc(db, "jobs", jobId))
      if (!jobDoc.exists()) throw new Error("Job not found")

      jobData = jobDoc.data()
      if (!title) {
        title = jobData.title
      }

      const recruiterId = jobData.recruiterId

      // Check if user has already applied
      const existingApplicationQuery = query(
        collection(db, "applications"),
        where("jobId", "==", jobId),
        where("candidateId", "==", user.uid),
      )

      const existingApplicationSnapshot = await getDocs(existingApplicationQuery)
      if (!existingApplicationSnapshot.empty) {
        throw new Error("You have already applied to this job")
      }

      // Create application
      const applicationRef = await addDoc(collection(db, "applications"), {
        jobId,
        jobTitle: title,
        candidateId: user.uid,
        candidateName: user.displayName,
        recruiterId,
        status: "pending",
        createdAt: serverTimestamp(),
        jobCategory: jobData.category,
        jobLocation: jobData.location,
        jobLocationType: jobData.locationType,
        jobType: jobData.jobType,
      })

      // Create a conversation between candidate and recruiter
      await createConversation(recruiterId, jobId, title || "")

      // Create notification for recruiter
      await addDoc(collection(db, "notifications"), {
        userId: recruiterId,
        type: "application",
        title: "New Job Application",
        message: `${user.displayName} applied to your job: ${title}`,
        read: false,
        createdAt: serverTimestamp(),
        jobId,
        applicationId: applicationRef.id,
        candidateId: user.uid,
      })

      return applicationRef.id
    } catch (error) {
      console.error("Error applying to job:", error)
      throw error
    }
  }

  const getApplications = async (jobId: string) => {
    try {
      let q

      if (jobId === "all" && user) {
        // Get all applications for all jobs posted by this recruiter
        q = query(collection(db, "applications"), where("recruiterId", "==", user.uid))
      } else {
        // Get applications for a specific job
        q = query(collection(db, "applications"), where("jobId", "==", jobId))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting applications:", error)
      return [] // Return empty array instead of throwing
    }
  }

  const getUserApplications = async () => {
    if (!user) return []

    try {
      const q = query(collection(db, "applications"), where("candidateId", "==", user.uid))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting user applications:", error)
      return [] // Return empty array instead of throwing
    }
  }
  const updateApplicationStatus = async (applicationId: string, status: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const applicationRef = doc(db, "applications", applicationId)
      const applicationDoc = await getDoc(applicationRef)

      if (!applicationDoc.exists()) throw new Error("Application not found")

      const applicationData = applicationDoc.data()

      // Check if user is the recruiter or an admin
      if (applicationData.recruiterId !== user.uid && userRole !== "admin") {
        throw new Error("Unauthorized to update this application")
      }

      await updateDoc(applicationRef, {
        status,
        updatedAt: serverTimestamp(),
      })

      // Create notification for candidate
      await addDoc(collection(db, "notifications"), {
        userId: applicationData.candidateId,
        type: "application_status",
        title: "Application Status Updated",
        message: `Your application for ${applicationData.jobTitle} has been ${status}`,
        read: false,
        createdAt: serverTimestamp(),
        jobId: applicationData.jobId,
        applicationId,
      })
    } catch (error) {
      console.error("Error updating application status:", error)
      throw error
    }
  };
  
  const createConversation = async (otherUserId: string, jobId?: string, jobTitle?: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      // Check if conversation already exists
      const q = query(collection(db, "conversations"), where("participants", "array-contains", user.uid));
      
      const querySnapshot = await getDocs(q);
      const existingConversationDoc = querySnapshot.docs.find((doc) => {
        const data = doc.data();
        return data.participants.includes(otherUserId);
      });
      
      const existingConversation = existingConversationDoc ? {
        id: existingConversationDoc.id,
        ...existingConversationDoc.data()
      } as Conversation : null;
      
      if (existingConversation) {
        // Update existing conversation if needed
        if (jobId && jobTitle) {
          await updateDoc(doc(db, "conversations", existingConversation.id), {
            jobId,
            jobTitle,
            updatedAt: serverTimestamp(),
          })
        }
        
        // Ensure participant names are up to date
        const participantNames = existingConversation.participantNames || {}
        
        // Update current user's name
        if (!participantNames[user.uid] || participantNames[user.uid] === "You" || participantNames[user.uid] === "Unknown User") {
          participantNames[user.uid] = user.displayName || "You"
          await updateDoc(doc(db, "conversations", existingConversation.id), { participantNames })
        }
        
        // Update other user's name if missing
        if (!participantNames[otherUserId] || participantNames[otherUserId] === "Unknown User") {
          const otherUserDoc = await getDoc(doc(db, "users", otherUserId))
          if (otherUserDoc.exists()) {
            const otherUserData = otherUserDoc.data()
            participantNames[otherUserId] = otherUserData.displayName || "Unknown User"
            await updateDoc(doc(db, "conversations", existingConversation.id), { participantNames })
          }
        }
        
        return existingConversation.id
      }      // Get other user's name
      const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
      const otherUserName = otherUserDoc.exists() ? otherUserDoc.data().displayName : "Unknown User";
      
      // Create new conversation
      const participantNames: Record<string, string> = {};
      participantNames[user.uid] = user.displayName || "You";
      participantNames[otherUserId] = otherUserName;
        const conversationRef = await addDoc(collection(db, "conversations"), {
        participants: [user.uid, otherUserId],
        participantNames,
        jobId,
        jobTitle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return conversationRef.id
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  };
  const getConversations = async () => {
    if (!user) return []

    try {
      // Remove the orderBy clause to avoid needing a composite index
      const q = query(collection(db, "conversations"), where("participants", "array-contains", user.uid))

      const querySnapshot = await getDocs(q)
      let conversations = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const lastMessageTimeDate = data.lastMessageTime?.toDate?.() || null;
        
        return {
          id: doc.id,
          ...data,
          lastMessageTimeDate,
          formattedLastMessageTime: lastMessageTimeDate ? getSmartTimeFormat(lastMessageTimeDate) : '',
          createdAtDate: data.createdAt?.toDate?.() || null,
          formattedCreatedAt: data.createdAt?.toDate?.() ? 
            new Intl.DateTimeFormat('en-US', {
              year: 'numeric', 
              month: 'short', 
              day: 'numeric'
            }).format(data.createdAt.toDate()) : '',
        };
      }) as Conversation[]

      // Ensure participant names are correctly populated
      for (const conversation of conversations) {
        // Make sure participantNames exists
        if (!conversation.participantNames) {
          conversation.participantNames = {}
        }
        
        // Fill in missing participant names
        for (const participantId of conversation.participants) {
          if (!conversation.participantNames[participantId]) {
            try {
              const participantDoc = await getDoc(doc(db, "users", participantId))
              if (participantDoc.exists()) {
                const userData = participantDoc.data()
                conversation.participantNames[participantId] = userData.displayName || "Unknown User"
              } else {
                conversation.participantNames[participantId] = "Unknown User"
              }
            } catch (err) {
              console.error(`Error fetching participant ${participantId}:`, err)
              conversation.participantNames[participantId] = "Unknown User"
            }
          }
        }
      }

      // Sort in memory instead - most recent messages first
      return conversations.sort((a, b) => {
        const timeA = a.lastMessageTimeDate || new Date(0)
        const timeB = b.lastMessageTimeDate || new Date(0)
        return timeB.getTime() - timeA.getTime() // descending order
      })
    } catch (error) {
      console.error("Error getting conversations:", error)
      return [] // Return empty array instead of throwing
    }
  }
  const getMessages = (conversationId: string, callback: (messages: any[]) => void) => {
    if (!user) return () => {}

    try {
      const q = query(collection(db, "conversations", conversationId, "messages"), orderBy("timestamp", "asc"))

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          // Format timestamps for better display
          const timestamp = data.timestamp?.toDate();
          return {
            id: doc.id,
            ...data,
            timestamp,
            formattedTime: timestamp ? new Intl.DateTimeFormat('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }).format(timestamp) : '',
            formattedDate: timestamp ? new Intl.DateTimeFormat('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }).format(timestamp) : '',
            // Show full datetime for hover
            formattedFullDateTime: timestamp ? new Intl.DateTimeFormat('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            }).format(timestamp) : '',
            // Smart display - today's messages show only time, other dates show date
            smartTime: timestamp ? getSmartTimeFormat(timestamp) : '',
          };
        });
        callback(messages);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error getting messages:", error);
      return () => {};
    }
  }
  
  // Helper function for smart timestamp formatting
  const getSmartTimeFormat = (date: Date): string => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    const isYesterday = date.getDate() === now.getDate() - 1 && 
                        date.getMonth() === now.getMonth() && 
                        date.getFullYear() === now.getFullYear();
    
    const isThisYear = date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } else if (isYesterday) {
      return `Yesterday, ${new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date)}`;
    } else if (isThisYear) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } else {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    }
  }

  const sendMessage = async (recipientId: string, content: string, jobId?: string, jobTitle?: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      // Create or get conversation
      const conversationId = await createConversation(recipientId, jobId, jobTitle)      // Only save message if it has actual content (not just whitespace)
      const trimmedContent = content.trim();
      
      if (trimmedContent) {
        // Add message to conversation
        await addDoc(collection(db, "conversations", conversationId, "messages"), {
          senderId: user.uid,
          senderName: user.displayName,
          recipientId,
          content: trimmedContent,
          timestamp: serverTimestamp(),
        })
  
        // Update conversation with last message
        await updateDoc(doc(db, "conversations", conversationId), {
          lastMessage: trimmedContent,
          lastMessageTime: serverTimestamp(),
        })
      }

      // Create notification for recipient
      await addDoc(collection(db, "notifications"), {
        userId: recipientId,
        type: "message",
        title: "New Message",
        message: `${user.displayName} sent you a message`,
        read: false,
        createdAt: serverTimestamp(),
        conversationId,
        senderId: user.uid,
      })
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  const getLearningResources = async () => {
    try {
      const q = query(collection(db, "learningResources"), orderBy("createdAt", "desc"))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting learning resources:", error)
      return [] // Return empty array instead of throwing
    }
  }

  const addLearningResource = async (resourceData: any) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const resourceRef = await addDoc(collection(db, "learningResources"), {
        ...resourceData,
        createdBy: user.uid,
        creatorName: user.displayName,
        createdAt: serverTimestamp(),
      })

      return resourceRef.id
    } catch (error) {
      console.error("Error adding learning resource:", error)
      throw error
    }
  }
  const getUserRatings = async () => {
    if (!user) return []

    try {
      const q = query(collection(db, "ratings"), where("ratedUserId", "==", user.uid))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Rating[]
    } catch (error) {
      console.error("Error getting user ratings:", error)
      return [] // Return empty array instead of throwing
    }
  }

  const getRatingsByUser = async () => {
    if (!user) return []

    try {
      const q = query(collection(db, "ratings"), where("raterId", "==", user.uid))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting ratings by user:", error)
      return [] // Return empty array instead of throwing
    }
  }

  const submitRating = async (ratingData: any) => {
    if (!user) throw new Error("User not authenticated")

    try {
      // Check if user has already rated this user for this job
      const q = query(
        collection(db, "ratings"),
        where("raterId", "==", user.uid),
        where("ratedUserId", "==", ratingData.userId),
        where("jobId", "==", ratingData.jobId),
      )

      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        // Update existing rating
        const ratingId = querySnapshot.docs[0].id
        await updateDoc(doc(db, "ratings", ratingId), {
          rating: ratingData.rating,
          review: ratingData.review,
          updatedAt: serverTimestamp(),
        })
        return
      }

      // Get rated user's name
      const ratedUserDoc = await getDoc(doc(db, "users", ratingData.userId))
      const ratedUserName = ratedUserDoc.exists() ? ratedUserDoc.data().displayName : "Unknown User"

      // Create new rating
      await addDoc(collection(db, "ratings"), {
        raterId: user.uid,
        raterName: user.displayName,
        ratedUserId: ratingData.userId,
        ratedUserName,
        jobId: ratingData.jobId,
        jobTitle: ratingData.jobTitle,
        rating: ratingData.rating,
        review: ratingData.review,
        createdAt: serverTimestamp(),
      })

      // Update user's average rating
      const allRatings = await getUserRatings()
      const totalRatings = allRatings.length + 1 // Include the new rating
      const sumRatings = allRatings.reduce((sum, r) => sum + r.rating, 0) + ratingData.rating
      const averageRating = sumRatings / totalRatings

      await updateDoc(doc(db, "users", ratingData.userId), {
        averageRating,
        totalRatings,
      })

      // Create notification for rated user
      await addDoc(collection(db, "notifications"), {
        userId: ratingData.userId,
        type: "rating",
        title: "New Rating",
        message: `${user.displayName} gave you a ${ratingData.rating}-star rating`,
        read: false,
        createdAt: serverTimestamp(),
        raterId: user.uid,
        rating: ratingData.rating,
      })
    } catch (error) {
      console.error("Error submitting rating:", error)
      throw error
    }
  }

  // Admin functions
  const getUsers = async () => {
    if (!isAdmin && userRole !== "admin") throw new Error("Unauthorized")

    try {
      const q = query(collection(db, "users"))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting users:", error)
      return [] // Return empty array instead of throwing
    }
  }

  const getCandidates = async () => {
    if (userRole !== "recruiter" && userRole !== "admin") throw new Error("Unauthorized")

    try {
      const q = query(collection(db, "users"), where("role", "==", "candidate"))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting candidates:", error)
      return [] // Return empty array instead of throwing
    }
  }

  const getRecruiters = async () => {
    if (!user || !userRole) return []

    try {
      const recruitersQuery = query(collection(db, "users"), where("role", "==", "recruiter"))
      const recruitersSnapshot = await getDocs(recruitersQuery)
      const recruitersData = recruitersSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt,
        }
      })

      return recruitersData
    } catch (error) {
      console.error("Error fetching recruiters:", error)
      return []
    }
  }
  
  const getUserById = async (userId: string) => {
    if (!userId) return null

    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      
      if (!userDoc.exists()) {
        return null
      }
      
      const userData = userDoc.data()
      
      // Calculate average rating for the user
      const ratingsQuery = query(collection(db, "ratings"), where("ratedUserId", "==", userId))
      const ratingsSnapshot = await getDocs(ratingsQuery)
      
      let totalRating = 0
      const ratingsCount = ratingsSnapshot.size
      
      ratingsSnapshot.forEach((ratingDoc) => {
        const ratingData = ratingDoc.data()
        totalRating += ratingData.rating
      })
      
      const averageRating = ratingsCount > 0 ? totalRating / ratingsCount : 0
      
      return {
        id: userDoc.id,
        ...userData,
        averageRating,
        ratingsCount,
        createdAt: userData.createdAt,
      }
    } catch (error) {
      console.error("Error fetching user by ID:", error)
      return null
    }
  }

  const getReportedContent = async () => {
    if (!isAdmin) throw new Error("Unauthorized")

    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting reported content:", error)
      return [] // Return empty array instead of throwing
    }
  }

  const submitReport = async (reportData: any) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const reportRef = await addDoc(collection(db, "reports"), {
        ...reportData,
        reporterId: user.uid,
        reporterName: user.displayName,
        status: "pending",
        createdAt: serverTimestamp(),
      })

      return reportRef.id
    } catch (error) {
      console.error("Error submitting report:", error)
      throw error
    }
  }

  const getJobStats = async () => {
    try {
      const jobsSnapshot = await getDocs(collection(db, "jobs"))
      const jobs = jobsSnapshot.docs.map((doc) => doc.data())

      // Count jobs by status
      const total = jobs.length
      const active = jobs.filter((job) => job.status === "open").length
      const completed = jobs.filter((job) => job.status === "closed").length

      // Count jobs by category
      const categoryCounts: Record<string, number> = {}
      jobs.forEach((job) => {
        const category = job.category || "Uncategorized"
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      })

      const categories = Object.entries(categoryCounts).map(([name, count]) => ({ name, count }))
      categories.sort((a, b) => b.count - a.count)

      return {
        total,
        active,
        completed,
        categories,
      }
    } catch (error) {
      console.error("Error getting job stats:", error)
      return {
        total: 0,
        active: 0,
        completed: 0,
        categories: [],
      }
    }
  }

  const getUserStats = async () => {
    if (!isAdmin) throw new Error("Unauthorized")

    try {
      const usersSnapshot = await getDocs(collection(db, "users"))
      const users = usersSnapshot.docs.map((doc) => doc.data())

      // Count users by role
      const total = users.length
      const candidates = users.filter((user) => user.role === "candidate").length
      const recruiters = users.filter((user) => user.role === "recruiter").length
      const admins = users.filter((user) => user.role === "admin").length

      // Count users by status
      const active = users.filter((user) => user.status === "active").length
      const suspended = users.filter((user) => user.status === "suspended").length
      const banned = users.filter((user) => user.status === "banned").length

      // Get new users in the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const newUsers = users.filter((user) => {
        if (!user.createdAt) return false
        const createdAt = user.createdAt.toDate()
        return createdAt > thirtyDaysAgo
      }).length

      return {
        total,
        candidates,
        recruiters,
        admins,
        active,
        suspended,
        banned,
        newUsers,
      }
    } catch (error) {
      console.error("Error getting user stats:", error)
      return {
        total: 0,
        candidates: 0,
        recruiters: 0,
        admins: 0,
        active: 0,
        suspended: 0,
        banned: 0,
        newUsers: 0,
      }
    }
  }

  const updateUserStatus = async (userId: string, status: string, reason: string) => {
    if (!isAdmin) throw new Error("Unauthorized")

    try {
      await updateDoc(doc(db, "users", userId), {
        status,
        statusReason: reason,
        statusUpdatedAt: serverTimestamp(),
        statusUpdatedBy: user?.uid,
      })

      // Log status change
      await addDoc(collection(db, "userStatusLogs"), {
        userId,
        status,
        reason,
        adminId: user?.uid,
        adminName: user?.displayName,
        timestamp: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating user status:", error)
      throw error
    }
  }

  const uploadProfileImage = async (file: File) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const storageRef = ref(storage, `profile_images/${user.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)

      const downloadURL = await getDownloadURL(storageRef)

      // Update user profile with the image URL
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: downloadURL,
        updatedAt: serverTimestamp(),
      })

      // Update local state
      setUserProfile({
        ...userProfile,
        photoURL: downloadURL,
      })

      return downloadURL
    } catch (error) {
      console.error("Error uploading profile image:", error)
      throw error
    }
  }
  const getNotifications = async () => {
    if (!user) return []

    try {
      // Use a simple query without orderBy to avoid index requirements
      const q = query(collection(db, "notifications"), where("userId", "==", user.uid))

      const querySnapshot = await getDocs(q)
      const notifications = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[]

      // Sort in memory instead
      return notifications
        .sort((a, b) => {
          const timeA = a.createdAt?.toDate?.() || new Date(0)
          const timeB = b.createdAt?.toDate?.() || new Date(0)
          return timeB.getTime() - timeA.getTime() // descending order (newest first)
        })
        .slice(0, 50) // Limit to 50 notifications
    } catch (error) {
      console.error("Error getting notifications:", error)
      return [] // Return empty array instead of throwing
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
        readAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      throw error
    }
  }
  // Function to check if the current user has already applied to a specific job
  const checkUserAppliedToJob = async (jobId: string) => {
    if (!user) return false;

    try {
      const existingApplicationQuery = query(
        collection(db, "applications"),
        where("jobId", "==", jobId),
        where("candidateId", "==", user.uid)
      );

      const existingApplicationSnapshot = await getDocs(existingApplicationQuery);
      return !existingApplicationSnapshot.empty;
    } catch (error) {
      console.error("Error checking if user applied to job:", error);
      return false;
    }
  };

  const value = {
    user,
    userRole,
    userProfile,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    setUserRole,
    updateUserProfile,
    createJob,
    getUserJobs,
    getAllJobs,
    getJob,
    updateJob,
    deleteJob,
    applyToJob,
    checkUserAppliedToJob,
    getApplications,
    getUserApplications,
    updateApplicationStatus,
    getConversations,
    getMessages,
    sendMessage,
    getLearningResources,
    addLearningResource,
    getUserRatings,
    getRatingsByUser,
    submitRating,
    getUsers,
    getCandidates,
    getRecruiters,
    getUserById,
    getReportedContent,
    submitReport,
    getJobStats,
    getUserStats,
    updateUserStatus,
    uploadProfileImage,
    getNotifications,
    markNotificationAsRead,
  }

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext)
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider")
  }
  return context
};
