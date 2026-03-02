import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import {
  LayoutDashboard, Users, Package, AlertTriangle, ShieldCheck,
  Star, Clock, Flag, TrendingUp, Eye
} from 'lucide-react';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  totalContacts: number;
  unreadContacts: number;
  totalAds: number;
  activeAds: number;
  bannedUsers: number;
  verifiedUsers: number;
  suspendedUsers: number;
  featuredListings: number;
  pendingListings: number;
  totalReports: number;
  pendingReports: number;
  totalProfanityLogs: number;
  listingsByType: { _id: string; count: number }[];
  recentListings: any[];
  recentUsers: any[];
}

interface EnhancedStats {
  userRegistrations: { date: string; count: number }[];
  listingCreations: { date: string; count: number }[];
  categoryDistribution: { name: string; value: number }[];
  cityDistribution: { name: string; value: number }[];
}

const typeLabels: Record<string, string> = {
  pazar: 'Pazar',
  lojistik: 'Lojistik',
  isgucu: 'İşgücü',
  ekipman: 'Ekipman',
  arazi: 'Arazi',
  depolama: 'Depolama',
};

const PIE_COLORS = ['#2D6A4F', '#1B4332', '#A47148', '#0077B6', '#7C3AED', '#DC2626'];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [enhanced, setEnhanced] = useState<EnhancedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats').then(({ data }) => data),
      api.get('/admin/stats/enhanced').then(({ data }) => data).catch(() => null),
    ])
      .then(([statsData, enhancedData]) => {
        setStats(statsData);
        setEnhanced(enhancedData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Dashboard" icon={<LayoutDashboard size={24} />}>
        <LoadingSpinner size="lg" className="py-20" />
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: 'Toplam İlan',
      value: stats?.totalListings ?? 0,
      sub: `${stats?.activeListings ?? 0} aktif`,
      color: '#2D6A4F',
      icon: Package,
    },
    {
      label: 'Toplam Kullanıcı',
      value: stats?.totalUsers ?? 0,
      sub: `${stats?.verifiedUsers ?? 0} doğrulanmış`,
      color: '#1B4332',
      icon: Users,
    },
    {
      label: 'Bekleyen İlanlar',
      value: stats?.pendingListings ?? 0,
      sub: '',
      color: '#F59E0B',
      icon: Clock,
    },
    {
      label: 'Bekleyen Raporlar',
      value: stats?.pendingReports ?? 0,
      sub: '',
      color: '#C1341B',
      icon: Flag,
    },
    {
      label: 'Öne Çıkan İlanlar',
      value: stats?.featuredListings ?? 0,
      sub: '',
      color: '#7C3AED',
      icon: Star,
    },
    {
      label: 'Engelli Kullanıcılar',
      value: stats?.bannedUsers ?? 0,
      sub: '',
      color: '#DC2626',
      icon: AlertTriangle,
    },
    {
      label: 'Askıdaki Kullanıcılar',
      value: stats?.suspendedUsers ?? 0,
      sub: '',
      color: '#EA580C',
      icon: ShieldCheck,
    },
    {
      label: 'Küfür Logları',
      value: stats?.totalProfanityLogs ?? 0,
      sub: '',
      color: '#6B7280',
      icon: Eye,
    },
  ];

  const quickActions = [
    {
      label: 'İlan Onayları',
      path: '/admin/ilanlar',
      icon: Package,
      badge: stats?.pendingListings ?? 0,
      color: '#2D6A4F',
    },
    {
      label: 'Raporlar',
      path: '/admin/moderasyon',
      icon: Flag,
      badge: stats?.pendingReports ?? 0,
      color: '#C1341B',
    },
    {
      label: 'Bildirim Gönder',
      path: '/admin/bildirimler',
      icon: TrendingUp,
      badge: 0,
      color: '#7C3AED',
    },
    {
      label: 'Kullanıcılar',
      path: '/admin/kullanicilar',
      icon: Users,
      badge: 0,
      color: '#1B4332',
    },
  ];

  return (
    <AdminLayout title="Dashboard" icon={<LayoutDashboard size={24} />}>
      <div className="animate-fade-in space-y-6">

        {/* Section 1: Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <card.icon size={16} style={{ color: card.color }} />
                <p className="text-xs text-[var(--text-secondary)] font-medium">{card.label}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: card.color }}>
                {card.value}
              </p>
              {card.sub && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">{card.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Section 2: Charts */}

        {/* Row 1: User Registrations AreaChart (full width) */}
        {enhanced?.userRegistrations && enhanced.userRegistrations.length > 0 && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Kullanıcı Kayıtları
            </h2>
            <div className="min-h-[200px] md:min-h-[250px]">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={enhanced.userRegistrations}>
                  <defs>
                    <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis width={30} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2D6A4F"
                    strokeWidth={2}
                    fill="url(#colorRegistrations)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Row 2: Listing Creations BarChart + Category Distribution PieChart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Listing Creations BarChart */}
          {enhanced?.listingCreations && enhanced.listingCreations.length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                İlan Oluşturma
              </h2>
              <div className="min-h-[200px] md:min-h-[250px]">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={enhanced.listingCreations}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis width={30} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Category Distribution PieChart */}
          {enhanced?.categoryDistribution && enhanced.categoryDistribution.length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                Kategori Dağılımı
              </h2>
              <div className="min-h-[200px] md:min-h-[250px]">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={enhanced.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {enhanced.categoryDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Row 3: City Distribution horizontal BarChart (full width) */}
        {enhanced?.cityDistribution && enhanced.cityDistribution.length > 0 && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Şehir Bazlı Kullanıcılar
            </h2>
            <div style={{ minHeight: Math.max(250, enhanced.cityDistribution.length * 32) }}>
              <ResponsiveContainer width="100%" height={Math.max(250, enhanced.cityDistribution.length * 32)}>
                <BarChart data={enhanced.cityDistribution} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2D6A4F" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Section 3: Quick Actions */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Hızlı İşlemler
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-input-hover)] transition-colors text-left group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: action.color + '15' }}
                >
                  <action.icon size={20} style={{ color: action.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{action.label}</p>
                </div>
                {action.badge > 0 && (
                  <span
                    className="text-xs font-bold text-white px-2 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: action.color }}
                  >
                    {action.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Section 4: Listings by Category */}
        {stats?.listingsByType && stats.listingsByType.length > 0 && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Kategoriye Göre İlanlar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {stats.listingsByType.map((item) => (
                <div
                  key={item._id}
                  className="text-center p-3 rounded-xl bg-[var(--bg-input)]"
                >
                  <p className="text-lg font-bold text-[#2D6A4F]">{item.count}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {typeLabels[item._id] || item._id}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
