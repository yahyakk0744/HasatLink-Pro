import { useState, useCallback } from 'react';
import api from '../config/api';
import type { Rating } from '../types';

export const useRatings = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRatings = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data } = await api.get<Rating[]>(`/ratings/user/${userId}`);
      setRatings(data);
    } catch {} finally { setLoading(false); }
  }, []);

  const createRating = useCallback(async (rating: Partial<Rating>): Promise<{ success: boolean; updated?: boolean }> => {
    try {
      const { data } = await api.post('/ratings', rating);
      return { success: true, updated: data.updated || false };
    } catch { return { success: false }; }
  }, []);

  return { ratings, loading, fetchRatings, createRating };
};
