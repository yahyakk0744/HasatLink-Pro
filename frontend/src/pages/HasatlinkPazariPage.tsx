import { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useHasatlinkPazar } from '../hooks/useHasatlinkPazar';
import HasatlinkWeeklyChart from '../components/hal/HasatlinkWeeklyChart';
import HasatlinkHourlyChart from '../components/hal/HasatlinkHourlyChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { HasatlinkPazarItem } from '../types';

const TABS = [
  { id: 'all', label: 'Tüm Ürünler' },
  { id: 'weekly', label: 'Haftalık Grafik' },
  { id: 'hourly', label: 'Saatlik Grafik' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const CATEGORIES = [
  { value: '', label: 'Hepsi' },
  { value: 'sebze', label: 'Sebze' },
  { value: 'meyve', label: 'Meyve' },
  { value: 'tahıl', label: 'Tahıl' },
  { value: 'bakliyat', label: 'Bakliyat' },
];

type SortKey = 'name' | 'price' | 'change' | 'minPrice' | 'maxPrice' | 'listingCount';
type SortDir = 'asc' | 'desc';

const PER_PAGE = 25;

export default function HasatlinkPazariPage() {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const {
    prices, weeklyData, hourlyData,
    loading, error,
    fetchPrices, fetchWeekly, fetchHourly,
  } = useHasatlinkPazar();

  // Tab 1 state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('listingCount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  // Tab 2/3 state
  const [selectedProduct, setSelectedProduct] = useState('');

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    if (activeTab === 'weekly') {
      fetchWeekly(selectedProduct || undefined);
    } else if (activeTab === 'hourly') {
      fetchHourly(selectedProduct || undefined);
    }
  }, [activeTab, selectedProduct, fetchWeekly, fetchHourly]);

  const productNames = useMemo(() => {
    const names = [...new Set(prices.map(p => p.name))];
    names.sort((a, b) => a.localeCompare(b, 'tr'));
    return names;
  }, [prices]);

  // Filter + sort + paginate
  const filtered = useMemo(() => {
    let items = [...prices];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      items = items.filter(p => p.category === categoryFilter);
    }
    items.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name, 'tr');
      else cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return items;
  }, [prices, search, categoryFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [search, categoryFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc'); }
  };

  const weeklySummary = useMemo(() => {
    if (weeklyData.length === 0) return null;
    let allMin = Infinity, allMax = -Infinity;
    for (const day of weeklyData) {
      for (const p of day.prices) {
        if (p.min < allMin) allMin = p.min;
        if (p.max > allMax) allMax = p.max;
      }
    }
    if (allMin === Infinity) return null;
    return { min: allMin, max: allMax };
  }, [weeklyData]);

  const SortArrow = ({ field }: { field: SortKey }) => (
    sortKey === field ? <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span> : null
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <ShoppingBag size={28} className="text-[#A47148]" />
        <h1 className="text-3xl font-semibold tracking-tight">HasatLink Pazarı</h1>
      </div>
      <p className="text-[#6B6560] mb-6">Site içi pazar ilanlarından derlenen fiyat verileri</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
              activeTab === tab.id
                ? 'bg-[#A47148] text-white'
                : 'bg-white border border-[#D6D0C8] text-[#6B6560] hover:bg-[#F5F3F0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* Tab 1 — Tüm Ürünler */}
      {activeTab === 'all' && (
        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6560]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#D6D0C8] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#A47148]/20 focus:border-[#A47148]"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-4 py-3 text-sm rounded-full transition-colors ${
                    categoryFilter === cat.value
                      ? 'bg-[#A47148] text-white'
                      : 'bg-white border border-[#D6D0C8] text-[#6B6560] hover:bg-[#F5F3F0]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" className="py-12" />
          ) : prices.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
              <ShoppingBag size={48} className="text-[#D6D0C8] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Henüz pazar verisi yok</h3>
              <p className="text-[#6B6560] text-sm">
                Pazar kategorisinde ilanlar eklendikçe fiyat karşılaştırma verileri burada görünecek.
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E1DC]">
                        {([
                          ['name', 'Ürün'],
                          ['minPrice', 'Min'],
                          ['price', 'Ort'],
                          ['maxPrice', 'Max'],
                        ] as [SortKey, string][]).map(([key, label]) => (
                          <th
                            key={key}
                            onClick={() => handleSort(key)}
                            className="px-4 py-3.5 text-left font-medium text-[#6B6560] cursor-pointer hover:text-[#A47148] select-none"
                          >
                            {label}<SortArrow field={key} />
                          </th>
                        ))}
                        <th className="px-4 py-3.5 text-left font-medium text-[#6B6560]">Birim</th>
                        <th
                          onClick={() => handleSort('change')}
                          className="px-4 py-3.5 text-left font-medium text-[#6B6560] cursor-pointer hover:text-[#A47148] select-none"
                        >
                          Değişim<SortArrow field="change" />
                        </th>
                        <th
                          onClick={() => handleSort('listingCount')}
                          className="px-4 py-3.5 text-left font-medium text-[#6B6560] cursor-pointer hover:text-[#A47148] select-none"
                        >
                          İlan<SortArrow field="listingCount" />
                        </th>
                        <th className="px-4 py-3.5 text-left font-medium text-[#6B6560]">Kategori</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((p: HasatlinkPazarItem, i: number) => (
                        <tr key={i} className="border-b border-[#F5F3F0] hover:bg-[#FAFAF8] transition-colors">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3">{p.minPrice.toFixed(2)}₺</td>
                          <td className="px-4 py-3 font-semibold">{p.price.toFixed(2)}₺</td>
                          <td className="px-4 py-3">{p.maxPrice.toFixed(2)}₺</td>
                          <td className="px-4 py-3 text-[#6B6560]">{p.unit}</td>
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-1 font-medium ${
                              p.change >= 0 ? 'text-[#2D6A4F]' : 'text-[#C1341B]'
                            }`}>
                              {p.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {p.change >= 0 ? '+' : ''}{p.change.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#6B6560]">{p.listingCount}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded-full bg-[#A47148]/10 text-[#A47148]">
                              {p.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-[#6B6560]">
                    {filtered.length} ürün, sayfa {page}/{totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-full bg-white border border-[#D6D0C8] disabled:opacity-40 hover:bg-[#F5F3F0]"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-full bg-white border border-[#D6D0C8] disabled:opacity-40 hover:bg-[#F5F3F0]"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 2 — Haftalık Grafik */}
      {activeTab === 'weekly' && (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#6B6560] mb-2">Ürün Seçin</label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="px-4 py-3 bg-white border border-[#D6D0C8] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#A47148]/20 focus:border-[#A47148] min-w-[200px]"
            >
              <option value="">Tümü (ortalama)</option>
              {productNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" className="py-12" />
          ) : (
            <>
              <HasatlinkWeeklyChart data={weeklyData} product={selectedProduct || undefined} />
              {weeklySummary && (
                <div className="mt-4 p-4 bg-white rounded-2xl shadow-sm text-sm text-[#6B6560]">
                  Bu hafta en düşük: <span className="font-semibold text-[#2D6A4F]">{weeklySummary.min.toFixed(2)}₺</span>,
                  en yüksek: <span className="font-semibold text-[#C1341B]">{weeklySummary.max.toFixed(2)}₺</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 3 — Saatlik Grafik */}
      {activeTab === 'hourly' && (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#6B6560] mb-2">Ürün Seçin</label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="px-4 py-3 bg-white border border-[#D6D0C8] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#A47148]/20 focus:border-[#A47148] min-w-[200px]"
            >
              <option value="">Tümü (ortalama)</option>
              {productNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" className="py-12" />
          ) : (
            <HasatlinkHourlyChart data={hourlyData} product={selectedProduct || undefined} />
          )}
        </div>
      )}
    </div>
  );
}
