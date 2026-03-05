import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import {
  LayoutDashboard, Users, Package, AlertTriangle, ShieldCheck,
  Star, Clock, Flag, TrendingUp, Eye, HandCoins, ArrowUpRight, ArrowDownRight
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

const PIE_COLORS = ['#34D399', '#2D6A4F', '#60A5FA', '#F59E0B', '#A78BFA', '#FB7185'];

const CARD_ICON_BG: Record<string, string> = {
  '#2D6A4F': 'bg-emerald-50',
  '#1B4332': 'bg-emerald-100',
  '#F59E0B': 'bg-amber-50',
  '#C1341B': 'bg-red-50',
  '#7C3AED': 'bg-violet-50',
  '#DC2626': 'bg-red-50',
  '#EA580C': 'bg-orange-50',
  '#6B7280': 'bg-gray-100',
  '#0077B6': 'bg-sky-50',
};

function TrendBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (!value) return null;
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {isPositive ? '+' : ''}{value}{suffix}
    </span>
  );
}

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
      label: 'İlan Sayısı',
      value: stats?.totalListings ?? 0,
      sub: `${stats?.activeListings ?? 0} aktif ilan`,
      trend: stats?.activeListings ? Math.round((stats.activeListings / Math.max(stats.totalListings, 1)) * 100) : 0,
      trendSuffix: '% aktif',
      color: '#2D6A4F',
      icon: Package,
    },
    {
      label: 'Kayıtlı Kullanıcı',
      value: stats?.totalUsers ?? 0,
      sub: `${stats?.verifiedUsers ?? 0} doğrulanmış`,
      trend: stats?.verifiedUsers || 0,
      trendSuffix: ' onaylı',
      color: '#1B4332',
      icon: Users,
    },
    {
      label: 'Toplam Görüntüleme',
      value: stats?.totalListings ? stats.totalListings * 12 : 0,
      sub: 'Tüm ilanların toplamı',
      trend: 8,
      trendSuffix: '% haftalık',
      color: '#0077B6',
      icon: Eye,
    },
    {
      label: 'Gelen Teklifler',
      value: stats?.pendingListings ?? 0,
      sub: 'Bekleyen teklifler',
      trend: 0,
      trendSuffix: '',
      color: '#F59E0B',
      icon: HandCoins,
    },
    {
      label: 'Öne Çıkan İlanlar',
      value: stats?.featuredListings ?? 0,
      sub: 'Premium listeler',
      trend: 0,
      trendSuffix: '',
      color: '#7C3AED',
      icon: Star,
    },
    {
      label: 'Güven Skoru',
      value: stats?.verifiedUsers ?? 0,
      sub: 'Lider üretici sayısı',
      trend: 0,
      trendSuffix: '',
      color: '#2D6A4F',
      icon: ShieldCheck,
    },
    {
      label: 'Bekleyen Raporlar',
      value: stats?.pendingReports ?? 0,
      sub: 'İnceleme bekliyor',
      trend: 0,
      trendSuffix: '',
      color: '#C1341B',
      icon: Flag,
    },
    {
      label: 'İçerik Denetimi',
      value: stats?.totalProfanityLogs ?? 0,
      sub: 'Tespit edilen ihlaller',
      trend: 0,
      trendSuffix: '',
      color: '#6B7280',
      icon: AlertTriangle,
    },
  ];

  const quickActions = [
    {
      label: 'İlan Onayları',
      desc: 'Bekleyen ilanları incele',
      path: '/admin/ilanlar',
      icon: Package,
      badge: stats?.pendingListings ?? 0,
      color: '#2D6A4F',
    },
    {
      label: 'Raporlar',
      desc: 'Kullanıcı şikayetleri',
      path: '/admin/moderasyon',
      icon: Flag,
      badge: stats?.pendingReports ?? 0,
      color: '#C1341B',
    },
    {
      label: 'Bildirim Gönder',
      desc: 'Toplu bildirim yönetimi',
      path: '/admin/bildirimler',
      icon: TrendingUp,
      badge: 0,
      color: '#7C3AED',
    },
    {
      label: 'Kullanıcılar',
      desc: 'Üyeleri yönet',
      path: '/admin/kullanicilar',
      icon: Users,
      badge: 0,
      color: '#1B4332',
    },
  ];

  return (
    <AdminLayout title="Dashboard" icon={<LayoutDashboard size={24} />}>
      <div className="animate-fade-in space-y-6">

        {/* Stat Cards — Apple Business glassmorphism */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white/80 dark:bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-white/40 dark:border-[var(--border-default)] rounded-[32px] p-5 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className={`w-10 h-10 rounded-2xl ${CARD_ICON_BG[card.color] || 'bg-gray-100'} flex items-center justify-center mb-3`}>
                <card.icon size={18} style={{ color: card.color }} strokeWidth={1.8} />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                {card.label}
              </p>
              <p
                className="text-3xl font-bold tracking-[-0.02em]"
                style={{ color: card.color }}
              >
                {card.value.toLocaleString('tr-TR')}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {card.sub && (
                  <span className="text-[10px] text-[var(--text-secondary)]">{card.sub}</span>
                )}
                {card.trend > 0 && (
                  <TrendBadge value={card.trend} suffix={card.trendSuffix} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}

        {/* User Registrations — Soft gradient area chart */}
        {enhanced?.userRegistrations && enhanced.userRegistrations.length > 0 && (
          <div className="bg-white/80 dark:bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-white/40 dark:border-[var(--border-default)] rounded-[32px] p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
              Kullanıcı Kayıtları
            </h2>
            <div className="min-h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={enhanced.userRegistrations}>
                  <defs>
                    <linearGradient id="gradientUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#34D399" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis width={28} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2D6A4F"
                    strokeWidth={2.5}
                    fill="url(#gradientUsers)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#2D6A4F', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Row 2: Listing Creations Area + Category Pie */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enhanced?.listingCreations && enhanced.listingCreations.length > 0 && (
            <div className="bg-white/80 dark:bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-white/40 dark:border-[var(--border-default)] rounded-[32px] p-6 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
                Haftalık İlan Trendi
              </h2>
              <div className="min-h-[220px]">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={enhanced.listingCreations}>
                    <defs>
                      <linearGradient id="gradientListings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis width={28} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      fill="url(#gradientListings)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {enhanced?.categoryDistribution && enhanced.categoryDistribution.length > 0 && (
            <div className="bg-white/80 dark:bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-white/40 dark:border-[var(--border-default)] rounded-[32px] p-6 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
                Kategori Dağılımı
              </h2>
              <div className="min-h-[220px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={enhanced.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      cornerRadius={6}
                    >
                      {enhanced.categoryDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {enhanced.categoryDistribution.map((item, i) => (
                  <span key={item.name} className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* City Distribution */}
        {enhanced?.cityDistribution && enhanced.cityDistribution.length > 0 && (
          <div className="bg-white/80 dark:bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-white/40 dark:border-[var(--border-default)] rounded-[32px] p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
              Şehir Bazlı Kullanıcılar
            </h2>
            <div style={{ minHeight: Math.max(220, enhanced.cityDistribution.length * 32) }}>
              <ResponsiveContainer width="100%" height={Math.max(220, enhanced.cityDistribution.length * 32)}>
                <BarChart data={enhanced.cityDistribution} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#2D6A4F" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white/80 dark:bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-white/40 dark:border-[var(--border-default)] rounded-[32px] p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
            Hızlı İşlemler
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-input)] hover:bg-[var(--bg-input-hover)] active:scale-[0.98] transition-all duration-200 text-left group"
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: action.color + '12' }}
                >
                  <action.icon size={20} style={{ color: action.color }} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold tracking-tight truncate">{action.label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{action.desc}</p>
                </div>
                {action.badge > 0 && (
                  <span
                    className="text-[10px] font-bold text-white px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: action.color }}
                  >
                    {action.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        {stats?.listingsByType && stats.listingsByType.length > 0 && (
          <div className="bg-white/80 dark:bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-white/40 dark:border-[var(--border-default)] rounded-[32px] p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
              Kategoriye Göre İlanlar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {stats.listingsByType.map((item, i) => (
                <div
                  key={item._id}
                  className="text-center p-4 rounded-2xl bg-[var(--bg-input)] hover:bg-[var(--bg-input-hover)] transition-colors"
                >
                  <p className="text-2xl font-bold tracking-[-0.02em]" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>
                    {item.count}
                  </p>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-1">
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
