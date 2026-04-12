import { useState, useEffect } from 'react';
import { BarChart3, Eye, Phone, Share2, TrendingUp, Heart, MessageSquare } from 'lucide-react';
import api from '../../config/api';

interface StatsData {
  views: number;
  whatsappClicks: number;
  shares: number;
  favorites: number;
  messages: number;
  viewsToday: number;
  viewsTrend: number;
}

interface ListingStatsProps {
  listingId: string;
}

export default function ListingStats({ listingId }: ListingStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    api.get<StatsData>(`/listings/${listingId}/stats`)
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, [listingId]);

  if (!stats) return null;

  const items = [
    { icon: Eye, label: 'Görüntülenme', value: stats.views, color: '#0077B6' },
    { icon: TrendingUp, label: 'Bugün', value: stats.viewsToday, color: '#2D6A4F', suffix: stats.viewsTrend > 0 ? `+${stats.viewsTrend}%` : undefined },
    { icon: Phone, label: 'WhatsApp', value: stats.whatsappClicks, color: '#25D366' },
    { icon: Share2, label: 'Paylaşım', value: stats.shares, color: '#7C3AED' },
    { icon: Heart, label: 'Favori', value: stats.favorites, color: '#EF4444' },
    { icon: MessageSquare, label: 'Mesaj', value: stats.messages, color: '#E76F00' },
  ];

  return (
    <div className="surface-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#0077B6]/10 flex items-center justify-center">
          <BarChart3 size={16} strokeWidth={1.5} className="text-[#0077B6]" />
        </div>
        <h3 className="text-sm font-semibold tracking-tight">İlan İstatistikleri</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ icon: Icon, label, value, color, suffix }) => (
          <div key={label} className="text-center p-2.5 rounded-xl bg-[var(--bg-input)]">
            <Icon size={14} className="mx-auto mb-1" style={{ color }} />
            <p className="text-sm font-bold">{value}</p>
            <p className="text-[9px] text-[var(--text-secondary)]">{label}</p>
            {suffix && (
              <span className="text-[8px] font-bold text-[#2D6A4F]">{suffix}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
