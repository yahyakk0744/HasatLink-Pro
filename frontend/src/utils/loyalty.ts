export interface LoyaltyBadge {
  rank: 'bronze' | 'silver' | 'gold';
  label: { tr: string; en: string };
  icon: string;
  color: string;
  bgColor: string;
  minPoints: number;
  nextRank: number | null;
}

const RANKS: LoyaltyBadge[] = [
  {
    rank: 'gold',
    label: { tr: 'Altin Hasat Ortagi', en: 'Gold Harvest Partner' },
    icon: '\uD83E\uDD47',
    color: '#B8860B',
    bgColor: 'rgba(184, 134, 11, 0.1)',
    minPoints: 2001,
    nextRank: null,
  },
  {
    rank: 'silver',
    label: { tr: 'Gumus Tuccar', en: 'Silver Merchant' },
    icon: '\uD83E\uDD48',
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    minPoints: 501,
    nextRank: 2001,
  },
  {
    rank: 'bronze',
    label: { tr: 'Bronz Uretici', en: 'Bronze Producer' },
    icon: '\uD83E\uDD49',
    color: '#A47148',
    bgColor: 'rgba(164, 113, 72, 0.1)',
    minPoints: 0,
    nextRank: 501,
  },
];

export function getLoyaltyBadge(points: number): LoyaltyBadge {
  for (const rank of RANKS) {
    if (points >= rank.minPoints) return rank;
  }
  return RANKS[RANKS.length - 1];
}

export function getProgressToNext(points: number): { current: number; next: number; percent: number } | null {
  const badge = getLoyaltyBadge(points);
  if (!badge.nextRank) return null;
  const current = points - badge.minPoints;
  const total = badge.nextRank - badge.minPoints;
  return { current: points, next: badge.nextRank, percent: Math.min(100, Math.round((current / total) * 100)) };
}
