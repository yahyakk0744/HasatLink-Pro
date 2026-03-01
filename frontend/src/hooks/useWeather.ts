import { useState, useCallback } from 'react';
import api from '../config/api';
import type { WeatherData } from '../types';

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = useCallback(async (cityOrLat?: string | number, lng?: number) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (typeof cityOrLat === 'number' && lng !== undefined) {
        params.lat = String(cityOrLat);
        params.lon = String(lng);
      } else if (cityOrLat) {
        params.city = cityOrLat as string;
      } else {
        setLoading(false);
        return;
      }
      const { data } = await api.get<WeatherData>('/weather', { params });
      setWeather(data);
    } catch {} finally { setLoading(false); }
  }, []);

  return { weather, loading, fetchWeather };
};
