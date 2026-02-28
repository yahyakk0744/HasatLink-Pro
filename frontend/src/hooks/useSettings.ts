import { useState, useCallback } from 'react';
import api from '../config/api';
import type { SiteSettings } from '../types';

export const useSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<SiteSettings>('/settings');
      setSettings(data);
      return data;
    } catch { return null; } finally { setLoading(false); }
  }, []);

  return { settings, loading, fetchSettings };
};
