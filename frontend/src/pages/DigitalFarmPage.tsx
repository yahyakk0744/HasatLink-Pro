import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, MapPin, Droplets, Leaf, Lock, ChevronRight,
  Loader2, Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import api from '../config/api';
import toast from 'react-hot-toast';

interface FarmRegion {
  region_id: string;
  region_name: string;
  city_name: string;
  district: string;
  total_area_m2: number;
  available_area_m2: number;
  available_percent: number;
  crop_types: string[];
  description: string;
  photos: string[];
}

interface FarmSettings {
  enabled: boolean;
  pricing: {
    rent_per_m2_monthly: number;
    water_per_action: number;
    fertilizer_per_action: number;
  };
  crop_catalog: any[];
  active_cities: { city_name: string }[];
  fomo_thresholds: { amber_percent: number; red_percent: number };
}

interface MyPlot {
  plot_id: string;
  crop_type: string;
  crop_display_name: string;
  area_m2: number;
  health_score: number;
  moisture: number;
  growth_percent: number;
  growth_stage: string;
  status: string;
}

const CROP_EMOJIS: Record<string, string> = {
  domates: '🍅', biber: '🌶️', salatalik: '🥒', patlican: '🍆',
  kabak: '🎃', fasulye: '🫘', marul: '🥬', ispanak: '🥬',
  havuc: '🥕', sogan: '🧅',
};

const STAGE_EMOJIS: Record<string, string> = {
  seed: '🌰', sprout: '🌱', growing: '🌿', flowering: '🌸', fruiting: '🍅', harvest_ready: '✨',
};

