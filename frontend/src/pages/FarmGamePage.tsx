import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Droplets, Leaf, Snowflake, Sun,
  Loader2, Wallet, Package,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import api from '../config/api';
import toast from 'react-hot-toast';

// ─── Sabitler ───
const TICK_MS = 3000; // 3 saniyede bir tick (demo hızı)
// Her tick 4 saat simüle eder

const STAGE_VISUALS: Record<string, { emoji: string; label: string; bg: string }> = {
  seed: { emoji: '🌰', label: 'Tohum', bg: 'from-amber-900/30 to-amber-800/10' },
  sprout: { emoji: '🌱', label: 'Fide', bg: 'from-lime-900/20 to-green-900/10' },
  growing: { emoji: '🌿', label: 'Büyüme', bg: 'from-green-900/20 to-emerald-900/10' },
  flowering: { emoji: '🌸', label: 'Çiçeklenme', bg: 'from-pink-900/15 to-green-900/10' },
  fruiting: { emoji: '🍅', label: 'Meyve', bg: 'from-red-900/15 to-green-900/10' },
  harvest_ready: { emoji: '✨', label: 'Hasat Hazır', bg: 'from-yellow-900/20 to-amber-900/10' },
};

const CROP_EMOJIS: Record<string, string> = {
  domates: '🍅', biber: '🌶️', salatalik: '🥒', patlican: '🍆',
  kabak: '🎃', fasulye: '🫘', marul: '🥬', ispanak: '🥬',
  havuc: '🥕', sogan: '🧅',
};

interface PlotData {
  plot_id: string;
  crop_type: string;
  crop_display_name: string;
  area_m2: number;
  health_score: number;
  water_level: number;
  fertilizer_level: number;
  fire_rate: number;
  growth_percent: number;
  growth_stage: string;
  status: string;
  total_spent: number;
  region_id: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  wind_speed: number;
  description: string;
  frost_risk: boolean;
  heat_risk: boolean;
}

interface ActionDef {
  type: string;
  label: string;
  emoji: string;
  icon: any;
  cost: number;
  color: string;
  bgColor: string;
}

