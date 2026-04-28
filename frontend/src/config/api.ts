import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://hasatlink-api.onrender.com/api' : 'http://localhost:5000/api'),
  headers: { 'Content-Type': 'application/json' },
  // Render free tier cold-start can take up to ~60s. Give the first request room.
  timeout: 75000,
});

// Fire-and-forget pings on module load to warm Render BEFORE the user hits login.
// We hammer the wakeup hard for the first 60s after app launch so the cold-start
// window closes before reviewers tap "Sign in with Apple". Each ping is independent
// so a single network blip can't leave the backend unwarmed.
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  const base = import.meta.env.VITE_API_URL || 'https://hasatlink-api.onrender.com/api';
  const ping = () => fetch(`${base}/ping`, { method: 'GET', cache: 'no-store' }).catch(() => {});
  ping();
  setTimeout(ping, 2000);
  setTimeout(ping, 5000);
  setTimeout(ping, 15000);
  setTimeout(ping, 30000);
}

// Backend-readiness probe used by login UI to gate auth buttons until the
// backend is awake. Eliminates the race window where Apple reviewers tapped
// "Sign in with Apple" while Render was still cold-booting and got
// "Apple giriş hatası" / "İnternet bağlantınızı kontrol edin" toasts.
//
// Returns a singleton Promise that resolves true once /api/ping returns 200,
// or false after 90s of failures. Subsequent callers reuse the same promise.
let _readyPromise: Promise<boolean> | null = null;
export function getBackendReady(): Promise<boolean> {
  if (_readyPromise) return _readyPromise;
  if (typeof window === 'undefined') return Promise.resolve(true);

  const base = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://hasatlink-api.onrender.com/api' : 'http://localhost:5000/api');
  const maxWaitMs = 90_000;
  const stepMs = 2_000;

  _readyPromise = (async () => {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 15_000);
        const r = await fetch(`${base}/ping`, { method: 'GET', cache: 'no-store', signal: ctrl.signal });
        clearTimeout(t);
        if (r.ok) return true;
      } catch {
        // network/abort/timeout — keep polling
      }
      await new Promise((res) => setTimeout(res, stepMs));
    }
    return false;
  })();

  return _readyPromise;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hasatlink_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hasatlink_token');
      localStorage.removeItem('hasatlink_user');
    }
    return Promise.reject(error);
  }
);

// Simple in-memory GET cache with 5-minute TTL
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export const cachedGet = async <T = any>(url: string, params?: Record<string, string>): Promise<T> => {
  const key = url + (params ? '?' + new URLSearchParams(params).toString() : '');
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data as T;
  }
  const { data } = await api.get<T>(url, { params });
  cache.set(key, { data, ts: Date.now() });
  return data;
};

export const clearCache = (urlPrefix?: string) => {
  if (!urlPrefix) { cache.clear(); return; }
  for (const key of cache.keys()) {
    if (key.startsWith(urlPrefix)) cache.delete(key);
  }
};

/** Full backend origin for absolute URLs (og:image, story share etc.) */
export const API_ORIGIN = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://hasatlink-api.onrender.com' : 'http://localhost:5000');

export default api;
