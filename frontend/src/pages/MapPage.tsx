import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useListings } from '../hooks/useListings';
import ListingMap from '../components/map/ListingMap';
import { CATEGORY_COLORS, CATEGORY_LABELS_TR } from '../components/map/MapMarker';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SEO from '../components/ui/SEO';

const ALL_TYPES = ['pazar', 'lojistik', 'isgucu', 'ekipman', 'arazi', 'depolama'] as const;

export default function MapPage() {
  const { t } = useTranslation();
  const { listings, loading, fetchListings } = useListings();
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(ALL_TYPES));

  useEffect(() => {
    fetchListings({ limit: '200' });
  }, [fetchListings]);

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filteredListings = listings.filter(l => activeFilters.has(l.type));

  return (
    <div className="animate-fade-in">
      <SEO
        title={t('map.title')}
        description="HasatLink harita üzerinde tüm tarım ilanlarını görüntüleyin."
        keywords="harita, tarım, ilan, konum"
      />
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-semibold tracking-tight mb-3">{t('map.allListings')}</h1>
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ALL_TYPES.map(type => (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase rounded-full transition-all"
              style={{
                background: activeFilters.has(type) ? CATEGORY_COLORS[type] : 'var(--bg-input)',
                color: activeFilters.has(type) ? '#fff' : 'var(--text-secondary)',
                opacity: activeFilters.has(type) ? 1 : 0.6,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: CATEGORY_COLORS[type] }}
              />
              {CATEGORY_LABELS_TR[type]}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[calc(100vh-220px)] px-4 pb-4 md:pb-4">
        {loading ? (
          <LoadingSpinner size="lg" className="py-20" />
        ) : (
          <ListingMap listings={filteredListings} zoom={7} className="rounded-[2rem] shadow-sm" />
        )}
      </div>
    </div>
  );
}
