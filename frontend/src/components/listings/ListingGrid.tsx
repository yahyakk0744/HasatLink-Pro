import type { Listing } from '../../types';
import { useTranslation } from 'react-i18next';
import ListingCard from './ListingCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { PackageOpen } from 'lucide-react';

interface ListingGridProps {
  listings: Listing[];
  loading: boolean;
}

export default function ListingGrid({ listings, loading }: ListingGridProps) {
  const { t } = useTranslation();

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  if (!listings.length) {
    return (
      <EmptyState
        icon={<PackageOpen size={48} />}
        title={t('listing.noListings')}
        description={t('listing.createFirst')}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {listings.map(listing => (
        <ListingCard key={listing._id} listing={listing} />
      ))}
    </div>
  );
}
