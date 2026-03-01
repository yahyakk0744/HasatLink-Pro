import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { signInWithRedirect, getRedirectResult, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { auth as firebaseAuth, googleProvider } from '../config/firebase';
import api from '../config/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  firebaseUid: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, location?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserData: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hasatlink_token'));
  const [loading, setLoading] = useState(true);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data);
          setFirebaseUid(data.firebaseUid || null);
        })
        .catch(() => { setToken(null); localStorage.removeItem('hasatlink_token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Handle Google redirect result on page load
  const redirectHandled = useRef(false);
  useEffect(() => {
    if (redirectHandled.current) return;
    redirectHandled.current = true;

    getRedirectResult(firebaseAuth)
      .then(async (result) => {
        if (result?.user) {
          try {
            const idToken = await result.user.getIdToken();
            const { data } = await api.post('/auth/google', { idToken });
            localStorage.setItem('hasatlink_token', data.token);
            setToken(data.token);
            setUser(data.user);
            setFirebaseUid(result.user.uid);
          } catch (err) {
            console.error('Google redirect backend error:', err);
          }
        }
      })
      .catch((err) => {
        console.error('Google redirect result error:', err);
      });
  }, []);

  // Keep firebaseUid in sync with actual Firebase auth state
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((fbUser) => {
      if (fbUser) {
        setFirebaseUid(fbUser.uid);
      }
      // Don't clear firebaseUid on null — we keep the backend-stored UID as fallback
    });
    return unsubscribe;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, location?: string) => {
    try {
      // 1. Create Firebase Auth account first
      const fbResult = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const fbUid = fbResult.user.uid;

      try {
        // 2. Register on backend with firebaseUid
        const { data } = await api.post('/auth/register', { name, email, password, location, firebaseUid: fbUid });
        localStorage.setItem('hasatlink_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setFirebaseUid(fbUid);
        return { success: true };
      } catch (err: any) {
        // Backend failed → delete Firebase account
        await deleteUser(fbResult.user).catch(() => {});
        return { success: false, message: err.response?.data?.message || 'Kayıt hatası' };
      }
    } catch (err: any) {
      // Firebase account creation failed
      if (err.code === 'auth/email-already-in-use') {
        // Email already exists in Firebase, try backend register without Firebase
        try {
          const { data } = await api.post('/auth/register', { name, email, password, location });
          localStorage.setItem('hasatlink_token', data.token);
          setToken(data.token);
          setUser(data.user);
          // Try to sign in to Firebase to get uid
          try {
            const fbResult = await signInWithEmailAndPassword(firebaseAuth, email, password);
            setFirebaseUid(fbResult.user.uid);
          } catch {}
          return { success: true };
        } catch (backendErr: any) {
          return { success: false, message: backendErr.response?.data?.message || 'Kayıt hatası' };
        }
      }
      return { success: false, message: err.message || 'Kayıt hatası' };
    }
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    try {
      // 1. Backend login first (validates credentials)
      const { data } = await api.post('/auth/login', { email: emailOrUsername, password });
      localStorage.setItem('hasatlink_token', data.token);
      setToken(data.token);
      setUser(data.user);

      // 2. Firebase Auth sign-in — always try with user's email
      const userEmail = data.user.email;
      let fbUid = data.user.firebaseUid || '';

      if (userEmail) {
        try {
          const fbResult = await signInWithEmailAndPassword(firebaseAuth, userEmail, password);
          fbUid = fbResult.user.uid;
        } catch {
          // Sign-in failed — try creating Firebase account
          try {
            const fbResult = await createUserWithEmailAndPassword(firebaseAuth, userEmail, password);
            fbUid = fbResult.user.uid;
          } catch {
            // Firebase auth mismatch — user can still use the app with backend auth
          }
        }
      }

      // 3. If we got a firebaseUid and backend doesn't have it, save it
      if (fbUid && fbUid !== data.user.firebaseUid) {
        try {
          await api.put(`/users/${data.user.userId}`, { firebaseUid: fbUid });
        } catch {
          // Non-critical: firebaseUid sync failed
        }
      }

      setFirebaseUid(fbUid || null);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Giriş hatası' };
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      // Try popup first (works on most desktop browsers)
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      const { data } = await api.post('/auth/google', { idToken });
      localStorage.setItem('hasatlink_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setFirebaseUid(result.user.uid);
      return { success: true };
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        return { success: false, message: 'Giriş iptal edildi' };
      }
      // Popup blocked or failed — fall back to redirect
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.code === 'auth/internal-error' ||
        err.code === 'auth/web-storage-unsupported'
      ) {
        try {
          await signInWithRedirect(firebaseAuth, googleProvider);
          // Page will redirect, return pending state
          return { success: true };
        } catch (redirectErr: any) {
          console.error('Google redirect error:', redirectErr);
          return { success: false, message: 'Google giriş hatası' };
        }
      }
      console.error('Google login error:', err.code, err.message);
      return { success: false, message: err.response?.data?.message || 'Google giriş hatası' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hasatlink_token');
    setToken(null);
    setUser(null);
    setFirebaseUid(null);
    signOut(firebaseAuth).catch(() => {});
  }, []);

  const updateUserData = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, firebaseUid, login, register, loginWithGoogle, logout, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
