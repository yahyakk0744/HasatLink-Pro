import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useListings } from '../hooks/useListings';
import ListingMap from '../components/map/ListingMap';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function MapPage() {
  const { t } = useTranslation();
  const { listings, loading, fetchListings } = useListings();

  useEffect(() => {
    fetchListings({ limit: '100' });
  }, [fetchListings]);

  return (
    <div className="animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">{t('map.allListings')}</h1>
      </div>
      <div className="h-[calc(100vh-200px)] px-4 pb-4 md:pb-4">
        {loading ? (
          <LoadingSpinner size="lg" className="py-20" />
        ) : (
          <ListingMap listings={listings} zoom={8} className="rounded-[2rem] shadow-sm" />
        )}
      </div>
    </div>
  );
}
