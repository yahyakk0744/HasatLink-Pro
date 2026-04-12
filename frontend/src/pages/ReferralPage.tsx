import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Copy, Share2, Users, Award, Check, Clock, ArrowLeft } from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../hooks/useFeatures';
import toast from 'react-hot-toast';

interface Referral {
  _id: string;
  refereeId: string;
  refereeEmail: string;
  status: 'pending' | 'registered' | 'verified' | 'rewarded';
  rewardPoints: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Bekliyor', color: 'text-amber-500', icon: Clock },
  registered: { label: 'Kayıt Oldu', color: 'text-blue-500', icon: Check },
  verified: { label: 'Doğrulandı', color: 'text-green-500', icon: Check },
  rewarded: { label: 'Ödül Verildi', color: 'text-green-600', icon: Award },
};

export default function ReferralPage() {
  const { user } = useAuth();
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalRewarded, setTotalRewarded] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/referrals/my-code'),
      api.get('/referrals/my'),
    ])
      .then(([codeRes, refRes]) => {
        setCode(codeRes.data.code);
        setLink(codeRes.data.link);
        setReferrals(refRes.data.referrals || []);
        setTotalRewarded(refRes.data.totalRewarded || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link kopyalandı!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopyalanamadı');
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HasatLink\'e katıl!',
          text: `HasatLink ile tarım ürünlerini al-sat. Davet kodum: ${code}`,
          url: link,
        });
      } catch { /* user cancelled */ }
    } else {
      copyLink();
    }
  };

  if (!featuresLoading && !isEnabled('referralProgram')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Gift size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">Davet Sistemi Yakında</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Arkadaşlarını davet et, puan kazan. Yakında aktif olacak!
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Gift size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">Davet Sistemi</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-4">Davet linkinizi görmek için giriş yapın</p>
        <Link to="/giris" className="inline-block px-5 py-2 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] transition-colors">
          Giriş Yap
        </Link>
      </div>
    );
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <SEO title="Arkadaşını Davet Et - HasatLink" description="Arkadaşlarını HasatLink'e davet et, puan kazan." />

      <Link
        to="/profil"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[#2D6A4F] mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Profilim
      </Link>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#2D6A4F] to-[#40916C] text-white rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Gift size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Arkadaşını Davet Et</h1>
            <p className="text-sm text-white/80">Her davet için puan kazan</p>
          </div>
        </div>

        {/* Code */}
        <div className="bg-white/10 rounded-xl p-4 mb-4">
          <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Davet Kodun</p>
          <p className="text-2xl font-bold tracking-widest">{code}</p>
        </div>

        {/* Link + Actions */}
        <div className="bg-white/10 rounded-xl p-3 flex items-center gap-2 mb-4">
          <p className="flex-1 text-xs text-white/80 truncate">{link}</p>
          <button
            onClick={copyLink}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors shrink-0"
            title="Kopyala"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <button
          onClick={shareLink}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#2D6A4F] rounded-2xl text-sm font-bold hover:bg-white/90 transition-colors"
        >
          <Share2 size={16} />
          Davet Linkini Paylaş
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{referrals.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mt-1">Toplam Davet</p>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{referrals.filter(r => r.status === 'rewarded').length}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mt-1">Ödüllü</p>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{totalRewarded}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mt-1">Kazanılan Puan</p>
        </div>
      </div>

      {/* Referral List */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
        Davet Edilen Kişiler
      </h2>

      {referrals.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
          <Users size={32} className="mx-auto text-[var(--text-secondary)] mb-2 opacity-50" />
          <p className="text-sm text-[var(--text-secondary)]">Henüz davet ettiğin kimse yok</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Linkini paylaş, arkadaşların kayıt olsun!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {referrals.map(ref => {
            const st = STATUS_LABELS[ref.status] || STATUS_LABELS.pending;
            const StIcon = st.icon;
            return (
              <div key={ref._id} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{ref.refereeEmail || 'Kullanıcı'}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {new Date(ref.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${st.color}`}>
                  <StIcon size={14} />
                  {st.label}
                  {ref.status === 'rewarded' && (
                    <span className="text-[10px] text-[var(--text-secondary)]">+{ref.rewardPoints} puan</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
