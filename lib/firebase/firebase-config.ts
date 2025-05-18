import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

export const firebaseConfig = {
  apiKey: "AIzaSyBUz9naZW1twahkdKUQwbU9k2EsnegdXcQ",
  authDomain: "kaaj-90710.firebaseapp.com",
  projectId: "kaaj-90710",
  storageBucket: "kaaj-90710.firebasestorage.app",
  messagingSenderId: "105436307071",
  appId: "1:105436307071:web:1d248fc77059918d40294a",
  measurementId: "G-XR8HQ7TKL6",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)
