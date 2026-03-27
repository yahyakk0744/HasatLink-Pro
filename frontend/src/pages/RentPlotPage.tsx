import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sprout, MapPin, ArrowLeft, Loader2, Minus, Plus, ShoppingCart, Leaf,
  Droplets, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import api from '../config/api';
import toast from 'react-hot-toast';

interface Region {
  region_id: string;
  region_name: string;
  city_name: string;
  district: string;
  total_area_m2: number;
  available_area_m2: number;
  crop_types: string[];
  description: string;
}

interface CropItem {
  crop_type: string;
  display_name: string;
  icon_emoji: string;
  seed_cost_per_m2: number;
  min_area_m2: number;
  growth_days: number;
  yield_per_m2_kg: number;
}

interface Pricing {
  rent_per_m2_monthly: number;
  water_per_action: number;
  fertilizer_per_action: number;
}

export default function RentPlotPage() {
  const { regionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region | null>(null);
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(null);

  // Seçimler
  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(null);
  const [areaM2, setAreaM2] = useState(10);
  const [renting, setRenting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/giris'); return; }
    loadData();
  }, [regionId]);

  const loadData = async () => {
    try {
      const [regionsRes, settingsRes] = await Promise.all([
        api.get('/farm/regions'),
        api.get('/farm/settings'),
      ]);
      const list = Array.isArray(regionsRes.data) ? regionsRes.data : (regionsRes.data?.regions || []);
      const found = list.find((r: Region) => r.region_id === regionId);
      if (found) {
        setRegion(found);
        // Sadece bu bölgedeki ürünleri filtrele
        const allCrops: CropItem[] = settingsRes.data?.crop_catalog || [];
        const regionCrops = allCrops.filter(c => found.crop_types.includes(c.crop_type));
        setCrops(regionCrops.length > 0 ? regionCrops : allCrops);
        if (regionCrops.length > 0) setSelectedCrop(regionCrops[0]);
        else if (allCrops.length > 0) setSelectedCrop(allCrops[0]);
      }
      setPricing(settingsRes.data?.pricing || null);
    } catch {
      toast.error('Bölge bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const minArea = selectedCrop?.min_area_m2 || 5;
  const maxArea = Math.min(region?.available_area_m2 || 100, 200);
  const rentCost = pricing ? areaM2 * pricing.rent_per_m2_monthly : 0;
  const seedCost = selectedCrop ? areaM2 * selectedCrop.seed_cost_per_m2 : 0;
  const totalInitial = rentCost + seedCost;
  const estimatedYield = selectedCrop ? areaM2 * selectedCrop.yield_per_m2_kg : 0;

  const handleRent = async () => {
    if (!selectedCrop || !region) return;
    setRenting(true);
    try {
      await api.post('/farm/plots/rent', {
        region_id: region.region_id,
        crop_type: selectedCrop.crop_type,
        area_m2: areaM2,
      });
      setSuccess(true);
      toast.success('Tarlanız başarıyla kiralandı!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kiralama başarısız');
    } finally {
      setRenting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#2D6A4F]" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
        <SEO title="Tarla Kiralandı!" />
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Tarlanız Hazır!</h1>
        <p className="text-[var(--text-secondary)] text-[14px] max-w-sm mx-auto mb-2">
          {selectedCrop?.icon_emoji} {areaM2} m² {selectedCrop?.display_name} tarlanız başarıyla oluşturuldu.
        </p>
        <p className="text-[var(--text-secondary)] text-[13px] mb-8">
          Tahmini hasat: {selectedCrop?.growth_days} gün sonra ({estimatedYield.toFixed(1)} kg)
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/dijital-tarla')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-[14px]">
            🌱 Tarlalarıma Git
          </button>
        </div>
      </div>
    );
  }

  if (!region) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <AlertTriangle size={48} className="mx-auto mb-3 text-amber-500" />
        <h2 className="text-[17px] font-bold mb-2">Bölge bulunamadı</h2>
        <button onClick={() => navigate('/dijital-tarla')} className="text-[#2D6A4F] font-semibold text-[14px] underline">
          Bölgelere Dön
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      <SEO title={`Tarla Kirala — ${region.region_name}`} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dijital-tarla')}
          className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Tarla Kirala</h1>
          <p className="text-[12px] text-[var(--text-secondary)] flex items-center gap-1">
            <MapPin size={10} /> {region.region_name} — {region.city_name}
          </p>
        </div>
      </div>

      {/* Müsait Alan */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 mb-5 flex items-center gap-3">
        <Sprout size={24} className="text-emerald-600" />
        <div>
          <p className="text-[11px] text-emerald-700 font-medium">Müsait Alan</p>
          <p className="text-[20px] font-bold text-emerald-800">{region.available_area_m2.toLocaleString('tr-TR')} m²</p>
        </div>
      </div>

      {/* 1. Ürün Seçimi */}
      <div className="mb-5">
        <p className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">1. Ürün Seçin</p>
        <div className="grid grid-cols-2 gap-2">
          {crops.map(crop => (
            <button key={crop.crop_type} onClick={() => { setSelectedCrop(crop); setAreaM2(Math.max(crop.min_area_m2, areaM2)); }}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                selectedCrop?.crop_type === crop.crop_type
                  ? 'border-[#2D6A4F] bg-emerald-50 shadow-sm'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[#2D6A4F]/30'
              }`}>
              <span className="text-[24px]">{crop.icon_emoji}</span>
              <p className="text-[13px] font-bold mt-1">{crop.display_name}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">{crop.growth_days} gün · {crop.yield_per_m2_kg} kg/m²</p>
              <p className="text-[10px] text-[#2D6A4F] font-semibold mt-0.5">Tohum: {crop.seed_cost_per_m2} TL/m²</p>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Alan Seçimi */}
      <div className="mb-5">
        <p className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">2. Alan Belirleyin (m²)</p>
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4">
          <div className="flex items-center justify-center gap-4 mb-3">
            <button onClick={() => setAreaM2(Math.max(minArea, areaM2 - 5))}
              className="w-10 h-10 rounded-xl bg-[var(--bg-input)] flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Minus size={18} />
            </button>
            <div className="text-center">
              <p className="text-[32px] font-bold text-[#2D6A4F]">{areaM2}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">metrekare</p>
            </div>
            <button onClick={() => setAreaM2(Math.min(maxArea, areaM2 + 5))}
              className="w-10 h-10 rounded-xl bg-[var(--bg-input)] flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Plus size={18} />
            </button>
          </div>
          <input type="range" min={minArea} max={maxArea} step={1} value={areaM2}
            onChange={e => setAreaM2(Number(e.target.value))}
            className="w-full accent-[#2D6A4F]" />
          <div className="flex justify-between text-[9px] text-[var(--text-tertiary)] mt-1">
            <span>Min: {minArea} m²</span>
            <span>Max: {maxArea} m²</span>
          </div>
        </div>
      </div>

      {/* 3. Maliyet Özeti */}
      <div className="mb-5">
        <p className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">3. Maliyet Özeti</p>
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] divide-y divide-[var(--border-default)]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 text-[13px]"><MapPin size={14} className="text-emerald-600" /> Aylık Kira</span>
            <span className="text-[13px] font-bold">{rentCost.toFixed(0)} TL</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 text-[13px]"><Leaf size={14} className="text-purple-500" /> Tohum Maliyeti</span>
            <span className="text-[13px] font-bold">{seedCost.toFixed(0)} TL</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 text-[13px]"><Droplets size={14} className="text-blue-500" /> Sulama (tahmini/ay)</span>
            <span className="text-[13px] text-[var(--text-secondary)]">~{(pricing?.water_per_action || 0) * 15} TL</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-50">
            <span className="flex items-center gap-2 text-[14px] font-bold text-[#2D6A4F]"><ShoppingCart size={16} /> İlk Ödeme</span>
            <span className="text-[18px] font-bold text-[#2D6A4F]">{totalInitial.toFixed(0)} TL</span>
          </div>
        </div>
      </div>

      {/* Tahmini Hasat */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 mb-5">
        <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1">Tahmini Hasat</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[20px] font-bold text-amber-800">{estimatedYield.toFixed(1)} kg</p>
            <p className="text-[11px] text-amber-600">{selectedCrop?.display_name} · {selectedCrop?.growth_days} gün sonra</p>
          </div>
          <span className="text-[36px]">{selectedCrop?.icon_emoji}</span>
        </div>
      </div>

      {/* Kirala Butonu */}
      <button onClick={handleRent} disabled={renting || !selectedCrop}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-[16px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all disabled:opacity-50 mb-4">
        {renting ? (
          <><Loader2 size={20} className="animate-spin" /> Kiralanıyor...</>
        ) : (
          <><Sprout size={20} /> Tarlamı Kirala — {totalInitial.toFixed(0)} TL</>
        )}
      </button>

      <p className="text-[10px] text-center text-[var(--text-tertiary)] leading-relaxed">
        Kiralama işlemi sonrası aylık kira otomatik tahsil edilir.
        İstediğiniz zaman iptal edebilirsiniz. Hasat sonunda ürünler adresinize kargolanır.
      </p>
    </div>
  );
}
