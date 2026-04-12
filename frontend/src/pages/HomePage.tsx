import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, MapPin, TrendingUp, TrendingDown, Droplets, Wind, Cloud,
  BarChart3, ShoppingBag, PackageOpen, Search, Wheat, Truck, HardHat,
  Tractor, Mountain, Warehouse, Users, Building2, Layers,
  UserPlus, MessageCircle, AlertTriangle, Plus, Sparkles,
  Package, Wrench,
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
import ListingMap from '../components/map/ListingMap';
import BannerCarousel from '../components/ads/BannerCarousel';
import ListingForm from '../components/listings/ListingForm';
import FAB from '../components/ui/FAB';
import { CATEGORY_LABELS, ALL_SUBCATEGORIES } from '../utils/constants';
import SEO from '../components/ui/SEO';
import JsonLd from '../components/ui/JsonLd';
import api from '../config/api';
import type { Blog, Listing } from '../types';
import { Calendar, User as UserIcon } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

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
    <div ref={ref} className="surface-card-hover rounded-2xl p-3 md:p-5 text-center">
      <div className="flex justify-center mb-1 md:mb-2">{icon}</div>
      <p className="text-xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
        {value.toLocaleString()}{suffix}
      </p>
      <p className="text-[10px] md:text-xs font-medium text-[var(--text-secondary)] mt-0.5 md:mt-1">{label}</p>
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
  pazar: <Wheat size={28} strokeWidth={1.5} />,
  lojistik: <Truck size={28} strokeWidth={1.5} />,
  isgucu: <HardHat size={28} strokeWidth={1.5} />,
  ekipman: <Tractor size={28} strokeWidth={1.5} />,
  arazi: <Mountain size={28} strokeWidth={1.5} />,
  depolama: <Warehouse size={28} strokeWidth={1.5} />,
  hayvancilik: <span className="text-[26px] leading-none">🐄</span>,
};