export default function DigitalFarmPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');
  const [settings, setSettings] = useState<FarmSettings | null>(null);
  const [regions, setRegions] = useState<FarmRegion[]>([]);
  const [myPlots, setMyPlots] = useState<MyPlot[]>([]);
  const [tab, setTab] = useState<'plots' | 'discover'>('plots');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const settingsRes = await api.get('/farm/settings').catch(() => ({ data: null }));

      if (settingsRes.data) {
        setSettings(settingsRes.data);
        if (!settingsRes.data.enabled) {
          setAccessDenied(true);
          setAccessMessage('Dijital Tarla modülü henüz aktif değildir. Yakında hizmetinizde!');
          setLoading(false);
          return;
        }
      }

      // Eğer beta_mode aktifse ve kullanıcı giriş yapmışsa access kontrolü yap
      if (user && settingsRes.data?.beta_mode) {
        try {
          const { data: access } = await api.get('/farm/access');
          if (!access.allowed) {
            const reasons: Record<string, string> = {
              beta_only: 'Dijital Tarla şu anda kapalı beta aşamasındadır.',
              city_blocked: 'Dijital Tarla henüz şehrinizde aktif değil.',
              disabled: 'Dijital Tarla henüz aktif değil.',
            };
            setAccessDenied(true);
            setAccessMessage(reasons[access.reason] || access.reason || 'Erişim engellendi.');
            setLoading(false);
            return;
          }
        } catch {}
      }
      // beta_mode kapalıysa veya undefined ise herkes girebilir

      const [regionsRes, plotsRes] = await Promise.all([
        api.get('/farm/regions').catch(() => ({ data: { regions: [] } })),
        user ? api.get('/farm/plots').catch(() => ({ data: { plots: [] } })) : Promise.resolve({ data: { plots: [] } }),
      ]);

      setRegions(regionsRes.data?.regions || regionsRes.data || []);
      setMyPlots(plotsRes.data?.plots || []);
      setTab(plotsRes.data?.plots?.length > 0 ? 'plots' : 'discover');
    } catch {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (accessDenied) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <SEO title="Dijital Tarla" />
        <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Lock size={36} className="text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Dijital Tarla</h1>
        <p className="text-[var(--text-secondary)] text-[14px] max-w-md mx-auto mb-6">{accessMessage}</p>
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-[13px]">
          <Sprout size={18} />
          Yakında Açılıyor
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#2D6A4F]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      <SEO title="Dijital Tarla" description="Gerçek tarlanı dijitalden yönet, hasadını kapında al." />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Sprout size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Dijital Tarla
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Gerçek tarlanı dijitalden yönet
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('plots')}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${tab === 'plots' ? 'bg-[#2D6A4F] text-white shadow-lg shadow-emerald-500/20' : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'}`}>
          🌱 Tarlalarım {myPlots.length > 0 && `(${myPlots.length})`}
        </button>
        <button onClick={() => setTab('discover')}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${tab === 'discover' ? 'bg-[#2D6A4F] text-white shadow-lg shadow-emerald-500/20' : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'}`}>
          🗺️ Bölge Keşfet
        </button>
      </div>

      {/* ─── TARLALARIM ─── */}
      {tab === 'plots' && (
        <div className="space-y-4">
          {myPlots.length === 0 ? (
            <div className="text-center py-16">
              <Sprout size={56} className="mx-auto mb-4 text-[var(--text-tertiary)] opacity-30" />
              <h2 className="text-[17px] font-bold mb-2">Henüz tarlanız yok</h2>
              <p className="text-[13px] text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
                Bir bölge seçin, alan kiralayın ve gerçek ürününüzün dijitalden büyümesini izleyin!
              </p>
              <button onClick={() => setTab('discover')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-[14px] shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all">
                🗺️ Bölge Keşfet
              </button>
            </div>
          ) : (
            myPlots.map(plot => (
              <button key={plot.plot_id} onClick={() => navigate(`/dijital-tarla/${plot.plot_id}`)}
                className="w-full text-left rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 hover:border-[#2D6A4F]/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[28px]">{STAGE_EMOJIS[plot.growth_stage] || '🌱'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold truncate">
                      {CROP_EMOJIS[plot.crop_type] || '🌱'} {plot.crop_display_name || plot.crop_type}
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">{plot.area_m2} m² | {plot.status === 'active' ? 'Aktif' : plot.status}</p>
                  </div>
                  <ChevronRight size={18} className="text-[var(--text-tertiary)]" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MiniBar label="Sağlık" value={plot.health_score} emoji="❤️" color={plot.health_score > 70 ? '#10B981' : plot.health_score > 40 ? '#F59E0B' : '#EF4444'} />
                  <MiniBar label="Nem" value={plot.moisture} emoji="💧" color={plot.moisture > 50 ? '#3B82F6' : plot.moisture > 20 ? '#F59E0B' : '#EF4444'} />
                  <MiniBar label="Büyüme" value={plot.growth_percent} emoji="📈" color="#2D6A4F" />
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* ─── BÖLGE KEŞFET ─── */}
      {tab === 'discover' && (
        <div className="space-y-4">
          {settings && (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-500/5 to-lime-500/5 border border-emerald-500/10 p-4">
              <p className="text-[11px] font-semibold text-[#2D6A4F] uppercase tracking-wider mb-2">Fiyatlandırma</p>
              <div className="flex flex-wrap gap-3 text-[12px]">
                <span className="flex items-center gap-1"><MapPin size={12} className="text-emerald-600" /> Kira: {settings.pricing.rent_per_m2_monthly} TL/m²/ay</span>
                <span className="flex items-center gap-1"><Droplets size={12} className="text-blue-500" /> Sulama: {settings.pricing.water_per_action} TL</span>
                <span className="flex items-center gap-1"><Leaf size={12} className="text-purple-500" /> Gübre: {settings.pricing.fertilizer_per_action} TL</span>
              </div>
            </div>
          )}

          {regions.length === 0 ? (
            <div className="text-center py-16">
              <MapPin size={48} className="mx-auto mb-3 text-[var(--text-tertiary)] opacity-30" />
              <h2 className="text-[15px] font-bold mb-1">Henüz bölge eklenmemiş</h2>
              <p className="text-[12px] text-[var(--text-secondary)]">Yakında yeni bölgeler eklenecek.</p>
            </div>
          ) : (
            regions.map(region => {
              const fomoLevel = region.available_percent <= 0 ? 'soldOut'
                : region.available_percent < 10 ? 'red'
                : region.available_percent < 20 ? 'amber' : 'none';

              return (
                <div key={region.region_id}
                  className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-hidden hover:border-[#2D6A4F]/30 transition-all">

                  {fomoLevel !== 'none' && (
                    <div className={`px-4 py-2 text-[12px] font-bold text-white ${
                      fomoLevel === 'soldOut' ? 'bg-gray-500' :
                      fomoLevel === 'red' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                    }`}>
                      {fomoLevel === 'soldOut' ? '🚫 Tükenmiştir!' :
                       fomoLevel === 'red' ? `🔥 Acele Edin! Son ${region.available_area_m2} m² kaldı!` :
                       `⚡ Sınırlı alan: ${region.available_area_m2} m² kaldı`}
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-[15px] font-bold">{region.region_name}</h3>
                        <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                          <MapPin size={10} /> {region.city_name} / {region.district}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[18px] font-bold text-[#2D6A4F]">{region.available_area_m2.toLocaleString('tr-TR')}</p>
                        <p className="text-[9px] text-[var(--text-secondary)]">m² müsait</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mb-1">
                        <span>Doluluk</span>
                        <span>%{(100 - region.available_percent).toFixed(0)}</span>
                      </div>
                      <div className="h-2.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          fomoLevel === 'red' ? 'bg-red-500' : fomoLevel === 'amber' ? 'bg-amber-500' : 'bg-[#2D6A4F]'
                        }`} style={{ width: `${100 - region.available_percent}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {region.crop_types.map(crop => (
                        <span key={crop} className="px-2.5 py-1 rounded-lg bg-[var(--bg-input)] text-[10px] font-medium">
                          {CROP_EMOJIS[crop] || '🌱'} {crop}
                        </span>
                      ))}
                    </div>

                    {region.description && (
                      <p className="text-[11px] text-[var(--text-secondary)] mb-3 line-clamp-2">{region.description}</p>
                    )}

                    {fomoLevel !== 'soldOut' ? (
                      <button onClick={() => {
                        if (!user) { navigate('/giris'); return; }
                        navigate(`/dijital-tarla/kirala/${region.region_id}`);
                      }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
                        <Sprout size={18} />
                        Tarla Kirala
                      </button>
                    ) : (
                      <button onClick={() => {
                        if (!user) { navigate('/giris'); return; }
                        api.post('/farm/waitlist', { region_id: region.region_id })
                          .then(() => toast.success('Bekleme listesine eklendiniz!'))
                          .catch(() => toast.error('Zaten bekleme listesinde'));
                      }}
                        className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-[14px] flex items-center justify-center gap-2">
                        <Zap size={18} />
                        Bekleme Listesine Katıl
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5">
            <h3 className="text-[13px] font-bold mb-4">Nasıl Çalışır?</h3>
            <div className="space-y-3">
              {[
                { emoji: '🗺️', title: 'Bölge Seçin', desc: 'Türkiye genelinde gerçek tarım bölgelerinden birini seçin.' },
                { emoji: '📐', title: 'Alan Kiralayın', desc: 'İstediğiniz büyüklükte (m²) tarla alanını kiralayın.' },
                { emoji: '💧', title: 'Dijitalden Yönetin', desc: 'Sulama, gübreleme, zararlı koruması — hepsini telefondan yapın.' },
                { emoji: '📸', title: 'Gerçek Fotoğraflarla Takip Edin', desc: 'Saha ekibi her hafta tarlanızın gerçek fotoğraflarını yükler.' },
                { emoji: '📦', title: 'Hasadınızı Kapınızda Alın', desc: 'Hasat zamanı gelince ürünleriniz kargoyla adresinize gelir.' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <span className="text-[16px]">{step.emoji}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">{step.title}</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniBar({ label, value, emoji, color }: { label: string; value: number; emoji: string; color: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg-input)] p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-[var(--text-tertiary)]">{emoji} {label}</span>
        <span className="text-[10px] font-bold" style={{ color }}>%{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-[var(--bg-page)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
