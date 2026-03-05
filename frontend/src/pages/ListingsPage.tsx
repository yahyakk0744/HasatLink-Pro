import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, SlidersHorizontal, X, ArrowUpDown, CalendarClock, TrendingDown } from 'lucide-react';
import { useListings } from '../hooks/useListings';
import { useAuth } from '../contexts/AuthContext';
import ListingGrid from '../components/listings/ListingGrid';
import SubCategoryBar from '../components/layout/SubCategoryBar';
import ListingForm from '../components/listings/ListingForm';
import FAB from '../components/ui/FAB';
import { CATEGORIES, CATEGORY_LABELS, LISTING_MODE_LABELS, PAZAR_SUBCATEGORIES } from '../utils/constants';
import SEO from '../components/ui/SEO';
import type { Listing } from '../types';
import toast from 'react-hot-toast';

const TURKISH_CITIES = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Aksaray','Amasya','Ankara','Antalya','Ardahan','Artvin',
  'Aydın','Balıkesir','Bartın','Batman','Bayburt','Bilecik','Bingöl','Bitlis','Bolu','Burdur',
  'Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Düzce','Edirne','Elazığ','Erzincan',
  'Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Iğdır','Isparta','İstanbul',
  'İzmir','Kahramanmaraş','Karabük','Karaman','Kars','Kastamonu','Kayseri','Kırıkkale','Kırklareli','Kırşehir',
  'Kilis','Kocaeli','Konya','Kütahya','Malatya','Manisa','Mardin','Mersin','Muğla','Muş',
  'Nevşehir','Niğde','Ordu','Osmaniye','Rize','Sakarya','Samsun','Şanlıurfa','Siirt','Sinop',
  'Şırnak','Sivas','Tekirdağ','Tokat','Trabzon','Tunceli','Uşak','Van','Yalova','Yozgat','Zonguldak',
];

const SORT_OPTIONS = [
  { value: 'newest', labelTr: 'En Yeni', labelEn: 'Newest' },
  { value: 'oldest', labelTr: 'En Eski', labelEn: 'Oldest' },
  { value: 'cheapest', labelTr: 'En Ucuz', labelEn: 'Cheapest' },
  { value: 'expensive', labelTr: 'En Pahalı', labelEn: 'Most Expensive' },
];

