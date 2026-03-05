import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Shield, Flag, AlertTriangle, CheckCircle, XCircle, ChevronLeft, ChevronRight, Trash2, Eye, Star, ShieldCheck } from 'lucide-react';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

/* ─── Data shapes ─── */

interface Report {
  _id: string;
  reporterUserId: string;
  targetType: 'listing' | 'comment' | 'user' | 'message';
  targetId: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedBy: string;
  createdAt: string;
}

interface AdminRating {
  _id: string;
  fromUserId: string;
  toUserId: string;
  listingId?: string;
  score: number;
  comment: string;
  seller_reply?: string;
  isUpdated?: boolean;
  commentDeleted?: boolean;
  fromUserName: string;
  fromUserImage: string;
  createdAt: string;
}

interface ProfanityLogItem {
  _id: string;
  userId: string;
  field: string;
  content: string;
  endpoint: string;
  createdAt: string;
}

/* ─── Helpers ─── */

const targetTypeLabels: Record<string, string> = {
  listing: 'İlan',
  comment: 'Yorum',
  user: 'Kullanıcı',
  message: 'Mesaj',
};

const targetTypeColors: Record<string, string> = {
  listing: 'bg-blue-100 text-blue-700',
  comment: 'bg-purple-100 text-purple-700',
  user: 'bg-orange-100 text-orange-700',
  message: 'bg-teal-100 text-teal-700',
};

const statusLabels: Record<string, string> = {
  pending: 'Beklemede',
  resolved: 'Çözümlendi',
  dismissed: 'Reddedildi',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  dismissed: 'bg-gray-100 text-gray-500',
};

const endpointLabels: Record<string, string> = {
  createListing: 'İlan Oluştur',
  updateListing: 'İlan Güncelle',
  createComment: 'Yorum Oluştur',
  register: 'Kayıt Ol',
  updateUser: 'Profil Güncelle',
};

const fieldLabels: Record<string, string> = {
  title: 'Başlık',
  description: 'Açıklama',
  text: 'Metin',
  name: 'İsim',
  bio: 'Biyografi',
};

type Tab = 'reports' | 'profanity' | 'ratings';

