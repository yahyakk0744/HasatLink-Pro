import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHalPrices } from '../hooks/useHalPrices';
import WeeklyChart from '../components/hal/WeeklyChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SEO from '../components/ui/SEO';
import type { HalPrice } from '../types';

type SortKey = 'name' | 'price' | 'change' | 'minPrice' | 'maxPrice';
type SortDir = 'asc' | 'desc';

const PER_PAGE = 25;

export default function HalFiyatlariPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');

  const TABS = [
    { id: 'all' as const, label: isTr ? 'Tüm Ürünler' : 'All Products' },
    { id: 'weekly' as const, label: isTr ? 'Haftalık Grafik' : 'Weekly Chart' },
  ];

  const CATEGORIES = [
    { value: '', label: isTr ? 'Hepsi' : 'All' },
    { value: 'sebze', label: isTr ? 'Sebze' : 'Vegetable' },
    { value: 'meyve', label: isTr ? 'Meyve' : 'Fruit' },
  ];

  const [activeTab, setActiveTab] = useState<'all' | 'weekly'>('all');
  const {
    allPrices, weeklyData,
    loading, error,
    fetchAllPrices, fetchWeekly,
  } = useHalPrices();

  // Tab 1 state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  // Tab 2 state
  const [weeklyProduct, setWeeklyProduct] = useState('');

  useEffect(() => {
    fetchAllPrices();
  }, [fetchAllPrices]);

  useEffect(() => {
    if (activeTab === 'weekly') {
      fetchWeekly(weeklyProduct || undefined);
    }
  }, [activeTab, weeklyProduct, fetchWeekly]);

  // Product list for dropdown
  const productNames = useMemo(() => {
    const names = [...new Set(allPrices.map(p => p.name))];
    names.sort();
    return names;
  }, [allPrices]);

  // Tab 1: filtered + sorted + paginated
  const filtered = useMemo(() => {
    let items = [...allPrices];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q));
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
  }, [allPrices, search, categoryFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [search, categoryFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  // Weekly summary
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
      <SEO
        title={isTr ? 'Hal Fiyatları' : 'Market Hall Prices'}
        description={isTr ? 'İzmir Büyükşehir Belediyesi hal fiyatları. Güncel sebze meyve fiyatlarını takip edin.' : 'Izmir Metropolitan Municipality market hall prices.'}
        keywords={isTr ? 'hal fiyatları, sebze, meyve, İzmir, piyasa' : 'market prices, vegetables, fruits, Izmir'}
      />
      <h1 className="text-3xl font-semibold tracking-tight mb-2">{isTr ? 'Hal Fiyatları' : 'Market Hall Prices'}</h1>
      <p className="text-[var(--text-secondary)] mb-6">{isTr ? 'İzmir Büyükşehir Belediyesi hal verileri' : 'Izmir Metropolitan Municipality market data'}</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
              activeTab === tab.id
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
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
                placeholder={isTr ? 'Ürün ara...' : 'Search product...'}
                className="w-full pl-11 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
              />
            </div>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-4 py-3 text-sm rounded-full transition-colors ${
                    categoryFilter === cat.value
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" className="py-12" />
          ) : (
            <>
              {/* Table */}
              <div className="bg-[var(--bg-surface)] rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E1DC]">
                        {([
                          ['name', isTr ? 'Ürün' : 'Product'],
                          ['minPrice', 'Min'],
                          ['price', isTr ? 'Ort' : 'Avg'],
                          ['maxPrice', 'Max'],
                        ] as [SortKey, string][]).map(([key, label]) => (
                          <th
                            key={key}
                            onClick={() => handleSort(key)}
                            className="px-4 py-3.5 text-left font-medium text-[#6B6560] cursor-pointer hover:text-[#2D6A4F] select-none"
                          >
                            {label}<SortArrow field={key} />
                          </th>
                        ))}
                        <th className="px-4 py-3.5 text-left font-medium text-[#6B6560]">{isTr ? 'Birim' : 'Unit'}</th>
                        <th
                          onClick={() => handleSort('change')}
                          className="px-4 py-3.5 text-left font-medium text-[#6B6560] cursor-pointer hover:text-[#2D6A4F] select-none"
                        >
                          {isTr ? 'Değişim' : 'Change'}<SortArrow field="change" />
                        </th>
                        <th className="px-4 py-3.5 text-left font-medium text-[#6B6560]">{isTr ? 'Tip' : 'Type'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((p: HalPrice, i: number) => (
                        <tr key={i} className="border-b border-[#F5F3F0] hover:bg-[#FAFAF8] transition-colors">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3">{p.minPrice?.toFixed(2)}₺</td>
                          <td className="px-4 py-3 font-semibold">{p.price.toFixed(2)}₺</td>
                          <td className="px-4 py-3">{p.maxPrice?.toFixed(2)}₺</td>
                          <td className="px-4 py-3 text-[#6B6560]">{p.unit}</td>
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-1 font-medium ${
                              p.change >= 0 ? 'text-[#2D6A4F]' : 'text-[#C1341B]'
                            }`}>
                              {p.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {p.change >= 0 ? '+' : ''}{p.change.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              p.category === 'meyve'
                                ? 'bg-orange-50 text-orange-700'
                                : 'bg-green-50 text-green-700'
                            }`}>
                              {p.category === 'meyve' ? (isTr ? 'Meyve' : 'Fruit') : (isTr ? 'Sebze' : 'Vegetable')}
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
                    {filtered.length} {isTr ? 'ürün, sayfa' : 'products, page'} {page}/{totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] disabled:opacity-40 hover:bg-[var(--bg-surface-hover)]"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] disabled:opacity-40 hover:bg-[var(--bg-surface-hover)]"
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
            <label className="block text-sm font-medium text-[#6B6560] mb-2">{isTr ? 'Ürün Seçin' : 'Select Product'}</label>
            <select
              value={weeklyProduct}
              onChange={e => setWeeklyProduct(e.target.value)}
              className="px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] min-w-[200px]"
            >
              <option value="">{isTr ? 'Tümü (ortalama)' : 'All (average)'}</option>
              {productNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" className="py-12" />
          ) : (
            <>
              <WeeklyChart data={weeklyData} product={weeklyProduct || undefined} />
              {weeklySummary && (
                <div className="mt-4 p-4 bg-[var(--bg-surface)] rounded-2xl shadow-sm text-sm text-[var(--text-secondary)]">
                  {isTr ? 'Bu hafta en düşük:' : 'This week lowest:'} <span className="font-semibold text-[#2D6A4F]">{weeklySummary.min.toFixed(2)}₺</span>,
                  {isTr ? 'en yüksek:' : 'highest:'} <span className="font-semibold text-[#C1341B]">{weeklySummary.max.toFixed(2)}₺</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
