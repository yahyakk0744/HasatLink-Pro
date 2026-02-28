import { useState, useCallback } from 'react';
import api from '../config/api';
import type { MarketPrice } from '../types';

export const useMarketPrices = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<MarketPrice[]>('/market-prices');
      setPrices(data);
    } catch {} finally { setLoading(false); }
  }, []);

  return { prices, loading, fetchPrices };
};
