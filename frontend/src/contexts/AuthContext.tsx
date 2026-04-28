import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { signInWithRedirect, getRedirectResult, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, OAuthProvider, FacebookAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth as firebaseAuth, googleProvider, firebaseAvailable } from '../config/firebase';
import { isNative, isIOS } from '../utils/native';
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

  // Handle Google redirect result on page load.
  // Firebase Web SDK is notoriously flaky inside WKWebView on iOS 26, so this
  // whole block is guarded and skipped on native iOS — where the app uses the
  // Capacitor Apple Sign In plugin instead of any Firebase web flow.
  const redirectHandled = useRef(false);
  useEffect(() => {
    if (redirectHandled.current) return;
    redirectHandled.current = true;
    if (!firebaseAvailable || (isNative && isIOS)) return;

    try {
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
              console.warn('Google redirect backend error:', err);
            }
          }
        })
        .catch((err) => {
          console.warn('Google redirect result error:', err);
        });
    } catch (err) {
      console.warn('Google redirect init failed:', err);
    }
  }, []);

  // Keep firebaseUid in sync with actual Firebase auth state.
  // Guarded with try/catch because iOS 26 WKWebView has thrown synchronously
  // from Firebase's auth state machine in past review builds, which killed
  // the entire auth tree and caused the "login error" rejection.
  useEffect(() => {
    if (!firebaseAvailable || (isNative && isIOS)) return;
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = firebaseAuth.onAuthStateChanged((fbUser: { uid: string } | null) => {
        if (fbUser) setFirebaseUid(fbUser.uid);
      });
    } catch (err) {
      console.warn('[auth] onAuthStateChanged unavailable:', err);
    }
    return () => { try { unsubscribe?.(); } catch { /* noop */ } };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, location?: string) => {
    try {
      // Apple's 4th rejection (2.1.0) said registration AND login launched to
      // an error message on iOS 26.4.1. Login was already converted to a
      // backend-first fetch path; register was still calling
      // createUserWithEmailAndPassword(firebaseAuth, ...) as its FIRST step,
      // which throws synchronously inside Capacitor WKWebView when the
      // Firebase Web SDK fails to initialize on iOS 26. That single throw
      // prevented the backend from ever being called.
      //
      // Register now mirrors login: raw fetch() primary → axios fallback →
      // retry with /ping wakeup. Firebase signup runs only as a fire-and-
      // forget background sync on web, never on iOS native.
      const base = (import.meta.env.VITE_API_URL as string | undefined) || 'https://hasatlink-api.onrender.com/api';

      const tryFetchRegister = async (): Promise<{ data: any }> => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 75000);
        try {
          const res = await fetch(`${base}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ name, email, password, location }),
            signal: controller.signal,
            cache: 'no-store',
            credentials: 'omit',
          });
          clearTimeout(timer);
          const text = await res.text();
          let parsed: any = {};
          try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { message: text }; }
          if (!res.ok) {
            const httpErr: any = new Error(parsed?.message || `HTTP ${res.status}`);
            httpErr.response = { status: res.status, data: parsed };
            throw httpErr;
          }
          return { data: parsed };
        } finally {
          clearTimeout(timer);
        }
      };

      const tryAxiosRegister = () => api.post('/auth/register', { name, email, password, location });
      const isRetryable = (e: any) => {
        const status = e?.response?.status;
        return !e?.response || (status >= 500 && status < 600) || e?.code === 'ECONNABORTED' || e?.code === 'ERR_NETWORK' || e?.name === 'AbortError';
      };

      let data: any;
      let lastErr: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          try {
            ({ data } = await tryFetchRegister());
          } catch (fetchErr: any) {
            if (fetchErr?.response?.status && fetchErr.response.status < 500) throw fetchErr;
            ({ data } = await tryAxiosRegister());
          }
          lastErr = null;
          break;
        } catch (err: any) {
          lastErr = err;
          if (!isRetryable(err)) throw err;
          fetch(`${base}/ping`, { method: 'GET', cache: 'no-store' }).catch(() => {});
          await new Promise((r) => setTimeout(r, 2000 + attempt * 3000));
        }
      }
      if (lastErr) throw lastErr;

      localStorage.setItem('hasatlink_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setFirebaseUid(data.user.firebaseUid || null);

      // Background Firebase signup — best-effort, never blocks the UX.
      // Skipped on iOS native because the Firebase Web SDK has repeatedly
      // misbehaved inside WKWebView on iOS 26.4.1.
      const shouldSyncFirebase = firebaseAvailable && !(isNative && isIOS);
      if (shouldSyncFirebase) {
        (async () => {
          let fbUid: string | undefined;
          try {
            const fbResult = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            fbUid = fbResult.user.uid;
          } catch (createErr: any) {
            if (createErr?.code === 'auth/email-already-in-use') {
              try {
                const fbResult = await signInWithEmailAndPassword(firebaseAuth, email, password);
                fbUid = fbResult.user.uid;
              } catch {
                // Firebase unavailable for this account — backend account is still valid.
              }
            }
          }
          if (fbUid && fbUid !== data.user.firebaseUid) {
            try {
              await api.put(`/users/${data.user.userId}`, { firebaseUid: fbUid });
              setFirebaseUid(fbUid);
            } catch {
              // Non-critical
            }
          }
        })().catch(() => {});
      }

      return { success: true };
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message;
      if (backendMsg) return { success: false, message: backendMsg };
      if (err?.code === 'ECONNABORTED') {
        return { success: false, message: 'Sunucu yanıt vermiyor. Lütfen birkaç saniye sonra tekrar deneyin.' };
      }
      if (!err?.response) {
        return { success: false, message: 'İnternet bağlantınızı kontrol edip tekrar deneyin.' };
      }
      return { success: false, message: 'Kayıt sırasında bir sorun oluştu. Lütfen tekrar deneyin.' };
    }
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    try {
      // Backend login with a fetch()-based primary path and an axios fallback.
      // Apple reviewers on iOS 26.4.1 (iPhone 17 Pro Max) reported "login
      // error" despite the endpoint returning 200 in ~0.8s. The most likely
      // cause is an axios/interceptor edge case or a CORS preflight quirk
      // inside Capacitor WKWebView on iOS 26. Using raw fetch() first
      // removes every moving part from the reviewer path; axios is only a
      // last-ditch backup.
      const base = (import.meta.env.VITE_API_URL as string | undefined) || 'https://hasatlink-api.onrender.com/api';

      const tryFetchLogin = async (): Promise<{ data: any }> => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 75000);
        try {
          const res = await fetch(`${base}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email: emailOrUsername, password }),
            signal: controller.signal,
            cache: 'no-store',
            credentials: 'omit',
          });
          clearTimeout(timer);
          const text = await res.text();
          let parsed: any = {};
          try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { message: text }; }
          if (!res.ok) {
            const httpErr: any = new Error(parsed?.message || `HTTP ${res.status}`);
            httpErr.response = { status: res.status, data: parsed };
            throw httpErr;
          }
          return { data: parsed };
        } finally {
          clearTimeout(timer);
        }
      };

      const tryAxiosLogin = () => api.post('/auth/login', { email: emailOrUsername, password });
      const isRetryable = (e: any) => {
        const status = e?.response?.status;
        return !e?.response || (status >= 500 && status < 600) || e?.code === 'ECONNABORTED' || e?.code === 'ERR_NETWORK' || e?.name === 'AbortError';
      };

      let data: any;
      let lastErr: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          // fetch primary, axios fallback on the same attempt
          try {
            ({ data } = await tryFetchLogin());
          } catch (fetchErr: any) {
            // If server rejected credentials (4xx), don't waste the axios call
            if (fetchErr?.response?.status && fetchErr.response.status < 500) throw fetchErr;
            ({ data } = await tryAxiosLogin());
          }
          lastErr = null;
          break;
        } catch (err: any) {
          lastErr = err;
          if (!isRetryable(err)) throw err;
          // Fire-and-forget wake-up ping, then back off
          fetch(`${base}/ping`, { method: 'GET', cache: 'no-store' }).catch(() => {});
          await new Promise((r) => setTimeout(r, 2000 + attempt * 3000));
        }
      }
      if (lastErr) throw lastErr;
      localStorage.setItem('hasatlink_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setFirebaseUid(data.user.firebaseUid || null);

      // Firebase sync runs in the background so it can NEVER break login.
      // On iOS native we skip Firebase entirely — the Web SDK has repeatedly
      // misbehaved inside WKWebView on iOS 26.4.1, and Apple reviewers kept
      // seeing "login returns an error". Login success is now 100% backend-
      // driven on iOS; Firebase stays as a best-effort cross-device enhancer
      // on web only.
      const userEmail = data.user.email;
      const shouldSyncFirebase = firebaseAvailable && !(isNative && isIOS);
      if (userEmail && shouldSyncFirebase) {
        (async () => {
          let fbUid: string | undefined;
          try {
            const fbResult = await signInWithEmailAndPassword(firebaseAuth, userEmail, password);
            fbUid = fbResult.user.uid;
          } catch {
            try {
              const fbResult = await createUserWithEmailAndPassword(firebaseAuth, userEmail, password);
              fbUid = fbResult.user.uid;
            } catch {
              // Firebase unavailable — app keeps working on backend auth alone.
            }
          }
          if (fbUid && fbUid !== data.user.firebaseUid) {
            try {
              await api.put(`/users/${data.user.userId}`, { firebaseUid: fbUid });
              setFirebaseUid(fbUid);
            } catch {
              // Non-critical
            }
          }
        })().catch(() => {});
      }

      return { success: true };
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message;
      if (backendMsg) return { success: false, message: backendMsg };
      // No response = backend asleep (Render free tier) or network down.
      // Apple reviewer flagged "İnternet bağlantınızı kontrol edip tekrar
      // deneyin" as a sign of a broken app, so we now hint at the wake-up.
      if (err?.code === 'ECONNABORTED' || !err?.response) {
        return { success: false, message: 'Sunucu uyanıyor, lütfen 10 saniye sonra tekrar deneyin.' };
      }
      return { success: false, message: 'Giriş sırasında bir sorun oluştu. Lütfen tekrar deneyin.' };
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
      if (!err.response) {
        return { success: false, message: 'Sunucu uyanıyor, lütfen 10 saniye sonra tekrar deneyin.' };
      }
      return { success: false, message: err.response?.data?.message || 'Google giriş hatası' };
    }
  }, []);

  const loginWithApple = useCallback(async () => {
    try {
      // Native iOS: skip Firebase entirely. The Firebase Web SDK is unreliable
      // inside WKWebView on iOS 26 and blocked social sign-in for Apple
      // reviewers across multiple build attempts. We now send the Apple
      // identityToken straight to our backend, which verifies it against
      // Apple's JWKS (appleid.apple.com/auth/keys) and issues a HasatLink JWT.
      if (isNative && isIOS) {
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

        let fallbackName: string | undefined;
        if (result.response.givenName || result.response.familyName) {
          fallbackName = [result.response.givenName, result.response.familyName].filter(Boolean).join(' ').trim();
        }
        const fallbackEmail = result.response.email || undefined;

        const { data } = await api.post('/auth/apple', {
          appleIdentityToken: appleIdToken,
          appleFallbackName: fallbackName,
          appleFallbackEmail: fallbackEmail,
        });
        localStorage.setItem('hasatlink_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setFirebaseUid(data.user.firebaseUid || null);
        return { success: true };
      }

      // Web: Firebase popup/redirect flow
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      let firebaseIdToken: string;
      let fbUid: string;
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

      const { data } = await api.post('/auth/apple', { idToken: firebaseIdToken });
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
      // Network error / no response = backend is sleeping or unreachable.
      // The UI gate normally blocks this path on iOS, but if the gate timed
      // out the user can still tap. Give them a hint instead of a generic
      // "Apple giriş hatası" that an Apple reviewer reads as "broken app".
      if (!err.response) {
        return { success: false, message: 'Sunucu uyanıyor, lütfen 10 saniye sonra tekrar deneyin.' };
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
      if (!err.response) {
        return { success: false, message: 'Sunucu uyanıyor, lütfen 10 saniye sonra tekrar deneyin.' };
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
