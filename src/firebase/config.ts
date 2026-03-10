import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID
};

// Validation to help user debug
const missingVars = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}`);

if (missingVars.length > 0) {
  console.error("Missing Firebase environment variables:", missingVars.join(", "));
  console.warn("Please check your AI Studio Environment Variables settings.");
}

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Error initializing Firebase Client SDK:", error);
  throw error;
}
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
