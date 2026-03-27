import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Leaf, Loader2, Wallet, Package, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import api from '../config/api';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════
// FARMVILLE-STYLE GAME ENGINE
// Grid tabanlı, tıkla-ek-sula-hasat, animasyonlu
// ═══════════════════════════════════════════════════

const TICK_MS = 2500;

// Kare durumları
type TileState = 'empty' | 'planted' | 'growing' | 'flowering' | 'ready' | 'withered';

interface FarmTile {
  id: number;
  state: TileState;
  moisture: number;      // 0-100
  growthPercent: number;  // 0-100
  plantedAt: number;     // timestamp
  lastWatered: number;
  isAnimating: string;   // 'water' | 'plant' | 'harvest' | 'fertilize' | ''
}

// Görsel tanımlar
const TILE_VISUALS: Record<TileState, { emoji: string; soilClass: string }> = {
  empty: { emoji: '', soilClass: 'bg-amber-800/60' },
  planted: { emoji: '🌰', soilClass: 'bg-amber-700/70' },
  growing: { emoji: '🌱', soilClass: 'bg-amber-700/50' },
  flowering: { emoji: '🌿', soilClass: 'bg-green-900/40' },
  ready: { emoji: '', soilClass: 'bg-green-800/30' }, // crop emoji dinamik
  withered: { emoji: '🥀', soilClass: 'bg-gray-700/50' },
};

const CROP_STAGES: Record<string, string[]> = {
  domates: ['🌰', '🌱', '🌿', '🌸', '🍅', '🥀'],
  biber: ['🌰', '🌱', '🌿', '🌸', '🌶️', '🥀'],
  salatalik: ['🌰', '🌱', '🌿', '🌸', '🥒', '🥀'],
  patlican: ['🌰', '🌱', '🌿', '🌸', '🍆', '🥀'],
  kabak: ['🌰', '🌱', '🌿', '🌸', '🎃', '🥀'],
  fasulye: ['🌰', '🌱', '🌿', '🌸', '🫘', '🥀'],
  marul: ['🌰', '🌱', '🌿', '🥬', '🥬', '🥀'],
  ispanak: ['🌰', '🌱', '🌿', '🥬', '🥬', '🥀'],
  havuc: ['🌰', '🌱', '🌿', '🌿', '🥕', '🥀'],
  sogan: ['🌰', '🌱', '🌿', '🌿', '🧅', '🥀'],
};

// Araç seçimi
type ToolType = 'hand' | 'water' | 'fertilize' | 'harvest' | 'plant';

const TOOLS: { type: ToolType; emoji: string; label: string; cost: number; color: string }[] = [
  { type: 'plant', emoji: '🌱', label: 'Ek', cost: 0, color: '#10B981' },
  { type: 'water', emoji: '💧', label: 'Sula', cost: 2, color: '#3B82F6' },
  { type: 'fertilize', emoji: '🧪', label: 'Gübrele', cost: 5, color: '#8B5CF6' },
  { type: 'harvest', emoji: '🧺', label: 'Hasat', cost: 0, color: '#F59E0B' },
];

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
}

