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

export interface ParcelInfo {
  parcel: {
    il: string;
    ilce: string;
    mahalle: string;
    ada: string;
    parsel: string;
    alan: number;
    mevkii: string;
    nitelik: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
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
  const [parcelInfo, setParcelInfo] = useState<ParcelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [parcelLoading, setParcelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Query TKGM for parcel boundary at given coordinate */
  const queryParcel = useCallback(async (lat: number, lng: number) => {
    setParcelLoading(true);
    setParcelInfo(null);
    try {
      const { data } = await api.get<ParcelInfo>('/satellite/parcel', { params: { lat, lng } });
      setParcelInfo(data);
      return data;
    } catch {
      // Parcel query failed — not critical, user can still analyze with fallback
      setParcelInfo(null);
      return null;
    } finally {
      setParcelLoading(false);
    }
  }, []);

  /** Run satellite NDVI analysis — uses parcel polygon if available, otherwise radius fallback */
  const analyze = useCallback(async (lat: number, lng: number, radiusKm = 0.5, polygon?: number[][]) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const body: any = { lat, lng, radiusKm };
      if (polygon && polygon.length >= 3) {
        body.polygon = polygon;
      }
      const { data } = await api.post<SatelliteAnalysis>('/satellite/analyze', body);
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
    setParcelInfo(null);
    setError(null);
  }, []);

  return { analysis, parcelInfo, loading, parcelLoading, error, analyze, queryParcel, clear };
};
