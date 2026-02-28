import { useTranslation } from 'react-i18next';
import { MapPin, Eye, Phone, Share2, MessageCircle, MessageSquare, Truck, Leaf, Star, Calendar, Weight, Box, Shield, Users, Clock, Wrench, Pencil, Trash2, Droplets, Zap, FileText, Landmark, Thermometer, Clock3, Ruler } from 'lucide-react';
import type { Listing } from '../../types';
import { formatPrice, formatDate } from '../../utils/formatters';
import ImageGallery from './ImageGallery';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { STATUS_LABELS, LISTING_MODE_LABELS, LISTING_MODE_COLORS } from '../../utils/constants';

interface ListingDetailViewProps {
  listing: Listing;
  onWaClick: () => void;
  onShare: () => void;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMessage?: () => void;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--bg-input)] last:border-0">
      <div className="w-8 h-8 rounded-xl bg-[var(--bg-input)] flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-[10px] font-medium uppercase text-[var(--text-secondary)] tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function ListingDetailView({ listing, onWaClick, onShare, isOwner, onEdit, onDelete, onMessage }: ListingDetailViewProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const statusInfo = STATUS_LABELS[listing.status] || STATUS_LABELS.active;

  const handleWhatsApp = () => {
    onWaClick();
    window.open(`https://wa.me/${listing.phone}?text=${encodeURIComponent(`HasatLink - ${listing.title} hakkında bilgi almak istiyorum.`)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <ImageGallery images={listing.images || []} title={listing.title} />

      {/* Header */}
      <div className="bg-[var(--bg-surface)] rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge color={statusInfo.color}>{lang === 'tr' ? statusInfo.tr : statusInfo.en}</Badge>
              <Badge color={LISTING_MODE_COLORS[listing.listingMode] || LISTING_MODE_COLORS.sell}>
                {LISTING_MODE_LABELS[listing.type]?.[listing.listingMode]?.[lang] || (lang === 'tr' ? 'SATIŞ' : 'SELL')}
              </Badge>
              <span className="text-[10px] font-medium uppercase text-[#6B6560]">{listing.subCategory}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
          </div>
          <div className="text-right shrink-0">
            {listing.listingMode === 'buy' && (
              <p className="text-[10px] font-medium text-[#0077B6] uppercase">{t('listing.priceBudget')}</p>
            )}
            <p className={`text-2xl font-semibold ${listing.listingMode === 'buy' ? 'text-[#0077B6]' : 'text-[#2D6A4F]'}`}>{formatPrice(listing.price)}</p>
            {listing.amount > 0 && <p className="text-xs text-[#6B6560]">{listing.amount} {listing.unit}</p>}
          </div>
        </div>

        {listing.description && (
          <p className="text-sm text-[#6B6560] leading-relaxed">{listing.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-[#6B6560]">
          <span className="flex items-center gap-1"><MapPin size={12} />{listing.location}</span>
          <span className="flex items-center gap-1"><Eye size={12} />{listing.stats?.views || 0} {t('listing.views')}</span>
          <span>{formatDate(listing.createdAt)}</span>
        </div>
      </div>

      {/* PAZAR Details */}
      {listing.type === 'pazar' && (listing.qualityGrade || listing.storageType || listing.harvestDate || listing.isOrganic || listing.minOrderAmount > 0) && (
        <DetailSection title={t('listing.pazarDetails')}>
          {listing.isOrganic && (
            <div className="mb-3">
              <Badge color="#2D6A4F"><Leaf size={10} className="inline mr-1" />{t('listing.organic')}</Badge>
            </div>
          )}
          <InfoRow icon={<Star size={14} className="text-[#A47148]" />} label={t('listing.quality')} value={listing.qualityGrade} />
          <InfoRow icon={<Box size={14} className="text-[var(--text-secondary)]" />} label={t('listing.storage')} value={listing.storageType} />
          <InfoRow icon={<Calendar size={14} className="text-[#2D6A4F]" />} label={t('listing.harvestDate')} value={listing.harvestDate} />
          <InfoRow icon={<Weight size={14} className="text-[#0077B6]" />} label={t('listing.minOrder')} value={listing.minOrderAmount > 0 ? `${listing.minOrderAmount} ${listing.unit}` : ''} />
        </DetailSection>
      )}

      {/* LOJİSTİK Details */}
      {listing.type === 'lojistik' && (listing.vehicleType || listing.capacity > 0 || listing.routeFrom || listing.routeTo) && (
        <DetailSection title={t('listing.lojistikDetails')}>
          <div className="flex gap-2 flex-wrap mb-3">
            {listing.isFrigo && <Badge color="#0077B6">{t('listing.frigo')}</Badge>}
            {listing.hasInsurance && <Badge color="#2D6A4F"><Shield size={10} className="inline mr-1" />{t('listing.insurance')}</Badge>}
          </div>
          <InfoRow icon={<Truck size={14} className="text-[#0077B6]" />} label={t('listing.vehicleType')} value={listing.vehicleType} />
          <InfoRow icon={<Weight size={14} className="text-[var(--text-secondary)]" />} label={t('listing.capacity')} value={listing.capacity > 0 ? `${listing.capacity} ton` : ''} />
          {(listing.routeFrom || listing.routeTo) && (
            <InfoRow icon={<MapPin size={14} className="text-[#A47148]" />} label={t('listing.route')} value={`${listing.routeFrom} → ${listing.routeTo}`} />
          )}
          <InfoRow icon={<Calendar size={14} className="text-[#2D6A4F]" />} label={t('listing.availableDate')} value={listing.availableDate} />
          <InfoRow icon={<Truck size={14} className="text-[var(--text-secondary)]" />} label={t('listing.plateNumber')} value={listing.plateNumber} />
        </DetailSection>
      )}

      {/* İŞGÜCÜ Details */}
      {listing.type === 'isgucu' && (listing.workerCount > 0 || listing.experienceYears > 0 || listing.dailyWage > 0 || listing.skills?.length > 0) && (
        <DetailSection title={t('listing.isgucuDetails')}>
          {listing.isTeam && (
            <div className="mb-3"><Badge color="#A47148">{t('listing.team')}</Badge></div>
          )}
          <InfoRow icon={<Users size={14} className="text-[#0077B6]" />} label={t('listing.workerCount')} value={listing.workerCount > 0 ? `${listing.workerCount} ${t('listing.person')}` : ''} />
          <InfoRow icon={<Clock size={14} className="text-[var(--text-secondary)]" />} label={t('listing.experience')} value={listing.experienceYears > 0 ? `${listing.experienceYears} ${t('listing.years')}` : ''} />
          <InfoRow icon={<Star size={14} className="text-[#A47148]" />} label={t('listing.dailyWage')} value={listing.dailyWage > 0 ? formatPrice(listing.dailyWage) + '/gün' : ''} />
          {listing.skills?.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-medium uppercase text-[var(--text-secondary)] tracking-wide mb-2">{t('listing.skills')}</p>
              <div className="flex gap-1.5 flex-wrap">
                {listing.skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 text-[10px] font-medium uppercase bg-[#A47148]/10 text-[#A47148] rounded-full">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </DetailSection>
      )}

      {/* EKİPMAN Details */}
      {listing.type === 'ekipman' && (listing.brand || listing.modelName || listing.condition || listing.horsePower > 0) && (
        <DetailSection title={t('listing.ekipmanDetails')}>
          <div className="flex gap-2 flex-wrap mb-3">
            {listing.saleType && <Badge color="#A47148">{listing.saleType}</Badge>}
            {listing.rentType && <Badge color="#6B6560">{listing.rentType}</Badge>}
            {listing.condition && <Badge color="#0077B6">{listing.condition}</Badge>}
          </div>
          <InfoRow icon={<Wrench size={14} className="text-[var(--text-primary)]" />} label={t('listing.brand')} value={listing.brand} />
          <InfoRow icon={<Box size={14} className="text-[var(--text-secondary)]" />} label={t('listing.modelName')} value={listing.modelName} />
          <InfoRow icon={<Calendar size={14} className="text-[#2D6A4F]" />} label={t('listing.year')} value={listing.yearOfManufacture > 0 ? listing.yearOfManufacture : ''} />
          <InfoRow icon={<Star size={14} className="text-[#A47148]" />} label={t('listing.horsePower')} value={listing.horsePower > 0 ? `${listing.horsePower} HP` : ''} />
        </DetailSection>
      )}

      {/* ARAZİ Details */}
      {listing.type === 'arazi' && (listing.landSize > 0 || listing.soilType || listing.deedStatus || listing.zoningStatus) && (
        <DetailSection title={t('listing.araziDetails')}>
          <div className="flex gap-2 flex-wrap mb-3">
            {listing.waterAvailable && <Badge color="#0077B6"><Droplets size={10} className="inline mr-1" />{t('listing.waterAvailable')}</Badge>}
            {listing.hasElectricity && <Badge color="#A47148"><Zap size={10} className="inline mr-1" />{t('listing.hasElectricity')}</Badge>}
          </div>
          <InfoRow icon={<Ruler size={14} className="text-[#2D6A4F]" />} label={t('listing.landSize')} value={listing.landSize > 0 ? `${listing.landSize} ${listing.landUnit}` : ''} />
          <InfoRow icon={<Landmark size={14} className="text-[#A47148]" />} label={t('listing.soilType')} value={listing.soilType} />
          <InfoRow icon={<FileText size={14} className="text-[var(--text-primary)]" />} label={t('listing.deedStatus')} value={listing.deedStatus} />
          <InfoRow icon={<Box size={14} className="text-[var(--text-secondary)]" />} label={t('listing.zoningStatus')} value={listing.zoningStatus} />
          <InfoRow icon={<Clock size={14} className="text-[#0077B6]" />} label={t('listing.rentDuration')} value={listing.rentDuration} />
        </DetailSection>
      )}

      {/* DEPOLAMA Details */}
      {listing.type === 'depolama' && (listing.storageCapacity > 0 || listing.temperatureMin || listing.temperatureMax) && (
        <DetailSection title={t('listing.depolamaDetails')}>
          <div className="flex gap-2 flex-wrap mb-3">
            {listing.hasSecurity && <Badge color="#2D6A4F"><Shield size={10} className="inline mr-1" />{t('listing.hasSecurity')}</Badge>}
            {listing.has24Access && <Badge color="#A47148"><Clock3 size={10} className="inline mr-1" />{t('listing.has24Access')}</Badge>}
          </div>
          <InfoRow icon={<Box size={14} className="text-[#0077B6]" />} label={t('listing.storageCapacity')} value={listing.storageCapacity > 0 ? `${listing.storageCapacity} ${listing.storageCapacityUnit}` : ''} />
          <InfoRow icon={<Thermometer size={14} className="text-[#0077B6]" />} label={t('listing.temperatureRange')} value={(listing.temperatureMin || listing.temperatureMax) ? `${listing.temperatureMin}°C ~ ${listing.temperatureMax}°C` : ''} />
          <InfoRow icon={<Clock size={14} className="text-[#A47148]" />} label={t('listing.rentDuration')} value={listing.rentDuration} />
        </DetailSection>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {isOwner ? (
          <>
            <Button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 bg-[#0077B6] hover:bg-[#005f8a]">
              <Pencil size={16} />
              {t('listing.edit')}
            </Button>
            <button onClick={onDelete} className="flex items-center justify-center w-12 h-12 bg-[#C1341B] text-white rounded-2xl hover:bg-[#a02b16] transition-colors">
              <Trash2 size={18} />
            </button>
          </>
        ) : (
          <>
            {onMessage && (
              <Button onClick={onMessage} variant="secondary" className="flex-1 flex items-center justify-center gap-2 bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]">
                <MessageSquare size={16} />
                {t('listing.message')}
              </Button>
            )}
            <Button onClick={handleWhatsApp} className="flex-1 flex items-center justify-center gap-2">
              <MessageCircle size={16} />
              {listing.listingMode === 'buy' ? t('listing.contactBuyer') : t('listing.whatsapp')}
            </Button>
            {listing.phone && (
              <a href={`tel:${listing.phone}`} className="flex items-center justify-center w-12 h-12 bg-[var(--bg-input)] rounded-2xl hover:bg-[var(--bg-surface-hover)] transition-colors">
                <Phone size={18} />
              </a>
            )}
          </>
        )}
        <button onClick={onShare} className="flex items-center justify-center w-12 h-12 bg-[var(--bg-input)] rounded-2xl hover:bg-[var(--bg-surface-hover)] transition-colors">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
}
