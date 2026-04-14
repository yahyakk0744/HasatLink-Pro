import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { signInWithRedirect, getRedirectResult, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, deleteUser, GoogleAuthProvider, OAuthProvider, FacebookAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth as firebaseAuth, googleProvider } from '../config/firebase';
import { isNative } from '../utils/native';
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
  loginWithApple: () => Promise<{ success: boolean; message?: string }>;
  loginWithFacebook: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserData: (updates: Partial<User>) => void;
}

// --- Nonce helpers for Sign in with Apple ---
// Apple requires a SHA-256 hashed nonce in the authorize call,
// while Firebase needs the raw (unhashed) nonce when exchanging the Apple token.
function generateRawNonce(length = 32): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._';
  const random = new Uint8Array(length);
  crypto.getRandomValues(random);
  let result = '';
  for (let i = 0; i < length; i++) result += charset[random[i] % charset.length];
  return result;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
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
      let idToken: string;
      let fbUid: string;

      if (isNative) {
        // Native: use Capacitor Google Auth plugin
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        const googleUser = await GoogleAuth.signIn();
        const googleIdToken = googleUser.authentication.idToken;

        // Sign into Firebase with the Google credential
        const credential = GoogleAuthProvider.credential(googleIdToken);
        const fbResult = await signInWithCredential(firebaseAuth, credential);
        idToken = await fbResult.user.getIdToken();
        fbUid = fbResult.user.uid;
      } else {
        // Web: try popup first, then redirect
        try {
          const result = await signInWithPopup(firebaseAuth, googleProvider);
          idToken = await result.user.getIdToken();
          fbUid = result.user.uid;
        } catch (popupErr: any) {
          if (popupErr.code === 'auth/popup-closed-by-user') {
            return { success: false, message: 'Giriş iptal edildi' };
          }
          if (
            popupErr.code === 'auth/popup-blocked' ||
            popupErr.code === 'auth/cancelled-popup-request' ||
            popupErr.code === 'auth/internal-error' ||
            popupErr.code === 'auth/web-storage-unsupported'
          ) {
            await signInWithRedirect(firebaseAuth, googleProvider);
            return { success: true };
          }
          throw popupErr;
        }
      }

      const { data } = await api.post('/auth/google', { idToken });
      localStorage.setItem('hasatlink_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setFirebaseUid(fbUid);
      return { success: true };
    } catch (err: any) {
      console.error('Google login error:', err.code || err.message, err);
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('canceled')) {
        return { success: false, message: 'Giriş iptal edildi' };
      }
      return { success: false, message: err.response?.data?.message || 'Google giriş hatası' };
    }
  }, []);

  const loginWithApple = useCallback(async () => {
    try {
      let firebaseIdToken: string;
      let fbUid: string;
      let fallbackName: string | undefined;
      let fallbackEmail: string | undefined;

      if (isNative) {
        // Native iOS: use Sign in with Apple plugin
        const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');

        const rawNonce = generateRawNonce();
        const hashedNonce = await sha256Hex(rawNonce);

        const result = await SignInWithApple.authorize({
          clientId: 'com.hasatlink.app',
          redirectURI: 'https://hasatlink.com',
          scopes: 'email name',
          nonce: hashedNonce,
        });

        const appleIdToken = result.response.identityToken;
        if (!appleIdToken) throw new Error('Apple kimlik tokeni alınamadı');

        // Apple only returns name/email on FIRST sign-in — capture them for backend fallback
        if (result.response.givenName || result.response.familyName) {
          fallbackName = [result.response.givenName, result.response.familyName].filter(Boolean).join(' ').trim();
        }
        if (result.response.email) fallbackEmail = result.response.email;

        const provider = new OAuthProvider('apple.com');
        const credential = provider.credential({ idToken: appleIdToken, rawNonce });
        const fbResult = await signInWithCredential(firebaseAuth, credential);
        firebaseIdToken = await fbResult.user.getIdToken();
        fbUid = fbResult.user.uid;
      } else {
        // Web: use Firebase popup
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        try {
          const result = await signInWithPopup(firebaseAuth, provider);
          firebaseIdToken = await result.user.getIdToken();
          fbUid = result.user.uid;
        } catch (popupErr: any) {
          if (popupErr.code === 'auth/popup-closed-by-user') {
            return { success: false, message: 'Giriş iptal edildi' };
          }
          if (
            popupErr.code === 'auth/popup-blocked' ||
            popupErr.code === 'auth/cancelled-popup-request' ||
            popupErr.code === 'auth/web-storage-unsupported'
          ) {
            await signInWithRedirect(firebaseAuth, provider);
            return { success: true };
          }
          throw popupErr;
        }
      }

      const { data } = await api.post('/auth/apple', {
        idToken: firebaseIdToken,
        appleFallbackName: fallbackName,
        appleFallbackEmail: fallbackEmail,
      });
      localStorage.setItem('hasatlink_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setFirebaseUid(fbUid);
      return { success: true };
    } catch (err: any) {
      console.error('Apple login error:', err.code || err.message, err);
      const msg = err.message || '';
      if (err.code === 'auth/popup-closed-by-user' || msg.includes('canceled') || msg.includes('1001') /* Apple user cancel */) {
        return { success: false, message: 'Giriş iptal edildi' };
      }
      return { success: false, message: err.response?.data?.message || 'Apple giriş hatası' };
    }
  }, []);

  const loginWithFacebook = useCallback(async () => {
    try {
      let firebaseIdToken: string;
      let fbUid: string;

      if (isNative) {
        // Native: use Capacitor Facebook plugin
        const { FacebookLogin } = await import('@capacitor-community/facebook-login');

        const result = await FacebookLogin.login({
          permissions: ['email', 'public_profile'],
        });
        const fbAccessToken = result.accessToken?.token;
        if (!fbAccessToken) return { success: false, message: 'Giriş iptal edildi' };

        const credential = FacebookAuthProvider.credential(fbAccessToken);
        const fbResult = await signInWithCredential(firebaseAuth, credential);
        firebaseIdToken = await fbResult.user.getIdToken();
        fbUid = fbResult.user.uid;
      } else {
        // Web: use Firebase popup
        const provider = new FacebookAuthProvider();
        provider.addScope('email');
        try {
          const result = await signInWithPopup(firebaseAuth, provider);
          firebaseIdToken = await result.user.getIdToken();
          fbUid = result.user.uid;
        } catch (popupErr: any) {
          if (popupErr.code === 'auth/popup-closed-by-user') {
            return { success: false, message: 'Giriş iptal edildi' };
          }
          if (
            popupErr.code === 'auth/popup-blocked' ||
            popupErr.code === 'auth/cancelled-popup-request' ||
            popupErr.code === 'auth/web-storage-unsupported'
          ) {
            await signInWithRedirect(firebaseAuth, provider);
            return { success: true };
          }
          throw popupErr;
        }
      }

      const { data } = await api.post('/auth/facebook', { idToken: firebaseIdToken });
      localStorage.setItem('hasatlink_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setFirebaseUid(fbUid);
      return { success: true };
    } catch (err: any) {
      console.error('Facebook login error:', err.code || err.message, err);
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('canceled')) {
        return { success: false, message: 'Giriş iptal edildi' };
      }
      return { success: false, message: err.response?.data?.message || 'Facebook giriş hatası' };
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
    <AuthContext.Provider value={{ user, token, loading, firebaseUid, login, register, loginWithGoogle, loginWithApple, loginWithFacebook, logout, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
