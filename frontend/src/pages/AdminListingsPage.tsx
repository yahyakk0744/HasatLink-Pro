import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Package, Search, Trash2, Eye, ChevronLeft, ChevronRight, Star, Square, CheckSquare } from 'lucide-react';
import api from '../config/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { Listing } from '../types';
import { useNavigate } from 'react-router-dom';

const typeLabels: Record<string, string> = {
  pazar: 'Pazar',
  lojistik: 'Lojistik',
  isgucu: 'İşgücü',
  ekipman: 'Ekipman',
  arazi: 'Arazi',
  depolama: 'Depolama',
};

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  pending: 'Beklemede',
  sold: 'Satıldı',
  rented: 'Kiralandı',
  closed: 'Kapatıldı',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  sold: 'bg-blue-100 text-blue-700',
  rented: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-500',
};

type ListingWithFeatured = Listing & { isFeatured?: boolean };

export default function AdminListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingWithFeatured[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // Single delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  /* ─── Fetch ─── */
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
      toast.error('İlanlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterType]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Reset selection when leaving selection mode
  useEffect(() => {
    if (!selectionMode) {
      setSelectedIds(new Set());
    }
  }, [selectionMode]);

  /* ─── Actions ─── */
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/admin/listings/${id}/status`, { status });
      setListings(prev => prev.map(l => (l._id === id ? { ...l, status } : l)));
      toast.success('Durum güncellendi');
    } catch {
      toast.error('Güncelleme başarısız');
    }
  };

  const handleFeature = async (id: string) => {
    try {
      const { data } = await api.put(`/admin/listings/${id}/feature`);
      setListings(prev =>
        prev.map(l => (l._id === id ? { ...l, isFeatured: data.isFeatured } : l))
      );
      toast.success(data.isFeatured ? 'İlan öne çıkarıldı' : 'Öne çıkarma kaldırıldı');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/listings/${deleteId}`);
      setListings(prev => prev.filter(l => l._id !== deleteId));
      setTotal(t => t - 1);
      selectedIds.delete(deleteId);
      setSelectedIds(new Set(selectedIds));
      toast.success('İlan silindi');
    } catch {
      toast.error('Silme başarısız');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await api.post('/admin/listings/bulk-delete', { ids });
      setListings(prev => prev.filter(l => !selectedIds.has(l._id)));
      setTotal(t => t - selectedIds.size);
      setSelectedIds(new Set());
      setSelectionMode(false);
      toast.success(`${ids.length} ilan silindi`);
    } catch {
      toast.error('Toplu silme başarısız');
    } finally {
      setBulkDeleting(false);
      setBulkDeleteOpen(false);
    }
  };

  /* ─── Selection helpers ─── */
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === listings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(listings.map(l => l._id)));
    }
  };

  return (
    <AdminLayout title="İlan Yönetimi" icon={<Package size={24} />}>
      {/* Top bar: total count + selection toggle */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[var(--text-secondary)]">{total} ilan</span>
        <button
          onClick={() => setSelectionMode(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectionMode
              ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
              : 'hover:bg-[var(--bg-input)] text-[var(--text-secondary)]'
          }`}
        >
          {selectionMode ? <CheckSquare size={16} /> : <Square size={16} />}
          <span className="hidden sm:inline">Seç</span>
        </button>
      </div>

      {/* Selection bar */}
      {selectionMode && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-[#2D6A4F]/5 border border-[#2D6A4F]/20 rounded-xl">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-sm font-medium text-[#2D6A4F] hover:underline"
          >
            {selectedIds.size === listings.length && listings.length > 0 ? (
              <CheckSquare size={16} />
            ) : (
              <Square size={16} />
            )}
            Tümünü Seç
          </button>
          <span className="text-xs text-[var(--text-secondary)]">
            {selectedIds.size} seçili
          </span>
          <div className="flex-1" />
          {selectedIds.size > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Seçilenleri Sil</span>
              <span className="sm:hidden">Sil</span>
              <span className="text-xs opacity-80">({selectedIds.size})</span>
            </Button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[180px] relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
          />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="İlan ara..."
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[#2D6A4F] transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-sm outline-none cursor-pointer"
        >
          <option value="">Tümü</option>
          <option value="active">Aktif</option>
          <option value="pending">Beklemede</option>
          <option value="sold">Satıldı</option>
          <option value="rented">Kiralandı</option>
          <option value="closed">Kapatıldı</option>
        </select>
        <select
          value={filterType}
          onChange={e => {
            setFilterType(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-sm outline-none cursor-pointer"
        >
          <option value="">Tümü</option>
          <option value="pazar">Pazar</option>
          <option value="lojistik">Lojistik</option>
          <option value="isgucu">İşgücü</option>
          <option value="ekipman">Ekipman</option>
          <option value="arazi">Arazi</option>
          <option value="depolama">Depolama</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-secondary)]">
          İlan bulunamadı
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {listings.map(l => (
              <div
                key={l._id}
                className={`flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[var(--bg-surface)] border rounded-2xl shadow-sm transition-colors ${
                  selectedIds.has(l._id)
                    ? 'border-[#2D6A4F] bg-[#2D6A4F]/5'
                    : 'border-[var(--border-default)]'
                }`}
              >
                {/* Selection checkbox */}
                {selectionMode && (
                  <button
                    onClick={() => toggleSelect(l._id)}
                    className="shrink-0 mt-1 sm:mt-0"
                  >
                    {selectedIds.has(l._id) ? (
                      <CheckSquare size={20} className="text-[#2D6A4F]" />
                    ) : (
                      <Square size={20} className="text-[var(--text-secondary)]" />
                    )}
                  </button>
                )}

                {/* Image */}
                {l.images?.[0] ? (
                  <img
                    src={l.images[0]}
                    alt=""
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[var(--bg-input)] flex items-center justify-center shrink-0">
                    <Package size={18} className="text-[var(--text-secondary)]" />
                  </div>
                )}

                {/* Info - Desktop */}
                <div className="hidden sm:flex flex-1 min-w-0 items-center gap-4">
                  {/* Title block */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{l.title}</p>
                      {l.isFeatured && (
                        <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--bg-input)] text-[10px] font-medium text-[var(--text-secondary)]">
                        {typeLabels[l.type] || l.type}
                      </span>
                      <span className="text-xs font-medium text-[#2D6A4F]">
                        ₺{l.price?.toLocaleString()}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">•</span>
                      <span className="text-xs text-[var(--text-secondary)] truncate">
                        {l.location}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                      {new Date(l.createdAt).toLocaleDateString('tr-TR')} • Görüntülenme:{' '}
                      {l.stats?.views || 0}
                    </p>
                  </div>

                  {/* Status dropdown */}
                  <select
                    value={l.status}
                    onChange={e => handleStatusChange(l._id, e.target.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 outline-none cursor-pointer shrink-0 ${
                      statusColors[l.status] || 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => navigate(`/ilan/${l._id}`)}
                      className="p-2 rounded-lg hover:bg-[var(--bg-input)] transition-colors"
                      title="Görüntüle"
                    >
                      <Eye size={16} className="text-[var(--text-secondary)]" />
                    </button>
                    <button
                      onClick={() => handleFeature(l._id)}
                      className="p-2 rounded-lg hover:bg-amber-50 transition-colors"
                      title={l.isFeatured ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'}
                    >
                      <Star
                        size={16}
                        className={
                          l.isFeatured
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-[var(--text-secondary)]'
                        }
                      />
                    </button>
                    <button
                      onClick={() => setDeleteId(l._id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={16} className="text-[#C1341B]" />
                    </button>
                  </div>
                </div>

                {/* Info - Mobile */}
                <div className="flex sm:hidden flex-1 min-w-0 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{l.title}</p>
                        {l.isFeatured && (
                          <Star
                            size={12}
                            className="text-amber-500 fill-amber-500 shrink-0"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--bg-input)] text-[9px] font-medium text-[var(--text-secondary)]">
                          {typeLabels[l.type] || l.type}
                        </span>
                        <span className="text-xs font-medium text-[#2D6A4F]">
                          ₺{l.price?.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 truncate">
                        {l.location} • {new Date(l.createdAt).toLocaleDateString('tr-TR')} •{' '}
                        {l.stats?.views || 0} görüntülenme
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={l.status}
                      onChange={e => handleStatusChange(l._id, e.target.value)}
                      className={`text-[10px] px-2 py-1 rounded-full font-medium border-0 outline-none cursor-pointer ${
                        statusColors[l.status] || 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => navigate(`/ilan/${l._id}`)}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-input)] transition-colors"
                        title="Görüntüle"
                      >
                        <Eye size={14} className="text-[var(--text-secondary)]" />
                      </button>
                      <button
                        onClick={() => handleFeature(l._id)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                        title={l.isFeatured ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'}
                      >
                        <Star
                          size={14}
                          className={
                            l.isFeatured
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-[var(--text-secondary)]'
                          }
                        />
                      </button>
                      <button
                        onClick={() => setDeleteId(l._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={14} className="text-[#C1341B]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl hover:bg-[var(--bg-input)] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl hover:bg-[var(--bg-input)] disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Single Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="İlanı Sil"
        size="sm"
      >
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Bu ilanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">
            İptal
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">
            Sil
          </Button>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Seçili İlanları Sil"
        size="sm"
      >
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          <span className="font-semibold text-[var(--text-primary)]">{selectedIds.size}</span> ilanı
          silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setBulkDeleteOpen(false)}
            className="flex-1"
          >
            İptal
          </Button>
          <Button
            variant="danger"
            onClick={handleBulkDelete}
            loading={bulkDeleting}
            className="flex-1"
          >
            {selectedIds.size} İlanı Sil
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
