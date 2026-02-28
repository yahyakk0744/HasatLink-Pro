import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useListings } from '../hooks/useListings';
import { useRatings } from '../hooks/useRatings';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import type { Listing } from '../types';
import api from '../config/api';
import ListingDetailView from '../components/listings/ListingDetailView';
import ListingForm from '../components/listings/ListingForm';
import ListingMap from '../components/map/ListingMap';
import SEO from '../components/ui/SEO';
import ReviewCard from '../components/ratings/ReviewCard';
import ReviewForm from '../components/ratings/ReviewForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user, firebaseUid } = useAuth();
  const navigate = useNavigate();
  const { fetchListing, updateListing, deleteListing, trackWaClick, trackShare } = useListings();
  const { ratings, fetchRatings } = useRatings();
  const { getOrCreateConversation } = useMessages();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = !!(user && listing && user.userId === listing.userId);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchListing(id).then(data => {
        setListing(data);
        if (data?.userId) fetchRatings(data.userId);
        setLoading(false);
      });
    }
  }, [id, fetchListing, fetchRatings]);

  const handleEditSubmit = async (data: Partial<Listing>) => {
    if (!listing) return;
    const updated = await updateListing(listing._id, data);
    if (updated) {
      setListing(updated);
      setShowEditForm(false);
      toast.success('İlan güncellendi!');
    }
  };

  const handleDelete = async () => {
    if (!listing) return;
    const success = await deleteListing(listing._id);
    if (success) {
      toast.success('İlan silindi!');
      navigate('/' + listing.type);
    }
    setShowDeleteConfirm(false);
  };

  const handleShare = () => {
    if (listing) {
      trackShare(listing._id);
      if (navigator.share) {
        navigator.share({ title: listing.title, url: window.location.href });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link kopyalandı!');
      }
    }
  };

  const handleMessage = async () => {
    if (!listing) return;
    if (!user) {
      navigate('/giris');
      return;
    }
    if (!firebaseUid) {
      toast.error('Mesajlaşma için lütfen çıkış yapıp tekrar giriş yapın.');
      return;
    }

    try {
      const { data: otherUser } = await api.get(`/users/${listing.userId}`);

      if (!otherUser.firebaseUid) {
        toast.error('Bu kullanıcı henüz giriş yapmamış. Mesaj göndermek için karşı tarafın da giriş yapmış olması gerekiyor.');
        return;
      }

      const conversationId = await getOrCreateConversation(
        firebaseUid,
        { userId: user.userId, name: user.name, profileImage: user.profileImage || '' },
        otherUser.firebaseUid,
        { userId: otherUser.userId, name: otherUser.name, profileImage: otherUser.profileImage || '' },
        { listingId: listing._id, listingTitle: listing.title, listingImage: listing.images?.[0] || '' }
      );
      navigate(`/mesajlar/${conversationId}`);
    } catch (err) {
      console.error('Message error:', err);
      toast.error('Mesaj gönderilemedi');
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;
  if (!listing) return <EmptyState title={t('noResults')} />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <SEO
        title={listing.title}
        description={listing.description?.slice(0, 160)}
        ogImage={listing.images?.[0]}
        keywords={`${listing.type}, ${listing.subCategory}, tarım, ilan`}
      />
      <Link to={`/${listing.type}`} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors">
        <ArrowLeft size={16} />
        {t('back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ListingDetailView
            listing={listing}
            onWaClick={() => trackWaClick(listing._id)}
            onShare={handleShare}
            isOwner={isOwner}
            onEdit={() => setShowEditForm(true)}
            onDelete={() => setShowDeleteConfirm(true)}
            onMessage={!isOwner ? handleMessage : undefined}
          />
        </div>

        <div className="space-y-6">
          {/* Mini Map */}
          <div className="bg-[var(--bg-surface)] rounded-2xl overflow-hidden shadow-sm h-[200px]">
            <ListingMap
              listings={[listing]}
              center={[listing.coordinates.lat, listing.coordinates.lng]}
              zoom={13}
            />
          </div>

          {/* Reviews */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-tight">{t('rating.title')}</h3>
            {user && user.userId !== listing.userId && (
              <ReviewForm
                fromUserId={user.userId}
                toUserId={listing.userId}
                listingId={listing._id}
                onSuccess={() => fetchRatings(listing.userId)}
              />
            )}
            {ratings.length > 0 ? (
              ratings.map(r => <ReviewCard key={r._id} rating={r} />)
            ) : (
              <p className="text-xs text-[#6B6560]">{t('rating.noReviews')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ListingForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleEditSubmit}
        initialData={listing}
      />

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{t('listing.deleteConfirmTitle')}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{t('listing.deleteConfirmMessage')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-[var(--bg-input)] rounded-xl hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#C1341B] text-white rounded-xl hover:bg-[#a02b16] transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
