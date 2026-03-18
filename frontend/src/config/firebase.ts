import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase frontend config keys are designed to be public and are restricted
// by domain/app in the Firebase Console. They are safe to include in client
// bundles. We use VITE_ env vars for flexibility (e.g. staging vs production)
// but fall back to the production values so the app never breaks.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCiYW0DLQwu6VN-BfbXyN6LqgN-u5W8vlA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hasatlink.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hasatlink-33",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hasatlink-33.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "361061612129",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:361061612129:web:c88e45638c9dc84df50820",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-WWWCHP1TNM",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
