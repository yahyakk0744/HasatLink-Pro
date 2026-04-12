import { useEffect, useState, useMemo } from 'react';
import { CalendarDays, Sprout, Scissors, MapPin, Info, Download } from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useFeatures } from '../hooks/useFeatures';

interface HarvestItem {
  _id: string;
  product: string;
  productEn: string;
  category: string;
  plantMonths: number[];
  harvestMonths: number[];
  regions: string[];
  description: string;
  tips: string[];
  iconUrl: string;
  coverImage: string;
}

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const CATEGORIES = [
  { value: '', label: 'Tümü' },
  { value: 'sebze', label: 'Sebze' },
  { value: 'meyve', label: 'Meyve' },
  { value: 'tahil', label: 'Tahıl' },
  { value: 'baklagil', label: 'Baklagil' },
  { value: 'yem-bitkileri', label: 'Yem Bitkileri' },
];

export default function HarvestCalendarPage() {
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const [items, setItems] = useState<HarvestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<HarvestItem | null>(null);

  useEffect(() => {
    const params: any = {};
    if (month) params.month = month;
    if (category) params.category = category;
    api.get('/harvest-calendar', { params })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [month, category]);

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

  if (!featuresLoading && !isEnabled('harvestCalendar')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <CalendarDays size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">Hasat Takvimi Yakında</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Ürün bazında ekim ve hasat takvimi yakında aktif olacak.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <SEO
        title="Hasat Takvimi - HasatLink"
        description="Türkiye'de ekim ve hasat dönemleri. Hangi ürün ne zaman hasat edilir, bölgesel ipuçları."
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <CalendarDays size={28} className="text-[#2D6A4F]" />
          Hasat Takvimi
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Ürün bazında ekim ve hasat dönemleri + bölgesel ipuçları
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setMonth('')}
            className={`
              px-4 py-2 rounded-full text-xs font-semibold transition-colors
              ${month === '' ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-input)] text-[var(--text-primary)]'}
            `}
          >
            Tüm Aylar
          </button>
          <button
            onClick={() => setMonth(currentMonth)}
            className={`
              px-4 py-2 rounded-full text-xs font-semibold transition-colors
              ${month === currentMonth ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-input)] text-[var(--text-primary)]'}
            `}
          >
            Bu Ay ({MONTHS[currentMonth - 1]})
          </button>
          {MONTHS.map((m, i) => {
            const mNum = i + 1;
            if (mNum === currentMonth) return null;
            return (
              <button
                key={m}
                onClick={() => setMonth(mNum)}
                className={`
                  px-4 py-2 rounded-full text-xs font-semibold transition-colors
                  ${month === mNum ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-input)] text-[var(--text-primary)]'}
                `}
              >
                {m}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`
                px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border
                ${category === c.value
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-default)]'
                }
              `}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
          <Sprout size={40} className="mx-auto text-[var(--text-secondary)] mb-3 opacity-50" />
          <p className="text-sm text-[var(--text-secondary)]">Bu filtrelere uygun ürün bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <button
              key={item._id}
              onClick={() => setSelected(item)}
              className="text-left bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt={item.product} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center text-2xl">
                    🌱
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{item.product}</h3>
                  <p className="text-xs text-[var(--text-secondary)] capitalize">{item.category}</p>
                </div>
              </div>

              {/* Harvest month bar */}
              <div className="mb-2">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-1 flex items-center gap-1">
                  <Scissors size={10} />
                  Hasat
                </p>
                <div className="flex gap-0.5">
                  {MONTHS.map((_, i) => {
                    const mNum = i + 1;
                    const isHarvest = item.harvestMonths?.includes(mNum);
                    return (
                      <div
                        key={i}
                        className={`
                          flex-1 h-2 rounded-full
                          ${isHarvest ? 'bg-green-500' : 'bg-[var(--bg-input)]'}
                        `}
                        title={MONTHS[i]}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-[var(--text-secondary)]">O</span>
                  <span className="text-[9px] text-[var(--text-secondary)]">A</span>
                </div>
              </div>

              {/* Plant month bar */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-1 flex items-center gap-1">
                  <Sprout size={10} />
                  Ekim
                </p>
                <div className="flex gap-0.5">
                  {MONTHS.map((_, i) => {
                    const mNum = i + 1;
                    const isPlant = item.plantMonths?.includes(mNum);
                    return (
                      <div
                        key={i}
                        className={`
                          flex-1 h-2 rounded-full
                          ${isPlant ? 'bg-amber-500' : 'bg-[var(--bg-input)]'}
                        `}
                      />
                    );
                  })}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg bg-[var(--bg-surface)] rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              {selected.iconUrl ? (
                <img src={selected.iconUrl} alt={selected.product} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center text-3xl">
                  🌱
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{selected.product}</h2>
                {selected.productEn && (
                  <p className="text-xs text-[var(--text-secondary)]">{selected.productEn}</p>
                )}
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] text-[10px] font-semibold capitalize">
                  {selected.category}
                </span>
              </div>
            </div>

            {selected.description && (
              <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-4">
                {selected.description}
              </p>
            )}

            <div className="mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                <Scissors size={12} />
                Hasat Ayları
              </h3>
              <div className="flex flex-wrap gap-1">
                {selected.harvestMonths?.map(m => (
                  <span key={m} className="px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-semibold">
                    {MONTHS[m - 1]}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                <Sprout size={12} />
                Ekim Ayları
              </h3>
              <div className="flex flex-wrap gap-1">
                {selected.plantMonths?.map(m => (
                  <span key={m} className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-semibold">
                    {MONTHS[m - 1]}
                  </span>
                ))}
              </div>
            </div>

            {selected.regions?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                  <MapPin size={12} />
                  Bölgeler
                </h3>
                <div className="flex flex-wrap gap-1">
                  {selected.regions.map(r => (
                    <span key={r} className="px-2 py-1 rounded-full bg-[var(--bg-input)] text-xs">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selected.tips?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                  <Info size={12} />
                  İpuçları
                </h3>
                <ul className="space-y-2">
                  {selected.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-[var(--text-primary)] flex gap-2">
                      <span className="text-[#2D6A4F] shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Add to Calendar */}
            <button
              onClick={() => {
                const year = new Date().getFullYear();
                const firstHarvestMonth = selected.harvestMonths?.[0] || 1;
                const lastHarvestMonth = selected.harvestMonths?.[selected.harvestMonths.length - 1] || firstHarvestMonth;
                const startDate = `${year}${String(firstHarvestMonth).padStart(2, '0')}01`;
                const endDate = `${year}${String(lastHarvestMonth).padStart(2, '0')}28`;
                const ics = [
                  'BEGIN:VCALENDAR',
                  'VERSION:2.0',
                  'PRODID:-//HasatLink//Hasat Takvimi//TR',
                  'BEGIN:VEVENT',
                  `DTSTART;VALUE=DATE:${startDate}`,
                  `DTEND;VALUE=DATE:${endDate}`,
                  `SUMMARY:${selected.product} Hasat Dönemi`,
                  `DESCRIPTION:${selected.description || `${selected.product} hasat zamanı`}`,
                  'END:VEVENT',
                  'END:VCALENDAR',
                ].join('\r\n');
                const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selected.product.toLowerCase().replace(/\s+/g, '-')}-hasat.ics`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0077B6] text-white rounded-2xl text-sm font-semibold hover:bg-[#005f8a] transition-colors"
            >
              <Download size={14} />
              Takvime Ekle (.ics)
            </button>

            <button
              onClick={() => setSelected(null)}
              className="mt-2 w-full px-4 py-3 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