const CATEGORY_COLORS: Record<string, string> = {
  pazar: '#2D6A4F',
  lojistik: '#0077B6',
  isgucu: '#A47148',
  ekipman: '#6B4E3D',
  arazi: '#52796F',
  depolama: '#5C677D',
  hayvancilik: '#C1341B',
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
  const [blogPosts, setBlogPosts] = useState<Blog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showEntrySheet, setShowEntrySheet] = useState(false);
  const [formInitialType, setFormInitialType] = useState<Listing['type']>('pazar');
  const [geoFilterEnabled, setGeoFilterEnabled] = useState(false);
  const [geoRadius, setGeoRadius] = useState(50);

  useEffect(() => {
    const userCity = geoLocation?.city || user?.location?.split(',').pop()?.trim() || '';
    const listingParams: Record<string, string> = { limit: '8' };
    if (userCity) listingParams.city = userCity;
    fetchListings(listingParams);
    if (geoLocation?.lat && geoLocation?.lng) {
      fetchWeather(geoLocation.lat, geoLocation.lng);
    } else {
      const city = geoLocation?.city || user?.location?.split(',')[0]?.trim();
      if (city) fetchWeather(city);
    }
  }, [fetchListings, fetchWeather, user, geoLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllPrices();
      fetchHasatlinkPrices();
      // Render free tier may sleep — retry up to 3 times with delay
      const fetchStats = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const { data } = await api.get('/stats/platform');
            setPlatformStats(data);
            try { localStorage.setItem('hasatlink_stats', JSON.stringify(data)); } catch {}
            return;
          } catch {
            if (i < retries - 1) await new Promise(r => setTimeout(r, 3000));
          }
        }
        // Fallback: show cached stats if API unreachable
        try {
          const cached = localStorage.getItem('hasatlink_stats');
          if (cached) setPlatformStats(JSON.parse(cached));
        } catch {}
      };
      fetchStats();
      api.get('/blog?limit=3').then(({ data }) => setBlogPosts(data.blogs || [])).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAllPrices, fetchHasatlinkPrices]);

  // Client-side geo-filter: Haversine distance
  const filteredListings = geoFilterEnabled && geoLocation?.lat && geoLocation?.lng
    ? listings.filter(l => {
        if (!l.coordinates?.lat || !l.coordinates?.lng) return false;
        const R = 6371;
        const dLat = (l.coordinates.lat - geoLocation.lat) * Math.PI / 180;
        const dLng = (l.coordinates.lng - geoLocation.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(geoLocation.lat * Math.PI / 180) * Math.cos(l.coordinates.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return d <= geoRadius;
      })
    : listings;

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

  const openEntrySheet = () => {
    if (!user) { navigate('/giris'); return; }
    setShowEntrySheet(true);
  };

  const selectEntryType = (entryType: 'product' | 'service') => {
    setFormInitialType(entryType === 'product' ? 'pazar' : 'lojistik');
    setShowEntrySheet(false);
    setShowForm(true);
  };

  return (
    <div className="animate-fade-in">
      <SEO
        title={lang === 'tr' ? 'Ana Sayfa' : 'Home'}
        description={lang === 'tr' ? 'Türkiye\'nin en kapsamlı tarım pazaryeri. Ürün alın, satın, lojistik bulun, ekipman kiralayın.' : 'Turkey\'s most comprehensive agricultural marketplace.'}
        keywords={lang === 'tr' ? 'tarım, pazar, çiftçi, hasatlink, ürün, lojistik, ekipman, arazi' : 'agriculture, marketplace, farmer, hasatlink, products, logistics, equipment, land'}
        ogImage="/icons/icon.svg"
      />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'HasatLink',
        url: 'https://hasatlink.com',
        description: 'Türkiye\'nin en kapsamlı tarım pazaryeri',
        potentialAction: { '@type': 'SearchAction', target: 'https://hasatlink.com/pazar?search={search_term_string}', 'query-input': 'required name=search_term_string' },
        publisher: { '@type': 'Organization', name: 'HasatLink', url: 'https://hasatlink.com', logo: 'https://hasatlink.com/icons/icon.svg' },
      }} />

      {/* ─── 1. Banner Carousel ─── */}
      <section className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <BannerCarousel />
      </section>

      {/* ─── 2. Hero Banner ─── */}
      <section className="relative bg-gradient-to-b from-[#0A0A0A] via-[#111111] to-[#1A1A1A] text-white py-8 md:py-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2D6A4F]/8 rounded-full blur-[120px] animate-float-slow" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#A47148]/6 rounded-full blur-[100px] animate-float-slow-reverse" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="max-w-4xl mx-auto px-3 md:px-4 relative text-center">
          <p className="text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-[var(--accent-orange)] mb-4 animate-slide-up" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
            {lang === 'tr' ? 'TARIMIN DİJİTAL GÜCÜ' : 'THE DIGITAL POWER OF AGRICULTURE'}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-3 md:mb-6 animate-slide-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">HASAT </span>
            <span className="bg-gradient-to-r from-[#2D6A4F] to-[#40916C] bg-clip-text text-transparent">LİNK</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-lg text-white/50 mb-6 md:mb-12 max-w-xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
            {lang === 'tr'
              ? 'Türkiye\'nin en kapsamlı tarım pazaryeri. Ürün alın, satın, lojistik bulun, ekipman kiralayın.'
              : 'Turkey\'s most comprehensive agricultural marketplace.'}
          </p>
          <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row items-stretch gap-2 w-full max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
            <select value={heroCategory} onChange={e => setHeroCategory(e.target.value)} className="px-4 py-3.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/50 sm:w-40 transition-colors hover:bg-white/10">
              <option value="" className="text-gray-900">{lang === 'tr' ? 'Tümü' : 'All'}</option>
              {Object.entries(CATEGORY_LABELS).map(([key, cat]) => (
                <option key={key} value={key} className="text-gray-900">{cat[lang]}</option>
              ))}
            </select>
            <div className="relative flex-1">
              <input type="text" value={heroSearch} onChange={e => setHeroSearch(e.target.value)} placeholder={lang === 'tr' ? 'İlan, ürün veya hizmet ara...' : 'Search listings, products or services...'} className="w-full px-5 py-3.5 pl-12 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/50 transition-colors hover:bg-white/10" />
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
            <button type="submit" className="px-8 py-3.5 bg-[#2D6A4F] text-white font-semibold text-sm rounded-xl hover:bg-[#40916C] transition-colors shadow-lg shadow-[#2D6A4F]/20">
              {lang === 'tr' ? 'Ara' : 'Search'}
            </button>
          </form>
        </div>
      </section>

      {/* ─── 3. Hızlı Kategoriler ─── */}
      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-3 md:px-4 py-6 md:py-10">
          <div className="flex items-end justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {lang === 'tr' ? 'Kategoriler' : 'Categories'}
            </h2>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {lang === 'tr' ? 'Üzerine gel, ilan ver' : 'Hover to post'}
            </span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
            {Object.entries(CATEGORY_LABELS).map(([key, cat]) => {
              const count = platformStats.categoryCounts[key] || 0;
              const color = CATEGORY_COLORS[key] || '#2D6A4F';
              return (
                <Link
                  key={key}
                  to={`/${key}`}
                  className="group relative overflow-hidden rounded-2xl p-3 md:p-4 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97] bg-[var(--bg-surface)] border border-[var(--border-default)] hover:shadow-lg flex flex-col items-center text-center"
                >
                  {/* Gradient hover layer */}
                  <div
                    className="absolute inset-0 opacity-30 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `linear-gradient(160deg, ${color}10 0%, transparent 70%)` }}
                  />

                  {/* Content */}
                  <div className="relative flex flex-col items-center w-full">
                    {/* Icon */}
                    <div
                      className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `${color}15`,
                        border: `1px solid ${color}25`,
                      }}
                    >
                      <div style={{ color, transform: 'scale(0.8)' }}>{CATEGORY_ICONS[key]}</div>
                    </div>

                    {/* Title & count */}
                    <h3 className="text-[11px] md:text-[12px] font-semibold tracking-tight mb-0.5 text-[var(--text-primary)] truncate w-full">
                      {cat[lang]}
                    </h3>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      {count} {lang === 'tr' ? 'ilan' : 'listings'}
                    </p>
                  </div>

                  {/* CTA — slide-up on hover (desktop only) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!user) {
                        navigate('/giris');
                        return;
                      }
                      setFormInitialType(key as Listing['type']);
                      setShowForm(true);
                    }}
                    className="hidden md:flex absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 px-2 py-1.5 items-center justify-center gap-1 text-white text-[10px] font-bold tracking-wide z-10"
                    style={{ background: color }}
                  >
                    <Plus size={11} strokeWidth={3} />
                    {lang === 'tr' ? 'İLAN VER' : 'POST'}
                  </button>
                </Link>
              );
            })}
          </div>
        </section>
      </AnimatedSection>

      {/* ─── 4. İlan Listesi ─── */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-3 md:px-4 py-8 md:py-12">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
              {geoFilterEnabled
                ? (lang === 'tr' ? `${geoRadius} km İçindeki İlanlar` : `Listings Within ${geoRadius} km`)
                : geoLocation?.city
                  ? (lang === 'tr' ? `${geoLocation.city} Yakınındaki İlanlar` : `Listings Near ${geoLocation.city}`)
                  : (lang === 'tr' ? 'Öne Çıkan İlanlar' : 'Featured Listings')}
            </h2>
            <Link to="/pazar" className="text-xs font-medium uppercase text-[var(--accent-green)] flex items-center gap-1 hover:gap-2 transition-all">
              {t('all')} <ArrowRight size={12} />
            </Link>
          </div>
          {/* Geo-Filter Toggle */}
          {geoLocation?.lat && geoLocation?.lng && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)]">
              <MapPin size={16} className="text-[var(--accent-green)] shrink-0" />
              <span className="text-[13px] font-medium text-[var(--text-primary)]">
                {lang === 'tr' ? 'Yakınımdaki İlanlar' : 'Nearby Listings'}
              </span>
              <button
                onClick={() => setGeoFilterEnabled(!geoFilterEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${geoFilterEnabled ? 'bg-[#2D6A4F]' : 'bg-[var(--bg-input)] border border-[var(--border-default)]'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${geoFilterEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
              {geoFilterEnabled && (
                <select
                  value={geoRadius}
                  onChange={e => setGeoRadius(Number(e.target.value))}
                  className="ml-auto px-2.5 py-1 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-[12px] font-semibold text-[var(--text-primary)] focus:outline-none"
                >
                  {[10, 25, 50, 100, 200].map(km => (
                    <option key={km} value={km}>{km} km</option>
                  ))}
                </select>
              )}
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="surface-card rounded-2xl p-12 text-center">
              <PackageOpen size={48} className="text-[var(--text-secondary)] mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {geoFilterEnabled
                  ? (lang === 'tr' ? `${geoRadius} km içinde ilan bulunamadı` : `No listings within ${geoRadius} km`)
                  : (lang === 'tr' ? 'Henüz ilan eklenmedi' : 'No listings yet')}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {geoFilterEnabled
                  ? (lang === 'tr' ? 'Mesafeyi artırmayı deneyin' : 'Try increasing the distance')
                  : (lang === 'tr' ? 'İlk ilanı sen oluştur!' : 'Be the first to create a listing!')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredListings.slice(0, 8).map((listing, index) => (
                <div key={listing._id} className="card-enter" style={{ animationDelay: `${index * 80}ms` }}>
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          )}
        </section>
      </AnimatedSection>

      {/* ─── 5. Tarım Rehberi (Blog) ─── */}
      {blogPosts.length > 0 && (
        <AnimatedSection>
          <section className="max-w-6xl mx-auto px-3 md:px-4 py-8 md:py-12">
            <div className="flex items-center justify-between mb-5 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">{lang === 'tr' ? 'Tarım Rehberi' : 'Agriculture Guide'}</h2>
              <Link to="/blog" className="text-xs font-medium uppercase text-[var(--accent-green)] flex items-center gap-1 hover:gap-2 transition-all">
                {lang === 'tr' ? 'Tümünü Gör' : 'View All'} <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {blogPosts.map(blog => (
                <Link key={blog._id} to={`/blog/${blog.slug}`} className="group surface-card-hover rounded-2xl overflow-hidden">
                  {blog.coverImage ? (
                    <img src={blog.coverImage} alt={blog.title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-[#2D6A4F] to-[#40916C] flex items-center justify-center">
                      <span className="text-white/60 text-4xl">📝</span>
                    </div>
                  )}
                  <div className="p-4">
                    {blog.category && (
                      <span className="inline-block text-[10px] font-medium uppercase tracking-wider text-[var(--accent-green)] bg-[#2D6A4F]/10 px-2.5 py-0.5 rounded-full mb-2">{blog.category}</span>
                    )}
                    <h3 className="text-sm font-semibold tracking-tight line-clamp-2 mb-2 group-hover:text-[var(--accent-green)] transition-colors">{blog.title}</h3>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1"><UserIcon size={10} />{blog.author}</span>
                      <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(blog.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </AnimatedSection>
      )}

      {/* ─── 6. Hava + Fiyatlar ─── */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-3 md:px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {/* Hava Durumu */}
            <div className="surface-card rounded-2xl p-4 md:p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0077B6]/5 to-[#2D6A4F]/5" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0077B6]/10 flex items-center justify-center">
                    <Cloud size={16} strokeWidth={1.5} className="text-[#0077B6]" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight">{lang === 'tr' ? 'Tarım Hava Durumu' : 'Agricultural Weather'}</h3>
                </div>
                {weather ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1"><MapPin size={10} />{weather.city}</p>
                        <p className="text-4xl font-bold tracking-tight mt-1">{weather.temp}°<span className="text-lg font-normal text-[var(--text-secondary)]">C</span></p>
                        <p className="text-[11px] text-[var(--text-secondary)] capitalize mt-0.5">{weather.description}</p>
                      </div>
                      {weather.icon && <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt={weather.description} className="w-20 h-20 -mr-2" />}
                    </div>
                    <div className="flex items-center gap-4 py-2 border-t border-[var(--border-default)]">
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]"><Droplets size={12} className="text-[#0077B6]" />{weather.humidity}%</span>
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]"><Wind size={12} className="text-[#52796F]" />{weather.windSpeed} km/h</span>
                    </div>
                    {weather.alerts && weather.alerts.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {weather.alerts.map((alert, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20">
                            <AlertTriangle size={14} className="text-[var(--accent-red)] shrink-0" />
                            <p className="text-[11px] font-medium text-[var(--accent-red)]">{alert.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-24 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
                )}
              </div>
            </div>

            {/* Hal Fiyatları */}
            <div className="surface-card rounded-2xl p-3 md:p-5">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-[var(--accent-green)]" />
                  <h3 className="text-sm font-semibold tracking-tight">{lang === 'tr' ? 'Hal Fiyatları' : 'Market Hall'}</h3>
                </div>
                <Link to="/hal-fiyatlari" className="text-[10px] font-medium text-[var(--accent-green)] uppercase hover:text-[#40916C]">{t('all')} →</Link>
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
                    <button key={i} onClick={() => navigate('/hal-fiyatlari')} className="w-full flex items-center py-1.5 hover:bg-[var(--bg-surface-hover,rgba(0,0,0,0.03))] rounded-lg transition-colors px-1 -mx-1">
                      <span className="flex-1 text-sm text-[var(--text-primary)] text-left truncate">{p.name}</span>
                      <span className="w-14 text-right text-xs text-[var(--accent-green)] font-medium">{p.minPrice?.toFixed(1)}₺</span>
                      <span className="w-14 text-right text-xs text-[#C1341B] font-medium">{p.maxPrice?.toFixed(1)}₺</span>
                      <span className={`w-12 text-right flex items-center justify-end gap-0.5 text-xs font-medium ${p.change >= 0 ? 'text-[var(--accent-green)]' : 'text-[#C1341B]'}`}>
                        {p.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {p.change >= 0 ? '+' : ''}{p.change.toFixed(1)}%
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-5 skeleton rounded animate-pulse" />)}</div>
              )}
            </div>

            {/* HasatLink Pazarı */}
            <div className="surface-card rounded-2xl p-3 md:p-5">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-[var(--accent-orange)]" />
                  <h3 className="text-sm font-semibold tracking-tight">{lang === 'tr' ? 'HasatLink Pazarı' : 'HasatLink Market'}</h3>
                </div>
                <Link to="/hasatlink-pazari" className="text-[10px] font-medium text-[var(--accent-orange)] uppercase hover:text-[#C4863A]">{t('all')} →</Link>
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
                    <button key={i} onClick={() => navigate('/hasatlink-pazari')} className="w-full flex items-center py-1.5 hover:bg-[var(--bg-surface-hover,rgba(0,0,0,0.03))] rounded-lg transition-colors px-1 -mx-1">
                      <span className="flex-1 text-sm text-[var(--text-primary)] text-left truncate">{p.name}</span>
                      <span className="w-14 text-right text-xs text-[var(--accent-green)] font-medium">{p.minPrice.toFixed(1)}₺</span>
                      <span className="w-14 text-right text-xs text-[#C1341B] font-medium">{p.maxPrice.toFixed(1)}₺</span>
                      <span className={`w-12 text-right flex items-center justify-end gap-0.5 text-xs font-medium ${p.change >= 0 ? 'text-[var(--accent-green)]' : 'text-[#C1341B]'}`}>
                        {p.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {p.change >= 0 ? '+' : ''}{p.change.toFixed(1)}%
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <ShoppingBag size={24} className="text-[var(--text-secondary)] mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-[var(--text-secondary)]">{lang === 'tr' ? 'İlan verisi bekleniyor...' : 'Waiting for listings...'}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ─── 7. Harita ─── */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-3 md:px-4 py-6 md:py-8">
          <div className="surface-card-lg p-4 overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 mb-3 px-2">
              <MapPin size={16} className="text-[var(--accent-green)]" />
              <h3 className="text-lg font-semibold tracking-tight">{t('map.title')}</h3>
              <Link to="/harita" className="ml-auto text-[10px] font-medium text-[var(--accent-green)] uppercase">{t('all')} &rarr;</Link>
            </div>
            <div className="h-[300px] rounded-2xl overflow-hidden">
              <ListingMap listings={listings} />
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ─── 8. Nasıl Çalışır ─── */}
      <AnimatedSection>
        <section className="max-w-4xl mx-auto px-3 md:px-4 py-8 md:py-12">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-center mb-6 md:mb-10">{lang === 'tr' ? 'Nasıl Çalışır?' : 'How It Works?'}</h2>
          <div className="grid grid-cols-3 gap-3 md:gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-[#2D6A4F]/20" />
            {[
              { icon: <UserPlus className="w-4 h-4 md:w-7 md:h-7" strokeWidth={1.5} />, title: lang === 'tr' ? 'Ücretsiz Kayıt Ol' : 'Sign Up Free', desc: lang === 'tr' ? 'Hızlıca hesap oluşturun ve platforma katılın.' : 'Quickly create an account and join.' },
              { icon: <Search className="w-4 h-4 md:w-7 md:h-7" strokeWidth={1.5} />, title: lang === 'tr' ? 'İlan Ver veya Ara' : 'Post or Search', desc: lang === 'tr' ? 'Ürün, hizmet veya ekipman ilanı verin ya da arayın.' : 'Post or search for products, services, or equipment.' },
              { icon: <MessageCircle className="w-4 h-4 md:w-7 md:h-7" strokeWidth={1.5} />, title: lang === 'tr' ? 'Doğrudan İletişime Geç' : 'Contact Directly', desc: lang === 'tr' ? 'Alıcı ve satıcılarla doğrudan bağlantı kurun.' : 'Connect directly with buyers and sellers.' },
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-9 h-9 md:w-16 md:h-16 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center mx-auto mb-2 md:mb-4 relative z-10">
                  <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#A47148] text-white text-[8px] md:text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  {step.icon}
                </div>
                <h3 className="text-[11px] md:text-base font-semibold mb-0.5 md:mb-2 leading-tight">{step.title}</h3>
                <p className="text-[9px] md:text-sm text-[var(--text-secondary)] leading-snug hidden xs:block md:block">{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] md:text-xs text-[var(--text-secondary)] mt-5 md:mt-8">
            {lang === 'tr' ? 'HasatLink alım-satım sürecine dahil olmaz, yalnızca kullanıcıları buluşturur.' : 'HasatLink does not participate in transactions, it only connects users.'}
          </p>
        </section>
      </AnimatedSection>

      {/* ─── 8.5. Platform Özellikleri (Keşfet) ─── */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-3 md:px-4 py-6 md:py-8">
          <h2 className="text-lg md:text-2xl font-bold tracking-tight mb-1">{lang === 'tr' ? 'Keşfet' : 'Discover'}</h2>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] mb-4 md:mb-6">{lang === 'tr' ? 'Çiftçiler için özel araçlar ve topluluk' : 'Special tools and community for farmers'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
            {[
              { icon: <MessageCircle size={20} />, label: lang === 'tr' ? 'Çiftçi Forumu' : 'Forum', to: '/forum', color: '#8B5CF6' },
              { icon: <Calendar size={20} />, label: lang === 'tr' ? 'Hasat Takvimi' : 'Calendar', to: '/hasat-takvimi', color: '#10B981' },
              { icon: <Truck size={20} />, label: lang === 'tr' ? 'Nakliyeci' : 'Logistics', to: '/nakliyeci', color: '#F59E0B' },
              { icon: <HardHat size={20} />, label: lang === 'tr' ? 'İş İlanları' : 'Jobs', to: '/is-ilanlari', color: '#3B82F6' },
              { icon: <Sparkles size={20} />, label: lang === 'tr' ? 'AI Teşhis' : 'AI Diagnosis', to: '/ai-teshis', color: '#EC4899' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="surface-card-hover rounded-2xl p-4 text-center group"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 transition-transform group-hover:scale-110" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                  {item.icon}
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</p>
              </Link>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* ─── 9. İstatistikler ─── */}
      <AnimatedSection>
        <section className="max-w-5xl mx-auto px-3 md:px-4 py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <StatCounter end={platformStats.activeListings} suffix="" label={lang === 'tr' ? 'Toplam İlan' : 'Total Listings'} icon={<Layers size={22} className="text-[var(--accent-green)]" />} />
            <StatCounter end={platformStats.registeredUsers} suffix="" label={lang === 'tr' ? 'Kayıtlı Kullanıcı' : 'Registered Users'} icon={<Users size={22} className="text-[#0077B6]" />} />
            <StatCounter end={platformStats.cities} suffix="" label={lang === 'tr' ? 'Aktif Şehir' : 'Active Cities'} icon={<Building2 size={22} className="text-[var(--accent-orange)]" />} />
            <StatCounter end={Object.keys(platformStats.categoryCounts).length || 6} suffix="" label={lang === 'tr' ? 'Kategori' : 'Categories'} icon={<BarChart3 size={22} className="text-[#52796F]" />} />
          </div>
        </section>
      </AnimatedSection>

      {/* ─── Smart Entry Sheet (İlan Tipi Seçimi) ─── */}
      {showEntrySheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowEntrySheet(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-[var(--bg-surface)] rounded-t-3xl sm:rounded-3xl border-t sm:border border-[var(--border-default)] shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-[var(--text-tertiary)]/30" />
            </div>
            <div className="p-6 pb-8">
              <h3 className="text-xl font-bold tracking-tight text-center mb-2">
                {lang === 'tr' ? 'Ne yapmak istersiniz?' : 'What would you like to do?'}
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] text-center mb-6">
                {lang === 'tr' ? 'İlan türünüzü seçin, size özel form açılsın.' : 'Select your listing type for a customized form.'}
              </p>
              <div className="grid grid-cols-1 gap-3">
                {/* Ürün Sat / İlan Ver */}
                <button onClick={() => selectEntryType('product')} className="group flex items-center gap-4 p-5 rounded-2xl border-2 border-[var(--border-default)] hover:border-[var(--accent-green)] bg-[var(--bg-input)] hover:bg-emerald-50/30 transition-all text-left">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 group-hover:scale-110 transition-transform">
                    <Package size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[var(--text-primary)] tracking-tight">
                      📦 {lang === 'tr' ? 'Ürün Sat / İlan Ver' : 'Sell Product / Post Listing'}
                    </h4>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                      {lang === 'tr' ? 'Tarım ürünü, ekipman, arazi veya depo ilanı' : 'Agriculture product, equipment, land or storage'}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-[var(--text-tertiary)] shrink-0 group-hover:text-[var(--accent-green)] group-hover:translate-x-1 transition-all ml-auto" />
                </button>

                {/* Nakliye / Hizmet Sun */}
                <button onClick={() => selectEntryType('service')} className="group flex items-center gap-4 p-5 rounded-2xl border-2 border-[var(--border-default)] hover:border-[#0077B6] bg-[var(--bg-input)] hover:bg-blue-50/30 transition-all text-left">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 group-hover:scale-110 transition-transform">
                    <Wrench size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[var(--text-primary)] tracking-tight">
                      🚛 {lang === 'tr' ? 'Nakliye / Hizmet Sun' : 'Offer Transport / Service'}
                    </h4>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                      {lang === 'tr' ? 'Lojistik, işgücü veya tarım hizmeti ilanı' : 'Logistics, labor or agricultural service'}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-[var(--text-tertiary)] shrink-0 group-hover:text-[#0077B6] group-hover:translate-x-1 transition-all ml-auto" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── HasatAI FAB ─── */}
      <Link
        to="/ai-teshis"
        className="fixed bottom-20 left-4 md:bottom-8 md:left-8 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group"
      >
        <Sparkles size={22} className="text-white" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-gray-900/90 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          HasatAI
        </span>
      </Link>

      {/* ─── Satellite Analysis FAB ─── */}
      <Link
        to="/uydu-analiz"
        className="fixed bottom-36 left-4 md:bottom-24 md:left-8 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M13 7 8 2 2 8l5 5" /><path d="m16 8 5 5-5 5" /><path d="M8 16l5 5 5-5" /><circle cx="12" cy="12" r="3" />
        </svg>
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-gray-900/90 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Uydu Analiz
        </span>
      </Link>


      {/* ─── Create Listing FAB ─── */}
      <FAB onClick={openEntrySheet} icon={<Plus size={24} />} />

      {/* ─── Listing Form ─── */}
      {user && (
        <ListingForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          initialData={{ type: formInitialType }}
          onSubmit={async (data) => {
            const res = await api.post('/listings', data);
            if (res.status === 201 || res.status === 200) {
              toast.success(lang === 'tr' ? 'İlan oluşturuldu!' : 'Listing created!');
              fetchListings({ limit: '8' });
            }
          }}
        />
      )}
    </div>
  );
}
