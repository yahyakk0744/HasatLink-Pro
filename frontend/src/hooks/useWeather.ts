import { useState, useCallback } from 'react';
import api from '../config/api';
import type { WeatherData } from '../types';

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = useCallback(async (city = 'Ceyhan') => {
    setLoading(true);
    try {
      const { data } = await api.get<WeatherData>('/weather', { params: { city } });
      setWeather(data);
    } catch {} finally { setLoading(false); }
  }, []);

  return { weather, loading, fetchWeather };
};
