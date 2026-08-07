import { useEffect, useState, useMemo } from 'react';
import {
  CalendarDays, Sprout, Scissors, MapPin, Info, Download, Search,
  LayoutGrid, BarChart3, X, TrendingUp, Package, Leaf, ChevronDown,
} from 'lucide-react';
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
const MONTH_SHORT = ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'];

const CATEGORIES = [
  { value: '', label: 'Tümü', emoji: '🌾' },
  { value: 'sebze', label: 'Sebze', emoji: '🥦' },
  { value: 'meyve', label: 'Meyve', emoji: '🍎' },
  { value: 'tahil', label: 'Tahıl', emoji: '🌾' },
  { value: 'baklagil', label: 'Baklagil', emoji: '🫘' },
  { value: 'yagli-tohum', label: 'Yağlı Tohum', emoji: '🌻' },
  { value: 'endustri', label: 'Endüstri', emoji: '🏭' },
  { value: 'yem-bitkileri', label: 'Yem Bitkileri', emoji: '🌿' },
];

const SORT_OPTIONS = [
  { value: 'default', label: 'Varsayılan' },
  { value: 'name-asc', label: 'A → Z' },
  { value: 'name-desc', label: 'Z → A' },
  { value: 'category', label: 'Kategori' },
  { value: 'harvest-now', label: 'Şu An Hasat' },
];

type ViewMode = 'grid' | 'timeline';
type SortKey = 'default' | 'name-asc' | 'name-desc' | 'category' | 'harvest-now';

/** Format month range "Nisan - Ekim" from an array of month numbers */
function formatMonthRange(months: number[]): string {
  if (!months || months.length === 0) return '—';
  if (months.length === 1) return MONTHS[months[0] - 1];
  const sorted = [...months].sort((a, b) => a - b);
  return `${MONTHS[sorted[0] - 1]} - ${MONTHS[sorted[sorted.length - 1] - 1]}`;
}

