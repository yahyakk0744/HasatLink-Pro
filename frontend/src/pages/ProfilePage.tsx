import { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../hooks/useUser';
import { useMessages } from '../hooks/useMessages';
import ProfileCard from '../components/profile/ProfileCard';
import AnalyticsCards from '../components/profile/AnalyticsCards';
import MyListings from '../components/profile/MyListings';
import ProfileEditForm from '../components/profile/ProfileEditForm';
import RatingStars from '../components/ratings/RatingStars';
import ReviewCard from '../components/ratings/ReviewCard';
import ReviewForm from '../components/ratings/ReviewForm';
import WeatherWidget from '../components/ui/WeatherWidget';
import { useRatings } from '../hooks/useRatings';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SEO from '../components/ui/SEO';
import type { User } from '../types';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const { t } = useTranslation();
  const { user: authUser, firebaseUid, updateUserData } = useAuth();
  const { user: profileUser, stats, loading, fetchUser, fetchStats, updateUser } = useUser();
  const { ratings, fetchRatings } = useRatings();
  const { getOrCreateConversation } = useMessages();
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);

  const targetUserId = paramUserId || authUser?.userId;
  const isOwn = !paramUserId || paramUserId === authUser?.userId;

  useEffect(() => {
    if (targetUserId) {
      fetchUser(targetUserId);
      fetchStats(targetUserId);
      fetchRatings(targetUserId);
    }
  }, [targetUserId, fetchUser, fetchStats, fetchRatings]);

  if (!paramUserId && !authUser) return <Navigate to="/giris" replace />;
  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  const displayUser = isOwn ? authUser : profileUser;
  if (!displayUser) return <LoadingSpinner size="lg" className="py-20" />;

  const handleEditSubmit = async (updates: Partial<User>) => {
    if (!targetUserId) return;
    const result = await updateUser(targetUserId, updates);
    if (result && isOwn) updateUserData(updates);
  };

  const handleProfileMessage = async () => {
    if (!authUser || !firebaseUid || !profileUser) return;
    if (!profileUser.firebaseUid) {
      toast.error('Bu kullanıcıya henüz mesaj gönderilemiyor');
      return;
    }
    try {
      const conversationId = await getOrCreateConversation(
        firebaseUid,
        { userId: authUser.userId, name: authUser.name, profileImage: authUser.profileImage || '' },
        profileUser.firebaseUid,
        { userId: profileUser.userId, name: profileUser.name, profileImage: profileUser.profileImage || '' },
        { listingId: 'profile', listingTitle: profileUser.name, listingImage: profileUser.profileImage || '' }
      );
      navigate(`/mesajlar/${conversationId}`);
    } catch {
      toast.error('Mesaj gönderilemedi');
    }
  };

  const weatherCity = displayUser.location?.split(',')[0]?.trim() || 'Ceyhan';

  // Rating distribution (5→1)
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratings.filter(r => r.score === star).length,
  }));
  const maxCount = Math.max(...ratingDistribution.map(d => d.count), 1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <SEO
        title={displayUser.name || t('profile')}
        description={`${displayUser.name} - HasatLink profili`}
      />
      <ProfileCard
        user={displayUser as User}
        isOwn={isOwn}
        onEdit={() => setShowEdit(true)}
        onMessage={!isOwn && authUser ? handleProfileMessage : undefined}
      />

      <WeatherWidget city={weatherCity} />

      {isOwn && stats && <AnalyticsCards stats={stats} />}

      {targetUserId && <MyListings userId={targetUserId} isOwn={isOwn} />}

      {/* Ratings Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold tracking-tight">{t('rating.title')}</h3>
          {displayUser.averageRating > 0 && (
            <div className="flex items-center gap-2">
              <RatingStars score={Math.round(displayUser.averageRating)} size={14} />
              <span className="text-sm font-semibold">{displayUser.averageRating.toFixed(1)}</span>
              <span className="text-xs text-[#6B6560]">({displayUser.totalRatings})</span>
            </div>
          )}
        </div>

        {/* Rating Distribution */}
        {ratings.length > 0 && (
          <div className="bg-[var(--bg-surface)] rounded-2xl p-4 shadow-sm space-y-2">
            {ratingDistribution.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs font-semibold w-4 text-right">{star}</span>
                <Star size={12} className="text-[#A47148] fill-[#A47148]" />
                <div className="flex-1 h-2 bg-[var(--bg-input)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#A47148] rounded-full transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#6B6560] w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}

        {ratings.length > 0 ? (
          ratings.map(r => <ReviewCard key={r._id} rating={r} />)
        ) : (
          <p className="text-sm text-[#6B6560]">{t('rating.noReviews')}</p>
        )}

        {/* Review Form — only on other user's profile */}
        {!isOwn && authUser && targetUserId && (
          <ReviewForm
            fromUserId={authUser.userId}
            toUserId={targetUserId}
            onSuccess={() => {
              if (targetUserId) {
                fetchRatings(targetUserId);
                fetchUser(targetUserId);
              }
            }}
          />
        )}
      </div>

      {isOwn && showEdit && (
        <ProfileEditForm
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          user={displayUser as User}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}
