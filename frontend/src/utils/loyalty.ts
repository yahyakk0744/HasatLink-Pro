export interface LoyaltyBadge {
  rank: 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  label: { tr: string; en: string };
  icon: string;
  color: string;
  bgColor: string;
  minPoints: number;
  nextRank: number | null;
}

const RANKS: LoyaltyBadge[] = [
  {
    rank: 'diamond',
    label: { tr: 'Elmas Lider', en: 'Diamond Leader' },
    icon: '\uD83D\uDC8E',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    minPoints: 10001,
    nextRank: null,
  },
  {
    rank: 'platinum',
    label: { tr: 'Platin Usta', en: 'Platinum Master' },
    icon: '\u2B50',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    minPoints: 5001,
    nextRank: 10001,
  },
  {
    rank: 'gold',
    label: { tr: 'Altin Hasat Ortagi', en: 'Gold Harvest Partner' },
    icon: '\uD83E\uDD47',
    color: '#B8860B',
    bgColor: 'rgba(184, 134, 11, 0.1)',
    minPoints: 2001,
    nextRank: 5001,
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
    minPoints: 100,
    nextRank: 501,
  },
  {
    rank: 'starter',
    label: { tr: 'Yeni Ciftci', en: 'New Farmer' },
    icon: '\uD83C\uDF31',
    color: '#2D6A4F',
    bgColor: 'rgba(45, 106, 79, 0.1)',
    minPoints: 0,
    nextRank: 100,
  },
];

export interface Achievement {
  id: string;
  label: { tr: string; en: string };
  icon: string;
  description: { tr: string; en: string };
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_listing', label: { tr: 'İlk İlan', en: 'First Listing' }, icon: '\uD83C\uDF89', description: { tr: 'İlk ilanını yayınladın', en: 'Published your first listing' } },
  { id: 'first_sale', label: { tr: 'İlk Satış', en: 'First Sale' }, icon: '\uD83D\uDCB0', description: { tr: 'İlk satışını gerçekleştirdin', en: 'Made your first sale' } },
  { id: 'five_star', label: { tr: '5 Yıldız', en: '5 Stars' }, icon: '\u2B50', description: { tr: '5 yıldızlı değerlendirme aldın', en: 'Received a 5-star rating' } },
  { id: 'organic_seller', label: { tr: 'Organik Satıcı', en: 'Organic Seller' }, icon: '\uD83C\uDF3F', description: { tr: '5+ organik ürün yayınladın', en: '5+ organic products listed' } },
  { id: 'fast_reply', label: { tr: 'Hızlı Yanıt', en: 'Fast Responder' }, icon: '\u26A1', description: { tr: 'Mesajlara 1 saat içinde cevap verdin', en: 'Replied within 1 hour' } },
  { id: 'trusted_seller', label: { tr: 'Güvenilir Satıcı', en: 'Trusted Seller' }, icon: '\uD83D\uDEE1\uFE0F', description: { tr: '10+ başarılı işlem tamamladın', en: '10+ successful transactions' } },
  { id: 'top_lister', label: { tr: 'İlan Kralı', en: 'Top Lister' }, icon: '\uD83D\uDC51', description: { tr: '50+ ilan yayınladın', en: '50+ listings published' } },
  { id: 'community', label: { tr: 'Topluluk Dostu', en: 'Community Friend' }, icon: '\uD83E\uDD1D', description: { tr: 'Forum ve yorumlarda aktifsin', en: 'Active in forums and comments' } },
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