export default function AdminModerationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('reports');

  /* ─── Reports state ─── */
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('pending');

  /* ─── Profanity logs state ─── */
  const [logs, setLogs] = useState<ProfanityLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);

  /* ─── Ratings state ─── */
  const [ratings, setRatings] = useState<AdminRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [ratingsTotalPages, setRatingsTotalPages] = useState(1);
  const [ratingsTotal, setRatingsTotal] = useState(0);

  /* ─── Modal state ─── */
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewReport, setViewReport] = useState<Report | null>(null);

  /* ─── Fetch Reports ─── */
  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: reportsPage,
        limit: 20,
        status: reportStatusFilter,
      };
      const { data } = await api.get('/admin/reports', { params });
      setReports(data.reports || data.data || []);
      setReportsTotalPages(data.totalPages || 1);
      setReportsTotal(data.total || 0);
    } catch {
      toast.error('Raporlar yüklenemedi');
    } finally {
      setReportsLoading(false);
    }
  }, [reportsPage, reportStatusFilter]);

  /* ─── Fetch Profanity Logs ─── */
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: logsPage,
        limit: 20,
      };
      const { data } = await api.get('/admin/profanity-logs', { params });
      setLogs(data.logs || data.data || []);
      setLogsTotalPages(data.totalPages || 1);
    } catch {
      toast.error('Küfür logları yüklenemedi');
    } finally {
      setLogsLoading(false);
    }
  }, [logsPage]);

  /* ─── Fetch Ratings ─── */
  const fetchRatings = useCallback(async () => {
    setRatingsLoading(true);
    try {
      const { data } = await api.get('/admin/ratings', { params: { page: ratingsPage, limit: 20 } });
      setRatings(data.ratings || []);
      setRatingsTotalPages(data.totalPages || 1);
      setRatingsTotal(data.total || 0);
    } catch { toast.error('Değerlendirmeler yüklenemedi'); }
    finally { setRatingsLoading(false); }
  }, [ratingsPage]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [fetchReports, activeTab]);

  useEffect(() => {
    if (activeTab === 'profanity') {
      fetchLogs();
    }
  }, [fetchLogs, activeTab]);

  useEffect(() => {
    if (activeTab === 'ratings') fetchRatings();
  }, [fetchRatings, activeTab]);

  /* ─── Report actions ─── */
  const handleResolve = async (id: string) => {
    try {
      await api.put(`/admin/reports/${id}/resolve`, { status: 'resolved' });
      setReports(prev => prev.map(r => (r._id === id ? { ...r, status: 'resolved' as const } : r)));
      toast.success('Rapor çözümlendi');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.put(`/admin/reports/${id}/resolve`, { status: 'dismissed' });
      setReports(prev => prev.map(r => (r._id === id ? { ...r, status: 'dismissed' as const } : r)));
      toast.success('Rapor reddedildi');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDeleteReport = async () => {
    if (!deleteReportId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/reports/${deleteReportId}`);
      setReports(prev => prev.filter(r => r._id !== deleteReportId));
      setReportsTotal(t => t - 1);
      toast.success('Rapor silindi');
    } catch {
      toast.error('Silme başarısız');
    } finally {
      setDeleting(false);
      setDeleteReportId(null);
    }
  };

  /* ─── Rating actions ─── */
  const handleHardDeleteRating = async (id: string) => {
    try {
      await api.delete(`/admin/ratings/${id}`);
      setRatings(prev => prev.filter(r => r._id !== id));
      setRatingsTotal(t => t - 1);
      toast.success('Değerlendirme tamamen silindi');
    } catch { toast.error('Silme başarısız'); }
  };

  const handleToggleVerify = async (userId: string) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/verify`);
      toast.success(data.isVerified ? 'Lider Üretici onaylandı' : 'Onay kaldırıldı');
    } catch { toast.error('İşlem başarısız'); }
  };

  /* ─── Pending count for tab badge ─── */
  const pendingCount = reportStatusFilter === 'pending' ? reportsTotal : 0;

  return (
    <AdminLayout title="İçerik Moderasyonu" icon={<Shield size={24} />}>
      {/* ─── Tab Switcher ─── */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 w-full sm:w-auto ${
            activeTab === 'reports'
              ? 'bg-[#2D6A4F] text-white shadow-sm'
              : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
          }`}
        >
          <Flag size={16} />
          Raporlar
          {pendingCount > 0 && (
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
              activeTab === 'reports'
                ? 'bg-white/20 text-white'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('profanity')}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 w-full sm:w-auto ${
            activeTab === 'profanity'
              ? 'bg-[#2D6A4F] text-white shadow-sm'
              : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
          }`}
        >
          <AlertTriangle size={16} />
          Küfür Logları
        </button>
        <button
          onClick={() => setActiveTab('ratings')}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 w-full sm:w-auto ${
            activeTab === 'ratings'
              ? 'bg-[#2D6A4F] text-white shadow-sm'
              : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
          }`}
        >
          <Star size={16} />
          Değerlendirmeler
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
            activeTab === 'ratings' ? 'bg-white/20 text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
          }`}>{ratingsTotal}</span>
        </button>
      </div>

      {/* ═══════════════════════════ TAB 1: Reports ═══════════════════════════ */}
      {activeTab === 'reports' && (
        <>
          {/* Status filter */}
          <div className="flex flex-wrap gap-2 mb-5">
            {(['pending', 'resolved', 'dismissed'] as const).map(status => (
              <button
                key={status}
                onClick={() => {
                  setReportStatusFilter(status);
                  setReportsPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  reportStatusFilter === status
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>

          {/* Reports list */}
          {reportsLoading ? (
            <LoadingSpinner size="lg" className="py-20" />
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <Flag size={40} className="text-[var(--text-secondary)] mx-auto mb-3 opacity-40" />
              <p className="text-sm text-[var(--text-secondary)]">Rapor bulunamadı</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {reports.map(report => (
                  <div
                    key={report._id}
                    className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm transition-colors"
                  >
                    {/* Top row: type badge + status badge */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${
                        targetTypeColors[report.targetType] || 'bg-gray-100 text-gray-500'
                      }`}>
                        <Flag size={10} />
                        {targetTypeLabels[report.targetType] || report.targetType}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${
                        statusColors[report.status]
                      }`}>
                        {report.status === 'pending' && <AlertTriangle size={10} />}
                        {report.status === 'resolved' && <CheckCircle size={10} />}
                        {report.status === 'dismissed' && <XCircle size={10} />}
                        {statusLabels[report.status]}
                      </span>
                      <span className="ml-auto text-[10px] text-[var(--text-secondary)]">
                        {new Date(report.createdAt).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--text-secondary)]">Hedef ID:</span>
                        <span className="font-mono text-[11px] bg-[var(--bg-input)] px-2 py-0.5 rounded-md truncate max-w-[200px] sm:max-w-none">
                          {report.targetId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--text-secondary)]">Sebep:</span>
                        <span className="font-medium text-[var(--text-primary)]">{report.reason}</span>
                      </div>
                      {report.description && (
                        <div className="text-xs">
                          <span className="text-[var(--text-secondary)]">Açıklama: </span>
                          <span className="text-[var(--text-primary)]">{report.description}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--text-secondary)]">Raporlayan:</span>
                        <span className="font-mono text-[11px] bg-[var(--bg-input)] px-2 py-0.5 rounded-md truncate max-w-[200px] sm:max-w-none">
                          {report.reporterUserId}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-default)]">
                      <button
                        onClick={() => setViewReport(report)}
                        className="p-2 rounded-lg hover:bg-[var(--bg-input)] transition-colors"
                        title="Detay"
                      >
                        <Eye size={16} className="text-[var(--text-secondary)]" />
                      </button>

                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleResolve(report._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircle size={14} />
                            <span className="hidden sm:inline">Çöz</span>
                          </button>
                          <button
                            onClick={() => handleDismiss(report._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            <XCircle size={14} />
                            <span className="hidden sm:inline">Reddet</span>
                          </button>
                        </>
                      )}

                      <div className="flex-1" />

                      <button
                        onClick={() => setDeleteReportId(report._id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={16} className="text-[#C1341B]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reports pagination */}
              {reportsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setReportsPage(p => Math.max(1, p - 1))}
                    disabled={reportsPage <= 1}
                    className="p-2 rounded-xl hover:bg-[var(--bg-input)] disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium">
                    {reportsPage} / {reportsTotalPages}
                  </span>
                  <button
                    onClick={() => setReportsPage(p => Math.min(reportsTotalPages, p + 1))}
                    disabled={reportsPage >= reportsTotalPages}
                    className="p-2 rounded-xl hover:bg-[var(--bg-input)] disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════ TAB 2: Profanity Logs ═══════════════════════════ */}
      {activeTab === 'profanity' && (
        <>
          {logsLoading ? (
            <LoadingSpinner size="lg" className="py-20" />
          ) : logs.length === 0 ? (
            <div className="text-center py-20">
              <AlertTriangle size={40} className="text-[var(--text-secondary)] mx-auto mb-3 opacity-40" />
              <p className="text-sm text-[var(--text-secondary)]">Küfür logu bulunamadı</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {logs.map(log => (
                  <div
                    key={log._id}
                    className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm"
                  >
                    {/* Top row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-red-100 text-red-700">
                        <AlertTriangle size={10} />
                        Küfür Tespiti
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[var(--bg-input)] text-[var(--text-secondary)]">
                        {endpointLabels[log.endpoint] || log.endpoint}
                      </span>
                      <span className="ml-auto text-[10px] text-[var(--text-secondary)]">
                        {new Date(log.createdAt).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--text-secondary)]">Kullanıcı ID:</span>
                        <span className="font-mono text-[11px] bg-[var(--bg-input)] px-2 py-0.5 rounded-md truncate max-w-[200px] sm:max-w-none">
                          {log.userId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--text-secondary)]">Alan:</span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {fieldLabels[log.field] || log.field}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-[var(--text-secondary)]">İçerik: </span>
                        <span className="text-[var(--text-primary)] bg-red-50 px-2 py-0.5 rounded-md inline-block max-w-full truncate">
                          {log.content.length > 150 ? log.content.slice(0, 150) + '...' : log.content}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Profanity logs pagination */}
              {logsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                    disabled={logsPage <= 1}
                    className="p-2 rounded-xl hover:bg-[var(--bg-input)] disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium">
                    {logsPage} / {logsTotalPages}
                  </span>
                  <button
                    onClick={() => setLogsPage(p => Math.min(logsTotalPages, p + 1))}
                    disabled={logsPage >= logsTotalPages}
                    className="p-2 rounded-xl hover:bg-[var(--bg-input)] disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════ TAB 3: Ratings ═══════════════════════════ */}
      {activeTab === 'ratings' && (
        <>
          {ratingsLoading ? (
            <LoadingSpinner size="lg" className="py-20" />
          ) : ratings.length === 0 ? (
            <div className="text-center py-20">
              <Star size={40} className="text-[var(--text-secondary)] mx-auto mb-3 opacity-40" />
              <p className="text-sm text-[var(--text-secondary)]">Değerlendirme bulunamadı</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {ratings.map(r => (
                  <div key={r._id} className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold">{r.fromUserName || 'Anonim'}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">→</span>
                      <span className="text-xs font-mono bg-[var(--bg-input)] px-2 py-0.5 rounded-md">{r.toUserId}</span>
                      <div className="flex items-center gap-0.5 ml-auto">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} className={i < r.score ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                        ))}
                      </div>
                      {r.isUpdated && (
                        <span className="text-[9px] font-semibold text-[#0077B6] bg-[#0077B6]/10 px-1.5 py-0.5 rounded-full">Güncellendi</span>
                      )}
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    {r.comment && !r.commentDeleted && (
                      <p className="text-sm text-[var(--text-primary)] mb-1">{r.comment}</p>
                    )}
                    {r.commentDeleted && (
                      <p className="text-[11px] italic text-[var(--text-secondary)] mb-1">Yorum silindi (puan korundu)</p>
                    )}
                    {r.seller_reply && (
                      <div className="pl-3 border-l-2 border-[var(--accent-green)]/30 mt-1 mb-2">
                        <p className="text-[10px] font-semibold text-[var(--accent-green)]">Satıcı Yanıtı:</p>
                        <p className="text-[12px] text-[var(--text-primary)]">{r.seller_reply}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-default)]">
                      <button
                        onClick={() => handleToggleVerify(r.toUserId)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#2D6A4F]/10 text-[#2D6A4F] hover:bg-[#2D6A4F]/20 transition-colors"
                        title="Satıcıyı Lider Üretici yap"
                      >
                        <ShieldCheck size={14} />
                        Lider Üretici
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={() => handleHardDeleteRating(r._id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#C1341B] hover:bg-red-50 transition-colors"
                        title="Tamamen sil"
                      >
                        <Trash2 size={14} />
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {ratingsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button onClick={() => setRatingsPage(p => Math.max(1, p - 1))} disabled={ratingsPage <= 1} className="p-2 rounded-xl hover:bg-[var(--bg-input)] disabled:opacity-30 transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium">{ratingsPage} / {ratingsTotalPages}</span>
                  <button onClick={() => setRatingsPage(p => Math.min(ratingsTotalPages, p + 1))} disabled={ratingsPage >= ratingsTotalPages} className="p-2 rounded-xl hover:bg-[var(--bg-input)] disabled:opacity-30 transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── Report Detail Modal ─── */}
      <Modal
        isOpen={!!viewReport}
        onClose={() => setViewReport(null)}
        title="Rapor Detayı"
        size="md"
      >
        {viewReport && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                targetTypeColors[viewReport.targetType] || 'bg-gray-100 text-gray-500'
              }`}>
                {targetTypeLabels[viewReport.targetType] || viewReport.targetType}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                statusColors[viewReport.status]
              }`}>
                {statusLabels[viewReport.status]}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-[var(--text-secondary)] text-xs">Hedef ID</span>
                <p className="font-mono text-xs bg-[var(--bg-input)] px-3 py-2 rounded-xl mt-1 break-all">
                  {viewReport.targetId}
                </p>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] text-xs">Sebep</span>
                <p className="font-medium mt-1">{viewReport.reason}</p>
              </div>
              {viewReport.description && (
                <div>
                  <span className="text-[var(--text-secondary)] text-xs">Açıklama</span>
                  <p className="mt-1 whitespace-pre-wrap">{viewReport.description}</p>
                </div>
              )}
              <div>
                <span className="text-[var(--text-secondary)] text-xs">Raporlayan Kullanıcı</span>
                <p className="font-mono text-xs bg-[var(--bg-input)] px-3 py-2 rounded-xl mt-1 break-all">
                  {viewReport.reporterUserId}
                </p>
              </div>
              {viewReport.resolvedBy && (
                <div>
                  <span className="text-[var(--text-secondary)] text-xs">Çözen Admin</span>
                  <p className="font-mono text-xs bg-[var(--bg-input)] px-3 py-2 rounded-xl mt-1 break-all">
                    {viewReport.resolvedBy}
                  </p>
                </div>
              )}
              <div>
                <span className="text-[var(--text-secondary)] text-xs">Tarih</span>
                <p className="mt-1">
                  {new Date(viewReport.createdAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {viewReport.status === 'pending' && (
              <div className="flex gap-3 pt-2 border-t border-[var(--border-default)]">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleResolve(viewReport._id);
                    setViewReport(prev => prev ? { ...prev, status: 'resolved' } : null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={14} />
                  Çöz
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleDismiss(viewReport._id);
                    setViewReport(prev => prev ? { ...prev, status: 'dismissed' } : null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} />
                  Reddet
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ─── Delete Confirmation Modal ─── */}
      <Modal
        isOpen={!!deleteReportId}
        onClose={() => setDeleteReportId(null)}
        title="Raporu Sil"
        size="sm"
      >
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Bu raporu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteReportId(null)} className="flex-1">
            İptal
          </Button>
          <Button variant="danger" onClick={handleDeleteReport} loading={deleting} className="flex-1">
            Sil
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
