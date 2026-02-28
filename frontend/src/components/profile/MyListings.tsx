import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, PackageOpen } from 'lucide-react';
import { useListings } from '../../hooks/useListings';
import ListingCard from '../listings/ListingCard';
import ListingForm from '../listings/ListingForm';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import type { Listing } from '../../types';
import toast from 'react-hot-toast';

interface MyListingsProps {
  userId: string;
  isOwn?: boolean;
}

export default function MyListings({ userId, isOwn = true }: MyListingsProps) {
  const { t } = useTranslation();
  const { listings, loading, fetchListings, updateListing, deleteListing } = useListings();
  const [filter, setFilter] = useState<'all' | 'active' | 'sold'>('all');
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filter !== 'all') params.status = filter;
    fetchListings(params);
  }, [filter, fetchListings]);

  const userListings = listings.filter(l => l.userId === userId);

  const handleEditSubmit = async (data: Partial<Listing>) => {
    if (!editingListing) return;
    const updated = await updateListing(editingListing._id, data);
    if (updated) {
      setEditingListing(null);
      fetchListings(filter !== 'all' ? { status: filter } : {});
      toast.success('İlan güncellendi!');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const success = await deleteListing(deletingId);
    if (success) {
      setDeletingId(null);
      fetchListings(filter !== 'all' ? { status: filter } : {});
      toast.success('İlan silindi!');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold tracking-tight flex-1">{t('myListings')}</h3>
        {isOwn && (
          <div className="flex gap-1">
            {(['all', 'active', 'sold'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-[10px] font-medium uppercase rounded-full transition-all ${
                  filter === f ? 'bg-[#1A1A1A] text-white' : 'bg-[#F5F3EF] text-[#6B6560]'
                }`}
              >
                {f === 'all' ? t('all') : f === 'active' ? t('listing.active') : t('listing.sold')}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : !userListings.length ? (
        <EmptyState icon={<PackageOpen size={48} />} title={t('listing.noListings')} description={t('listing.createFirst')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {userListings.map(listing => (
            <div key={listing._id} className="relative group">
              <ListingCard listing={listing} />
              {isOwn && (
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingListing(listing); }}
                    className="w-8 h-8 flex items-center justify-center bg-[#0077B6] text-white rounded-xl shadow-lg hover:bg-[#005f8a] transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingId(listing._id); }}
                    className="w-8 h-8 flex items-center justify-center bg-[#C1341B] text-white rounded-xl shadow-lg hover:bg-[#a02b16] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <ListingForm
        isOpen={!!editingListing}
        onClose={() => setEditingListing(null)}
        onSubmit={handleEditSubmit}
        initialData={editingListing || undefined}
      />

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeletingId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{t('listing.deleteConfirmTitle')}</h3>
            <p className="text-sm text-[#6B6560]">{t('listing.deleteConfirmMessage')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#F5F3EF] rounded-xl hover:bg-[#EBE7E0] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#C1341B] text-white rounded-xl hover:bg-[#a02b16] transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
