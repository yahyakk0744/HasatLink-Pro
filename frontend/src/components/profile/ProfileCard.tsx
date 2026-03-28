import { useTranslation } from 'react-i18next';
import { MapPin, CheckCircle, Calendar, MessageSquare, Trophy, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RatingStars from '../ratings/RatingStars';
import { formatDate } from '../../utils/formatters';
import { getLoyaltyBadge, getProgressToNext } from '../../utils/loyalty';
import type { User } from '../../types';

interface ProfileCardProps {
  user: User;
  isOwn?: boolean;
  onEdit?: () => void;
  onMessage?: () => void;
}

export default function ProfileCard({ user, isOwn, onEdit, onMessage }: ProfileCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const points = user.points || 0;
  const badge = getLoyaltyBadge(points);
  const progress = getProgressToNext(points);

  return (
    <div className="surface-card-lg p-6">
      {/* Mobile: stacked centered layout, Desktop: horizontal */}
      <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:gap-4">
        <div className="w-24 h-24 rounded-full bg-[var(--bg-input)] overflow-hidden shrink-0 ring-4 ring-[var(--accent-green)]/20 mb-3 md:mb-0">
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-[var(--text-secondary)]">
              {user.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h2 className="text-xl font-bold tracking-tight break-words">{user.name}</h2>
            {user.isVerified && <CheckCircle size={18} className="text-[var(--accent-green)] shrink-0" />}
          </div>
          {user.location && (
            <div className="flex items-center justify-center md:justify-start gap-1 text-xs text-[var(--text-secondary)] mt-1">
              <MapPin size={12} />
              <span>{user.location}</span>
            </div>
          )}
          {user.averageRating > 0 && (
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1.5">
              <RatingStars score={Math.round(user.averageRating)} size={14} />
              <span className="text-sm font-semibold">{user.averageRating.toFixed(1)}</span>
              <span className="text-xs text-[var(--text-secondary)]">({user.totalRatings})</span>
            </div>
          )}
          {user.createdAt && (
            <div className="flex items-center justify-center md:justify-start gap-1 text-xs text-[var(--text-secondary)] mt-1.5">
              <Calendar size={12} />
              <span>{t('profileInfo.memberSince')}: {formatDate(user.createdAt)}</span>
            </div>
          )}
          {/* Action buttons */}
          <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
            {isOwn && onEdit && (
              <>
                <button
                  onClick={onEdit}
                  className="px-4 py-2 text-xs font-semibold uppercase bg-[var(--bg-input)] rounded-full hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  {t('editProfile')}
                </button>
                <button
                  onClick={() => navigate('/hesap-ayarlari')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase bg-[var(--bg-input)] rounded-full hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Settings size={14} />
                  {t('accountSettings.title', 'Hesap Ayarları')}
                </button>
              </>
            )}
            {!isOwn && onMessage && (
              <button
                onClick={onMessage}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase bg-[var(--accent-green)] text-white rounded-full hover:opacity-90 transition-colors"
              >
                <MessageSquare size={14} />
                {t('listing.message')}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Loyalty Progress Bar */}
      <div className="mt-4 pt-4 border-t border-[var(--bg-input)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: badge.bgColor }}>
            {badge.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: badge.color }}>{badge.label[lang]}</span>
              {badge.rank === 'gold' && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#B8860B]/20 to-[#DAA520]/20 text-[#B8860B]">MAX</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Trophy size={10} className="text-[var(--text-secondary)]" />
              <span className="text-[10px] text-[var(--text-secondary)]">{points.toLocaleString('tr-TR')} {lang === 'tr' ? 'puan' : 'points'}</span>
            </div>
          </div>
        </div>
        {progress && (
          <div>
            <div className="h-2 rounded-full bg-[var(--bg-input)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress.percent}%`, background: `linear-gradient(90deg, ${badge.color}, ${badge.color}cc)` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-[var(--text-secondary)]">{progress.current} / {progress.next}</span>
              <span className="text-[9px] font-medium" style={{ color: badge.color }}>{progress.percent}%</span>
            </div>
          </div>
        )}
      </div>

      {user.bio && (
        <div className="mt-4 pt-4 border-t border-[var(--bg-input)]">
          <p className="text-xs font-medium uppercase text-[var(--text-secondary)] mb-1">{t('profileInfo.bio')}</p>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">{user.bio}</p>
        </div>
      )}
    </div>
  );
}
