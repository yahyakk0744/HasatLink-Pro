import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

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

export default api;
