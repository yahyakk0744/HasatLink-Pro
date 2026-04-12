import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Check, Star, TrendingUp, Shield, Zap, Eye, Megaphone, BarChart3, ArrowRight } from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useFeatures } from '../hooks/useFeatures';
import { useAuth } from '../contexts/AuthContext';
import type { PremiumPackage } from '../types';
import { formatPrice } from '../utils/formatters';

const DEFAULT_BENEFITS = [
  { icon: Star, label: 'Öne Çıkan İlanlar', desc: 'İlanlarınız listelerin başında gösterilir' },
  { icon: Eye, label: 'Sınırsız İlan Görüntüleme', desc: 'Tüm ilanların iletişim bilgilerine erişin' },
  { icon: TrendingUp, label: 'Pazar Analiz Raporları', desc: 'Aylık fiyat trendleri ve talep raporları' },
  { icon: Megaphone, label: 'Öncelikli Destek', desc: '7/24 öncelikli müşteri desteği' },
  { icon: Shield, label: 'Onaylı Satıcı Rozeti', desc: 'Profilinizde güvenilir satıcı işareti' },
  { icon: BarChart3, label: 'Detaylı İstatistikler', desc: 'İlanlarınızın performansını takip edin' },
  { icon: Zap, label: 'Erken Erişim', desc: 'Yeni özelliklere ilk siz erişin' },
];

export default function PremiumPage() {
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const { user } = useAuth();
  const [packages, setPackages] = useState<PremiumPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => {
        const pkgs = data.premiumMembership?.packages || [];
        setPackages(pkgs);
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  if (!featuresLoading && !isEnabled('premiumMembership')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Crown size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">Premium Yakında</h1>
        <p className="text-sm text-[var(--text-secondary)]">Premium üyelik planları yakında burada olacak.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <SEO title="Premium Üyelik - HasatLink" description="HasatLink Premium ile ilanlarınızı öne çıkarın, detaylı analizlere erişin." />

      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/20">
          <Crown size={40} className="text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          HasatLink <span className="bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">Premium</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
          Tarım ticaretinde bir adım öne geçin. Premium üyelikle ilanlarınızı öne çıkarın,
          pazar analizlerine erişin ve güvenilir satıcı rozeti kazanın.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {DEFAULT_BENEFITS.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 hover:border-amber-400/30 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                <Icon size={20} className="text-amber-500" />
              </div>
              <h3 className="text-sm font-bold mb-1">{b.label}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{b.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Packages */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : packages.length > 0 ? (
        <>
          <h2 className="text-xl font-bold text-center mb-6">Paketler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {packages.map((pkg, i) => {
              const isPopular = i === 1 || packages.length === 1;
              return (
                <div
                  key={pkg._id || i}
                  className={`relative bg-[var(--bg-surface)] border rounded-2xl p-6 transition-all ${
                    isPopular
                      ? 'border-amber-400 shadow-lg shadow-amber-500/10 scale-[1.02]'
                      : 'border-[var(--border-default)] hover:border-amber-400/30'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                      Popüler
                    </span>
                  )}
                  <h3 className="text-lg font-bold mb-1">{pkg.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">
                    {pkg.durationDays} gün
                  </p>
                  <div className="mb-5">
                    <span className="text-3xl font-bold text-amber-500">{formatPrice(pkg.price)}</span>
                    <span className="text-xs text-[var(--text-secondary)] ml-1">
                      / {pkg.durationDays >= 30 ? 'ay' : `${pkg.durationDays} gün`}
                    </span>
                  </div>
                  {pkg.features?.length > 0 && (
                    <ul className="space-y-2 mb-5">
                      {pkg.features.map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-xs">
                          <Check size={14} className="text-green-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    to={user ? '/iletisim' : '/giris'}
                    className={`block w-full text-center px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                      isPopular
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white hover:from-amber-600 hover:to-yellow-500'
                        : 'bg-[var(--bg-input)] hover:bg-amber-500/10 text-[var(--text-primary)]'
                    }`}
                  >
                    {user ? 'Başvur' : 'Giriş Yap'}
                    <ArrowRight size={14} className="inline ml-1" />
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] mb-12">
          <Crown size={36} className="mx-auto text-amber-400 mb-3 opacity-60" />
          <p className="text-sm text-[var(--text-secondary)]">Premium paketler yakında açıklanacak</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Bilgilendirilmek için takipte kalın</p>
        </div>
      )}

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">Sıkça Sorulan Sorular</h2>
        <div className="space-y-3">
          {[
            { q: 'Premium üyelik nasıl başlar?', a: 'İletişim sayfasından başvurunuzu gönderin, ekibimiz sizinle iletişime geçecektir.' },
            { q: 'Ücretsiz deneme var mı?', a: 'Hayır, ancak mevcut tüm temel özellikler ücretsiz kullanılabilir.' },
            { q: 'İptal edebilir miyim?', a: 'Evet, süre sonunda otomatik yenileme yoktur. İstediğiniz zaman bırakabilirsiniz.' },
            { q: 'Ödeme nasıl yapılır?', a: 'Banka havalesi veya EFT ile ödeme kabul edilmektedir. Detaylar başvuru sonrasında iletilir.' },
          ].map((faq, i) => (
            <details key={i} className="group bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl">
              <summary className="px-5 py-4 text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
                {faq.q}
                <ArrowRight size={14} className="text-[var(--text-secondary)] group-open:rotate-90 transition-transform" />
              </summary>
              <p className="px-5 pb-4 text-xs text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
