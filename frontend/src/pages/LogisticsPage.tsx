import { useEffect, useState } from 'react';
import {
  Truck, MapPin, Phone, Star, Snowflake, Calculator, Search, ChevronRight,
} from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useFeatures } from '../hooks/useFeatures';

interface Provider {
  _id: string;
  name: string;
  companyName: string;
  phone: string;
  whatsapp: string;
  city: string;
  district: string;
  vehicleTypes: string[];
  capacityKg: number;
  coverageAreas: string[];
  pricePerKm: number;
  hasColdChain: boolean;
  description: string;
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  contactCount: number;
}

const VEHICLE_LABELS: Record<string, string> = {
  kamyon: 'Kamyon',
  tir: 'TIR',
  'soguk-zincir': 'Soğuk Zincir',
  frigo: 'Frigo',
  minibus: 'Minibüs',
};

export default function LogisticsPage() {
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [coldChain, setColdChain] = useState(false);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [showCalc, setShowCalc] = useState(false);

  const fetchProviders = () => {
    setLoading(true);
    const params: any = {};
    if (search) params.search = search;
    if (city) params.city = city;
    if (coldChain) params.coldChain = 'true';
    api.get('/logistics', { params })
      .then(({ data }) => setProviders(data.providers || []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchProviders, [city, coldChain]);

  if (!featuresLoading && !isEnabled('logisticsDirectory')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Truck size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">Nakliyeci Rehberi Yakında</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Tarım nakliyecileri ve mesafe hesaplayıcı yakında burada.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <SEO
        title="Nakliyeci Rehberi - HasatLink"
        description="Tarım nakliyecileri, soğuk zincir taşımacılık, mesafe ve maliyet hesaplayıcı."
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Truck size={28} className="text-[#2D6A4F]" />
            Nakliyeci Rehberi
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Tarım nakliyecileri + mesafe/maliyet hesaplayıcı
          </p>
        </div>
        <button
          onClick={() => setShowCalc(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-2xl font-semibold text-sm hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Calculator size={16} />
          Mesafe Hesapla
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Nakliyeci ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchProviders()}
            className="w-full pl-11 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl text-sm focus:outline-none focus:border-[#2D6A4F]"
          />
        </div>
        <input
          type="text"
          placeholder="Şehir filtrele..."
          value={city}
          onChange={e => setCity(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchProviders()}
          className="px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl text-sm focus:outline-none focus:border-[#2D6A4F] w-40"
        />
        <button
          onClick={() => setColdChain(!coldChain)}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border transition-colors
            ${coldChain
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-600'
              : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)]'
            }
          `}
        >
          <Snowflake size={14} />
          Soğuk Zincir
        </button>
      </div>

      {/* Providers */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : providers.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
          <Truck size={40} className="mx-auto text-[var(--text-secondary)] mb-3 opacity-50" />
          <p className="text-sm text-[var(--text-secondary)]">Nakliyeci bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map(p => (
            <button
              key={p._id}
              onClick={() => {
                setSelected(p);
                api.post(`/logistics/${p._id}/contact`).catch(() => {});
              }}
              className="text-left bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">{p.companyName || p.name}</h3>
                    {p.isVerified && (
                      <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-semibold">
                        ONAYLI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                    <MapPin size={12} />
                    {p.city}{p.district ? `, ${p.district}` : ''}
                  </p>
                </div>
                {p.rating > 0 && (
                  <span className="flex items-center gap-1 text-sm font-bold text-amber-500">
                    <Star size={14} fill="currentColor" />
                    {p.rating.toFixed(1)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.vehicleTypes?.map(v => (
                  <span key={v} className="px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[10px] font-medium">
                    {VEHICLE_LABELS[v] || v}
                  </span>
                ))}
                {p.hasColdChain && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-medium">
                    <Snowflake size={10} />
                    Soğuk Zincir
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>{p.pricePerKm ? `${p.pricePerKm} ₺/km` : ''}</span>
                {p.capacityKg > 0 && <span>{(p.capacityKg / 1000).toFixed(0)} ton kapasite</span>}
                <ChevronRight size={14} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Provider Detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-1">{selected.companyName || selected.name}</h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4 flex items-center gap-1">
              <MapPin size={12} />
              {selected.city}{selected.district ? `, ${selected.district}` : ''}
              {selected.coverageAreas?.length > 0 && ` · Kapsam: ${selected.coverageAreas.join(', ')}`}
            </p>
            {selected.description && <p className="text-sm mb-4">{selected.description}</p>}

            <div className="flex gap-3 mb-4">
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] transition-colors">
                  <Phone size={14} />
                  Ara
                </a>
              )}
              {selected.whatsapp && (
                <a href={`https://wa.me/90${selected.whatsapp.replace(/\D/g, '').replace(/^90/, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-2xl text-sm font-semibold hover:bg-green-700 transition-colors">
                  WhatsApp
                </a>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm font-semibold hover:opacity-80 transition-opacity">
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Distance Calculator */}
      {showCalc && <DistanceCalcModal onClose={() => setShowCalc(false)} />}
    </div>
  );
}

function DistanceCalcModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ fromLat: '', fromLng: '', toLat: '', toLng: '', pricePerKm: '25' });
  const [result, setResult] = useState<{ distanceKm: number; estimatedPrice: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!form.fromLat || !form.fromLng || !form.toLat || !form.toLng) {
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/logistics/distance', {
        params: {
          fromLat: form.fromLat,
          fromLng: form.fromLng,
          toLat: form.toLat,
          toLng: form.toLng,
          pricePerKm: form.pricePerKm,
        },
      });
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-2xl p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calculator size={20} className="text-amber-500" />
          Mesafe ve Maliyet Hesaplayıcı
        </h2>

        <div className="space-y-3 mb-4">
          <p className="text-xs text-[var(--text-secondary)]">Nereden (Enlem / Boylam)</p>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="any" placeholder="Enlem (ör: 39.92)" value={form.fromLat} onChange={e => setForm(f => ({ ...f, fromLat: e.target.value }))} className="px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30" />
            <input type="number" step="any" placeholder="Boylam (ör: 32.85)" value={form.fromLng} onChange={e => setForm(f => ({ ...f, fromLng: e.target.value }))} className="px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30" />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Nereye (Enlem / Boylam)</p>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="any" placeholder="Enlem" value={form.toLat} onChange={e => setForm(f => ({ ...f, toLat: e.target.value }))} className="px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30" />
            <input type="number" step="any" placeholder="Boylam" value={form.toLng} onChange={e => setForm(f => ({ ...f, toLng: e.target.value }))} className="px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30" />
          </div>
          <input type="number" placeholder="₺/km (varsayılan: 25)" value={form.pricePerKm} onChange={e => setForm(f => ({ ...f, pricePerKm: e.target.value }))} className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30" />
        </div>

        {result && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 bg-green-500/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-600">{result.distanceKm} km</p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mt-1">Mesafe</p>
            </div>
            <div className="p-4 bg-amber-500/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-amber-600">{result.estimatedPrice.toLocaleString('tr-TR')} ₺</p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mt-1">Tahmini Maliyet</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm font-semibold hover:opacity-80 transition-opacity">Kapat</button>
          <button onClick={calculate} disabled={loading} className="flex-1 px-4 py-3 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] transition-colors disabled:opacity-50">
            {loading ? 'Hesaplanıyor...' : 'Hesapla'}
          </button>
        </div>
      </div>
    </div>
  );
}
