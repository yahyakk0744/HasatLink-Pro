import { useEffect, useState } from 'react';
import { Store, MapPin, Phone, Star, ExternalLink, Search, Filter, CheckCircle2 } from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useFeatures } from '../hooks/useFeatures';

interface Dealer {
  _id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  whatsapp: string;
  website: string;
  logoUrl: string;
  coverImage: string;
  rating: number;
  ratingCount: number;
  is_premium_partner: boolean;
  isActive: boolean;
  clickCount: number;
  contactCount: number;
}

const DEALER_CATEGORIES = [
  { value: '', label: 'Tümü' },
  { value: 'tohum', label: 'Tohum' },
  { value: 'gubre', label: 'Gübre' },
  { value: 'ilac', label: 'Tarım İlacı' },
  { value: 'ekipman', label: 'Ekipman' },
  { value: 'sulama', label: 'Sulama' },
  { value: 'yem', label: 'Yem' },
  { value: 'diger', label: 'Diğer' },
];

export default function DealersPage() {
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<Dealer | null>(null);

  const fetchDealers = () => {
    setLoading(true);
    const params: any = {};
    if (search) params.search = search;
    if (category) params.category = category;
    api.get('/dealers/nearby', { params })
      .then(({ data }) => setDealers(data.dealers || data || []))
      .catch(() => setDealers([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchDealers, [category]);

  if (!featuresLoading && !isEnabled('dealerDirectory')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Store size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">Bayi Rehberi Yakında</h1>
        <p className="text-sm text-[var(--text-secondary)]">Tarım malzemeleri bayi dizini yakında burada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <SEO title="Bayi Rehberi - HasatLink" description="Tohum, gübre, ilaç, ekipman bayileri. Tarım malzemeleri dizini." />

      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 mb-2">
        <Store size={28} className="text-[#2D6A4F]" />
        Bayi Rehberi
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">Tohum, gübre, ilaç ve ekipman bayileri</p>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text" placeholder="Bayi ara..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchDealers()}
            className="w-full pl-11 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl text-sm focus:outline-none focus:border-[#2D6A4F]"
          />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl text-sm focus:outline-none focus:border-[#2D6A4F]">
          {DEALER_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : dealers.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
          <Store size={40} className="mx-auto text-[var(--text-secondary)] mb-3 opacity-50" />
          <p className="text-sm text-[var(--text-secondary)]">Bayi bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dealers.map(d => (
            <button
              key={d._id}
              onClick={() => {
                setSelected(d);
                api.post(`/dealers/${d._id}/click`).catch(() => {});
              }}
              className="text-left bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all"
            >
              {d.coverImage ? (
                <img src={d.coverImage} alt={d.name} className="w-full h-32 object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-[#2D6A4F]/10 to-[#40916C]/10 flex items-center justify-center">
                  <Store size={28} className="text-[#2D6A4F]/40" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start gap-3 mb-2">
                  {d.logoUrl && <img src={d.logoUrl} alt={d.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold truncate">{d.name}</h3>
                      {d.is_premium_partner && (
                        <CheckCircle2 size={14} className="text-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />{d.city}{d.district ? `, ${d.district}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span className="capitalize">{d.category}</span>
                  {d.rating > 0 && (
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star size={12} fill="currentColor" />{d.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              {selected.logoUrl && <img src={selected.logoUrl} alt={selected.name} className="w-14 h-14 rounded-xl object-cover" />}
              <div>
                <h2 className="text-lg font-bold">{selected.name}</h2>
                <p className="text-xs text-[var(--text-secondary)]">{selected.category} · {selected.city}</p>
              </div>
            </div>
            {selected.description && <p className="text-sm mb-4">{selected.description}</p>}
            {selected.address && <p className="text-xs text-[var(--text-secondary)] mb-4 flex items-center gap-1"><MapPin size={12} />{selected.address}</p>}
            <div className="flex gap-3 mb-3">
              {selected.phone && (
                <a href={`tel:${selected.phone}`} onClick={() => api.post(`/dealers/${selected._id}/contact`).catch(() => {})}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] transition-colors">
                  <Phone size={14} />Ara
                </a>
              )}
              {selected.website && (
                <a href={selected.website} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                  <ExternalLink size={14} />Web Sitesi
                </a>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm font-semibold hover:opacity-80 transition-opacity">Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}
