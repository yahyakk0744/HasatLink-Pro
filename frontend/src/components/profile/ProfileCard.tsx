import { useTranslation } from 'react-i18next';
import { MapPin, CheckCircle, Calendar, MessageSquare } from 'lucide-react';
import RatingStars from '../ratings/RatingStars';
import { formatDate } from '../../utils/formatters';
import type { User } from '../../types';

interface ProfileCardProps {
  user: User;
  isOwn?: boolean;
  onEdit?: () => void;
  onMessage?: () => void;
}

export default function ProfileCard({ user, isOwn, onEdit, onMessage }: ProfileCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-[var(--bg-surface)] rounded-[2.5rem] p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-[var(--bg-input)] overflow-hidden shrink-0 ring-4 ring-[#2D6A4F]/20">
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-[#6B6560]">
              {user.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight truncate">{user.name}</h2>
            {user.isVerified && <CheckCircle size={16} className="text-[#2D6A4F] shrink-0" />}
          </div>
          <div className="flex items-center gap-3 text-xs text-[#6B6560] mt-1">
            <span className="flex items-center gap-1"><MapPin size={12} />{user.location}</span>
          </div>
          {user.averageRating > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <RatingStars score={Math.round(user.averageRating)} size={14} />
              <span className="text-sm font-semibold">{user.averageRating.toFixed(1)}</span>
              <span className="text-xs text-[#6B6560]">({user.totalRatings})</span>
            </div>
          )}
          {user.createdAt && (
            <div className="flex items-center gap-1 text-xs text-[#6B6560] mt-1">
              <Calendar size={12} />
              <span>{t('profile.memberSince')}: {formatDate(user.createdAt)}</span>
            </div>
          )}
        </div>
        {isOwn && onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 text-xs font-semibold uppercase bg-[var(--bg-input)] rounded-full hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            {t('editProfile')}
          </button>
        )}
        {!isOwn && onMessage && (
          <button
            onClick={onMessage}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase bg-[#2D6A4F] text-white rounded-full hover:bg-[#1B4332] transition-colors"
          >
            <MessageSquare size={14} />
            {t('listing.message')}
          </button>
        )}
      </div>
      {user.bio && (
        <div className="mt-4 pt-4 border-t border-[var(--bg-input)]">
          <p className="text-xs font-medium uppercase text-[var(--text-secondary)] mb-1">{t('profile.bio')}</p>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">{user.bio}</p>
        </div>
      )}
    </div>
  );
}
