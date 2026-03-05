import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bell, HandCoins, ShieldCheck, Star, Package, Calendar, MessageCircle, Store } from 'lucide-react';
import { useListings } from '../hooks/useListings';
import { useRatings } from '../hooks/useRatings';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import { auth as firebaseAuth } from '../config/firebase';
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
import CommentSection from '../components/comments/CommentSection';
import toast from 'react-hot-toast';

function SellerCard({ listing, onMessage }: { listing: Listing; onMessage?: () => void }) {
  const navigate = useNavigate();
  const joinYear = listing.sellerJoinDate
    ? new Date(listing.sellerJoinDate).getFullYear()
    : null;

  return (
    <div className="bg-white/90 dark:bg-[var(--bg-surface)]/90 backdrop-blur-xl rounded-[32px] shadow-sm border border-gray-100 dark:border-[var(--border-default)] p-5 space-y-4">
      {/* Seller Header */}
      <div className="flex items-center gap-3">
        {listing.sellerImage ? (
          <img
            src={listing.sellerImage}
            alt={listing.sellerName}
            className="w-12 h-12 rounded-2xl object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 flex items-center justify-center">
            <span className="text-lg font-bold text-[#2D6A4F]">
              {listing.sellerName?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold tracking-tight truncate">{listing.sellerName || 'Satıcı'}</p>
            {listing.sellerVerified && (
              <ShieldCheck size={14} className="text-[#0077B6] shrink-0" fill="#0077B6" stroke="white" />
            )}
          </div>
          {joinYear && (
            <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
              <Calendar size={10} />
              {joinYear}'den beri üye
            </p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2.5 rounded-2xl bg-[var(--bg-input)]">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Star size={12} className="text-[#F59E0B]" fill="#F59E0B" />
          </div>
          <p className="text-sm font-bold tracking-[-0.02em]">
            {listing.sellerRating > 0 ? listing.sellerRating.toFixed(1) : '—'}
          </p>
          <p className="text-[9px] text-[var(--text-secondary)]">Puan</p>
        </div>
        <div className="text-center p-2.5 rounded-2xl bg-[var(--bg-input)]">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Package size={12} className="text-[#2D6A4F]" />
          </div>
          <p className="text-sm font-bold tracking-[-0.02em]">
            {listing.sellerListingCount ?? 0}
          </p>
          <p className="text-[9px] text-[var(--text-secondary)]">İlan</p>
        </div>
        <div className="text-center p-2.5 rounded-2xl bg-[var(--bg-input)]">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <ShieldCheck size={12} className="text-[#0077B6]" />
          </div>
          <p className="text-sm font-bold tracking-[-0.02em]">
            {listing.sellerTotalRatings ?? 0}
          </p>
          <p className="text-[9px] text-[var(--text-secondary)]">Yorum</p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-2">
        {onMessage && (
          <button
            onClick={onMessage}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] rounded-2xl transition-all active:scale-[0.97]"
          >
            <MessageCircle size={14} />
            Satıcıya Sor
          </button>
        )}
        <button
          onClick={() => navigate(`/profil/${listing.userId}`)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#0077B6] text-white rounded-2xl hover:opacity-90 transition-all active:scale-[0.97]"
        >
          <Store size={14} />
          Mağazayı İncele
        </button>
      </div>
    </div>
  );
}

function PriceAlertBox({ category, subCategory, currentPrice }: { category: string; subCategory: string; currentPrice: number }) {
  const [targetPrice, setTargetPrice] = useState('');
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation();

  const handleSave = async () => {
    if (!targetPrice || Number(targetPrice) <= 0) return;
    try {
      await api.post('/price-alerts', { category, subCategory, targetPrice: Number(targetPrice) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setTargetPrice('');
    } catch {}
  };

  return (
    <div className="surface-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[var(--accent-orange)]/10 flex items-center justify-center">
          <Bell size={16} strokeWidth={1.5} className="text-[var(--accent-orange)]" />
        </div>
        <h3 className="text-sm font-semibold tracking-tight">{t('listing.priceAlert') || 'Fiyat Alarmi'}</h3>
      </div>
      <p className="text-[11px] text-[var(--text-secondary)] mb-3">
        Bu kategoride hedef fiyatinizin altinda ilan girildiginde bildirim alin.
      </p>
      <div className="flex gap-2">
        <input
          type="number"
          value={targetPrice}
          onChange={e => setTargetPrice(e.target.value)}
          placeholder={`Hedef fiyat (Guncel: ${currentPrice.toLocaleString('tr-TR')})`}
          className="flex-1 px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl outline-none focus:border-[var(--accent-green)] transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={saved}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            saved
              ? 'bg-[var(--accent-green)] text-white'
              : 'bg-[var(--accent-orange)] text-white hover:opacity-90 active:scale-95'
          }`}
        >
          {saved ? '✓' : 'Kur'}
        </button>
      </div>
      {saved && (
        <p className="text-[11px] text-[var(--accent-green)] mt-2 font-medium">
          Alarm kuruldu! Eslesen ilan girildiginde bildirim alacaksiniz.
        </p>
      )}
    </div>
  );
}

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
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerSending, setOfferSending] = useState(false);

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

  const handleOffer = async () => {
    if (!listing || !offerPrice || Number(offerPrice) <= 0) return;
    if (!user) { navigate('/giris'); return; }
    setOfferSending(true);
    try {
      await api.post('/offers', {
        listingId: listing._id,
        offerPrice: Number(offerPrice),
        message: offerMessage,
      });
      toast.success('Teklifiniz gönderildi!');
      setShowOfferModal(false);
      setOfferPrice('');
      setOfferMessage('');
    } catch {
      toast.error('Teklif gönderilemedi');
    } finally {
      setOfferSending(false);
    }
  };

  const handleMessage = async () => {
    if (!listing) return;
    if (!user) {
      navigate('/giris');
      return;
    }

    // Check actual Firebase auth state (not just stored UID)
    const fbUser = firebaseAuth.currentUser;
    const currentFbUid = fbUser?.uid || firebaseUid;

    if (!currentFbUid) {
      toast.error('Mesajlaşma için lütfen çıkış yapıp tekrar giriş yapın.');
      return;
    }

    try {
      const { data: otherUser } = await api.get(`/users/${listing.userId}`);

      if (!otherUser.firebaseUid) {
        toast.error('Bu kullanıcıya henüz mesaj gönderilemez.');
        return;
      }

      const conversationId = await getOrCreateConversation(
        currentFbUid,
        { userId: user.userId, name: user.name, profileImage: user.profileImage || '' },
        otherUser.firebaseUid,
        { userId: otherUser.userId, name: otherUser.name, profileImage: otherUser.profileImage || '' },
        { listingId: listing._id, listingTitle: listing.title, listingImage: listing.images?.[0] || '' }
      );
      navigate(`/mesajlar/${conversationId}`);
    } catch (err: any) {
      console.error('Message error:', err);
      const code = err?.code || '';
      if (code.includes('permission-denied') || code.includes('unauthenticated')) {
        toast.error('Oturum süresi dolmuş. Lütfen çıkış yapıp tekrar giriş yapın.');
      } else {
        toast.error('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      }
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
            onOffer={!isOwner ? () => setShowOfferModal(true) : undefined}
          />

          {/* Comments */}
          <CommentSection listingId={listing._id} />
        </div>

        <div className="space-y-6">
          {/* Seller Identity Card */}
          {listing.sellerName && !isOwner && (
            <SellerCard listing={listing} onMessage={handleMessage} />
          )}

          {/* Mini Map */}
          <div className="surface-card rounded-2xl overflow-hidden h-[200px]">
            <ListingMap
              listings={[listing]}
              center={[listing.coordinates.lat, listing.coordinates.lng]}
              zoom={13}
            />
          </div>

          {/* Price Alert */}
          {user && !isOwner && (
            <PriceAlertBox category={listing.type} subCategory={listing.subCategory} currentPrice={listing.price} />
          )}

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
              ratings.map(r => <ReviewCard key={r._id} rating={r} currentUserId={user?.userId} sellerId={listing.userId} onRefresh={() => fetchRatings(listing.userId)} />)
            ) : (
              <p className="text-xs text-[var(--text-secondary)]">{t('rating.noReviews')}</p>
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
          <div className="surface-card rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
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
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-[var(--accent-red)] text-white rounded-xl hover:opacity-90 transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && listing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowOfferModal(false)}>
          <div
            className="bg-[var(--bg-surface)]/95 backdrop-blur-xl border border-white/20 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E76F00]/10 flex items-center justify-center">
                <HandCoins size={20} className="text-[#E76F00]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Teklif Ver</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">{listing.title}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-input)] flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">Mevcut Fiyat</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {listing.price.toLocaleString('tr-TR')} TL
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
                Teklif Fiyatı (TL)
              </label>
              <input
                type="number"
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
                placeholder="Teklifinizi girin..."
                className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-2xl text-sm outline-none focus:border-[#E76F00] transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
                Mesaj (Opsiyonel)
              </label>
              <textarea
                value={offerMessage}
                onChange={e => setOfferMessage(e.target.value)}
                placeholder="Satıcıya bir not bırakın..."
                rows={2}
                className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-2xl text-sm outline-none focus:border-[#E76F00] transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOfferModal(false)}
                className="flex-1 px-4 py-3 text-sm font-medium bg-[var(--bg-input)] rounded-2xl hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleOffer}
                disabled={offerSending || !offerPrice}
                className="flex-1 px-4 py-3 text-sm font-semibold bg-[#E76F00] text-white rounded-2xl hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50"
              >
                {offerSending ? 'Gönderiliyor...' : 'Teklif Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
