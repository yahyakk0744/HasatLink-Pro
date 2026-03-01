import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Eye, Clock, Leaf, Truck, Users, Wrench, Droplets, Shield, Clock3, ArrowRight, Heart, Star, Sparkles } from 'lucide-react';
import type { Listing } from '../../types';
import { formatPrice, timeAgo } from '../../utils/formatters';
import Badge from '../ui/Badge';
import { STATUS_LABELS, CATEGORY_LABELS, LISTING_MODE_LABELS, LISTING_MODE_COLORS } from '../../utils/constants';

interface ListingCardProps {
  listing: Listing;
}

function isNew(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 3 * 24 * 60 * 60 * 1000;
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  pazar: '#2D6A4F',
  lojistik: '#0077B6',
  isgucu: '#A47148',
  ekipman: '#6B4E3D',
  arazi: '#52796F',
  depolama: '#5C677D',
};

export default function ListingCard({ listing }: ListingCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const statusInfo = STATUS_LABELS[listing.status] || STATUS_LABELS.active;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [liked, setLiked] = useState(false);

  const catLabel = CATEGORY_LABELS[listing.type];
  const catColor = CATEGORY_BADGE_COLORS[listing.type] || '#2D6A4F';

  return (
    <Link to={`/ilan/${listing._id}`} className="group">
      <div className="bg-[var(--bg-surface)] rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-[var(--bg-input)] overflow-hidden">
          {listing.images?.[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${imgLoaded ? '' : 'img-lazy'}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {catLabel?.icon}
            </div>
          )}
          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Hover arrow */}
          <div className="absolute bottom-3 right-3 w-8 h-8 bg-[var(--glass-surface)] backdrop-blur rounded-full flex items-center justify-center opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <ArrowRight size={14} className="text-[#2D6A4F]" />
          </div>

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex gap-1">
            {/* Category badge */}
            <Badge color={catColor}>{catLabel?.[lang] || listing.type}</Badge>
            {listing.listingMode === 'buy' && (
              <Badge color={LISTING_MODE_COLORS.buy}>
                {LISTING_MODE_LABELS[listing.type]?.buy?.[lang] || 'ALIM'}
              </Badge>
            )}
            {listing.status !== 'active' && (
              <Badge color={statusInfo.color}>{lang === 'tr' ? statusInfo.tr : statusInfo.en}</Badge>
            )}
          </div>

          {/* Top-right: YENİ badge + heart */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {isNew(listing.createdAt) && (
              <Badge color="#E76F00" className="!bg-[#E76F00] !text-white">
                <Sparkles size={8} className="mr-0.5" />{lang === 'tr' ? 'YENİ' : 'NEW'}
              </Badge>
            )}
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setLiked(!liked); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                liked ? 'bg-red-500 text-white' : 'bg-black/30 backdrop-blur text-white hover:bg-red-500'
              }`}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
            </button>
            {/* Category-specific badges */}
            {listing.type === 'pazar' && listing.isOrganic && (
              <Badge color="#2D6A4F"><Leaf size={8} className="inline mr-0.5" />ORGANİK</Badge>
            )}
            {listing.type === 'lojistik' && listing.isFrigo && (
              <Badge color="#0077B6">FRİGO</Badge>
            )}
            {listing.type === 'arazi' && listing.waterAvailable && (
              <Badge color="#0077B6"><Droplets size={8} className="inline mr-0.5" />SU</Badge>
            )}
            {listing.type === 'depolama' && listing.hasSecurity && (
              <Badge color="#2D6A4F"><Shield size={8} className="inline mr-0.5" />GÜVENLİK</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-sm font-semibold tracking-tight line-clamp-1 mb-1">{listing.title}</h3>

          {/* Price — large and bold */}
          <p className={`text-lg font-bold tracking-tight mb-2 ${listing.listingMode === 'buy' ? 'text-[#0077B6]' : 'text-[#2D6A4F]'}`}>
            {listing.listingMode === 'buy' && <span className="text-[10px] font-medium mr-1">{lang === 'tr' ? 'Bütçe:' : 'Budget:'}</span>}
            {formatPrice(listing.price)}
          </p>

          {/* Category-specific info line */}
          <div className="flex gap-1.5 flex-wrap mb-2">
            {listing.type === 'pazar' && listing.qualityGrade && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#A47148]/10 text-[#A47148] rounded-full">{listing.qualityGrade}</span>
            )}
            {listing.type === 'pazar' && listing.amount > 0 && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[var(--bg-input)] text-[var(--text-secondary)] rounded-full">{listing.amount} {listing.unit}</span>
            )}
            {listing.type === 'lojistik' && listing.vehicleType && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#0077B6]/10 text-[#0077B6] rounded-full flex items-center gap-0.5">
                <Truck size={8} />{listing.vehicleType}
              </span>
            )}
            {listing.type === 'lojistik' && listing.routeFrom && listing.routeTo && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[var(--bg-input)] text-[var(--text-secondary)] rounded-full">{listing.routeFrom} → {listing.routeTo}</span>
            )}
            {listing.type === 'isgucu' && listing.workerCount > 1 && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#A47148]/10 text-[#A47148] rounded-full flex items-center gap-0.5">
                <Users size={8} />{listing.workerCount} {t('listing.person')}
              </span>
            )}
            {listing.type === 'isgucu' && listing.dailyWage > 0 && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-full">{formatPrice(listing.dailyWage)}/{t('listing.daily')}</span>
            )}
            {listing.type === 'ekipman' && listing.brand && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[var(--bg-invert)]/10 text-[var(--text-primary)] rounded-full flex items-center gap-0.5">
                <Wrench size={8} />{listing.brand}
              </span>
            )}
            {listing.type === 'ekipman' && listing.condition && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#0077B6]/10 text-[#0077B6] rounded-full">{listing.condition}</span>
            )}
            {listing.type === 'arazi' && listing.landSize > 0 && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-full">{listing.landSize} {listing.landUnit}</span>
            )}
            {listing.type === 'arazi' && listing.deedStatus && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#A47148]/10 text-[#A47148] rounded-full">{listing.deedStatus}</span>
            )}
            {listing.type === 'depolama' && listing.storageCapacity > 0 && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#0077B6]/10 text-[#0077B6] rounded-full">{listing.storageCapacity} {listing.storageCapacityUnit}</span>
            )}
            {listing.type === 'depolama' && listing.has24Access && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#A47148]/10 text-[#A47148] rounded-full flex items-center gap-0.5">
                <Clock3 size={8} />7/24
              </span>
            )}
          </div>

          {/* Location + date row */}
          <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] mb-2">
            <span className="flex items-center gap-1">
              <MapPin size={10} />
              {listing.location}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye size={10} />
                {listing.stats?.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {timeAgo(listing.createdAt)}
              </span>
            </div>
          </div>

          {/* Seller info */}
          {listing.sellerName && (
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-default)]">
              {listing.sellerImage ? (
                <img src={listing.sellerImage} alt={listing.sellerName} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center text-[10px] font-semibold text-[#2D6A4F]">
                  {listing.sellerName[0]}
                </div>
              )}
              <span className="text-xs font-medium text-[var(--text-primary)] truncate flex-1">{listing.sellerName}</span>
              {listing.sellerRating > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#A47148]">
                  <Star size={10} fill="#A47148" />
                  {listing.sellerRating.toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