export default function FarmGamePage() {
  const { plotId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [plot, setPlot] = useState<PlotData | null>(null);
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 28, humidity: 50, wind_speed: 3, description: 'Güneşli',
    frost_risk: false, heat_risk: false,
  });
  const [balance, setBalance] = useState(0);
  const [alerts, setAlerts] = useState<{ text: string; type: 'danger' | 'warning' | 'success' | 'info'; id: number }[]>([]);
  const [actionCooldown, setActionCooldown] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval>>(null);
  const alertIdRef = useRef(0);

  // ─── Veri Yükle ───
  useEffect(() => {
    if (!user) { navigate('/giris'); return; }
    loadPlot();
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [plotId]);

  const loadPlot = async () => {
    try {
      const { data } = await api.get(`/farm/plots/${plotId}`);
      const p = data.plot || data;
      setPlot(p);

      const meRes = await api.get('/auth/me');
      setBalance(meRes.data?.points || 0);

      // Hava durumu
      try {
        const wRes = await api.get(`/farm/weather/${p.region_id || ''}`);
        if (wRes.data) setWeather(wRes.data);
      } catch {}

      setLoading(false);
      startSimulation(p);
    } catch {
      toast.error('Tarla yüklenemedi');
      setLoading(false);
    }
  };

  // ─── Simülasyon Motoru (Client-Side) ───
  const startSimulation = useCallback((_initialPlot: PlotData) => {
    if (tickRef.current) clearInterval(tickRef.current);

    tickRef.current = setInterval(() => {
      setPlot(prev => {
        if (!prev || prev.status !== 'active') return prev;

        let moisture = prev.water_level;
        let health = prev.health_score;
        let fert = prev.fertilizer_level;
        let fire = prev.fire_rate;
        let growth = prev.growth_percent;

        // Nem azalması (hava durumuna bağlı)
        let decayRate = 1.5; // baz: tick başına %1.5
        setWeather(w => {
          if (w.temperature > 30) decayRate *= 1.8;
          else if (w.temperature > 25) decayRate *= 1.3;
          else if (w.temperature < 10) decayRate *= 0.5;
          if (w.wind_speed > 5) decayRate *= 1.3;
          if (w.humidity > 70) decayRate *= 0.6;
          return w;
        });
        moisture = Math.max(0, moisture - decayRate);

        // Gübre azalması
        fert = Math.max(0, fert - 0.8);

        // Nem düşükse sağlık düşer
        if (moisture < 20) {
          health -= 2;
          fire += 0.5;
          if (moisture < 10) {
            addAlert('Kurak tehlike! Hemen sula!', 'danger');
          }
        }

        // Gübre düşükse büyüme yavaşlar
        if (fert < 15) {
          health -= 0.5;
        }

        // Don/sıcak riski
        setWeather(w => {
          if (w.frost_risk) { health -= 3; fire += 1; addAlert('Don tehlikesi! Koruma yap!', 'danger'); }
          if (w.heat_risk) { health -= 1.5; fire += 0.5; addAlert('Aşırı sıcak! Sulama gerekli!', 'warning'); }
          return w;
        });

        // Büyüme
        if (health > 30 && moisture > 15) {
          const hFactor = health / 100;
          const mFactor = Math.min(moisture / 50, 1);
          const fFactor = Math.max(fert / 50, 0.3);
          growth += 0.15 * hFactor * mFactor * fFactor;
        }

        health = Math.max(0, Math.min(100, health));
        fire = Math.max(0, Math.min(100, fire));
        growth = Math.min(100, growth);

        // Aşama belirleme
        let stage = 'seed';
        if (growth >= 90) stage = 'harvest_ready';
        else if (growth >= 70) stage = 'fruiting';
        else if (growth >= 50) stage = 'flowering';
        else if (growth >= 25) stage = 'growing';
        else if (growth >= 10) stage = 'sprout';

        return {
          ...prev,
          water_level: moisture,
          health_score: health,
          fertilizer_level: fert,
          fire_rate: fire,
          growth_percent: growth,
          growth_stage: stage,
        };
      });
    }, TICK_MS);
  }, []);

  const addAlert = useCallback((text: string, type: 'danger' | 'warning' | 'success' | 'info') => {
    const id = ++alertIdRef.current;
    setAlerts(prev => {
      if (prev.some(a => a.text === text)) return prev; // duplikat engelle
      return [{ text, type, id }, ...prev].slice(0, 5);
    });
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 4000);
  }, []);

  // ─── Aksiyon Yap ───
  const performAction = async (actionType: string, cost: number) => {
    if (actionCooldown) return;
    if (balance < cost) {
      toast.error(`Yetersiz bakiye! Gereken: ${cost} TL`);
      return;
    }

    setActionCooldown(actionType);
    try {
      await api.post('/farm/actions', { plot_id: plotId, action_type: actionType });
      setBalance(prev => prev - cost);

      // Anında UI etkisi
      setPlot(prev => {
        if (!prev) return prev;
        const updates = { ...prev, total_spent: prev.total_spent + cost };
        switch (actionType) {
          case 'water':
            updates.water_level = Math.min(100, prev.water_level + 35);
            updates.health_score = Math.min(100, prev.health_score + 3);
            addAlert('💧 Sulama yapıldı! Toprak nemi arttı.', 'success');
            break;
          case 'fertilize':
            updates.fertilizer_level = Math.min(100, prev.fertilizer_level + 30);
            updates.health_score = Math.min(100, prev.health_score + 5);
            addAlert('🧪 Gübre verildi! Bitki güçlendi.', 'success');
            break;
          case 'protect_frost':
            updates.health_score = Math.min(100, prev.health_score + 8);
            updates.fire_rate = Math.max(0, prev.fire_rate - 5);
            addAlert('❄️ Don koruması aktif! Bitki güvende.', 'success');
            break;
          case 'protect_heat':
            updates.water_level = Math.min(100, prev.water_level + 15);
            updates.health_score = Math.min(100, prev.health_score + 3);
            addAlert('☀️ Sıcak koruması yapıldı!', 'success');
            break;
        }
        return updates;
      });

      toast.success(`${actionType === 'water' ? '💧 Sulama' : actionType === 'fertilize' ? '🧪 Gübre' : '🛡️ Koruma'} yapıldı! -${cost} TL`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İşlem başarısız');
    } finally {
      setTimeout(() => setActionCooldown(null), 1500);
    }
  };

  // ─── Pricing ───
  const [pricing, setPricing] = useState({ water: 15, fertilize: 50, frost: 60, heat: 40 });
  useEffect(() => {
    api.get('/farm/settings').then(({ data }) => {
      if (data?.pricing) {
        setPricing({
          water: data.pricing.water_per_action || 15,
          fertilize: data.pricing.fertilizer_per_action || 50,
          frost: data.pricing.frost_protection_cost || 60,
          heat: data.pricing.heat_protection_cost || 40,
        });
      }
    }).catch(() => {});
  }, []);

  const actions: ActionDef[] = [
    { type: 'water', label: 'Sula', emoji: '💧', icon: Droplets, cost: pricing.water, color: 'text-blue-400', bgColor: 'bg-blue-500/15 border-blue-500/30' },
    { type: 'fertilize', label: 'Gübrele', emoji: '🧪', icon: Leaf, cost: pricing.fertilize, color: 'text-purple-400', bgColor: 'bg-purple-500/15 border-purple-500/30' },
    { type: 'protect_frost', label: 'Don Koru', emoji: '❄️', icon: Snowflake, cost: pricing.frost, color: 'text-cyan-400', bgColor: 'bg-cyan-500/15 border-cyan-500/30' },
    { type: 'protect_heat', label: 'Sıcak Koru', emoji: '☀️', icon: Sun, cost: pricing.heat, color: 'text-amber-400', bgColor: 'bg-amber-500/15 border-amber-500/30' },
  ];

  if (!user) return null;
  if (loading) return <div className="flex items-center justify-center py-20 bg-[#0A1628] min-h-screen"><Loader2 size={32} className="animate-spin text-emerald-400" /></div>;
  if (!plot) return <div className="text-center py-20 bg-[#0A1628] min-h-screen text-white">Tarla bulunamadı</div>;

  const stage = STAGE_VISUALS[plot.growth_stage] || STAGE_VISUALS.seed;
  const cropEmoji = CROP_EMOJIS[plot.crop_type] || '🌱';
  const yieldKg = (plot.area_m2 * 3 * (plot.health_score / 100) * (1 - plot.fire_rate / 100)).toFixed(1);

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <SEO title={`${plot.crop_display_name || plot.crop_type} Tarlanız`} />

      {/* ─── Alert Banner ─── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-2 pointer-events-none">
        {alerts.map(a => (
          <div key={a.id} className={`mb-1 px-4 py-2 rounded-xl text-[12px] font-bold shadow-lg pointer-events-auto animate-fade-in ${
            a.type === 'danger' ? 'bg-red-500' : a.type === 'warning' ? 'bg-amber-500' : a.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
          }`}>
            {a.text}
          </div>
        ))}
      </div>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dijital-tarla')} className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[16px] font-bold">{cropEmoji} {plot.crop_display_name || plot.crop_type}</h1>
            <p className="text-[10px] text-white/40">{plot.area_m2} m² · {stage.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/8 border border-white/10">
          <Wallet size={12} className="text-emerald-400" />
          <span className={`text-[13px] font-bold ${balance < 30 ? 'text-red-400' : 'text-emerald-400'}`}>
            {balance} TL
          </span>
        </div>
      </div>

      {/* ─── Bitki Görseli ─── */}
      <div className={`mx-4 mt-2 rounded-3xl overflow-hidden bg-gradient-to-b ${stage.bg} border border-white/5 relative`} style={{ height: 220 }}>
        {/* Toprak */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-900/40 to-transparent"
          style={{ opacity: 0.3 + (plot.water_level / 100) * 0.7 }} />

        {/* Bitki */}
        <div className="flex items-center justify-center h-full">
          <span className="animate-bounce" style={{
            fontSize: 60 + (plot.growth_percent / 100) * 30,
            animationDuration: '3s',
            filter: plot.health_score < 30 ? 'grayscale(0.6)' : 'none',
          }}>
            {plot.growth_stage === 'harvest_ready' ? '✨' : stage.emoji}
          </span>
        </div>

        {/* Büyüme % */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
          <span className="text-[13px] font-bold text-emerald-400">%{plot.growth_percent.toFixed(1)}</span>
        </div>

        {/* Aşama */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
          <span className="text-[11px] font-semibold text-white/70">{stage.label}</span>
        </div>

        {/* Fire rate */}
        {plot.fire_rate > 0 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30">
            <span className="text-[10px] font-bold text-red-400">🔥 Kayıp: %{plot.fire_rate.toFixed(0)}</span>
          </div>
        )}

        {/* Nem göstergesi */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1">
          <Droplets size={10} className={plot.water_level < 20 ? 'text-red-400' : 'text-blue-400'} />
          <span className={`text-[10px] font-bold ${plot.water_level < 20 ? 'text-red-400 animate-pulse' : 'text-blue-300'}`}>
            %{Math.round(plot.water_level)}
          </span>
        </div>
      </div>

      {/* ─── Hava Durumu ─── */}
      <div className={`mx-4 mt-3 px-3 py-2.5 rounded-xl flex items-center gap-3 ${
        weather.frost_risk || weather.heat_risk ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 border border-white/5'
      }`}>
        <span className="text-[24px]">
          {weather.frost_risk ? '🥶' : weather.heat_risk ? '🔥' : weather.temperature > 30 ? '☀️' : '⛅'}
        </span>
        <div className="flex-1">
          <p className="text-[13px] font-bold">{weather.temperature}°C · {weather.description}</p>
          <p className="text-[10px] text-white/40">💧 %{weather.humidity} · 🌬️ {weather.wind_speed} m/s</p>
        </div>
        {(weather.frost_risk || weather.heat_risk) && (
          <span className="animate-pulse text-[18px]">⚠️</span>
        )}
      </div>

      {/* ─── Stratejik Barlar ─── */}
      <div className="mx-4 mt-3 space-y-2">
        <GameBar emoji="❤️" label="Sağlık" value={plot.health_score}
          color={plot.health_score > 70 ? '#10B981' : plot.health_score > 40 ? '#F59E0B' : '#EF4444'} />
        <GameBar emoji="💧" label="Toprak Nemi" value={plot.water_level}
          color={plot.water_level > 50 ? '#3B82F6' : plot.water_level > 20 ? '#F59E0B' : '#EF4444'}
          critical={plot.water_level < 20} />
        <GameBar emoji="🧪" label="Gübre" value={plot.fertilizer_level}
          color={plot.fertilizer_level > 40 ? '#8B5CF6' : plot.fertilizer_level > 15 ? '#F59E0B' : '#EF4444'} />
      </div>

      {/* ─── Büyüme Zaman Çizelgesi ─── */}
      <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Büyüme Aşamaları</span>
          <span className="text-[10px] font-bold text-emerald-400">%{plot.growth_percent.toFixed(1)}</span>
        </div>
        <div className="flex gap-1">
          {Object.entries(STAGE_VISUALS).map(([key, s]) => {
            const isActive = key === plot.growth_stage;
            const isPast = Object.keys(STAGE_VISUALS).indexOf(key) < Object.keys(STAGE_VISUALS).indexOf(plot.growth_stage);
            return (
              <div key={key} className="flex-1 text-center">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center border transition-all ${
                  isActive ? 'bg-emerald-500/20 border-emerald-400 scale-110' :
                  isPast ? 'bg-white/10 border-white/20' : 'bg-white/3 border-white/5'
                }`}>
                  <span style={{ fontSize: isActive ? 16 : 12, opacity: isPast || isActive ? 1 : 0.3 }}>{s.emoji}</span>
                </div>
                <p className={`text-[7px] mt-1 ${isActive ? 'text-emerald-400 font-bold' : 'text-white/25'}`}>{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Hasat Tahmini ─── */}
      <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
        <Package size={18} className="text-amber-400" />
        <div className="flex-1">
          <p className="text-[10px] text-white/40">Tahmini Hasat</p>
          <p className="text-[16px] font-bold">{yieldKg} kg</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/40">Harcanan</p>
          <p className="text-[13px] font-bold text-amber-400">{plot.total_spent} TL</p>
        </div>
      </div>

      {/* ─── Aksiyon Butonları ─── */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A1628]/95 backdrop-blur-sm border-t border-white/5 px-3 py-3 pb-5">
        <div className="flex gap-2">
          {actions.map(a => {
            const canAfford = balance >= a.cost;
            const isCooldown = actionCooldown === a.type;
            return (
              <button key={a.type}
                onClick={() => performAction(a.type, a.cost)}
                disabled={!canAfford || !!actionCooldown}
                className={`flex-1 py-2.5 rounded-xl border transition-all ${
                  canAfford && !actionCooldown ? `${a.bgColor} active:scale-95` : 'bg-white/3 border-white/5 opacity-40'
                }`}>
                <div className="text-center">
                  <span className="text-[18px]">{isCooldown ? '⏳' : a.emoji}</span>
                  <p className={`text-[9px] font-bold mt-0.5 ${canAfford ? a.color : 'text-white/30'}`}>{a.label}</p>
                  <p className={`text-[8px] font-semibold ${canAfford ? 'text-white/50' : 'text-white/20'}`}>{a.cost} TL</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alt boşluk */}
      <div className="h-28" />
    </div>
  );
}

// ─── Oyun Barı Componenti ───
function GameBar({ emoji, label, value, color, critical }: {
  emoji: string; label: string; value: number; color: string; critical?: boolean;
}) {
  return (
    <div className={`px-3 py-2 rounded-xl border transition-all ${
      critical ? 'bg-red-500/8 border-red-500/20' : 'bg-white/5 border-white/5'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-white/50 font-medium">{emoji} {label}</span>
        <span className={`text-[12px] font-bold ${critical ? 'animate-pulse' : ''}`} style={{ color }}>
          %{Math.round(value)}
        </span>
      </div>
      <div className="h-2 bg-white/8 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{
          width: `${Math.max(1, value)}%`,
          backgroundColor: color,
          boxShadow: critical ? `0 0 8px ${color}` : 'none',
        }} />
      </div>
    </div>
  );
}
