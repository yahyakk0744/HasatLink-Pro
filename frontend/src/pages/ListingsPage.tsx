import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
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

export default function ListingsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listings, loading, fetchListings, createListing } = useListings();
  // Get the type from the URL path
  const pathType = window.location.pathname.replace('/', '') || 'pazar';
  const type = ['pazar', 'lojistik', 'isgucu', 'ekipman', 'arazi', 'depolama'].includes(pathType) ? pathType : 'pazar';
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';

  const [subCategory, setSubCategory] = useState('HEPSİ');
  const [productFilter, setProductFilter] = useState('');
  const [listingMode, setListingMode] = useState<'all' | 'sell' | 'buy'>('all');
  const [showForm, setShowForm] = useState(false);

  const subCategories = CATEGORIES[type as keyof typeof CATEGORIES] || CATEGORIES.pazar;
  const catLabel = CATEGORY_LABELS[type];
  const productOptions = type === 'pazar' && subCategory !== 'HEPSİ' ? (PAZAR_SUBCATEGORIES[subCategory] || []) : [];

  useEffect(() => {
    const params: Record<string, string> = { type };
    if (subCategory !== 'HEPSİ') params.subCategory = subCategory;
    if (productFilter) params.search = productFilter;
    else if (search) params.search = search;
    if (listingMode !== 'all') params.listingMode = listingMode;
    fetchListings(params);
  }, [type, subCategory, productFilter, search, listingMode, fetchListings]);

  useEffect(() => {
    setSubCategory('HEPSİ');
    setProductFilter('');
    setListingMode('all');
  }, [type]);

  const handleCreate = async (data: Partial<Listing>) => {
    const result = await createListing({ ...data, type: type as Listing['type'] });
    if (result) {
      toast.success(t('listing.createdSuccess'));
      fetchListings({ type });
    }
  };

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
                  ? mode === 'buy' ? 'bg-[#0077B6] text-white' : 'bg-[#2D6A4F] text-white'
                  : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <SubCategoryBar categories={subCategories} active={subCategory} onChange={(cat) => { setSubCategory(cat); setProductFilter(''); }} />

      {/* Product-level filter for pazar */}
      {productOptions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide flex-nowrap">
          <button
            onClick={() => setProductFilter('')}
            className={`px-3 py-1 text-[10px] font-medium rounded-full whitespace-nowrap flex-shrink-0 transition-all ${
              !productFilter ? 'bg-[#A47148] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
            }`}
          >
            Tümü
          </button>
          {productOptions.map(p => (
            <button
              key={p}
              onClick={() => setProductFilter(p)}
              className={`px-3 py-1 text-[10px] font-medium rounded-full whitespace-nowrap flex-shrink-0 transition-all ${
                productFilter === p ? 'bg-[#A47148] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        <ListingGrid listings={listings} loading={loading} />
      </div>

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
