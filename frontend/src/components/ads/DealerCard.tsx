import { MapPin, MessageCircle, Navigation, Star, ExternalLink } from 'lucide-react';
import api from '../../config/api';
import type { NearbyDealerItem } from '../../types';

interface DealerCardProps {
  item: NearbyDealerItem;
  className?: string;
}

export default function DealerCard({ item, className = '' }: DealerCardProps) {
  const { dealer, distance } = item;
  const isPremium = dealer.is_premium_partner;

  const handleWhatsApp = () => {
    api.post(`/dealers/${dealer._id}/contact`).catch(() => {});
    const phone = dealer.whatsapp || dealer.phone;
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleaned}`, '_blank', 'noopener,noreferrer');
  };

  const handleMaps = () => {
    api.post(`/dealers/${dealer._id}/contact`).catch(() => {});
    if (dealer.google_maps_url) {
      window.open(dealer.google_maps_url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${dealer.coordinates.lat},${dealer.coordinates.lng}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  const handleClick = () => {
    api.post(`/dealers/${dealer._id}/click`).catch(() => {});
    if (dealer.website) {
      window.open(dealer.website, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-[var(--glass-surface)] backdrop-blur-md
        border border-[var(--glass-border)]
        shadow-sm hover:shadow-md
        transition-all duration-300 ease-out
        hover:-translate-y-0.5
        ${isPremium ? 'ring-2 ring-amber-400/50' : ''}
        ${className}
      `}
    >
      {/* Premium badge */}
      {isPremium && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[11px] font-semibold shadow-sm">
          <Star size={12} fill="currentColor" />
          Premium
        </div>
      )}

      {/* Cover image */}
      {dealer.coverImage && (
        <div className="h-32 overflow-hidden">
          <img
            src={dealer.coverImage}
            alt=""
            className="w-full h-full object-cover"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3.5 mb-3.5">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--bg-input)] shrink-0 shadow-sm">
            {dealer.profileImage ? (
              <img src={dealer.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-bold">
                {dealer.companyName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight truncate">
              {dealer.companyName}
            </h3>
            <p className="text-[13px] text-[var(--text-secondary)] truncate">{dealer.name}</p>
          </div>
        </div>

        {/* Tags */}
        {dealer.specialization_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {dealer.specialization_tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-[var(--accent-green-bg)] text-[var(--accent-green)] text-[11px] font-medium"
              >
                {tag}
              </span>
            ))}
            {dealer.specialization_tags.length > 4 && (
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-input)] text-[var(--text-secondary)] text-[11px] font-medium">
                +{dealer.specialization_tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Location & distance */}
        <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] mb-4">
          <MapPin size={14} className="text-[var(--text-tertiary)] shrink-0" />
          <span className="truncate">{dealer.address}</span>
          <span className="shrink-0 ml-auto text-emerald-600 font-medium">{distance} km</span>
        </div>

        {/* Quick action buttons — Apple style */}
        <div className="flex gap-2">
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-[13px] font-semibold hover:bg-emerald-600 active:scale-[0.98] transition-all"
          >
            <MessageCircle size={16} />
            WhatsApp
          </button>
          <button
            onClick={handleMaps}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold hover:bg-blue-600 active:scale-[0.98] transition-all"
          >
            <Navigation size={16} />
            Yol Tarifi
          </button>
          {dealer.website && (
            <button
              onClick={handleClick}
              className="w-11 flex items-center justify-center py-2.5 rounded-xl bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] active:scale-[0.98] transition-all"
            >
              <ExternalLink size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
