import { useState, useCallback } from 'react';
import api from '../config/api';
import type { HalPrice, WeeklyPriceDay } from '../types';

export const useHalPrices = () => {
  const [allPrices, setAllPrices] = useState<HalPrice[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyPriceDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<HalPrice[]>('/market-prices/all');
      setAllPrices(data);
    } catch {
      setError('Fiyat verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeekly = useCallback(async (product?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = product ? { product } : {};
      const { data } = await api.get<WeeklyPriceDay[]>('/market-prices/weekly', { params });
      setWeeklyData(data);
    } catch {
      setError('Haftalık veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    allPrices,
    weeklyData,
    loading,
    error,
    fetchAllPrices,
    fetchWeekly,
  };
};
