import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, MapPin, TrendingUp, TrendingDown, Droplets, Wind, Cloud,
  BarChart3, ShoppingBag, PackageOpen, Search, Wheat, Truck, HardHat,
  Tractor, Mountain, Warehouse, Users, Building2, Layers,
  UserPlus, MessageCircle,
} from 'lucide-react';
import { useListings } from '../hooks/useListings';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useHalPrices } from '../hooks/useHalPrices';
import { useHasatlinkPazar } from '../hooks/useHasatlinkPazar';
import { useWeather } from '../hooks/useWeather';
import { useInView } from '../hooks/useInView';
import { useCountUp } from '../hooks/useCountUp';
import ListingCard from '../components/listings/ListingCard';
import AIDiagnosisPanel from '../components/ai/AIDiagnosisPanel';
import ListingMap from '../components/map/ListingMap';
import { CATEGORY_LABELS } from '../utils/constants';
import SEO from '../components/ui/SEO';
import api from '../config/api';

function AnimatedSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, inView } = useInView(0.15);
  return (
    <div ref={ref} className={`reveal-section ${inView ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  );
}

function StatCounter({ end, suffix, label, icon }: { end: number; suffix: string; label: string; icon: ReactNode }) {
  const { ref, inView } = useInView(0.3);
  const value = useCountUp(end, 2000, inView);
  return (
    <div ref={ref} className="bg-[var(--bg-surface)] rounded-2xl p-5 shadow-sm border border-[var(--border-default)] text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
        {value.toLocaleString()}{suffix}
      </p>
      <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">{label}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-surface)] rounded-[2rem] overflow-hidden shadow-sm">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-2/3 skeleton rounded-lg" />
          <div className="h-4 w-16 skeleton rounded-lg" />
        </div>
        <div className="h-3 w-1/3 skeleton rounded-lg" />
        <div className="flex gap-1.5">
          <div className="h-5 w-14 skeleton rounded-full" />
          <div className="h-5 w-16 skeleton rounded-full" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-24 skeleton rounded-lg" />
          <div className="h-3 w-16 skeleton rounded-lg" />
        </div>
      </div>
    </div>
  );
}

const CATEGORY_ICONS: Record<string, ReactNode> = {
  pazar: <Wheat size={28} />,
  lojistik: <Truck size={28} />,
  isgucu: <HardHat size={28} />,
  ekipman: <Tractor size={28} />,
  arazi: <Mountain size={28} />,
  depolama: <Warehouse size={28} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  pazar: '#2D6A4F',
  lojistik: '#0077B6',
  isgucu: '#A47148',
  ekipman: '#6B4E3D',
  arazi: '#52796F',
  depolama: '#5C677D',
};

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { listings, loading, fetchListings } = useListings();
  const { allPrices, fetchAllPrices } = useHalPrices();
  const { prices: hasatlinkPrices, fetchPrices: fetchHasatlinkPrices } = useHasatlinkPazar();
  const { weather, fetchWeather } = useWeather();
  const { location: geoLocation } = useLocation();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const [platformStats, setPlatformStats] = useState({ activeListings: 0, registeredUsers: 0, cities: 0, aiDiagnoses: 0, categoryCounts: {} as Record<string, number> });
  const [heroSearch, setHeroSearch] = useState('');
  const [heroCategory, setHeroCategory] = useState('');

  // Critical: listings + weather load immediately
  useEffect(() => {
    fetchListings({ limit: '8' });
    if (geoLocation?.lat && geoLocation?.lng) {
      fetchWeather(geoLocation.lat, geoLocation.lng);
    } else {
      const city = geoLocation?.city || user?.location?.split(',')[0]?.trim();
      if (city) fetchWeather(city);
    }
  }, [fetchListings, fetchWeather, user, geoLocation]);

  // Non-critical: prices + stats lazy load after 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllPrices();
      fetchHasatlinkPrices();
      api.get('/stats/platform').then(({ data }) => setPlatformStats(data)).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAllPrices, fetchHasatlinkPrices]);

  // Top pazar products for comparison (pick 6 popular ones)
  const popularProducts = ['Domates', 'Biber', 'Patlıcan', 'Salatalık', 'Soğan', 'Patates'];
  const comparisonPrices = popularProducts
    .map(name => allPrices.find(p => p.name.toLowerCase().includes(name.toLowerCase())))
    .filter(Boolean) as typeof allPrices;

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = heroCategory || 'pazar';
    const params = heroSearch.trim() ? `?search=${encodeURIComponent(heroSearch.trim())}` : '';
    navigate(`/${cat}${params}`);
  };

  return (
    <div className="animate-fade-in">
      <SEO
        title={lang === 'tr' ? 'Ana Sayfa' : 'Home'}
        description={lang === 'tr' ? 'Türkiye\'nin en kapsamlı tarım pazaryeri. Ürün alın, satın, lojistik bulun, ekipman kiralayın.' : 'Turkey\'s most comprehensive agricultural marketplace.'}
        keywords={lang === 'tr' ? 'tarım, pazar, çiftçi, hasatlink, ürün, lojistik, ekipman, arazi' : 'agriculture, marketplace, farmer, hasatlink, products, logistics, equipment, land'}
        ogImage="/icons/icon.svg"
      />

      {/* ─── 1. Hero Banner ─── */}
      <section className="relative bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#A47148] rounded-full blur-3xl animate-float-slow-reverse" />
        </div>
        <div className="max-w-4xl mx-auto px-4 relative text-center">
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4 animate-slide-up"
            style={{ animationDelay: '0ms', animationFillMode: 'both' }}
          >
            {lang === 'tr' ? "Türkiye'nin Tarım Pazaryeri" : "Turkey's Agricultural Marketplace"}
          </h1>
          <p
            className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto animate-slide-up"
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
          >
            {lang === 'tr' ? 'Binlerce çiftçi ve alıcı burada buluşuyor' : 'Thousands of farmers and buyers meet here'}
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="flex flex-col sm:flex-row items-stretch gap-2 max-w-2xl mx-auto animate-slide-up"
            style={{ animationDelay: '200ms', animationFillMode: 'both' }}
          >
            <select
              value={heroCategory}
              onChange={e => setHeroCategory(e.target.value)}
              className="px-4 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 sm:w-40"
            >
              <option value="" className="text-gray-900">{lang === 'tr' ? 'Tümü' : 'All'}</option>
              {Object.entries(CATEGORY_LABELS).map(([key, cat]) => (
                <option key={key} value={key} className="text-gray-900">{cat[lang]}</option>
              ))}
            </select>
            <div className="relative flex-1">
              <input
                type="text"
                value={heroSearch}
                onChange={e => setHeroSearch(e.target.value)}
                placeholder={lang === 'tr' ? 'İlan, ürün veya hizmet ara...' : 'Search listings, products or services...'}
                className="w-full px-5 py-3.5 pl-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 bg-white text-[#1B4332] font-semibold text-sm rounded-xl hover:bg-white/90 transition-colors"
            >
              {lang === 'tr' ? 'Ara' : 'Search'}
            </button>
          </form>
        </div>
      </section>

      {/* ─── 2. Trust Badges (Stats Row) ─── */}
      <AnimatedSection>
        <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCounter
              end={platformStats.activeListings}
              suffix=""
              label={lang === 'tr' ? 'Toplam İlan' : 'Total Listings'}
              icon={<Layers size={22} className="text-[#2D6A4F]" />}
            />
            <StatCounter
              end={platformStats.registeredUsers}
              suffix=""
              label={lang === 'tr' ? 'Kayıtlı Kullanıcı' : 'Registered Users'}
              icon={<Users size={22} className="text-[#0077B6]" />}
            />
            <StatCounter
              end={platformStats.cities}
              suffix=""
              label={lang === 'tr' ? 'Aktif Şehir' : 'Active Cities'}
              icon={<Building2 size={22} className="text-[#A47148]" />}
            />
            <StatCounter
              end={6}
              suffix=""
              label={lang === 'tr' ? 'Kategori' : 'Categories'}
              icon={<BarChart3 size={22} className="text-[#52796F]" />}
            />
          </div>
        </section>
      </AnimatedSection>

      {/* ─── 3. Category Grid with Lucide Icons ─── */}
      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8">
            {lang === 'tr' ? 'Kategoriler' : 'Categories'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(CATEGORY_LABELS).map(([key, cat]) => {
              const count = platformStats.categoryCounts[key] || 0;
              const color = CATEGORY_COLORS[key] || '#2D6A4F';
              return (
                <Link
                  key={key}
                  to={`/${key}`}
                  className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200 group text-center"
                >
                  <div className="flex justify-center mb-3" style={{ color }}>
                    {CATEGORY_ICONS[key]}
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight mb-1">{cat[lang]}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {count} {lang === 'tr' ? 'ilan' : 'listings'}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </AnimatedSection>

      {/* ─── 4. Nasıl Çalışır (How It Works) ─── */}
      <AnimatedSection>
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-10">
            {lang === 'tr' ? 'Nasıl Çalışır?' : 'How It Works?'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-[#2D6A4F]/20" />

            {[
              {
                icon: <UserPlus size={28} />,
                title: lang === 'tr' ? 'Ücretsiz Kayıt Ol' : 'Sign Up Free',
                desc: lang === 'tr' ? 'Hızlıca hesap oluşturun ve platforma katılın.' : 'Quickly create an account and join the platform.',
              },
              {
                icon: <Search size={28} />,
                title: lang === 'tr' ? 'İlan Ver veya Ara' : 'Post or Search',
                desc: lang === 'tr' ? 'Ürün, hizmet veya ekipman ilanı verin ya da arayın.' : 'Post or search for products, services, or equipment.',
              },
              {
                icon: <MessageCircle size={28} />,
                title: lang === 'tr' ? 'Doğrudan İletişime Geç' : 'Contact Directly',
                desc: lang === 'tr' ? 'Alıcı ve satıcılarla doğrudan bağlantı kurun.' : 'Connect directly with buyers and sellers.',
              },
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#A47148] text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {step.icon}
                </div>
                <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[var(--text-secondary)] mt-8">
            {lang === 'tr'
              ? 'HasatLink alım-satım sürecine dahil olmaz, yalnızca kullanıcıları buluşturur.'
              : 'HasatLink does not participate in transactions, it only connects users.'}
          </p>
        </section>
      </AnimatedSection>

      {/* ─── 5. Weather + Hal Fiyatları + HasatLink Pazarı ─── */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hava Durumu */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Cloud size={14} className="text-[#0077B6]" />
                <h3 className="text-xs font-semibold tracking-tight">{t('weather.title')}</h3>
              </div>
              {weather ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-[var(--text-secondary)]">{weather.city}</p>
                    <p className="text-3xl font-semibold tracking-tight">{weather.temp}°C</p>
                    <p className="text-[11px] text-[var(--text-secondary)] capitalize">{weather.description}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]"><Droplets size={10} />{weather.humidity}%</span>
                      <span className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]"><Wind size={10} />{weather.windSpeed} km/h</span>
                    </div>
                  </div>
                  {weather.icon && (
                    <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt={weather.description} className="w-16 h-16" />
                  )}
                </div>
              ) : (
                <div className="h-20 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
              )}
            </div>

            {/* Hal Fiyatları */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#2D6A4F]" />
                  <h3 className="text-sm font-semibold tracking-tight">
                    {lang === 'tr' ? 'Hal Fiyatları' : 'Market Hall'}
                  </h3>
                </div>
                <Link to="/hal-fiyatlari" className="text-[10px] font-medium text-[#2D6A4F] uppercase hover:text-[#40916C]">
                  {t('all')} →
                </Link>
              </div>
              {comparisonPrices.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center text-[10px] font-medium uppercase text-[var(--text-secondary)] pb-1 border-b border-[var(--border-default)]">
                    <span className="flex-1">{lang === 'tr' ? 'Ürün' : 'Product'}</span>
                    <span className="w-14 text-right">Min</span>
                    <span className="w-14 text-right">Max</span>
                    <span className="w-12 text-right">%</span>
                  </div>
                  {comparisonPrices.slice(0, 5).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => navigate('/hal-fiyatlari')}
                      className="w-full flex items-center py-1.5 hover:bg-[var(--bg-surface-hover,rgba(0,0,0,0.03))] rounded-lg transition-colors px-1 -mx-1"
                    >
                      <span className="flex-1 text-sm text-[var(--text-primary)] text-left truncate">{p.name}</span>
                      <span className="w-14 text-right text-xs text-[#2D6A4F] font-medium">
                        {p.minPrice?.toFixed(1)}₺
                      </span>
                      <span className="w-14 text-right text-xs text-[#C1341B] font-medium">
                        {p.maxPrice?.toFixed(1)}₺
                      </span>
                      <span className={`w-12 text-right flex items-center justify-end gap-0.5 text-xs font-medium ${
                        p.change >= 0 ? 'text-[#2D6A4F]' : 'text-[#C1341B]'
                      }`}>
                        {p.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {p.change >= 0 ? '+' : ''}{p.change.toFixed(1)}%
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-5 skeleton rounded animate-pulse" />
                  ))}
                </div>
              )}
            </div>

            {/* HasatLink Pazarı */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-[#A47148]" />
                  <h3 className="text-sm font-semibold tracking-tight">
                    {lang === 'tr' ? 'HasatLink Pazarı' : 'HasatLink Market'}
                  </h3>
                </div>
                <Link to="/hasatlink-pazari" className="text-[10px] font-medium text-[#A47148] uppercase hover:text-[#C4863A]">
                  {t('all')} →
                </Link>
              </div>
              {hasatlinkPrices.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center text-[10px] font-medium uppercase text-[var(--text-secondary)] pb-1 border-b border-[var(--border-default)]">
                    <span className="flex-1">{lang === 'tr' ? 'Ürün' : 'Product'}</span>
                    <span className="w-14 text-right">Min</span>
                    <span className="w-14 text-right">Max</span>
                    <span className="w-12 text-right">%</span>
                  </div>
                  {hasatlinkPrices.slice(0, 5).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => navigate('/hasatlink-pazari')}
                      className="w-full flex items-center py-1.5 hover:bg-[var(--bg-surface-hover,rgba(0,0,0,0.03))] rounded-lg transition-colors px-1 -mx-1"
                    >
                      <span className="flex-1 text-sm text-[var(--text-primary)] text-left truncate">{p.name}</span>
                      <span className="w-14 text-right text-xs text-[#2D6A4F] font-medium">
                        {p.minPrice.toFixed(1)}₺
                      </span>
                      <span className="w-14 text-right text-xs text-[#C1341B] font-medium">
                        {p.maxPrice.toFixed(1)}₺
                      </span>
                      <span className={`w-12 text-right flex items-center justify-end gap-0.5 text-xs font-medium ${
                        p.change >= 0 ? 'text-[#2D6A4F]' : 'text-[#C1341B]'
                      }`}>
                        {p.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {p.change >= 0 ? '+' : ''}{p.change.toFixed(1)}%
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <ShoppingBag size={24} className="text-[var(--text-secondary)] mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    {lang === 'tr' ? 'İlan verisi bekleniyor...' : 'Waiting for listings...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ─── 6. Featured Listings ─── */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">{lang === 'tr' ? 'Öne Çıkan İlanlar' : 'Featured Listings'}</h2>
            <Link to="/pazar" className="text-xs font-medium uppercase text-[#2D6A4F] flex items-center gap-1 hover:gap-2 transition-all">
              {t('all')} <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-12 text-center">
              <PackageOpen size={48} className="text-[var(--text-secondary)] mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">{lang === 'tr' ? 'Henüz ilan eklenmedi' : 'No listings yet'}</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {lang === 'tr' ? 'İlk ilanı sen oluştur!' : 'Be the first to create a listing!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {listings.slice(0, 4).map((listing, index) => (
                <div
                  key={listing._id}
                  className="card-enter"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          )}
        </section>
      </AnimatedSection>

      {/* ─── 7. AI + Map Section ─── */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIDiagnosisPanel />
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[2.5rem] p-4 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-3 px-2">
                <MapPin size={16} className="text-[#2D6A4F]" />
                <h3 className="text-lg font-semibold tracking-tight">{t('map.title')}</h3>
                <Link to="/harita" className="ml-auto text-[10px] font-medium text-[#2D6A4F] uppercase">
                  {t('all')} &rarr;
                </Link>
              </div>
              <div className="h-[300px] rounded-2xl overflow-hidden">
                <ListingMap listings={listings} />
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