export default function ListingsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listings, loading, fetchListings, createListing } = useListings();
  const pathType = window.location.pathname.replace('/', '') || 'pazar';
  const type = ['pazar', 'lojistik', 'isgucu', 'ekipman', 'arazi', 'depolama'].includes(pathType) ? pathType : 'pazar';
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';

  const [subCategory, setSubCategory] = useState('HEPSİ');
  const [productFilter, setProductFilter] = useState('');
  const [listingMode, setListingMode] = useState<'all' | 'sell' | 'buy'>('all');
  const [showForm, setShowForm] = useState(false);

  // Advanced filters
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickFilter, setQuickFilter] = useState<'none' | 'today' | 'priceDropped'>('none');

  const subCategories = CATEGORIES[type as keyof typeof CATEGORIES] || CATEGORIES.pazar;
  const catLabel = CATEGORY_LABELS[type];
  const productOptions = type === 'pazar' && subCategory !== 'HEPSİ' ? (PAZAR_SUBCATEGORIES[subCategory] || []) : [];

  useEffect(() => {
    const params: Record<string, string> = { type };
    if (subCategory !== 'HEPSİ') params.subCategory = subCategory;
    if (productFilter) params.search = productFilter;
    else if (search) params.search = search;
    if (listingMode !== 'all') params.listingMode = listingMode;
    if (city) params.city = city;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sort && sort !== 'newest') params.sort = sort;
    fetchListings(params);
  }, [type, subCategory, productFilter, search, listingMode, city, minPrice, maxPrice, sort, fetchListings]);

  useEffect(() => {
    setSubCategory('HEPSİ');
    setProductFilter('');
    setListingMode('all');
    setCity('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setQuickFilter('none');
  }, [type]);

  // Client-side quick filtering
  const filteredListings = quickFilter === 'none'
    ? listings
    : quickFilter === 'today'
      ? listings.filter(l => Date.now() - new Date(l.createdAt).getTime() < 24 * 60 * 60 * 1000)
      : listings.filter(l => l.is_negotiable);

  const handleCreate = async (data: Partial<Listing>) => {
    const result = await createListing({ ...data, type: type as Listing['type'] });
    if (result) {
      toast.success(t('listing.createdSuccess'));
      fetchListings({ type });
    }
  };

  const clearFilters = () => {
    setCity('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
  };

  const hasActiveFilters = city || minPrice || maxPrice || sort !== 'newest';

  const filterPanel = (
    <div className="space-y-4">
      {/* City */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
          {lang === 'tr' ? 'Şehir' : 'City'}
        </label>
        <select
          value={city}
          onChange={e => setCity(e.target.value)}
          className="apple-input"
        >
          <option value="">{lang === 'tr' ? 'Tüm Şehirler' : 'All Cities'}</option>
          {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
          {lang === 'tr' ? 'Fiyat Aralığı' : 'Price Range'}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min ₺"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="w-1/2 apple-input"
          />
          <input
            type="number"
            placeholder="Max ₺"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="w-1/2 apple-input"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
          {lang === 'tr' ? 'Sıralama' : 'Sort By'}
        </label>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="apple-input"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{lang === 'tr' ? opt.labelTr : opt.labelEn}</option>
          ))}
        </select>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent-red)] bg-[var(--accent-red)]/10 rounded-xl hover:bg-[var(--accent-red)]/20 transition-colors"
        >
          {lang === 'tr' ? 'Filtreleri Temizle' : 'Clear Filters'}
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 animate-fade-in">
      <SEO
        title={t(`categories.${type}`)}
        description={`HasatLink ${t(`categories.${type}`)} ilanları. En güncel tarım ilanlarını keşfedin.`}
        keywords={`${type}, tarım, ilan, hasatlink`}
      />
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{catLabel?.icon}</span>
        <h1 className="text-2xl font-semibold tracking-tight">{t(`categories.${type}`)}</h1>
      </div>

      {/* Sell / Buy Mode Filter */}
      <div className="flex gap-2 mt-2 mb-1">
        {(['all', 'sell', 'buy'] as const).map(mode => {
          const label = mode === 'all'
            ? t('all')
            : LISTING_MODE_LABELS[type]?.[mode]?.[lang] || (mode === 'sell' ? t('listing.modeSell') : t('listing.modeBuy'));
          return (
            <button
              key={mode}
              onClick={() => setListingMode(mode)}
              className={`px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-full transition-all ${
                listingMode === mode
                  ? mode === 'buy' ? 'bg-[#0077B6] text-white' : 'bg-[var(--accent-green)] text-white'
                  : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {label}
            </button>
          );
        })}

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowMobileFilters(true)}
          className="ml-auto md:hidden flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-all relative"
        >
          <SlidersHorizontal size={12} />
          {lang === 'tr' ? 'Filtre' : 'Filter'}
          {hasActiveFilters && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--accent-green)] rounded-full" />}
        </button>
      </div>

      <SubCategoryBar categories={subCategories} active={subCategory} onChange={(cat) => { setSubCategory(cat); setProductFilter(''); }} />

      {/* Product-level filter for pazar */}
      {productOptions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide flex-nowrap">
          <button
            onClick={() => setProductFilter('')}
            className={`px-3 py-1 text-[10px] font-medium rounded-full whitespace-nowrap flex-shrink-0 transition-all ${
              !productFilter ? 'bg-[var(--accent-orange)] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
            }`}
          >
            Tümü
          </button>
          {productOptions.map(p => (
            <button
              key={p}
              onClick={() => setProductFilter(p)}
              className={`px-3 py-1 text-[10px] font-medium rounded-full whitespace-nowrap flex-shrink-0 transition-all ${
                productFilter === p ? 'bg-[var(--accent-orange)] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setQuickFilter(quickFilter === 'today' ? 'none' : 'today')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold rounded-full whitespace-nowrap transition-all active:scale-[0.97] ${
            quickFilter === 'today'
              ? 'bg-[#2D6A4F] text-white shadow-sm'
              : 'bg-white/80 dark:bg-[var(--bg-surface)]/80 backdrop-blur border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[#2D6A4F] hover:text-[#2D6A4F]'
          }`}
        >
          <CalendarClock size={13} />
          {lang === 'tr' ? 'Bugün Eklenenler' : 'Added Today'}
        </button>
        <button
          onClick={() => setQuickFilter(quickFilter === 'priceDropped' ? 'none' : 'priceDropped')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold rounded-full whitespace-nowrap transition-all active:scale-[0.97] ${
            quickFilter === 'priceDropped'
              ? 'bg-[#0077B6] text-white shadow-sm'
              : 'bg-white/80 dark:bg-[var(--bg-surface)]/80 backdrop-blur border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[#0077B6] hover:text-[#0077B6]'
          }`}
        >
          <TrendingDown size={13} />
          {lang === 'tr' ? 'Pazarlığa Açık' : 'Negotiable'}
        </button>
      </div>

      {/* Desktop: sidebar + grid layout */}
      <div className="mt-4 flex gap-6">
        {/* Desktop sidebar filters */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="surface-card rounded-2xl p-5 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={14} className="text-[var(--accent-green)]" />
              <h3 className="text-sm font-semibold tracking-tight">{lang === 'tr' ? 'Filtreler' : 'Filters'}</h3>
              {hasActiveFilters && (
                <span className="ml-auto flex items-center gap-1">
                  <ArrowUpDown size={10} className="text-[var(--accent-green)]" />
                </span>
              )}
            </div>
            {filterPanel}
          </div>
        </aside>

        {/* Listing grid */}
        <div className="flex-1 min-w-0">
          <ListingGrid listings={filteredListings} loading={loading} />
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 glass-card rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{lang === 'tr' ? 'Filtreler' : 'Filters'}</h3>
              <button onClick={() => setShowMobileFilters(false)} className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            {filterPanel}
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full mt-4 py-3 bg-[var(--accent-green)] text-white font-semibold text-sm rounded-xl"
            >
              {lang === 'tr' ? 'Uygula' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      <FAB onClick={() => user ? setShowForm(true) : navigate('/giris')} icon={<Plus size={24} />} />
      {user && (
        <ListingForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
          initialData={{ type: type as Listing['type'], listingMode: listingMode === 'all' ? 'sell' : listingMode }}
        />
      )}
    </div>
  );
}
