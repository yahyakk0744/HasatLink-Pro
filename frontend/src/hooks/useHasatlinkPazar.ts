import { useState, useCallback } from 'react';
import api from '../config/api';
import type { HasatlinkPazarItem, WeeklyPriceDay, HasatlinkHourlyData } from '../types';

export const useHasatlinkPazar = () => {
  const [prices, setPrices] = useState<HasatlinkPazarItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyPriceDay[]>([]);
  const [hourlyData, setHourlyData] = useState<HasatlinkHourlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<HasatlinkPazarItem[]>('/hasatlink-pazar');
      setPrices(data);
    } catch {
      setError('HasatLink pazar verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeekly = useCallback(async (product?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = product ? { product } : {};
      const { data } = await api.get<WeeklyPriceDay[]>('/hasatlink-pazar/weekly', { params });
      setWeeklyData(data);
    } catch {
      setError('Haftalık veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHourly = useCallback(async (product?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = product ? { product } : {};
      const { data } = await api.get<HasatlinkHourlyData[]>('/hasatlink-pazar/hourly', { params });
      setHourlyData(data);
    } catch {
      setError('Saatlik veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    prices,
    weeklyData,
    hourlyData,
    loading,
    error,
    fetchPrices,
    fetchWeekly,
    fetchHourly,
  };
};
