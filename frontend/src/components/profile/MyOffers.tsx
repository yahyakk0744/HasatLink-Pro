import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HandCoins, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../../config/api';
import type { Offer } from '../../types';
import { timeAgo } from '../../utils/formatters';

const STATUS_CONFIG = {
  pending: {
    label: { tr: 'Değerlendiriliyor', en: 'Pending' },
    icon: Clock,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200/50',
  },
  accepted: {
    label: { tr: 'Kabul Edildi', en: 'Accepted' },
    icon: CheckCircle,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200/50',
  },
  rejected: {
    label: { tr: 'Reddedildi', en: 'Rejected' },
    icon: XCircle,
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200/50',
  },
};

export default function MyOffers() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Offer[]>('/offers/my')
      .then(({ data }) => setOffers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-20 skeleton rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (offers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <HandCoins size={18} className="text-[#D97706]" />
        <h3 className="text-lg font-semibold tracking-tight">
          {lang === 'tr' ? 'Tekliflerim' : 'My Offers'}
        </h3>
        <span className="text-xs text-[var(--text-secondary)]">({offers.length})</span>
      </div>

      <div className="space-y-2">
        {offers.map(offer => {
          const config = STATUS_CONFIG[offer.status];
          const StatusIcon = config.icon;

          return (
            <Link
              key={offer._id}
              to={`/ilan/${offer.listingId}`}
              className={`flex items-center gap-3 p-4 rounded-2xl border ${config.border} bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors`}
            >
              <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                <StatusIcon size={18} className={config.text} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                  {offer.listingTitle}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[12px] font-bold text-[var(--accent-green)]">
                    {offer.offerPrice.toLocaleString()} TL
                  </span>
                  {offer.message && (
                    <span className="text-[11px] text-[var(--text-secondary)] truncate">
                      — {offer.message}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                  {timeAgo(offer.createdAt)}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${config.bg} ${config.text} shrink-0`}>
                {config.label[lang]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