/** 12-ay bar + şu anki ay göstergesi */
function MonthBar({
  months,
  color,
  currentMonth,
}: {
  months: number[];
  color: 'green' | 'amber';
  currentMonth: number;
}) {
  const barColor = color === 'green' ? 'bg-green-500' : 'bg-amber-500';
  const activeGlow = color === 'green' ? 'shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'shadow-[0_0_8px_rgba(245,158,11,0.5)]';
  return (
    <div className="relative">
      <div className="flex gap-0.5 relative">
        {MONTHS.map((_, i) => {
          const mNum = i + 1;
          const isActive = months?.includes(mNum);
          const isCurrent = mNum === currentMonth;
          const isActiveNow = isActive && isCurrent;
          return (
            <div
              key={i}
              className={`
                flex-1 h-2.5 rounded-full transition-all
                ${isActive ? `${barColor} ${isActiveNow ? activeGlow : ''}` : 'bg-[var(--bg-input)]'}
                ${isCurrent && !isActive ? 'ring-1 ring-inset ring-[var(--text-secondary)]/30' : ''}
              `}
              title={MONTHS[i]}
            />
          );
        })}
      </div>
      {/* Ay harfleri */}
      <div className="flex gap-0.5 mt-1.5">
        {MONTH_SHORT.map((m, i) => {
          const isCurrent = i + 1 === currentMonth;
          return (
            <div
              key={i}
              className={`
                flex-1 text-center text-[9px] font-semibold leading-none
                ${isCurrent ? 'text-[#2D6A4F]' : 'text-[var(--text-secondary)]/70'}
              `}
            >
              {m}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HarvestCalendarPage() {
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const [items, setItems] = useState<HarvestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('default');
  const [view, setView] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<HarvestItem | null>(null);
  const [showAllMonths, setShowAllMonths] = useState(false);

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const currentMonthName = MONTHS[currentMonth - 1];

  useEffect(() => {
    const params: Record<string, string | number> = {};
    if (month) params.month = month;
    if (category) params.category = category;
    api.get('/harvest-calendar', { params })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [month, category]);

  /** Client-side search + sort */
  const filteredItems = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.trim().toLocaleLowerCase('tr');
      result = result.filter(it =>
        it.product?.toLocaleLowerCase('tr').includes(q) ||
        it.productEn?.toLowerCase().includes(q) ||
        it.category?.toLocaleLowerCase('tr').includes(q)
      );
    }
    if (sortBy === 'name-asc') {
      result = [...result].sort((a, b) => a.product.localeCompare(b.product, 'tr'));
    } else if (sortBy === 'name-desc') {
      result = [...result].sort((a, b) => b.product.localeCompare(a.product, 'tr'));
    } else if (sortBy === 'category') {
      result = [...result].sort((a, b) => (a.category || '').localeCompare(b.category || '', 'tr'));
    } else if (sortBy === 'harvest-now') {
      result = [...result].sort((a, b) => {
        const aNow = a.harvestMonths?.includes(currentMonth) ? 0 : 1;
        const bNow = b.harvestMonths?.includes(currentMonth) ? 0 : 1;
        return aNow - bNow;
      });
    }
    return result;
  }, [items, search, sortBy, currentMonth]);

  /** Stats - tüm veri üzerinden (filtre uygulanmadan) — daha güvenilir */
  const stats = useMemo(() => {
    const harvestNow = items.filter(i => i.harvestMonths?.includes(currentMonth)).length;
    const plantNow = items.filter(i => i.plantMonths?.includes(currentMonth)).length;
    const regions = new Set<string>();
    items.forEach(i => i.regions?.forEach(r => regions.add(r)));
    return {
      harvestNow,
      plantNow,
      total: items.length,
      regions: regions.size,
    };
  }, [items, currentMonth]);

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
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      <SEO
        title="Hasat Takvimi - HasatLink"
        description="Türkiye'de ekim ve hasat dönemleri. Hangi ürün ne zaman hasat edilir, bölgesel ipuçları."
      />

      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2D6A4F] via-[#1B4332] to-[#081C15] rounded-3xl p-6 md:p-8 mb-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute right-10 bottom-0 w-40 h-40 rounded-full bg-green-400/10 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <CalendarDays size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Türkiye Tarım Takvimi · {new Date().getFullYear()}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
            Hasat Takvimi
          </h1>
          <p className="text-sm text-white/80 max-w-xl">
            Ürün bazında ekim ve hasat dönemleri, bölgesel ipuçları ve mevsimlik öneriler.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Scissors size={16} />}
          label={`${currentMonthName} Hasat`}
          value={stats.harvestNow}
          accent="green"
        />
        <StatCard
          icon={<Sprout size={16} />}
          label={`${currentMonthName} Ekim`}
          value={stats.plantNow}
          accent="amber"
        />
        <StatCard
          icon={<Package size={16} />}
          label="Toplam Ürün"
          value={stats.total}
          accent="blue"
        />
        <StatCard
          icon={<MapPin size={16} />}
          label="Bölge"
          value={stats.regions}
          accent="purple"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 mb-5 sticky top-2 z-20 backdrop-blur-sm">
        {/* Top: Search + Sort + View */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ürün ara (ör: domates, buğday)..."
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-[var(--bg-input)] rounded-xl border border-transparent focus:border-[#2D6A4F] focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-[var(--bg-input)] rounded-xl border border-transparent focus:border-[#2D6A4F] focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>Sırala: {s.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]" />
          </div>

          <div className="inline-flex items-center bg-[var(--bg-input)] rounded-xl p-1">
            <button
              onClick={() => setView('grid')}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${view === 'grid' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}
              `}
              title="Grid görünüm"
            >
              <LayoutGrid size={13} /> Grid
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${view === 'timeline' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}
              `}
              title="Timeline görünüm"
            >
              <BarChart3 size={13} /> Timeline
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-3">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
                ${category === c.value
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm'
                  : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[#2D6A4F]/40'
                }
              `}
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Months */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            onClick={() => setMonth('')}
            className={`
              px-3 py-1 rounded-full text-[11px] font-semibold transition-all
              ${month === '' ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
            `}
          >
            Tüm Aylar
          </button>
          <button
            onClick={() => setMonth(currentMonth)}
            className={`
              inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all
              ${month === currentMonth
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-green-50 dark:bg-green-900/20 text-[#2D6A4F] border border-[#2D6A4F]/30'}
            `}
          >
            <TrendingUp size={10} />
            Bu Ay · {currentMonthName}
          </button>
          {(showAllMonths ? MONTHS : MONTHS.slice(0, 6)).map((m, i) => {
            const mNum = i + 1;
            if (mNum === currentMonth) return null;
            return (
              <button
                key={m}
                onClick={() => setMonth(mNum)}
                className={`
                  px-3 py-1 rounded-full text-[11px] font-semibold transition-all
                  ${month === mNum ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
                `}
              >
                {m}
              </button>
            );
          })}
          {!showAllMonths && (
            <button
              onClick={() => setShowAllMonths(true)}
              className="px-3 py-1 rounded-full text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[#2D6A4F]"
            >
              +6 diğer ay
            </button>
          )}
        </div>
      </div>

      {/* Active filter summary */}
      {(search || month || category || sortBy !== 'default') && (
        <div className="flex items-center justify-between mb-4 text-[11px] text-[var(--text-secondary)]">
          <span>
            <strong className="text-[var(--text-primary)]">{filteredItems.length}</strong> ürün gösteriliyor
            {month && <> · <strong>{MONTHS[Number(month) - 1]}</strong> ayı</>}
            {category && <> · <strong>{CATEGORIES.find(c => c.value === category)?.label}</strong></>}
            {search && <> · "<strong>{search}</strong>" aramasına uygun</>}
          </span>
          <button
            onClick={() => { setSearch(''); setMonth(''); setCategory(''); setSortBy('default'); }}
            className="text-[#2D6A4F] hover:underline font-semibold"
          >
            Filtreleri temizle
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
          <Leaf size={48} className="mx-auto text-[var(--text-secondary)] mb-3 opacity-40" />
          <h3 className="text-base font-bold mb-1">Sonuç bulunamadı</h3>
          <p className="text-sm text-[var(--text-secondary)]">Filtreleri değiştirmeyi veya farklı bir arama yapmayı dene</p>
        </div>
      ) : view === 'grid' ? (
        <GridView items={filteredItems} currentMonth={currentMonth} onSelect={setSelected} />
      ) : (
        <TimelineView items={filteredItems} currentMonth={currentMonth} onSelect={setSelected} />
      )}

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          item={selected}
          currentMonth={currentMonth}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function StatCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: 'green' | 'amber' | 'blue' | 'purple';
}) {
  const colors = {
    green: { bg: 'bg-green-500/10', text: 'text-green-600', ring: 'ring-green-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', ring: 'ring-amber-500/20' },
    blue: { bg: 'bg-sky-500/10', text: 'text-sky-600', ring: 'ring-sky-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-600', ring: 'ring-purple-500/20' },
  }[accent];
  return (
    <div className={`bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 hover:ring-1 ${colors.ring} transition-all`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
        {value}
      </p>
    </div>
  );
}

function GridView({
  items, currentMonth, onSelect,
}: {
  items: HarvestItem[];
  currentMonth: number;
  onSelect: (item: HarvestItem) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => {
        const isHarvestingNow = item.harvestMonths?.includes(currentMonth);
        const isPlantingNow = item.plantMonths?.includes(currentMonth);
        return (
          <button
            key={item._id}
            onClick={() => onSelect(item)}
            className="group text-left bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 hover:border-[#2D6A4F]/40 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3 min-w-0">
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt={item.product} loading="lazy" decoding="async" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2D6A4F]/15 to-[#2D6A4F]/5 flex items-center justify-center text-2xl shrink-0">
                    🌱
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[var(--text-primary)] truncate group-hover:text-[#2D6A4F] transition-colors">
                    {item.product}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] capitalize">{item.category}</p>
                </div>
              </div>
              {isHarvestingNow && (
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Şimdi
                </span>
              )}
              {!isHarvestingNow && isPlantingNow && (
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Ekim
                </span>
              )}
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold flex items-center gap-1">
                  <Scissors size={10} /> Hasat
                </p>
                <span className="text-[10px] text-[var(--text-secondary)] font-semibold">
                  {formatMonthRange(item.harvestMonths)}
                </span>
              </div>
              <MonthBar months={item.harvestMonths} color="green" currentMonth={currentMonth} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold flex items-center gap-1">
                  <Sprout size={10} /> Ekim
                </p>
                <span className="text-[10px] text-[var(--text-secondary)] font-semibold">
                  {formatMonthRange(item.plantMonths)}
                </span>
              </div>
              <MonthBar months={item.plantMonths} color="amber" currentMonth={currentMonth} />
            </div>

            {item.regions?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                <MapPin size={10} />
                <span className="truncate">{item.regions.slice(0, 3).join(', ')}{item.regions.length > 3 ? ` +${item.regions.length - 3}` : ''}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function TimelineView({
  items, currentMonth, onSelect,
}: {
  items: HarvestItem[];
  currentMonth: number;
  onSelect: (item: HarvestItem) => void;
}) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden">
      {/* Header row - month labels */}
      <div className="grid grid-cols-[160px_1fr] border-b border-[var(--border-default)] bg-[var(--bg-input)]/30">
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Ürün
        </div>
        <div className="grid grid-cols-12 relative">
          {MONTHS.map((m, i) => {
            const isCurrent = i + 1 === currentMonth;
            return (
              <div
                key={m}
                className={`
                  text-center py-3 text-[10px] font-bold uppercase tracking-wider
                  ${isCurrent ? 'text-[#2D6A4F] bg-green-500/10' : 'text-[var(--text-secondary)]'}
                `}
                title={m}
              >
                {m.slice(0, 3)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {items.map(item => {
          const isHarvestingNow = item.harvestMonths?.includes(currentMonth);
          return (
            <button
              key={item._id}
              onClick={() => onSelect(item)}
              className="w-full grid grid-cols-[160px_1fr] hover:bg-[var(--bg-input)]/30 transition-colors text-left group"
            >
              <div className="px-4 py-3 flex items-center gap-2 min-w-0">
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt="" loading="lazy" decoding="async" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#2D6A4F]/10 flex items-center justify-center text-sm shrink-0">
                    🌱
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-[#2D6A4F]">
                    {item.product}
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] capitalize truncate">
                    {item.category}
                  </p>
                </div>
                {isHarvestingNow && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" title="Şu an hasat dönemi" />
                )}
              </div>
              <div className="grid grid-cols-12 relative py-3 pr-2">
                {MONTHS.map((_, i) => {
                  const mNum = i + 1;
                  const isHarvest = item.harvestMonths?.includes(mNum);
                  const isPlant = item.plantMonths?.includes(mNum);
                  const isCurrent = mNum === currentMonth;
                  return (
                    <div key={i} className="px-1 flex flex-col gap-1 justify-center">
                      {isHarvest && (
                        <div className={`h-2 rounded-full bg-green-500 ${isCurrent ? 'shadow-[0_0_6px_rgba(34,197,94,0.6)]' : ''}`} title={`Hasat: ${MONTHS[i]}`} />
                      )}
                      {isPlant && (
                        <div className={`h-2 rounded-full bg-amber-500 ${isCurrent ? 'shadow-[0_0_6px_rgba(245,158,11,0.6)]' : ''}`} title={`Ekim: ${MONTHS[i]}`} />
                      )}
                      {!isHarvest && !isPlant && (
                        <div className="h-2" />
                      )}
                    </div>
                  );
                })}
                {/* Current month vertical marker */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-[#2D6A4F]/30 pointer-events-none"
                  style={{ left: `${((currentMonth - 0.5) / 12) * 100}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="border-t border-[var(--border-default)] px-4 py-3 flex flex-wrap items-center gap-4 text-[10px] text-[var(--text-secondary)] bg-[var(--bg-input)]/20">
        <span className="inline-flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-full bg-green-500" />
          Hasat
        </span>
        <span className="inline-flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-full bg-amber-500" />
          Ekim
        </span>
        <span className="inline-flex items-center gap-1.5">
          <div className="w-px h-3 bg-[#2D6A4F]" />
          Bugün · {MONTHS[currentMonth - 1]}
        </span>
      </div>
    </div>
  );
}

function DetailModal({
  item, currentMonth, onClose,
}: {
  item: HarvestItem;
  currentMonth: number;
  onClose: () => void;
}) {
  const isHarvestingNow = item.harvestMonths?.includes(currentMonth);
  const isPlantingNow = item.plantMonths?.includes(currentMonth);

  const handleDownloadICS = () => {
    const year = new Date().getFullYear();
    const firstHarvest = item.harvestMonths?.[0] || 1;
    const lastHarvest = item.harvestMonths?.[item.harvestMonths.length - 1] || firstHarvest;
    const startDate = `${year}${String(firstHarvest).padStart(2, '0')}01`;
    const endDate = `${year}${String(lastHarvest).padStart(2, '0')}28`;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HasatLink//Hasat Takvimi//TR',
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${item.product} Hasat Dönemi`,
      `DESCRIPTION:${item.description || `${item.product} hasat zamanı`}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.product.toLowerCase().replace(/\s+/g, '-')}-hasat.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--bg-surface)] rounded-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - hero */}
        <div className="relative bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-start gap-4">
            {item.iconUrl ? (
              <img src={item.iconUrl} alt={item.product} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center text-4xl">
                🌱
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-1 truncate">{item.product}</h2>
              {item.productEn && (
                <p className="text-sm text-white/70 italic mb-2">{item.productEn}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-semibold capitalize">
                  {item.category}
                </span>
                {isHarvestingNow && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-400 text-green-950 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-700 animate-pulse" />
                    Şu An Hasat Dönemi
                  </span>
                )}
                {!isHarvestingNow && isPlantingNow && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-700" />
                    Ekim Zamanı
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {item.description && (
            <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-5">
              {item.description}
            </p>
          )}

          {/* Year timeline */}
          <div className="bg-[var(--bg-input)]/30 rounded-2xl p-4 mb-5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Yıllık Takvim
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold flex items-center gap-1 mb-1.5">
                  <Scissors size={10} /> Hasat · {formatMonthRange(item.harvestMonths)}
                </p>
                <MonthBar months={item.harvestMonths} color="green" currentMonth={currentMonth} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold flex items-center gap-1 mb-1.5">
                  <Sprout size={10} /> Ekim · {formatMonthRange(item.plantMonths)}
                </p>
                <MonthBar months={item.plantMonths} color="amber" currentMonth={currentMonth} />
              </div>
            </div>
          </div>

          {/* Regions */}
          {item.regions?.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                <MapPin size={11} /> Yetişen Bölgeler
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {item.regions.map(r => (
                  <span key={r} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-input)] text-xs">
                    <MapPin size={10} className="text-[var(--text-secondary)]" />
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {item.tips?.length > 0 && (
            <div className="mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                <Info size={11} /> Üretici İpuçları
              </h3>
              <ul className="space-y-2">
                {item.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-[var(--text-primary)] flex gap-2 bg-[var(--bg-input)]/30 rounded-lg px-3 py-2">
                    <span className="text-[#2D6A4F] font-bold shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-[var(--border-default)] p-4 flex gap-2 bg-[var(--bg-input)]/20">
          <button
            onClick={handleDownloadICS}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0077B6] text-white rounded-xl text-sm font-semibold hover:bg-[#005f8a] transition-colors"
          >
            <Download size={14} /> Takvime Ekle
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm font-semibold hover:bg-[var(--bg-input)] transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
