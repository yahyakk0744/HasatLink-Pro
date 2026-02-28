import { useTranslation } from 'react-i18next';
import { Eye, MessageCircle, Share2, FileText } from 'lucide-react';
import type { UserStats } from '../../types';

interface AnalyticsCardsProps {
  stats: UserStats;
}

export default function AnalyticsCards({ stats }: AnalyticsCardsProps) {
  const { t } = useTranslation();

  const cards = [
    { label: t('stats.totalViews'), value: stats.totalViews, icon: Eye, color: '#0077B6' },
    { label: t('stats.totalInteractions'), value: stats.totalWhatsapp, icon: MessageCircle, color: '#2D6A4F' },
    { label: t('stats.totalShares'), value: stats.totalShares, icon: Share2, color: '#A47148' },
    { label: t('stats.activeListings'), value: stats.activeListings, icon: FileText, color: '#1A1A1A' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(card => (
        <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <card.icon size={16} style={{ color: card.color }} />
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#6B6560]">{card.label}</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight">{card.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
