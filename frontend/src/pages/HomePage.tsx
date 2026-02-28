import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, TrendingUp, TrendingDown, Droplets, Wind, Cloud, BarChart3, ShoppingBag } from 'lucide-react';
import { useListings } from '../hooks/useListings';
import { useAuth } from '../contexts/AuthContext';
import { useHalPrices } from '../hooks/useHalPrices';
import { useHasatlinkPazar } from '../hooks/useHasatlinkPazar';
import { useWeather } from '../hooks/useWeather';
import { useInView } from '../hooks/useInView';
import { useCountUp } from '../hooks/useCountUp';
import ListingCard from '../components/listings/ListingCard';
import AIDiagnosisPanel from '../components/ai/AIDiagnosisPanel';
import ListingMap from '../components/map/ListingMap';
import { CATEGORY_LABELS } from '../utils/constants';
import api from '../config/api';

function AnimatedSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, inView } = useInView(0.15);
  return (
    <div ref={ref} className={`reveal-section ${inView ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  );
}

function StatCounter({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const { ref, inView } = useInView(0.3);
  const value = useCountUp(end, 2000, inView);
  return (
    <div ref={ref}>
      <p className="text-3xl md:text-4xl font-semibold tracking-tight">
        {value.toLocaleString()}{suffix}
      </p>
      <p className="text-xs uppercase font-medium tracking-wider text-white/70 mt-1">{label}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm">
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

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { listings, loading, fetchListings } = useListings();
  const { allPrices, fetchAllPrices } = useHalPrices();
  const { prices: hasatlinkPrices, fetchPrices: fetchHasatlinkPrices } = useHasatlinkPazar();
  const { weather, fetchWeather } = useWeather();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const [platformStats, setPlatformStats] = useState({ activeListings: 0, registeredUsers: 0, cities: 0, aiDiagnoses: 0 });

  useEffect(() => {
    fetchListings({ limit: '8' });
    fetchAllPrices();
    fetchHasatlinkPrices();
    const city = user?.location?.split(',')[0]?.trim();
    fetchWeather(city || 'Istanbul');
    api.get('/stats/platform').then(({ data }) => setPlatformStats(data)).catch(() => {});
  }, [fetchListings, fetchAllPrices, fetchHasatlinkPrices, fetchWeather, user]);

  // Top pazar products for comparison (pick 6 popular ones)
  const popularProducts = ['Domates', 'Biber', 'Patlıcan', 'Salatalık', 'Soğan', 'Patates'];
  const comparisonPrices = popularProducts
    .map(name => allPrices.find(p => p.name.toLowerCase().includes(name.toLowerCase())))
    .filter(Boolean) as typeof allPrices;

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1A1A1A] via-[#2A2520] to-[#1A1A1A] text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#2D6A4F] rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#A47148] rounded-full blur-3xl animate-float-slow-reverse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="max-w-4xl">
            <p
              className="text-xs font-medium uppercase tracking-[0.3em] text-[#2D6A4F] mb-4 animate-slide-up"
              style={{ animationDelay: '0ms' }}
            >
              {t('appSlogan')}
            </p>
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[0.9] mb-6 animate-slide-up"
              style={{ animationDelay: '100ms', animationFillMode: 'both' }}
            >
              <span className="text-white">HASAT</span>
              <span className="text-[#2D6A4F]">LiNK</span>
            </h1>
            <p
              className="text-lg md:text-xl text-white/60 mb-8 max-w-lg animate-slide-up"
              style={{ animationDelay: '200ms', animationFillMode: 'both' }}
            >
              {t('heroDescription')}
            </p>

            {/* Hava Durumu + Hal Fiyatları + HasatLink Pazarı */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Hava Durumu */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Cloud size={16} className="text-[#0077B6]" />
                  <h3 className="text-sm font-semibold tracking-tight">{t('weather.title')}</h3>
                </div>
                {weather ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/70">{weather.city}</p>
                        <p className="text-4xl font-semibold tracking-tight mt-1">{weather.temp}°C</p>
                        <p className="text-sm text-white/60 capitalize mt-1">{weather.description}</p>
                      </div>
                      {weather.icon && (
                        <img
                          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                          alt={weather.description}
                          className="w-20 h-20"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-6 mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-1.5">
                        <Droplets size={12} className="text-white/50" />
                        <span className="text-xs text-white/60">{weather.humidity}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wind size={12} className="text-white/50" />
                        <span className="text-xs text-white/60">{weather.windSpeed} km/h</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 bg-white/5 rounded-xl animate-pulse" />
                )}
              </div>

              {/* İzmir Hal Fiyatları */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
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
                    <div className="flex items-center text-[10px] font-medium uppercase text-white/40 pb-1 border-b border-white/10">
                      <span className="flex-1">{lang === 'tr' ? 'Ürün' : 'Product'}</span>
                      <span className="w-14 text-right">Min</span>
                      <span className="w-14 text-right">Max</span>
                      <span className="w-12 text-right">%</span>
                    </div>
                    {comparisonPrices.slice(0, 5).map((p, i) => (
                      <button
                        key={i}
                        onClick={() => navigate('/hal-fiyatlari')}
                        className="w-full flex items-center py-1.5 hover:bg-white/5 rounded-lg transition-colors px-1 -mx-1"
                      >
                        <span className="flex-1 text-sm text-white/80 text-left truncate">{p.name}</span>
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
                      <div key={i} className="h-5 bg-white/5 rounded animate-pulse" />
                    ))}
                  </div>
                )}
              </div>

              {/* HasatLink Pazarı */}
              <div className="bg-white/5 backdrop-blur-sm border border-[#A47148]/20 rounded-2xl p-5">
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
                    <div className="flex items-center text-[10px] font-medium uppercase text-white/40 pb-1 border-b border-white/10">
                      <span className="flex-1">{lang === 'tr' ? 'Ürün' : 'Product'}</span>
                      <span className="w-14 text-right">Min</span>
                      <span className="w-14 text-right">Max</span>
                      <span className="w-12 text-right">%</span>
                    </div>
                    {hasatlinkPrices.slice(0, 5).map((p, i) => (
                      <button
                        key={i}
                        onClick={() => navigate('/hasatlink-pazari')}
                        className="w-full flex items-center py-1.5 hover:bg-white/5 rounded-lg transition-colors px-1 -mx-1"
                      >
                        <span className="flex-1 text-sm text-white/80 text-left truncate">{p.name}</span>
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
                    <ShoppingBag size={24} className="text-white/20 mx-auto mb-2" />
                    <p className="text-xs text-white/40">
                      {lang === 'tr' ? 'İlan verisi bekleniyor...' : 'Waiting for listings...'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div
              className="flex flex-wrap gap-3 animate-slide-up"
              style={{ animationDelay: '300ms', animationFillMode: 'both' }}
            >
              <Link to="/pazar" className="px-8 py-4 bg-[#2D6A4F] text-white font-semibold text-sm rounded-full hover:bg-[#1B4332] transition-colors">
                {t('getStarted')}
              </Link>
              <Link to="/harita" className="px-8 py-4 border-2 border-white/20 text-white font-semibold text-sm rounded-full hover:bg-white/10 transition-colors flex items-center gap-2">
                <MapPin size={16} /> {t('map.title')}
              </Link>
              <Link to="/hal-fiyatlari" className="px-8 py-4 border-2 border-white/20 text-white font-semibold text-sm rounded-full hover:bg-white/10 transition-colors flex items-center gap-2">
                <TrendingUp size={16} /> Hal Fiyatları
              </Link>
              <Link to="/hasatlink-pazari" className="px-8 py-4 border-2 border-[#A47148]/40 text-white font-semibold text-sm rounded-full hover:bg-[#A47148]/10 transition-colors flex items-center gap-2">
                <ShoppingBag size={16} /> HasatLink Pazarı
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Quick Links */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(CATEGORY_LABELS).map(([key, cat], index) => (
              <Link
                key={key}
                to={`/${key}`}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group card-enter"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-3xl mb-2 block">{cat.icon}</span>
                <h3 className="text-sm font-semibold tracking-tight">{t(`categories.${key}`)}</h3>
                <ArrowRight size={14} className="text-[#6B6560] mt-2 group-hover:text-[#2D6A4F] group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Featured Listings */}
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

      {/* AI + Map Section */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIDiagnosisPanel />
            <div className="bg-white rounded-[2.5rem] p-4 shadow-sm overflow-hidden">
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

      {/* Stats Section */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] rounded-[2.5rem] p-8 md:p-12 text-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <StatCounter end={platformStats.activeListings} suffix="" label={lang === 'tr' ? 'Aktif İlan' : 'Active Listings'} />
              <StatCounter end={platformStats.registeredUsers} suffix="" label={lang === 'tr' ? 'Kayıtlı Üretici' : 'Registered Farmers'} />
              <StatCounter end={platformStats.cities} suffix="" label={lang === 'tr' ? 'Şehir' : 'Cities'} />
              <StatCounter end={platformStats.aiDiagnoses} suffix="" label={lang === 'tr' ? 'AI Teşhis' : 'AI Diagnoses'} />
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
