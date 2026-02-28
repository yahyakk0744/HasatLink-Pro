import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, MessageSquare, Settings, DollarSign,
  Megaphone, TrendingUp, ShoppingCart, ChevronRight, AlertCircle, Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../config/api';

interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  totalContacts: number;
  unreadContacts: number;
  totalAds: number;
  activeAds: number;
  bannedUsers: number;
  listingsByType: { _id: string; count: number }[];
  recentListings: { _id: string; title: string; type: string; status: string; createdAt: string; userId: string }[];
  recentUsers: { name: string; email: string; username: string; createdAt: string; role: string; isBanned: boolean }[];
}

const typeLabels: Record<string, string> = {
  pazar: 'Pazar',
  lojistik: 'Lojistik',
  isgucu: 'İşgücü',
  ekipman: 'Ekipman',
  arazi: 'Arazi',
  depolama: 'Depolama',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  sold: 'bg-blue-100 text-blue-700',
  rented: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-500',
};

export default function AdminDashboardPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  const navCards = [
    { icon: Package, label: isTr ? 'İlan Yönetimi' : 'Listings', desc: isTr ? 'İlanları listele, düzenle, sil' : 'List, edit, delete listings', path: '/admin/ilanlar', color: '#2D6A4F' },
    { icon: Users, label: isTr ? 'Kullanıcı Yönetimi' : 'Users', desc: isTr ? 'Kullanıcıları yönet' : 'Manage users', path: '/admin/kullanicilar', color: '#1B4332' },
    { icon: TrendingUp, label: isTr ? 'Hal Fiyatları' : 'Market Prices', desc: isTr ? 'Hal fiyatlarını güncelle' : 'Update market prices', path: '/admin/hal-fiyatlari', color: '#A47148' },
    { icon: ShoppingCart, label: isTr ? 'HasatLink Pazarı' : 'HasatLink Market', desc: isTr ? 'Pazar fiyatlarını gör' : 'View market prices', path: '/admin/pazar-fiyatlari', color: '#6D4C41' },
    { icon: MessageSquare, label: isTr ? 'İletişim Mesajları' : 'Contact Messages', desc: `${stats?.unreadContacts || 0} ${isTr ? 'okunmamış' : 'unread'}`, path: '/admin/mesajlar', color: '#C1341B' },
    { icon: Settings, label: isTr ? 'Site Ayarları' : 'Site Settings', desc: isTr ? 'Logo, başlık, sosyal medya' : 'Logo, title, social media', path: '/admin/ayarlar', color: '#555' },
    { icon: DollarSign, label: isTr ? 'Gelir Yönetimi' : 'Revenue', desc: isTr ? 'Premium, komisyon, öne çıkan' : 'Premium, commission, featured', path: '/admin/gelir', color: '#2D6A4F' },
    { icon: Megaphone, label: isTr ? 'Reklam Yönetimi' : 'Ads', desc: `${stats?.activeAds || 0} ${isTr ? 'aktif reklam' : 'active ads'}`, path: '/admin/reklamlar', color: '#1565C0' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      <SEO title={isTr ? 'Admin Panel' : 'Admin Panel'} />

      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard size={24} className="text-[#2D6A4F]" />
        <h1 className="text-2xl font-semibold tracking-tight">{isTr ? 'Admin Panel' : 'Admin Panel'}</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: isTr ? 'Toplam İlan' : 'Total Listings', value: stats?.totalListings || 0, sub: `${stats?.activeListings || 0} ${isTr ? 'aktif' : 'active'}`, color: '#2D6A4F' },
          { label: isTr ? 'Toplam Kullanıcı' : 'Total Users', value: stats?.totalUsers || 0, sub: `${stats?.bannedUsers || 0} ${isTr ? 'engelli' : 'banned'}`, color: '#1B4332' },
          { label: isTr ? 'İletişim' : 'Contacts', value: stats?.totalContacts || 0, sub: `${stats?.unreadContacts || 0} ${isTr ? 'okunmamış' : 'unread'}`, color: '#C1341B' },
          { label: isTr ? 'Reklamlar' : 'Ads', value: stats?.totalAds || 0, sub: `${stats?.activeAds || 0} ${isTr ? 'aktif' : 'active'}`, color: '#1565C0' },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-[var(--text-secondary)] font-medium">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Listings by Type */}
      {stats?.listingsByType && stats.listingsByType.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            {isTr ? 'Kategoriye Göre İlanlar' : 'Listings by Category'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {stats.listingsByType.map((item) => (
              <div key={item._id} className="text-center p-3 rounded-xl bg-[var(--bg-input)]">
                <p className="text-lg font-bold text-[#2D6A4F]">{item.count}</p>
                <p className="text-xs text-[var(--text-secondary)]">{typeLabels[item._id] || item._id}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {navCards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="flex items-center gap-4 p-5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: card.color + '15' }}>
              <card.icon size={22} style={{ color: card.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{card.label}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{card.desc}</p>
            </div>
            <ChevronRight size={18} className="text-[var(--text-secondary)] group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {isTr ? 'Son İlanlar' : 'Recent Listings'}
            </h2>
            <button onClick={() => navigate('/admin/ilanlar')} className="text-xs text-[#2D6A4F] font-semibold flex items-center gap-1">
              {isTr ? 'Tümü' : 'All'} <ChevronRight size={14} />
            </button>
          </div>
          {stats?.recentListings && stats.recentListings.length > 0 ? (
            <div className="space-y-3">
              {stats.recentListings.map((l) => (
                <div key={l._id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-input)]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--text-secondary)]">{typeLabels[l.type] || l.type}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[l.status] || ''}`}>{l.status}</span>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/ilan/${l._id}`)} className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors">
                    <Eye size={16} className="text-[var(--text-secondary)]" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] py-4">
              <AlertCircle size={16} /> {isTr ? 'Henüz ilan yok' : 'No listings yet'}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {isTr ? 'Son Kullanıcılar' : 'Recent Users'}
            </h2>
            <button onClick={() => navigate('/admin/kullanicilar')} className="text-xs text-[#2D6A4F] font-semibold flex items-center gap-1">
              {isTr ? 'Tümü' : 'All'} <ChevronRight size={14} />
            </button>
          </div>
          {stats?.recentUsers && stats.recentUsers.length > 0 ? (
            <div className="space-y-3">
              {stats.recentUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-input)]">
                  <div className="w-9 h-9 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center text-sm font-bold text-[#2D6A4F]">
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{u.email}</p>
                  </div>
                  {u.role === 'admin' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] font-semibold">Admin</span>
                  )}
                  {u.isBanned && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">{isTr ? 'Engelli' : 'Banned'}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] py-4">
              <AlertCircle size={16} /> {isTr ? 'Henüz kullanıcı yok' : 'No users yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
