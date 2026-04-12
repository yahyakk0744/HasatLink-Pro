import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BadgeCheck, Star, MessageCircle, User as UserIcon, Eye, Package, Calendar, Store, QrCode, Share2, ShoppingCart } from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../hooks/useMessages';
import { auth as firebaseAuth } from '../config/firebase';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import SEO from '../components/ui/SEO';
import { formatPrice, formatDate } from '../utils/formatters';
import type { User, Listing } from '../types';
import toast from 'react-hot-toast';

type CategoryFilter = 'hepsi' | 'pazar' | 'lojistik' | 'isgucu' | 'ekipman' | 'arazi' | 'depolama';

const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: 'hepsi', label: 'Hepsi' },
  { key: 'pazar', label: 'Pazar' },
  { key: 'lojistik', label: 'Lojistik' },
  { key: 'isgucu', label: 'İşgücü' },
  { key: 'ekipman', label: 'Ekipman' },
  { key: 'arazi', label: 'Arazi' },
  { key: 'depolama', label: 'Depolama' },
];

export default function SellerStorePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: authUser, firebaseUid } = useAuth();
  const { getOrCreateConversation } = useMessages();

  const [seller, setSeller] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CategoryFilter>('hepsi');

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    Promise.all([
      api.get(`/users/${userId}`).then(r => r.data).catch(() => null),
      api.get('/listings', { params: { userId, status: 'active' } }).then(r => r.data).catch(() => null),
    ]).then(([userRes, listingsRes]) => {
      if (!active) return;
      setSeller(userRes || null);
      const items: Listing[] = Array.isArray(listingsRes) ? listingsRes : (listingsRes?.listings || []);
      setListings(items);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const filteredListings = useMemo(
    () => filter === 'hepsi' ? listings : listings.filter(l => l.type === filter),
    [listings, filter]
  );

  const totalViews = useMemo(
    () => listings.reduce((sum, l) => sum + (l.stats?.views || 0), 0),
    [listings]
  );

  const handleMessage = async () => {
    if (!authUser) {
      navigate('/giris');
      return;
    }
    if (!seller) return;
    const fbUser = firebaseAuth.currentUser;
    const currentFbUid = fbUser?.uid || firebaseUid;
    if (!currentFbUid) {
      toast.error('Mesajlaşma için lütfen çıkış yapıp tekrar giriş yapın.');
      return;
    }
    if (!seller.firebaseUid) {
      toast.error('Bu satıcıya henüz mesaj gönderilemez.');
      return;
    }
    try {
      const conversationId = await getOrCreateConversation(
        currentFbUid,
        { userId: authUser.userId, name: authUser.name, profileImage: authUser.profileImage || '' },
        seller.firebaseUid,
        { userId: seller.userId, name: seller.name, profileImage: seller.profileImage || '' },
        { listingId: 'store', listingTitle: seller.name, listingImage: seller.profileImage || '' }
      );
      navigate(`/mesajlar/${conversationId}`);
    } catch (err) {
      console.error('Store message error:', err);
      toast.error('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  if (!seller) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20">
        <EmptyState
          icon={<Store size={32} />}
          title="Mağaza bulunamadı"
          description="Aradığınız satıcı mevcut değil veya kaldırılmış olabilir."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <SEO
        title={`${seller.name} - Mağaza`}
        description={`${seller.name} adlı satıcının HasatLink mağazası. ${listings.length} aktif ilan.`}
      />

      {/* Seller Profile Card */}
      <div
        className="rounded-2xl p-6 border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="relative shrink-0 mx-auto sm:mx-0">
            {seller.profileImage ? (
              <img
                src={seller.profileImage}
                alt={seller.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2"
                style={{ borderColor: 'var(--border-default)' }}
              />
            ) : (
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                <UserIcon size={40} className="text-[var(--text-secondary)]" />
              </div>
            )}
            {seller.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                <BadgeCheck size={18} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                {seller.name}
              </h1>
              {seller.isVerified && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold">
                  Onaylı
                </span>
              )}
            </div>

            {seller.bio && (
              <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">
                {seller.bio}
              </p>
            )}

            <div className="mt-3 flex items-center gap-4 flex-wrap justify-center sm:justify-start text-sm text-[var(--text-secondary)]">
              {seller.averageRating > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={14} className="fill-[var(--accent-orange)] text-[var(--accent-orange)]" />
                  <span className="font-semibold text-[var(--text-primary)]">
                    {seller.averageRating.toFixed(1)}
                  </span>
                  <span>({seller.totalRatings})</span>
                </span>
              )}
              {seller.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Üyelik: {formatDate(seller.createdAt)}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div
                className="rounded-xl p-3 text-center"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                <Package size={16} className="mx-auto mb-1 text-[var(--text-secondary)]" />
                <div className="text-lg font-bold text-[var(--text-primary)]">{listings.length}</div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">İlan</div>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                <Eye size={16} className="mx-auto mb-1 text-[var(--text-secondary)]" />
                <div className="text-lg font-bold text-[var(--text-primary)]">{totalViews}</div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Görüntülenme</div>
              </div>
              <div
                className="rounded-xl p-3 text-center col-span-2 sm:col-span-1"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                <Star size={16} className="mx-auto mb-1 text-[var(--text-secondary)]" />
                <div className="text-lg font-bold text-[var(--text-primary)]">
                  {seller.averageRating > 0 ? seller.averageRating.toFixed(1) : '-'}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Puan</div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2 justify-center sm:justify-start">
              {authUser?.userId !== seller.userId && (
                <button
                  onClick={handleMessage}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
                  style={{
                    backgroundColor: 'var(--accent-green)',
                    color: 'white',
                  }}
                >
                  <MessageCircle size={16} />
                  Mesaj Gönder
                </button>
              )}
              <Link
                to={`/profil/${seller.userId}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border transition-colors"
                style={{
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                <UserIcon size={16} />
                Profil
              </Link>
              <button
                onClick={() => {
                  const url = window.location.href;
                  if (navigator.share) {
                    navigator.share({ title: `${seller.name} - HasatLink Mağaza`, url });
                  } else {
                    navigator.clipboard.writeText(url);
                    toast.success('Mağaza linki kopyalandı!');
                  }
                }}
                className="flex items-center justify-center w-10 h-10 rounded-xl border transition-colors"
                style={{ borderColor: 'var(--border-default)' }}
                title="Paylaş"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={() => {
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`;
                  window.open(qrUrl, '_blank');
                }}
                className="flex items-center justify-center w-10 h-10 rounded-xl border transition-colors"
                style={{ borderColor: 'var(--border-default)' }}
                title="QR Kod"
              >
                <QrCode size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {CATEGORY_TABS.map(tab => {
          const count = tab.key === 'hepsi'
            ? listings.length
            : listings.filter(l => l.type === tab.key).length;
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all border"
              style={{
                backgroundColor: isActive ? 'var(--accent-green)' : 'var(--bg-surface)',
                color: isActive ? 'white' : 'var(--text-primary)',
                borderColor: isActive ? 'var(--accent-green)' : 'var(--border-default)',
              }}
            >
              {tab.label}
              <span className="ml-1.5 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Bulk Offer CTA */}
      {authUser && authUser.userId !== seller.userId && listings.length > 0 && (
        <div className="rounded-2xl p-4 border flex items-center gap-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <div className="w-10 h-10 rounded-xl bg-[#E76F00]/10 flex items-center justify-center shrink-0">
            <ShoppingCart size={20} className="text-[#E76F00]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">Toplu Alım Talebi</h3>
            <p className="text-[10px] text-[var(--text-secondary)]">Bu satıcının birden fazla ürünü için toplu teklif gönderin</p>
          </div>
          <button
            onClick={async () => {
              try {
                await api.post('/demands', {
                  category: 'pazar',
                  subCategory: 'Toplu Alım',
                  description: `${seller.name} mağazasından toplu alım talebi`,
                  sellerId: seller.userId,
                });
                toast.success('Toplu alım talebiniz satıcıya iletildi!');
              } catch { toast.error('Talep gönderilemedi'); }
            }}
            className="shrink-0 px-4 py-2.5 bg-[#E76F00] text-white rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            Teklif Gönder
          </button>
        </div>
      )}

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <EmptyState
          icon={<Package size={32} />}
          title="İlan bulunamadı"
          description={
            filter === 'hepsi'
              ? 'Bu satıcının henüz aktif ilanı yok.'
              : 'Bu kategoride ilan bulunamadı.'
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredListings.map(listing => (
            <Link
              key={listing._id}
              to={`/ilan/${listing._id}`}
              className="rounded-2xl overflow-hidden border transition-transform hover:-translate-y-0.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
              }}
            >
              <div
                className="aspect-square w-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                {listing.images?.[0] ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={32} className="text-[var(--text-secondary)]" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
                  {listing.type}
                </div>
                <h3 className="mt-1 text-sm font-semibold text-[var(--text-primary)] line-clamp-2">
                  {listing.title}
                </h3>
                <div className="mt-2 text-base font-bold text-[var(--accent-green)]">
                  {formatPrice(listing.price)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
