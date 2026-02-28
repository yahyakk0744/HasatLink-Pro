import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { Package, Search, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import api from '../config/api';
import toast from 'react-hot-toast';
import type { Listing } from '../types';

const typeLabels: Record<string, string> = {
  pazar: 'Pazar', lojistik: 'Lojistik', isgucu: 'İşgücü',
  ekipman: 'Ekipman', arazi: 'Arazi', depolama: 'Depolama',
};

const statusLabels: Record<string, string> = {
  active: 'Aktif', sold: 'Satıldı', rented: 'Kiralandı', closed: 'Kapatıldı',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  sold: 'bg-blue-100 text-blue-700',
  rented: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-500',
};

export default function AdminListingsPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      const { data } = await api.get('/admin/listings', { params });
      setListings(data.listings);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      toast.error(isTr ? 'İlanlar yüklenemedi' : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterType, isTr]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/admin/listings/${id}/status`, { status });
      setListings(prev => prev.map(l => l._id === id ? { ...l, status } : l));
      toast.success(isTr ? 'Durum güncellendi' : 'Status updated');
    } catch {
      toast.error(isTr ? 'Güncelleme başarısız' : 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/listings/${deleteId}`);
      setListings(prev => prev.filter(l => l._id !== deleteId));
      setTotal(t => t - 1);
      toast.success(isTr ? 'İlan silindi' : 'Listing deleted');
    } catch {
      toast.error(isTr ? 'Silme başarısız' : 'Delete failed');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      <SEO title={isTr ? 'Admin - İlan Yönetimi' : 'Admin - Listings'} />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-[var(--bg-input)] transition-colors">
          <ChevronLeft size={20} />
        </button>
        <Package size={24} className="text-[#2D6A4F]" />
        <h1 className="text-2xl font-semibold tracking-tight">{isTr ? 'İlan Yönetimi' : 'Listing Management'}</h1>
        <span className="ml-auto text-sm text-[var(--text-secondary)]">{total} {isTr ? 'ilan' : 'listings'}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={isTr ? 'İlan ara...' : 'Search listings...'}
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[#2D6A4F] transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-sm outline-none"
        >
          <option value="">{isTr ? 'Tüm Durumlar' : 'All Status'}</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-sm outline-none"
        >
          <option value="">{isTr ? 'Tüm Kategoriler' : 'All Categories'}</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-secondary)]">
          {isTr ? 'İlan bulunamadı' : 'No listings found'}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l._id} className="flex items-center gap-4 p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm">
                {l.images?.[0] ? (
                  <img src={l.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[var(--bg-input)] flex items-center justify-center shrink-0">
                    <Package size={20} className="text-[var(--text-secondary)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{l.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-[var(--text-secondary)]">{typeLabels[l.type] || l.type}</span>
                    <span className="text-xs text-[var(--text-secondary)]">•</span>
                    <span className="text-xs font-medium text-[#2D6A4F]">₺{l.price?.toLocaleString()}</span>
                    <span className="text-xs text-[var(--text-secondary)]">•</span>
                    <span className="text-xs text-[var(--text-secondary)]">{l.location}</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                    {new Date(l.createdAt).toLocaleDateString('tr-TR')} • {isTr ? 'Görüntülenme' : 'Views'}: {l.stats?.views || 0}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={l.status}
                    onChange={e => handleStatusChange(l._id, e.target.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 outline-none cursor-pointer ${statusColors[l.status] || ''}`}
                  >
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button onClick={() => navigate(`/ilan/${l._id}`)} className="p-2 rounded-lg hover:bg-[var(--bg-input)] transition-colors" title={isTr ? 'Görüntüle' : 'View'}>
                    <Eye size={16} className="text-[var(--text-secondary)]" />
                  </button>
                  <button onClick={() => setDeleteId(l._id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title={isTr ? 'Sil' : 'Delete'}>
                    <Trash2 size={16} className="text-[#C1341B]" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-xl hover:bg-[var(--bg-input)] disabled:opacity-30">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-xl hover:bg-[var(--bg-input)] disabled:opacity-30">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title={isTr ? 'İlanı Sil' : 'Delete Listing'} size="sm">
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {isTr ? 'Bu ilanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.' : 'Are you sure you want to delete this listing? This action cannot be undone.'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">{isTr ? 'İptal' : 'Cancel'}</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">{isTr ? 'Sil' : 'Delete'}</Button>
        </div>
      </Modal>
    </div>
  );
}
