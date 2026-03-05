import { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Package,
  Users,
  Shield,
  Bell,
  TrendingUp,
  ShoppingCart,
  Megaphone,
  Store,
  FileText,
  MessageSquare,
  DollarSign,
  Settings,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'İlanlar', icon: Package, path: '/admin/ilanlar' },
  { label: 'Kullanıcılar', icon: Users, path: '/admin/kullanicilar' },
  { label: 'Moderasyon', icon: Shield, path: '/admin/moderasyon' },
  { label: 'Bildirimler', icon: Bell, path: '/admin/bildirimler' },
  { label: 'Hal Fiyatları', icon: TrendingUp, path: '/admin/hal-fiyatlari' },
  { label: 'HasatLink Pazarı', icon: ShoppingCart, path: '/admin/pazar-fiyatlari' },
  { label: 'Reklamlar', icon: Megaphone, path: '/admin/reklamlar' },
  { label: 'Bayiler', icon: Store, path: '/admin/bayiler' },
  { label: 'Blog', icon: FileText, path: '/admin/blog' },
  { label: 'İletişim', icon: MessageSquare, path: '/admin/mesajlar' },
  { label: 'Gelir', icon: DollarSign, path: '/admin/gelir' },
  { label: 'Ayarlar', icon: Settings, path: '/admin/ayarlar' },
];

export default function AdminLayout({ children, title, icon }: AdminLayoutProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth guard: redirect non-admin users
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className="px-5 py-5 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] flex items-center justify-center">
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">Admin Panel</h2>
            <p className="text-xs text-[var(--text-secondary)]">{user.name}</p>
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`
                w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm transition-all duration-200
                ${active
                  ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'
                }
              `}
            >
              <Icon size={18} className={active ? 'text-[#2D6A4F]' : ''} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Back to site + branding */}
      <div className="px-3 py-3 border-t border-[var(--border-default)] space-y-2">
        <button
          onClick={() => handleNavigate('/')}
          className="w-full flex items-center gap-3 py-2 px-4 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-input)] transition-colors"
        >
          <Home size={16} />
          <span>Site'ye Dön</span>
        </button>
        <p className="text-xs text-[var(--text-secondary)] text-center">
          <span className="font-semibold text-[var(--text-primary)]">HASAT</span>
          <span className="font-semibold text-[#2D6A4F]">LiNK</span>
          <span className="ml-1 opacity-60">Admin</span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed top-0 left-0 z-40 h-screen flex-col bg-[var(--bg-surface)] border-r border-[var(--border-default)]"
        style={{ width: 260 }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar panel */}
          <aside
            className="absolute top-0 left-0 h-full bg-[var(--bg-surface)] shadow-2xl flex flex-col animate-slide-in"
            style={{ width: 280 }}
          >
            {/* Close button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-[var(--bg-input)] transition-colors"
              >
                <X size={20} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Mobile header */}
      <div className="sticky top-0 z-30 md:hidden bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-1 rounded-xl hover:bg-[var(--bg-input)] transition-colors shrink-0"
          >
            <Menu size={20} className="text-[var(--text-primary)]" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {icon && <span className="text-[#2D6A4F] shrink-0 [&_svg]:w-5 [&_svg]:h-5">{icon}</span>}
            <h1 className="text-base font-bold text-[var(--text-primary)] truncate">{title}</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-[var(--bg-input)] transition-colors shrink-0"
            title="Site'ye Dön"
          >
            <Home size={18} className="text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="md:ml-[260px] min-h-screen">
        {/* Desktop page header */}
        <div className="hidden md:block px-6 lg:px-8 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {icon && <span className="text-[#2D6A4F]">{icon}</span>}
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
          </div>
        </div>

        {/* Page content */}
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
