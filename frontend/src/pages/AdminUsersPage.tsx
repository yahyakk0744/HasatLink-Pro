import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Users, Search, Ban, ShieldCheck, Trash2, ChevronLeft, ChevronRight, Eye, Pause, AlertTriangle } from 'lucide-react';
import api from '../config/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { User } from '../types';
import { useNavigate } from 'react-router-dom';

interface UserDetail extends User {
  isSuspended?: boolean;
  listingCount?: number;
  commentCount?: number;
}

export default function AdminUsersPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterBanned, setFilterBanned] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (filterRole) params.role = filterRole;
      if (filterBanned) params.banned = 'true';
      if (filterVerified) params.verified = 'true';
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRole, filterBanned, filterVerified]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch user detail
  const fetchUserDetail = async (userId: string) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const { data } = await api.get(`/admin/users/${userId}/detail`);
      setDetailUser(data);
    } catch {
      toast.error('Kullanıcı detayı yüklenemedi');
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Actions
  const handleBan = async (userId: string) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/ban`);
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, isBanned: data.isBanned } : u));
      if (detailUser && detailUser.userId === userId) {
        setDetailUser(prev => prev ? { ...prev, isBanned: data.isBanned } : prev);
      }
      toast.success(data.isBanned ? 'Kullanıcı engellendi' : 'Engel kaldırıldı');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleVerify = async (userId: string) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/verify`);
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, isVerified: data.isVerified } : u));
      if (detailUser && detailUser.userId === userId) {
        setDetailUser(prev => prev ? { ...prev, isVerified: data.isVerified } : prev);
      }
      toast.success(data.isVerified ? 'Kullanıcı doğrulandı' : 'Doğrulama kaldırıldı');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/suspend`);
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, isSuspended: data.isSuspended } : u));
      if (detailUser && detailUser.userId === userId) {
        setDetailUser(prev => prev ? { ...prev, isSuspended: data.isSuspended } : prev);
      }
      toast.success(data.isSuspended ? 'Kullanıcı askıya alındı' : 'Askı kaldırıldı');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteUserId}`);
      setUsers(prev => prev.filter(u => u.userId !== deleteUserId));
      setTotal(t => t - 1);
      toast.success('Kullanıcı silindi');
      if (detailUser && detailUser.userId === deleteUserId) {
        setDetailModalOpen(false);
        setDetailUser(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Silme başarısız');
    } finally {
      setDeleting(false);
      setDeleteUserId(null);
    }
  };

  // Filter pills
  const activeFilter = filterBanned ? 'banned' : filterVerified ? 'verified' : 'all';

  const setFilter = (type: 'all' | 'banned' | 'verified') => {
    setFilterBanned(type === 'banned');
    setFilterVerified(type === 'verified');
    setPage(1);
  };

  // Action buttons for a user (used in card and detail modal)
  const renderActions = (u: UserDetail, compact: boolean) => {
    const btnClass = (active: boolean, color: string) =>
      `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
        active
          ? color === 'green'
            ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
            : color === 'red'
            ? 'bg-red-50 text-red-600'
            : color === 'orange'
            ? 'bg-orange-50 text-orange-600'
            : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
          : 'hover:bg-[var(--bg-input)] text-[var(--text-secondary)]'
      }`;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => fetchUserDetail(u.userId)}
          className={btnClass(false, '')}
          title="Görüntüle"
        >
          <Eye size={14} />
          {!compact && <span className="hidden sm:inline">Görüntüle</span>}
        </button>
        {u.role !== 'admin' && (
          <>
            <button
              onClick={() => handleVerify(u.userId)}
              className={btnClass(u.isVerified, 'green')}
              title={u.isVerified ? 'Doğrulamayı Kaldır' : 'Doğrula'}
            >
              <ShieldCheck size={14} />
              {!compact && <span className="hidden sm:inline">{u.isVerified ? 'Doğrulandı' : 'Doğrula'}</span>}
            </button>
            <button
              onClick={() => handleSuspend(u.userId)}
              className={btnClass(!!u.isSuspended, 'orange')}
              title={u.isSuspended ? 'Askıyı Kaldır' : 'Askıya Al'}
            >
              <Pause size={14} />
              {!compact && <span className="hidden sm:inline">{u.isSuspended ? 'Askıda' : 'Askıya Al'}</span>}
            </button>
            <button
              onClick={() => handleBan(u.userId)}
              className={btnClass(u.isBanned, 'red')}
              title={u.isBanned ? 'Engeli Kaldır' : 'Engelle'}
            >
              <Ban size={14} />
              {!compact && <span className="hidden sm:inline">{u.isBanned ? 'Engelli' : 'Engelle'}</span>}
            </button>
            <button
              onClick={() => setDeleteUserId(u.userId)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 text-[#C1341B] transition-all duration-200"
              title="Sil"
            >
              <Trash2 size={14} />
              {!compact && <span className="hidden sm:inline">Sil</span>}
            </button>
          </>
        )}
      </div>
    );
  };

  // Status badges
  const renderBadges = (u: UserDetail) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      {u.role === 'admin' && (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] font-semibold">
          Admin
        </span>
      )}
      {u.isBanned && (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
          <Ban size={10} />
          Engelli
        </span>
      )}
      {u.isSuspended && (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-semibold">
          <Pause size={10} />
          Askıda
        </span>
      )}
      {u.isVerified && (
        <ShieldCheck size={14} className="text-[#2D6A4F]" />
      )}
    </div>
  );

  // Avatar component
  const renderAvatar = (u: UserDetail, size: 'sm' | 'lg' = 'sm') => {
    const dim = size === 'lg' ? 'w-16 h-16' : 'w-11 h-11';
    const textSize = size === 'lg' ? 'text-2xl' : 'text-lg';

    if (u.profileImage) {
      return <img src={u.profileImage} alt="" className={`${dim} rounded-full object-cover shrink-0`} />;
    }
    return (
      <div className={`${dim} rounded-full bg-[#2D6A4F]/10 flex items-center justify-center shrink-0`}>
        <span className={`${textSize} font-bold text-[#2D6A4F]`}>
          {u.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
    );
  };

  return (
    <AdminLayout title="Kullanıcı Yönetimi" icon={<Users size={24} />}>
      {/* Top bar: total count */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-[var(--text-secondary)]">
          Toplam <span className="font-semibold text-[var(--text-primary)]">{total}</span> kullanıcı
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="İsim, email veya kullanıcı adı..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-full text-sm outline-none focus:border-[#2D6A4F] transition-colors"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeFilter === 'all'
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter('banned')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
              activeFilter === 'banned'
                ? 'bg-red-500 text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Ban size={12} />
            Engelli
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
              activeFilter === 'verified'
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <ShieldCheck size={12} />
            Doğrulanmış
          </button>

          {/* Role dropdown */}
          <select
            value={filterRole}
            onChange={e => { setFilterRole(e.target.value); setPage(1); }}
            className="px-3.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-full text-xs font-medium outline-none cursor-pointer"
          >
            <option value="">Tüm Roller</option>
            <option value="user">Kullanıcı</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* User list */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
          <Users size={48} className="mb-3 opacity-30" />
          <p className="text-sm">Kullanıcı bulunamadı</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.userId}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                {/* Card content */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    {renderAvatar(u)}

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {u.name}
                        </p>
                        {renderBadges(u)}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                        {u.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-secondary)]">
                        {u.username && <span>@{u.username}</span>}
                        {u.location && (
                          <>
                            <span>•</span>
                            <span>{u.location}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>

                    {/* Desktop actions */}
                    <div className="hidden md:flex shrink-0">
                      {renderActions(u, false)}
                    </div>
                  </div>

                  {/* Mobile actions */}
                  <div className="flex md:hidden mt-3 pt-3 border-t border-[var(--border-default)]">
                    {renderActions(u, true)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl hover:bg-[var(--bg-input)] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-[var(--text-primary)]">
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

      {/* User Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setDetailUser(null); }}
        title="Kullanıcı Detayı"
        size="lg"
      >
        {detailLoading ? (
          <LoadingSpinner size="lg" className="py-12" />
        ) : detailUser ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              {renderAvatar(detailUser, 'lg')}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {detailUser.name}
                  </h3>
                  {renderBadges(detailUser)}
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  {detailUser.email}
                </p>
                {detailUser.username && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    @{detailUser.username}
                  </p>
                )}
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {detailUser.location && (
                <div className="bg-[var(--bg-input)] rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-0.5">Konum</p>
                  <p className="text-sm text-[var(--text-primary)]">{detailUser.location}</p>
                </div>
              )}
              {detailUser.phone && (
                <div className="bg-[var(--bg-input)] rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-0.5">Telefon</p>
                  <p className="text-sm text-[var(--text-primary)]">{detailUser.phone}</p>
                </div>
              )}
              <div className="bg-[var(--bg-input)] rounded-xl px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-0.5">Kayıt Tarihi</p>
                <p className="text-sm text-[var(--text-primary)]">
                  {new Date(detailUser.createdAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="bg-[var(--bg-input)] rounded-xl px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-0.5">Rol</p>
                <p className="text-sm text-[var(--text-primary)] capitalize">{detailUser.role}</p>
              </div>
              {typeof detailUser.averageRating === 'number' && (
                <div className="bg-[var(--bg-input)] rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-0.5">Ortalama Puan</p>
                  <p className="text-sm text-[var(--text-primary)]">
                    {detailUser.averageRating.toFixed(1)} / 5
                    <span className="text-[var(--text-secondary)] ml-1">({detailUser.totalRatings} değerlendirme)</span>
                  </p>
                </div>
              )}
              {typeof detailUser.listingCount === 'number' && (
                <div className="bg-[var(--bg-input)] rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-0.5">İlan Sayısı</p>
                  <p className="text-sm text-[var(--text-primary)]">{detailUser.listingCount}</p>
                </div>
              )}
              {typeof detailUser.commentCount === 'number' && (
                <div className="bg-[var(--bg-input)] rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-0.5">Yorum Sayısı</p>
                  <p className="text-sm text-[var(--text-primary)]">{detailUser.commentCount}</p>
                </div>
              )}
            </div>

            {/* Bio */}
            {detailUser.bio && (
              <div className="bg-[var(--bg-input)] rounded-xl px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-1">Hakkında</p>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{detailUser.bio}</p>
              </div>
            )}

            {/* Actions in modal */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-default)]">
              {renderActions(detailUser, false)}
              <button
                onClick={() => {
                  navigate(`/profil/${detailUser.userId}`);
                  setDetailModalOpen(false);
                }}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2D6A4F]/10 text-[#2D6A4F] hover:bg-[#2D6A4F]/20 transition-colors"
              >
                <Eye size={14} />
                Profili Gör
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        title="Kullanıcıyı Sil"
        size="sm"
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Bu kullanıcıyı ve tüm ilanlarını silmek istediğinizden emin misiniz?
            Bu işlem geri alınamaz.
          </p>
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={() => setDeleteUserId(null)} className="flex-1">
              İptal
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
