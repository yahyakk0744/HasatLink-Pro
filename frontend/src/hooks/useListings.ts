import { useState, useCallback } from 'react';
import api from '../config/api';
import type { Listing, ListingsResponse } from '../types';

export const useListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ListingsResponse>('/listings', { params });
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
      return data;
    } catch {
      return null;
    }
  }, []);

  const updateListing = useCallback(async (id: string, updates: Partial<Listing>): Promise<Listing | null> => {
    try {
      const { data } = await api.put<Listing>(`/listings/${id}`, updates);
      return data;
    } catch {
      return null;
    }
  }, []);

  const deleteListing = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/listings/${id}`);
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
