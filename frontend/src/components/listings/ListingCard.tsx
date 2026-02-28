import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Eye, Clock, Leaf, Truck, Users, Wrench, Droplets, Zap, Shield, Clock3 } from 'lucide-react';
import type { Listing } from '../../types';
import { formatPrice, timeAgo } from '../../utils/formatters';
import Badge from '../ui/Badge';
import { STATUS_LABELS, LISTING_MODE_LABELS, LISTING_MODE_COLORS } from '../../utils/constants';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const statusInfo = STATUS_LABELS[listing.status] || STATUS_LABELS.active;

  const getCategoryIcon = () => {
    switch (listing.type) {
      case 'pazar': return '🌾';
      case 'lojistik': return '🚛';
      case 'isgucu': return '👷';
      case 'ekipman': return '🚜';
      case 'arazi': return '🏞️';
      case 'depolama': return '📦';
      default: return '📋';
    }
  };

  return (
    <Link to={`/ilan/${listing._id}`} className="group">
      <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-[#F5F3EF] overflow-hidden">
          {listing.images?.[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {getCategoryIcon()}
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-1">
            <Badge color={statusInfo.color}>{lang === 'tr' ? statusInfo.tr : statusInfo.en}</Badge>
            {listing.listingMode === 'buy' && (
              <Badge color={LISTING_MODE_COLORS.buy}>
                {LISTING_MODE_LABELS[listing.type]?.buy?.[lang] || 'ALIM'}
              </Badge>
            )}
          </div>
          {/* Category-specific top-right badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {listing.type === 'pazar' && listing.isOrganic && (
              <Badge color="#2D6A4F"><Leaf size={8} className="inline mr-0.5" />ORGANİK</Badge>
            )}
            {listing.type === 'lojistik' && listing.isFrigo && (
              <Badge color="#0077B6">FRİGO</Badge>
            )}
            {listing.type === 'ekipman' && listing.saleType && (
              <Badge color="#A47148">{listing.saleType}</Badge>
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
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-semibold tracking-tight line-clamp-1">{listing.title}</h3>
            <span className={`text-sm font-semibold shrink-0 ${listing.listingMode === 'buy' ? 'text-[#0077B6]' : 'text-[#2D6A4F]'}`}>
              {listing.listingMode === 'buy' && <span className="text-[10px] font-medium mr-0.5">{lang === 'tr' ? 'Bütçe:' : 'Budget:'}</span>}
              {formatPrice(listing.price)}
            </span>
          </div>

          <p className="text-xs text-[#6B6560] uppercase font-medium tracking-wide mb-2">{listing.subCategory}</p>

          {/* Category-specific info line */}
          <div className="flex gap-1.5 flex-wrap mb-2">
            {listing.type === 'pazar' && listing.qualityGrade && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#A47148]/10 text-[#A47148] rounded-full">{listing.qualityGrade}</span>
            )}
            {listing.type === 'pazar' && listing.amount > 0 && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#F5F3EF] text-[#6B6560] rounded-full">{listing.amount} {listing.unit}</span>
            )}
            {listing.type === 'lojistik' && listing.vehicleType && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#0077B6]/10 text-[#0077B6] rounded-full flex items-center gap-0.5">
                <Truck size={8} />{listing.vehicleType}
              </span>
            )}
            {listing.type === 'lojistik' && listing.routeFrom && listing.routeTo && (
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#F5F3EF] text-[#6B6560] rounded-full">{listing.routeFrom} → {listing.routeTo}</span>
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
              <span className="text-[9px] font-medium px-2 py-0.5 bg-[#1A1A1A]/10 text-[#1A1A1A] rounded-full flex items-center gap-0.5">
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

          <div className="flex items-center justify-between text-[10px] text-[#6B6560]">
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
        </div>
      </div>
    </Link>
  );
}
