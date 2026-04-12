import { useEffect, useState } from 'react';
import api from '../config/api';

export type FeatureKey =
  | 'featuredListing'
  | 'bannerAds'
  | 'dealerDirectory'
  | 'sponsoredContent'
  | 'premiumMembership'
  | 'jobListings'
  | 'reportsSale'
  | 'commission'
  | 'qnaForum'
  | 'weatherAlerts'
  | 'harvestCalendar'
  | 'successStories'
  | 'referralProgram'
  | 'voiceMessages'
  | 'videoCall'
  | 'broadcastMessages'
  | 'mapView'
  | 'voiceSearch'
  | 'logisticsDirectory'
  | 'weeklyNewsletter'
  | 'telegramBot'
  | 'priceForecast';

export type FeatureMap = Record<FeatureKey, boolean>;

// In-memory cache — features shouldn't flip often, so cache for 5 min
let cachedFeatures: FeatureMap | null = null;
let cachedAt = 0;
const TTL = 5 * 60 * 1000;

export function useFeatures() {
  const [features, setFeatures] = useState<FeatureMap | null>(cachedFeatures);
  const [loading, setLoading] = useState(!cachedFeatures);

  useEffect(() => {
    const now = Date.now();
    if (cachedFeatures && now - cachedAt < TTL) {
      setFeatures(cachedFeatures);
      setLoading(false);
      return;
    }

    let cancelled = false;
    api.get('/settings')
      .then(({ data }) => {
        if (cancelled) return;
        const map = (data?.features || {}) as FeatureMap;
        cachedFeatures = map;
        cachedAt = Date.now();
        setFeatures(map);
      })
      .catch(() => {
        if (!cancelled) setFeatures({} as FeatureMap);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isEnabled = (key: FeatureKey): boolean => !!features?.[key];

  return { features, loading, isEnabled };
}

// Cache invalidation — call this after admin toggles
export function invalidateFeatureCache() {
  cachedFeatures = null;
  cachedAt = 0;
}
