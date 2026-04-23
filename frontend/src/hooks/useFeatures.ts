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

// Optimistic defaults — used when /api/settings fails (e.g., Render cold start).
// Apple reviewers on iOS 26 repeatedly rejected the app because cold-start timeouts
// made useFeatures fall back to an empty map, which hid core features (map, forum,
// calendar, etc.) behind a "Yakında" placeholder that looked like a bug.
// These defaults match production settings so the app stays usable even if the
// feature flag fetch fails.
const OPTIMISTIC_DEFAULTS: FeatureMap = {
  featuredListing: false,
  bannerAds: false,
  dealerDirectory: false,
  sponsoredContent: false,
  premiumMembership: false,
  jobListings: false,
  reportsSale: false,
  commission: false,
  qnaForum: true,
  weatherAlerts: true,
  harvestCalendar: true,
  successStories: true,
  referralProgram: false,
  voiceMessages: false,
  videoCall: false,
  broadcastMessages: false,
  mapView: true,
  voiceSearch: false,
  logisticsDirectory: true,
  weeklyNewsletter: true,
  telegramBot: false,
  priceForecast: true,
};

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
    const attempt = async (retriesLeft: number): Promise<void> => {
      try {
        const { data } = await api.get('/settings');
        if (cancelled) return;
        const map = (data?.features || {}) as FeatureMap;
        cachedFeatures = map;
        cachedAt = Date.now();
        setFeatures(map);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        if (retriesLeft > 0) {
          setTimeout(() => attempt(retriesLeft - 1), 2000);
          return;
        }
        // All retries exhausted — fall back to optimistic defaults so the UI
        // never shows misleading "Yakında" placeholders for features that are
        // actually enabled in production.
        setFeatures(OPTIMISTIC_DEFAULTS);
        setLoading(false);
      }
    };
    attempt(2);

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
