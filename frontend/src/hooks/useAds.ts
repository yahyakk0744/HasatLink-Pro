import { useState, useCallback } from 'react';
import api from '../config/api';
import type { Ad } from '../types';

export const useAds = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActiveAds = useCallback(async (slot?: string) => {
    setLoading(true);
    try {
      const params = slot ? `?slot=${slot}` : '';
      const { data } = await api.get<Ad[]>(`/ads/active${params}`);
      setAds(data);
      return data;
    } catch { return []; } finally { setLoading(false); }
  }, []);

  const trackImpression = useCallback(async (id: string) => {
    try { await api.post(`/ads/active/${id}/impression`); } catch {}
  }, []);

  const trackClick = useCallback(async (id: string) => {
    try { await api.post(`/ads/active/${id}/click`); } catch {}
  }, []);

  return { ads, loading, fetchActiveAds, trackImpression, trackClick };
};
