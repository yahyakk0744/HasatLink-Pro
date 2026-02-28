import { useState, useCallback } from 'react';
import api from '../config/api';
import type { User, UserStats } from '../types';

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data } = await api.get<User>(`/users/${userId}`);
      setUser(data);
    } catch {} finally { setLoading(false); }
  }, []);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    try {
      const { data } = await api.put<User>(`/users/${userId}`, updates);
      setUser(data);
      return data;
    } catch { return null; }
  }, []);

  const fetchStats = useCallback(async (userId: string) => {
    try {
      const { data } = await api.get<UserStats>(`/users/${userId}/stats`);
      setStats(data);
    } catch {}
  }, []);

  return { user, stats, loading, fetchUser, updateUser, fetchStats };
};
