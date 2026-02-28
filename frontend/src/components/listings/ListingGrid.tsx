import type { Listing } from '../../types';
import { useTranslation } from 'react-i18next';
import ListingCard from './ListingCard';
import EmptyState from '../ui/EmptyState';
import { PackageOpen } from 'lucide-react';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-2/3 skeleton rounded-lg" />
          <div className="h-4 w-16 skeleton rounded-lg" />
        </div>
        <div className="h-3 w-1/3 skeleton rounded-lg" />
        <div className="flex gap-1.5">
          <div className="h-5 w-14 skeleton rounded-full" />
          <div className="h-5 w-16 skeleton rounded-full" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-24 skeleton rounded-lg" />
          <div className="h-3 w-16 skeleton rounded-lg" />
        </div>
      </div>
    </div>
  );
}

interface ListingGridProps {
  listings: Listing[];
  loading: boolean;
}

export default function ListingGrid({ listings, loading }: ListingGridProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

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
      {listings.map((listing, index) => (
        <div
          key={listing._id}
          className="card-enter"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <ListingCard listing={listing} />
        </div>
      ))}
    </div>
  );
}
