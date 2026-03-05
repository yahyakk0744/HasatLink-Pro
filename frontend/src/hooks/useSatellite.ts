import { useState, useCallback } from 'react';
import api from '../config/api';

export interface NDVIDataPoint {
  dt: number;
  date: string;
  min: number;
  max: number;
  mean: number;
  median: number;
}

export interface SatelliteImage {
  dt: number;
  date: string;
  cloudCoverage: number;
  trueColor: string;
  ndvi: string;
}

export interface SatelliteAnalysis {
  polygonId: string;
  center: { lat: number; lng: number };
  area: number;
  latestNDVI: NDVIDataPoint | null;
  healthStatus: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical' | 'unknown';
  healthColor: string;
  ndviHistory: NDVIDataPoint[];
  images: SatelliteImage[];
}

const HEALTH_LABELS: Record<string, { tr: string; en: string }> = {
  excellent: { tr: 'Mukemmel', en: 'Excellent' },
  good: { tr: 'Saglikli', en: 'Good' },
  moderate: { tr: 'Orta', en: 'Moderate' },
  poor: { tr: 'Zayif', en: 'Poor' },
  critical: { tr: 'Kritik', en: 'Critical' },
  unknown: { tr: 'Bilinmiyor', en: 'Unknown' },
};

export const getHealthLabel = (status: string, lang: 'tr' | 'en' = 'tr') =>
  HEALTH_LABELS[status]?.[lang] || status;

export const useSatellite = () => {
  const [analysis, setAnalysis] = useState<SatelliteAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (lat: number, lng: number, radiusKm = 0.5) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const { data } = await api.post<SatelliteAnalysis>('/satellite/analyze', { lat, lng, radiusKm });
      setAnalysis(data);
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Uydu analizi yapilamadi';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return { analysis, loading, error, analyze, clear };
};
