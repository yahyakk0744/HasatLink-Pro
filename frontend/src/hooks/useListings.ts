import { useState, useCallback, useRef } from 'react';
import api from '../config/api';
import type { Listing, ListingsResponse } from '../types';

// Module-level SWR cache: instant navigation on repeat visits
const LISTINGS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const listingsCache = new Map<string, { data: ListingsResponse; ts: number }>();

// localStorage persistence — survives page refresh
const LS_PREFIX = 'hl_lc_';
const LS_TTL = 10 * 60 * 1000; // 10 min stale data is fine for instant display

function saveToLS(key: string, data: ListingsResponse) {
  try {
    // Only cache first 12 items to keep localStorage small
    const slim = { ...data, listings: data.listings.slice(0, 12) };
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ d: slim, t: Date.now() }));
  } catch { /* quota exceeded — ignore */ }
}

function loadFromLS(key: string): ListingsResponse | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const { d, t } = JSON.parse(raw);
    if (Date.now() - t > LS_TTL) { localStorage.removeItem(LS_PREFIX + key); return null; }
    return d;
  } catch { return null; }
}

const cacheKey = (params?: Record<string, string>) =>
  params ? JSON.stringify(Object.keys(params).sort().reduce<Record<string, string>>((acc, k) => { acc[k] = params[k]; return acc; }, {})) : '__default__';

export const useListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchListings = useCallback(async (params?: Record<string, string>) => {
    // Abort previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const key = cacheKey(params);
    const cached = listingsCache.get(key);
    const now = Date.now();

    // 1) Memory cache hit — instant
    if (cached) {
      setListings(cached.data.listings);
      setTotal(cached.data.total);
      if (now - cached.ts < LISTINGS_CACHE_TTL) {
        setLoading(false);
        setError(null);
        return;
      }
    } else {
      // 2) localStorage cache hit — instant on page refresh
      const lsCached = loadFromLS(key);
      if (lsCached) {
        setListings(lsCached.listings);
        setTotal(lsCached.total);
        // Show stale data, keep loading=true for background revalidation indicator
      } else {
        setLoading(true);
      }
    }

    setError(null);
    try {
      const { data } = await api.get<ListingsResponse>('/listings', {
        params,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      listingsCache.set(key, { data, ts: Date.now() });
      saveToLS(key, data);
      setListings(data.listings);
      setTotal(data.total);
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      setError(err.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const fetchListing = useCallback(async (id: string): Promise<Listing | null> => {
    try {
      const { data } = await api.get<Listing>(`/listings/${id}`);
      return data;
    } catch {
      return null;
    }
  }, []);

  const createListing = useCallback(async (listing: Partial<Listing>): Promise<Listing | null> => {
    try {
      const { data } = await api.post<Listing>('/listings', listing);
      listingsCache.clear();
      return data;
    } catch {
      return null;
    }
  }, []);

  const updateListing = useCallback(async (id: string, updates: Partial<Listing>): Promise<Listing | null> => {
    try {
      const { data } = await api.put<Listing>(`/listings/${id}`, updates);
      listingsCache.clear();
      return data;
    } catch {
      return null;
    }
  }, []);

  const deleteListing = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/listings/${id}`);
      listingsCache.clear();
      return true;
    } catch {
      return false;
    }
  }, []);

  const trackWaClick = useCallback(async (id: string) => {
    try { await api.post(`/listings/${id}/wa-click`); } catch {}
  }, []);

  const trackShare = useCallback(async (id: string) => {
    try { await api.post(`/listings/${id}/share`); } catch {}
  }, []);

  return { listings, total, loading, error, fetchListings, fetchListing, createListing, updateListing, deleteListing, trackWaClick, trackShare };
};
