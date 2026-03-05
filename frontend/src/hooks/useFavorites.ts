import { useState, useCallback, useEffect } from 'react';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get<{ favorites: string[] }>('/favorites');
      setFavorites(data.favorites);
    } catch {}
  }, [user]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (listingId: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      const { data } = await api.post<{ favorites: string[]; isFavorited: boolean }>('/favorites/toggle', { listingId });
      setFavorites(data.favorites);
      return data.isFavorited;
    } catch { return false; } finally { setLoading(false); }
  }, [user]);

  const isFavorited = useCallback((listingId: string) => favorites.includes(listingId), [favorites]);

  return { favorites, loading, toggleFavorite, isFavorited, fetchFavorites };
};
