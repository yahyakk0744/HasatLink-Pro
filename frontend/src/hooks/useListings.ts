import { useState, useCallback } from 'react';
import api from '../config/api';
import type { Listing, ListingsResponse } from '../types';

// Module-level SWR cache: instant navigation on repeat visits
const LISTINGS_CACHE_TTL = 60 * 1000; // 60 seconds
const listingsCache = new Map<string, { data: ListingsResponse; ts: number }>();

const cacheKey = (params?: Record<string, string>) =>
  params ? JSON.stringify(Object.keys(params).sort().reduce<Record<string, string>>((acc, k) => { acc[k] = params[k]; return acc; }, {})) : '__default__';

export const useListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async (params?: Record<string, string>) => {
    const key = cacheKey(params);
    const cached = listingsCache.get(key);
    const now = Date.now();

    // Instant stale-while-revalidate: show cached data immediately
    if (cached) {
      setListings(cached.data.listings);
      setTotal(cached.data.total);
      // If fresh, skip refetch entirely
      if (now - cached.ts < LISTINGS_CACHE_TTL) {
        setLoading(false);
        setError(null);
        return;
      }
    } else {
      setLoading(true);
    }

    setError(null);
    try {
      const { data } = await api.get<ListingsResponse>('/listings', { params });
      listingsCache.set(key, { data, ts: Date.now() });
      setListings(data.listings);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
