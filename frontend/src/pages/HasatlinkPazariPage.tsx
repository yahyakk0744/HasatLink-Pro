import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useHasatlinkPazar } from '../hooks/useHasatlinkPazar';
import HasatlinkWeeklyChart from '../components/hal/HasatlinkWeeklyChart';
import HasatlinkHourlyChart from '../components/hal/HasatlinkHourlyChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SEO from '../components/ui/SEO';
import type { HasatlinkPazarItem } from '../types';

type SortKey = 'name' | 'price' | 'change' | 'minPrice' | 'maxPrice' | 'listingCount';
type SortDir = 'asc' | 'desc';

const PER_PAGE = 25;

export default function HasatlinkPazariPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');

  const TABS = [
    { id: 'all' as const, label: isTr ? 'Tüm Ürünler' : 'All Products' },
    { id: 'weekly' as const, label: isTr ? 'Haftalık Grafik' : 'Weekly Chart' },
    { id: 'hourly' as const, label: isTr ? 'Saatlik Grafik' : 'Hourly Chart' },
  ];

  const CATEGORIES = [
    { value: '', label: isTr ? 'Hepsi' : 'All' },
    { value: 'meyve', label: isTr ? 'Meyve' : 'Fruit' },
    { value: 'sebze', label: isTr ? 'Sebze' : 'Vegetable' },
    { value: 'tahıl', label: isTr ? 'Tahıl' : 'Grain' },
    { value: 'pamuk', label: isTr ? 'Pamuk' : 'Cotton' },
    { value: 'gübre', label: isTr ? 'Gübre' : 'Fertilizer' },
    { value: 'fide', label: isTr ? 'Fide' : 'Seedling' },
    { value: 'bakliyat', label: isTr ? 'Bakliyat' : 'Legume' },
  ];

  const [activeTab, setActiveTab] = useState<'all' | 'weekly' | 'hourly'>('all');
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
      <SEO
        title={isTr ? 'HasatLink Pazarı' : 'HasatLink Market'}
        description={isTr ? 'HasatLink pazar ilanlarından derlenen güncel fiyat verileri ve karşılaştırmalar.' : 'Price data compiled from HasatLink marketplace listings.'}
        keywords={isTr ? 'hasatlink pazarı, fiyat, tarım, ürün' : 'hasatlink market, price, agriculture'}
      />
      <div className="flex items-center gap-3 mb-2">
        <ShoppingBag size={28} className="text-[#A47148]" />
        <h1 className="text-3xl font-semibold tracking-tight">{isTr ? 'HasatLink Pazarı' : 'HasatLink Market'}</h1>
      </div>
      <p className="text-[var(--text-secondary)] mb-6">{isTr ? 'Site içi pazar ilanlarından derlenen fiyat verileri' : 'Price data compiled from marketplace listings'}</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
              activeTab === tab.id
                ? 'bg-[#A47148] text-white'
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
                className="w-full pl-11 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#A47148]/20 focus:border-[#A47148]"
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
          ) : prices.length === 0 ? (
            <div className="bg-[var(--bg-surface)] rounded-2xl p-12 shadow-sm text-center">
              <ShoppingBag size={48} className="text-[#D6D0C8] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{isTr ? 'Henüz pazar verisi yok' : 'No market data yet'}</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                {isTr ? 'Pazar kategorisinde ilanlar eklendikçe fiyat karşılaştırma verileri burada görünecek.' : 'Price comparison data will appear here as listings are added to the marketplace.'}
              </p>
            </div>
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
                            className="px-4 py-3.5 text-left font-medium text-[#6B6560] cursor-pointer hover:text-[#A47148] select-none"
                          >
                            {label}<SortArrow field={key} />
                          </th>
                        ))}
                        <th className="px-4 py-3.5 text-left font-medium text-[#6B6560]">{isTr ? 'Birim' : 'Unit'}</th>
                        <th
                          onClick={() => handleSort('change')}
                          className="px-4 py-3.5 text-left font-medium text-[#6B6560] cursor-pointer hover:text-[#A47148] select-none"
                        >
                          {isTr ? 'Değişim' : 'Change'}<SortArrow field="change" />
                        </th>
                        <th
                          onClick={() => handleSort('listingCount')}
                          className="px-4 py-3.5 text-left font-medium text-[#6B6560] cursor-pointer hover:text-[#A47148] select-none"
                        >
                          {isTr ? 'İlan' : 'Listings'}<SortArrow field="listingCount" />
                        </th>
                        <th className="px-4 py-3.5 text-left font-medium text-[#6B6560]">{isTr ? 'Kategori' : 'Category'}</th>
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
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#A47148]/20 focus:border-[#A47148] min-w-[200px]"
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
              <HasatlinkWeeklyChart data={weeklyData} product={selectedProduct || undefined} />
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

      {/* Tab 3 — Saatlik Grafik */}
      {activeTab === 'hourly' && (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#6B6560] mb-2">{isTr ? 'Ürün Seçin' : 'Select Product'}</label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#A47148]/20 focus:border-[#A47148] min-w-[200px]"
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
            <HasatlinkHourlyChart data={hourlyData} product={selectedProduct || undefined} />
          )}
        </div>
      )}
    </div>
  );
}