export default function FarmGamePage() {
  const { plotId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [plot, setPlot] = useState<PlotData | null>(null);
  const [balance, setBalance] = useState(0);
  const [selectedTool, setSelectedTool] = useState<ToolType>('water');
  const [tiles, setTiles] = useState<FarmTile[]>([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [harvestedKg, setHarvestedKg] = useState(0);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);
  const [weather, setWeather] = useState({ temp: 28, desc: 'Güneşli', icon: '☀️' });
  const floatIdRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval>>(null);

  // Grid boyutu (alan m²'ye göre)
  const gridSize = plot ? Math.max(3, Math.min(8, Math.ceil(Math.sqrt(plot.area_m2 / 2)))) : 5;

  useEffect(() => {
    if (!user) { navigate('/giris'); return; }
    loadData();
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [plotId]);

  const loadData = async () => {
    try {
      const { data } = await api.get(`/farm/plots/${plotId}`);
      const p = data.plot || data;
      setPlot(p);

      const me = await api.get('/auth/me');
      setBalance(me.data?.points || 0);

      // Grid oluştur
      const size = Math.max(3, Math.min(8, Math.ceil(Math.sqrt(p.area_m2 / 2))));
      const count = size * size;
      const plantedCount = Math.floor(count * (p.growth_percent / 100));

      const newTiles: FarmTile[] = Array.from({ length: count }, (_, i) => {
        const isPlanted = i < plantedCount;
        const tileGrowth = isPlanted ? Math.min(100, p.growth_percent + (Math.random() * 20 - 10)) : 0;
        let state: TileState = 'empty';
        if (isPlanted) {
          if (tileGrowth >= 90) state = 'ready';
          else if (tileGrowth >= 50) state = 'flowering';
          else if (tileGrowth >= 10) state = 'growing';
          else state = 'planted';
        }
        return {
          id: i,
          state,
          moisture: isPlanted ? p.water_level + (Math.random() * 10 - 5) : 40,
          growthPercent: tileGrowth,
          plantedAt: isPlanted ? Date.now() - tileGrowth * 1000 : 0,
          lastWatered: Date.now(),
          isAnimating: '',
        };
      });
      setTiles(newTiles);

      // Hava durumu
      try {
        await api.get('/farm/settings');
        // Basit hava simülasyonu
        const temps = [22, 25, 28, 31, 34, 18, 15];
        const t = temps[Math.floor(Math.random() * temps.length)];
        setWeather({
          temp: t,
          desc: t > 32 ? 'Çok Sıcak' : t > 28 ? 'Sıcak' : t < 18 ? 'Serin' : 'Güneşli',
          icon: t > 32 ? '🔥' : t > 28 ? '☀️' : t < 18 ? '🌧️' : '⛅',
        });
      } catch {}

      setLoading(false);
      startTick();
    } catch {
      toast.error('Tarla yüklenemedi');
      setLoading(false);
    }
  };

  // ─── Oyun Döngüsü ───
  const startTick = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setTiles(prev => prev.map(tile => {
        if (tile.state === 'empty' || tile.state === 'withered') return tile;

        let { moisture, growthPercent, state } = tile;

        // Nem azalması
        const decayRate = weather.temp > 30 ? 3 : weather.temp > 25 ? 2 : 1;
        moisture = Math.max(0, moisture - decayRate);

        // Nem düşükse solma riski
        if (moisture < 10 && Math.random() < 0.1) {
          return { ...tile, state: 'withered' as TileState, moisture: 0, isAnimating: '' };
        }

        // Büyüme
        if (moisture > 15) {
          const growRate = 0.3 * (moisture / 80);
          growthPercent = Math.min(100, growthPercent + growRate);
        }

        // Aşama güncelle
        if (growthPercent >= 90) state = 'ready';
        else if (growthPercent >= 50) state = 'flowering';
        else if (growthPercent >= 10) state = 'growing';

        return { ...tile, moisture, growthPercent, state };
      }));
    }, TICK_MS);
  }, [weather.temp]);

  // ─── Kareye Tıklama ───
  const handleTileClick = (tile: FarmTile, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    switch (selectedTool) {
      case 'plant':
        if (tile.state === 'empty' || tile.state === 'withered') {
          setTiles(prev => prev.map(t => t.id === tile.id ? {
            ...t, state: 'planted' as TileState, moisture: 60, growthPercent: 1,
            plantedAt: Date.now(), isAnimating: 'plant',
          } : t));
          spawnFloat('🌱', x, y);
          addXp(5);
          setTimeout(() => clearAnim(tile.id), 800);
        }
        break;

      case 'water':
        if (tile.state !== 'empty') {
          if (balance < 2) { toast.error('Yetersiz bakiye!'); return; }
          setBalance(b => b - 2);
          setTiles(prev => prev.map(t => t.id === tile.id ? {
            ...t, moisture: Math.min(100, t.moisture + 30), lastWatered: Date.now(),
            isAnimating: 'water',
            // Solmuş bitki canlanabilir
            state: t.state === 'withered' ? 'growing' as TileState : t.state,
            growthPercent: t.state === 'withered' ? 10 : t.growthPercent,
          } : t));
          spawnFloat('💧', x, y);
          addXp(2);
          setTimeout(() => clearAnim(tile.id), 800);
        }
        break;

      case 'fertilize':
        if (tile.state !== 'empty' && tile.state !== 'withered') {
          if (balance < 5) { toast.error('Yetersiz bakiye!'); return; }
          setBalance(b => b - 5);
          setTiles(prev => prev.map(t => t.id === tile.id ? {
            ...t, growthPercent: Math.min(100, t.growthPercent + 15),
            isAnimating: 'fertilize',
          } : t));
          spawnFloat('🧪', x, y);
          addXp(3);
          setTimeout(() => clearAnim(tile.id), 800);
        }
        break;

      case 'harvest':
        if (tile.state === 'ready') {
          const crop = plot?.crop_type || 'domates';
          const stages = CROP_STAGES[crop] || CROP_STAGES.domates;
          spawnFloat(stages[4], x, y);
          spawnFloat('⭐', x + 20, y - 10);
          setTiles(prev => prev.map(t => t.id === tile.id ? {
            ...t, state: 'empty' as TileState, growthPercent: 0, moisture: 40,
            isAnimating: 'harvest',
          } : t));
          const kg = 0.5 + Math.random() * 1.5;
          setHarvestedKg(h => h + kg);
          addXp(10);
          toast.success(`🧺 ${kg.toFixed(1)} kg hasat edildi!`);
          setTimeout(() => clearAnim(tile.id), 800);
        }
        break;

      default:
        // hand — bilgi göster
        toast(`${tile.state === 'empty' ? 'Boş kare' : `Nem: %${Math.round(tile.moisture)} · Büyüme: %${Math.round(tile.growthPercent)}`}`, { icon: 'ℹ️', duration: 1500 });
    }
  };

  const clearAnim = (id: number) => {
    setTiles(prev => prev.map(t => t.id === id ? { ...t, isAnimating: '' } : t));
  };

  const addXp = (amount: number) => {
    setXp(prev => {
      const newXp = prev + amount;
      const newLevel = Math.floor(newXp / 50) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
        toast.success(`⭐ Seviye ${newLevel}!`, { duration: 2000 });
      }
      return newXp;
    });
  };

  const spawnFloat = (emoji: string, x: number, y: number) => {
    const id = ++floatIdRef.current;
    setFloatingEmojis(prev => [...prev, { id, emoji, x, y }]);
    setTimeout(() => setFloatingEmojis(prev => prev.filter(f => f.id !== id)), 1200);
  };

  // Toplu sulama
  const waterAll = async () => {
    const dryTiles = tiles.filter(t => t.state !== 'empty' && t.state !== 'withered' && t.moisture < 50);
    const cost = dryTiles.length * 2;
    if (balance < cost) { toast.error(`Yetersiz bakiye! Gereken: ${cost} TL`); return; }

    try {
      await api.post('/farm/actions', { plot_id: plotId, action_type: 'water' });
    } catch {}

    setBalance(b => b - cost);
    setTiles(prev => prev.map(t => {
      if (t.state !== 'empty' && t.state !== 'withered' && t.moisture < 50) {
        return { ...t, moisture: Math.min(100, t.moisture + 30), isAnimating: 'water', lastWatered: Date.now() };
      }
      return t;
    }));
    addXp(dryTiles.length * 2);
    toast.success(`💧 ${dryTiles.length} kare sulandı! -${cost} TL`);
    setTimeout(() => setTiles(prev => prev.map(t => ({ ...t, isAnimating: '' }))), 800);
  };

  // Toplu hasat
  const harvestAll = () => {
    const readyTiles = tiles.filter(t => t.state === 'ready');
    if (readyTiles.length === 0) { toast('Hasat edilecek ürün yok', { icon: '🤷' }); return; }

    let totalKg = 0;
    setTiles(prev => prev.map(t => {
      if (t.state === 'ready') {
        const kg = 0.5 + Math.random() * 1.5;
        totalKg += kg;
        return { ...t, state: 'empty' as TileState, growthPercent: 0, moisture: 40, isAnimating: 'harvest' };
      }
      return t;
    }));
    setHarvestedKg(h => h + totalKg);
    addXp(readyTiles.length * 10);
    toast.success(`🧺 ${readyTiles.length} kare hasat edildi! +${totalKg.toFixed(1)} kg`);
    setTimeout(() => setTiles(prev => prev.map(t => ({ ...t, isAnimating: '' }))), 800);
  };

  // İstatistikler
  const plantedCount = tiles.filter(t => t.state !== 'empty' && t.state !== 'withered').length;
  const avgMoisture = plantedCount > 0 ? tiles.filter(t => t.state !== 'empty').reduce((s, t) => s + t.moisture, 0) / plantedCount : 0;
  const avgGrowth = plantedCount > 0 ? tiles.filter(t => t.state !== 'empty').reduce((s, t) => s + t.growthPercent, 0) / plantedCount : 0;

  if (!user) return null;
  if (loading) return <div className="flex items-center justify-center py-20 bg-[#1a2e1a] min-h-screen"><Loader2 size={32} className="animate-spin text-green-400" /></div>;
  if (!plot) return <div className="text-center py-20 bg-[#1a2e1a] min-h-screen text-white">Tarla bulunamadı</div>;

  const crop = plot.crop_type || 'domates';
  const stages = CROP_STAGES[crop] || CROP_STAGES.domates;

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(180deg, #1a3a1a 0%, #0d1f0d 50%, #1a2e1a 100%)' }}>
      <SEO title={`${plot.crop_display_name || crop} Tarlanız`} />

      {/* Floating emojis */}
      {floatingEmojis.map(f => (
        <div key={f.id} className="fixed pointer-events-none z-50" style={{
          left: f.x - 15, top: f.y,
          animation: 'floatUp 1.2s ease-out forwards',
        }}>
          <span className="text-[28px]">{f.emoji}</span>
        </div>
      ))}

      <style>{`
        @keyframes floatUp { 0% { opacity:1; transform:translateY(0) scale(1); } 100% { opacity:0; transform:translateY(-60px) scale(1.3); } }
        @keyframes tileWater { 0%,100% { box-shadow: inset 0 0 0 transparent; } 50% { box-shadow: inset 0 0 20px rgba(59,130,246,0.5); } }
        @keyframes tilePlant { 0% { transform:scale(0.5); } 50% { transform:scale(1.2); } 100% { transform:scale(1); } }
        @keyframes tileHarvest { 0% { transform:scale(1); } 50% { transform:scale(1.3) rotate(10deg); } 100% { transform:scale(0); opacity:0; } }
        @keyframes tilePulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
      `}</style>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dijital-tarla')} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <ArrowLeft size={14} />
          </button>
          <div>
            <h1 className="text-[14px] font-bold">{stages[4]} {plot.crop_display_name || crop}</h1>
            <p className="text-[9px] text-white/40">{plot.area_m2} m²</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* XP/Level */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30">
            <Star size={10} className="text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400">Lv.{level}</span>
            <span className="text-[8px] text-amber-300/60">{xp}xp</span>
          </div>
          {/* Bakiye */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            <Wallet size={10} className="text-emerald-400" />
            <span className={`text-[11px] font-bold ${balance < 20 ? 'text-red-400' : 'text-emerald-400'}`}>{balance} TL</span>
          </div>
        </div>
      </div>

      {/* ─── Hava & İstatistik Bar ─── */}
      <div className="flex gap-2 px-3 mb-2">
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 flex-1">
          <span className="text-[16px]">{weather.icon}</span>
          <span className="text-[11px] font-bold">{weather.temp}°C</span>
          <span className="text-[9px] text-white/40">{weather.desc}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5">
          <Droplets size={10} className="text-blue-400" />
          <span className="text-[10px] font-bold">%{Math.round(avgMoisture)}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5">
          <Leaf size={10} className="text-green-400" />
          <span className="text-[10px] font-bold">%{Math.round(avgGrowth)}</span>
        </div>
        {harvestedKg > 0 && (
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-500/10">
            <Package size={10} className="text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400">{harvestedKg.toFixed(1)}kg</span>
          </div>
        )}
      </div>

      {/* ─── TARLA GRİDİ (FarmVille Çekirdeği) ─── */}
      <div className="px-3 mb-2">
        <div className="rounded-2xl overflow-hidden border-2 border-green-900/50 bg-gradient-to-b from-amber-900/20 to-green-900/20 p-2"
          style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)' }}>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {tiles.map(tile => {
              const vis = TILE_VISUALS[tile.state];
              let emoji = vis.emoji;

              // Dinamik ürün emojisi
              if (tile.state === 'planted') emoji = stages[0];
              else if (tile.state === 'growing') emoji = stages[1];
              else if (tile.state === 'flowering') emoji = stages[2] || stages[1];
              else if (tile.state === 'ready') emoji = stages[4];
              else if (tile.state === 'withered') emoji = stages[5];

              // Nem bazlı toprak rengi
              const soilDarkness = tile.state === 'empty' ? 0.4 : 0.3 + (tile.moisture / 100) * 0.4;

              const isReady = tile.state === 'ready';
              const isDry = tile.moisture < 20 && tile.state !== 'empty';
              const canInteract =
                (selectedTool === 'plant' && (tile.state === 'empty' || tile.state === 'withered')) ||
                (selectedTool === 'water' && tile.state !== 'empty') ||
                (selectedTool === 'fertilize' && tile.state !== 'empty' && tile.state !== 'withered') ||
                (selectedTool === 'harvest' && tile.state === 'ready');

              return (
                <button key={tile.id}
                  onClick={(e) => handleTileClick(tile, e)}
                  className={`aspect-square rounded-lg relative transition-all duration-200 ${
                    canInteract ? 'ring-2 ring-white/30 cursor-pointer hover:scale-105' : 'cursor-default'
                  }`}
                  style={{
                    backgroundColor: `rgba(101, 67, 33, ${soilDarkness})`,
                    animation: tile.isAnimating === 'water' ? 'tileWater 0.8s ease' :
                      isReady ? 'tilePulse 2s infinite' : 'none',
                  }}>

                  {/* Toprak çizgileri */}
                  {tile.state === 'empty' && (
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-1/3 left-1 right-1 h-px bg-amber-600" />
                      <div className="absolute top-2/3 left-1 right-1 h-px bg-amber-600" />
                    </div>
                  )}

                  {/* Bitki */}
                  {emoji && (
                    <span className="absolute inset-0 flex items-center justify-center" style={{
                      fontSize: tile.state === 'ready' ? 22 : tile.state === 'flowering' ? 18 : tile.state === 'growing' ? 16 : 12,
                      animation: tile.isAnimating === 'plant' ? 'tilePlant 0.6s ease' :
                        tile.isAnimating === 'harvest' ? 'tileHarvest 0.6s ease' : 'none',
                      filter: tile.state === 'withered' ? 'grayscale(0.7)' : 'none',
                    }}>
                      {emoji}
                    </span>
                  )}

                  {/* Nem göstergesi (düşükse kırmızı nokta) */}
                  {isDry && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}

                  {/* Hasat hazır parıltı */}
                  {isReady && (
                    <span className="absolute top-0 right-0 text-[8px] animate-bounce">✨</span>
                  )}

                  {/* Nem bar (mini) */}
                  {tile.state !== 'empty' && (
                    <div className="absolute bottom-0.5 left-0.5 right-0.5 h-1 rounded-full bg-black/30 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{
                        width: `${tile.moisture}%`,
                        backgroundColor: tile.moisture > 50 ? '#3B82F6' : tile.moisture > 20 ? '#F59E0B' : '#EF4444',
                      }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Hızlı Aksiyonlar ─── */}
      <div className="flex gap-2 px-3 mb-2">
        <button onClick={waterAll}
          className="flex-1 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-[11px] font-bold text-blue-400 flex items-center justify-center gap-1 active:scale-95 transition-transform">
          💧 Tümünü Sula
        </button>
        <button onClick={harvestAll}
          className="flex-1 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-400 flex items-center justify-center gap-1 active:scale-95 transition-transform">
          🧺 Tümünü Hasat Et
        </button>
      </div>

      {/* ─── Büyüme Çizelgesi ─── */}
      <div className="px-3 mb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
          <span className="text-[9px] text-white/30 font-bold">AŞAMALAR</span>
          <div className="flex-1 flex justify-between">
            {stages.slice(0, 5).map((s, i) => {
              const stagePercent = i * 25;
              const isActive = avgGrowth >= stagePercent && avgGrowth < stagePercent + 25;
              const isPast = avgGrowth >= stagePercent + 25;
              return (
                <div key={i} className={`text-center ${isActive ? 'scale-125' : ''} transition-transform`}>
                  <span style={{ fontSize: isActive ? 18 : 14, opacity: isPast || isActive ? 1 : 0.3 }}>{s}</span>
                </div>
              );
            })}
          </div>
          <span className="text-[10px] font-bold text-green-400">%{Math.round(avgGrowth)}</span>
        </div>
      </div>

      {/* Alt boşluk */}
      <div className="h-24" />

      {/* ─── ARAÇ ÇUBUĞU (Alt Sabit) ─── */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0d1f0d]/95 backdrop-blur-sm border-t border-green-900/50 px-3 py-2 pb-4">
        <div className="flex gap-1.5">
          {TOOLS.map(tool => {
            const isActive = selectedTool === tool.type;
            return (
              <button key={tool.type}
                onClick={() => setSelectedTool(tool.type)}
                className={`flex-1 py-2.5 rounded-xl border-2 transition-all active:scale-95 ${
                  isActive ? 'border-white/40 bg-white/10 scale-105' : 'border-white/5 bg-white/3'
                }`}>
                <div className="text-center">
                  <span className="text-[20px]">{tool.emoji}</span>
                  <p className={`text-[9px] font-bold mt-0.5 ${isActive ? 'text-white' : 'text-white/40'}`}>{tool.label}</p>
                  {tool.cost > 0 && <p className="text-[7px] text-white/30">{tool.cost} TL</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
