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

export interface SatelliteScene {
  dt: number;
  date: string;
  cloudCoverage: number;
  platform: string;
}

export interface SatelliteAnalysis {
  center: { lat: number; lng: number };
  area: number;
  latestNDVI: NDVIDataPoint | null;
  healthStatus: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical' | 'unknown';
  healthColor: string;
  ndviHistory: NDVIDataPoint[];
  images: SatelliteScene[];
  renderedImages: {
    trueColor?: string;
    ndvi?: string;
    falseColor?: string;
  };
  clearImageCount: number;
  totalImageCount: number;
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

  /** Run satellite NDVI analysis — uses custom polygon if provided, otherwise radius fallback */
  const analyze = useCallback(async (lat: number, lng: number, radiusKm = 0.5, polygon?: number[][]) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const body: Record<string, unknown> = { lat, lng, radiusKm };
      if (polygon && polygon.length >= 3) {
        body.polygon = polygon;
      }
      const { data } = await api.post<SatelliteAnalysis>('/satellite/analyze', body);
      setAnalysis(data);
      return data;
    } catch (err: any) {
      const raw = err.response?.data?.message || err.response?.data || 'Uydu analizi yapilamadi';
      const msg = typeof raw === 'object' ? (raw.message || JSON.stringify(raw)) : String(raw);
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
