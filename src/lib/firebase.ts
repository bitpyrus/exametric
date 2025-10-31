import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD9Eq7tAmxx6o1iFBYb-s-3fLKqIl-8DDU",
  authDomain: "exametric-439ba.firebaseapp.com",
  projectId: "exametric-439ba",
  storageBucket: "exametric-439ba.firebasestorage.app",
  messagingSenderId: "680338040075",
  appId: "1:680338040075:web:870b8ca6cb78b7598cee0e",
};

// Initialize Firebase app
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export types
export type { User } from 'firebase/auth';
export type { DocumentData, DocumentReference, QueryDocumentSnapshot } from 'firebase/firestore';

export interface UserAnswer {
  userId: string;
  email?: string | null;
  answers: Record<string, string>;
  sectionId: string;
  timestamp: string;
  score?: number;
  analysis?: {
    completeness: number;
    keywords: Record<string, number>;
    timeSpent: number;
  };
}
