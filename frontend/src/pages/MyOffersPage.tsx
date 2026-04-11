import { useEffect, useState, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Inbox, Send, Check, X, Clock, HandCoins, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SEO from '../components/ui/SEO';
import { formatPrice, timeAgo } from '../utils/formatters';
import type { Offer } from '../types';
import toast from 'react-hot-toast';

type Tab = 'sent' | 'received';

const STATUS_STYLES: Record<Offer['status'], { bg: string; text: string; label: string; icon: typeof Clock }> = {
  pending: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', label: 'Bekliyor', icon: Clock },
  accepted: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', label: 'Kabul Edildi', icon: Check },
  rejected: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Reddedildi', icon: X },
};

export default function MyOffersPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('sent');
  const [sentOffers, setSentOffers] = useState<Offer[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSent = useCallback(async () => {
    try {
      const { data } = await api.get('/offers/my');
      setSentOffers(Array.isArray(data) ? data : (data?.offers || []));
    } catch {
      setSentOffers([]);
    }
  }, []);

  const fetchReceived = useCallback(async () => {
    if (!user) return;
    try {
      // Get all user's active listings, then fetch offers per listing
      const listingsRes = await api.get('/listings', { params: { userId: user.userId } });
      const listings = Array.isArray(listingsRes.data) ? listingsRes.data : (listingsRes.data?.listings || []);
      const all: Offer[] = [];
      await Promise.all(
        listings.map(async (l: { _id: string }) => {
          try {
            const { data } = await api.get(`/offers/listing/${l._id}`);
            const items: Offer[] = Array.isArray(data) ? data : (data?.offers || []);
            all.push(...items);
          } catch {}
        })
      );
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReceivedOffers(all);
    } catch {
      setReceivedOffers([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const p = tab === 'sent' ? fetchSent() : fetchReceived();
    p.finally(() => setLoading(false));
  }, [user, tab, fetchSent, fetchReceived]);

  if (!authLoading && !user) return <Navigate to="/giris" replace />;
  if (authLoading) return <LoadingSpinner size="lg" className="py-20" />;

  const handleStatus = async (offerId: string, status: 'accepted' | 'rejected') => {
    setUpdatingId(offerId);
    try {
      await api.put(`/offers/${offerId}/status`, { status });
      setReceivedOffers(prev =>
        prev.map(o => (o._id === offerId ? { ...o, status } : o))
      );
      toast.success(status === 'accepted' ? 'Teklif kabul edildi' : 'Teklif reddedildi');
    } catch {
      toast.error('İşlem başarısız');
    } finally {
      setUpdatingId(null);
    }
  };

  const offers = tab === 'sent' ? sentOffers : receivedOffers;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <SEO
        title="Tekliflerim"
        description="Gönderdiğiniz ve aldığınız teklifleri yönetin."
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <HandCoins size={22} className="text-[var(--accent-green)]" />
          Tekliflerim
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Gönderdiğiniz ve aldığınız teklifleri buradan takip edin.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex p-1 rounded-2xl border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
      >
        {([
          { key: 'sent', label: 'Gönderdiğim', icon: Send, count: sentOffers.length },
          { key: 'received', label: 'Aldığım', icon: Inbox, count: receivedOffers.length },
        ] as const).map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                backgroundColor: active ? 'var(--accent-green)' : 'transparent',
                color: active ? 'white' : 'var(--text-secondary)',
              }}
            >
              <Icon size={16} />
              {t.label}
              {t.count > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'var(--bg-input)',
                    color: active ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner size="md" className="py-12" />
      ) : offers.length === 0 ? (
        <EmptyState
          icon={tab === 'sent' ? <Send size={32} /> : <Inbox size={32} />}
          title={tab === 'sent' ? 'Henüz teklif göndermediniz' : 'Henüz teklif almadınız'}
          description={
            tab === 'sent'
              ? 'İlanlara yaptığınız teklifler burada görünecek.'
              : 'İlanlarınıza gelen teklifler burada görünecek.'
          }
        />
      ) : (
        <div className="space-y-3">
          {offers.map(offer => {
            const statusStyle = STATUS_STYLES[offer.status];
            const StatusIcon = statusStyle.icon;
            const isReceived = tab === 'received';
            const isPending = offer.status === 'pending';
            return (
              <div
                key={offer._id}
                className="rounded-2xl p-4 border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/ilan/${offer.listingId}`}
                      className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-green)] transition-colors line-clamp-1"
                    >
                      {offer.listingTitle}
                    </Link>
                    <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      {isReceived ? `${offer.fromUserName} teklif verdi` : 'Teklifiniz'} · {timeAgo(offer.createdAt)}
                    </div>
                  </div>
                  <span
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shrink-0"
                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                  >
                    <StatusIcon size={11} />
                    {statusStyle.label}
                  </span>
                </div>

                {/* Offer price */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[var(--accent-green)]">
                    {formatPrice(offer.offerPrice)}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">teklif</span>
                </div>

                {/* Message */}
                {offer.message && (
                  <div
                    className="mt-3 rounded-xl p-3 flex gap-2"
                    style={{ backgroundColor: 'var(--bg-input)' }}
                  >
                    <MessageSquare size={14} className="text-[var(--text-secondary)] shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                      {offer.message}
                    </p>
                  </div>
                )}

                {/* Actions (only received + pending) */}
                {isReceived && isPending && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleStatus(offer._id, 'accepted')}
                      disabled={updatingId === offer._id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: 'var(--accent-green)', color: 'white' }}
                    >
                      <Check size={14} />
                      Kabul Et
                    </button>
                    <button
                      onClick={() => handleStatus(offer._id, 'rejected')}
                      disabled={updatingId === offer._id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-60"
                      style={{
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <X size={14} />
                      Reddet
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
