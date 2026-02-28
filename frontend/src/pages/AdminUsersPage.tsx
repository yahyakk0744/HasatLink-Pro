import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { Users, Search, Ban, ShieldCheck, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import api from '../config/api';
import toast from 'react-hot-toast';
import type { User } from '../types';

export default function AdminUsersPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (filterRole) params.role = filterRole;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      toast.error(isTr ? 'Kullanıcılar yüklenemedi' : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRole, isTr]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleBan = async (userId: string) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/ban`);
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, isBanned: data.isBanned } : u));
      toast.success(data.isBanned ? (isTr ? 'Kullanıcı engellendi' : 'User banned') : (isTr ? 'Engel kaldırıldı' : 'User unbanned'));
    } catch {
      toast.error(isTr ? 'İşlem başarısız' : 'Operation failed');
    }
  };

  const handleVerify = async (userId: string) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/verify`);
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, isVerified: data.isVerified } : u));
      toast.success(data.isVerified ? (isTr ? 'Kullanıcı doğrulandı' : 'User verified') : (isTr ? 'Doğrulama kaldırıldı' : 'Verification removed'));
    } catch {
      toast.error(isTr ? 'İşlem başarısız' : 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteUserId}`);
      setUsers(prev => prev.filter(u => u.userId !== deleteUserId));
      setTotal(t => t - 1);
      toast.success(isTr ? 'Kullanıcı silindi' : 'User deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isTr ? 'Silme başarısız' : 'Delete failed'));
    } finally {
      setDeleting(false);
      setDeleteUserId(null);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      <SEO title={isTr ? 'Admin - Kullanıcı Yönetimi' : 'Admin - Users'} />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-[var(--bg-input)] transition-colors">
          <ChevronLeft size={20} />
        </button>
        <Users size={24} className="text-[#2D6A4F]" />
        <h1 className="text-2xl font-semibold tracking-tight">{isTr ? 'Kullanıcı Yönetimi' : 'User Management'}</h1>
        <span className="ml-auto text-sm text-[var(--text-secondary)]">{total} {isTr ? 'kullanıcı' : 'users'}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={isTr ? 'İsim, email veya kullanıcı adı...' : 'Name, email or username...'}
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[#2D6A4F] transition-colors"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => { setFilterRole(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-sm outline-none"
        >
          <option value="">{isTr ? 'Tüm Roller' : 'All Roles'}</option>
          <option value="user">{isTr ? 'Kullanıcı' : 'User'}</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-secondary)]">
          {isTr ? 'Kullanıcı bulunamadı' : 'No users found'}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.userId} className="flex items-center gap-4 p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm">
                {u.profileImage ? (
                  <img src={u.profileImage} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-[#2D6A4F]">{u.name?.charAt(0)?.toUpperCase() || '?'}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{u.name}</p>
                    {u.isVerified && <ShieldCheck size={14} className="text-[#2D6A4F]" />}
                    {u.role === 'admin' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] font-semibold">Admin</span>}
                    {u.isBanned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">{isTr ? 'Engelli' : 'Banned'}</span>}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-secondary)]">
                    {u.username && <span>@{u.username}</span>}
                    {u.location && <><span>•</span><span>{u.location}</span></>}
                    <span>•</span>
                    <span>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {u.role !== 'admin' && (
                    <>
                      <button
                        onClick={() => handleVerify(u.userId)}
                        className={`p-2 rounded-lg transition-colors ${u.isVerified ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'hover:bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}
                        title={u.isVerified ? (isTr ? 'Doğrulamayı Kaldır' : 'Remove Verification') : (isTr ? 'Doğrula' : 'Verify')}
                      >
                        <ShieldCheck size={16} />
                      </button>
                      <button
                        onClick={() => handleBan(u.userId)}
                        className={`p-2 rounded-lg transition-colors ${u.isBanned ? 'bg-red-50 text-red-600' : 'hover:bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}
                        title={u.isBanned ? (isTr ? 'Engeli Kaldır' : 'Unban') : (isTr ? 'Engelle' : 'Ban')}
                      >
                        <Ban size={16} />
                      </button>
                      <button onClick={() => setDeleteUserId(u.userId)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title={isTr ? 'Sil' : 'Delete'}>
                        <Trash2 size={16} className="text-[#C1341B]" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

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

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteUserId} onClose={() => setDeleteUserId(null)} title={isTr ? 'Kullanıcıyı Sil' : 'Delete User'} size="sm">
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {isTr ? 'Bu kullanıcıyı ve tüm ilanlarını silmek istediğinizden emin misiniz?' : 'Are you sure you want to delete this user and all their listings?'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteUserId(null)} className="flex-1">{isTr ? 'İptal' : 'Cancel'}</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">{isTr ? 'Sil' : 'Delete'}</Button>
        </div>
      </Modal>
    </div>
  );
}
