import { useState, useCallback } from 'react';
import api from '../config/api';
import type { PriceAlert } from '../types';

export const usePriceAlerts = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/price-alerts');
      setAlerts(data);
    } catch {} finally { setLoading(false); }
  }, []);

  const createAlert = useCallback(async (data: { category: string; subCategory?: string; targetPrice: number; keyword?: string; condition?: 'below' | 'above' }) => {
    const { data: alert } = await api.post('/price-alerts', data);
    setAlerts(prev => [alert, ...prev]);
    return alert;
  }, []);

  const deleteAlert = useCallback(async (id: string) => {
    await api.delete(`/price-alerts/${id}`);
    setAlerts(prev => prev.filter(a => a._id !== id));
  }, []);

  const toggleAlert = useCallback(async (id: string) => {
    const { data: alert } = await api.put(`/price-alerts/${id}/toggle`);
    setAlerts(prev => prev.map(a => a._id === id ? alert : a));
  }, []);

  return { alerts, loading, fetchAlerts, createAlert, deleteAlert, toggleAlert };
};
