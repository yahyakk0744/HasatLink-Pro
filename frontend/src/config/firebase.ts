import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

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

// Firebase Web SDK has repeatedly failed to initialise cleanly inside
// Capacitor's WKWebView on iOS 26.4.1 — Apple reviewers saw "login error"
// because a module-level throw from getAuth()/getFirestore() killed the
// React tree before AuthContext ever mounted. Everything is now wrapped in
// try/catch and exported as "safe stubs" when init fails. Backend auth is
// 100% independent of Firebase, so a null auth stub is harmless.
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _provider: GoogleAuthProvider | null = null;
let _db: Firestore | null = null;

try {
  _app = initializeApp(firebaseConfig);
} catch (err) {
  // Intentionally swallow: Firebase is optional for login on iOS.
  if (typeof console !== 'undefined') console.warn('[firebase] init skipped:', (err as Error)?.message);
}

try {
  if (_app) _auth = getAuth(_app);
} catch (err) {
  if (typeof console !== 'undefined') console.warn('[firebase] getAuth skipped:', (err as Error)?.message);
}

try {
  _provider = new GoogleAuthProvider();
} catch {
  // Provider is only needed for Google sign-in, which is disabled on iOS.
}

try {
  if (_app) _db = getFirestore(_app);
} catch (err) {
  if (typeof console !== 'undefined') console.warn('[firebase] getFirestore skipped:', (err as Error)?.message);
}

// Safe listener stub used when real auth is unavailable so consumers can
// call onAuthStateChanged() without iOS-specific null checks everywhere.
const noopAuthStub = {
  currentUser: null,
  onAuthStateChanged: (_cb: (u: unknown) => void) => () => {},
  // Any other property access returns a rejected promise to fail loud but
  // caught in callers.
} as unknown as Auth;

const noopProviderStub = {} as unknown as GoogleAuthProvider;
const noopDbStub = {} as unknown as Firestore;

export const auth: Auth = _auth ?? noopAuthStub;
export const googleProvider: GoogleAuthProvider = _provider ?? noopProviderStub;
export const db: Firestore = _db ?? noopDbStub;
export const firebaseAvailable = _auth !== null;
