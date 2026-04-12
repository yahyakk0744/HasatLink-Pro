import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import NotificationItem from '../components/notifications/NotificationItem';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import SEO from '../components/ui/SEO';
import { Bell, Trash2, X } from 'lucide-react';

const FILTER_TYPES = [
  { key: 'all', label: 'Tümü' },
  { key: 'mesaj', label: 'Mesajlar' },
  { key: 'teklif', label: 'Teklifler' },
  { key: 'ilan', label: 'İlanlar' },
  { key: 'rating', label: 'Puanlar' },
  { key: 'hava', label: 'Hava' },
  { key: 'sistem', label: 'Sistem' },
];

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { notifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotificationContext();
  const [filter, setFilter] = useState('all');

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" /></div>;
  if (!user) return <Navigate to="/giris" replace />;

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <SEO title={t('notifications.title')} description="Bildirimlerinizi görüntüleyin." />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t('notifications.title')}</h1>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
                {t('notifications.markAllRead')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteAllNotifications()} className="text-red-500 hover:text-red-600">
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {FILTER_TYPES.map(ft => (
          <button
            key={ft.key}
            onClick={() => setFilter(ft.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === ft.key
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            {ft.label}
            {ft.key !== 'all' && (
              <span className="ml-1 opacity-70">
                {notifications.filter(n => n.type === ft.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(n => (
            <div key={n._id} className="relative group">
              <NotificationItem notification={n} onClick={() => markAsRead(n._id)} />
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell size={48} />}
          title={filter === 'all' ? t('notifications.empty') : 'Bu kategoride bildirim yok'}
        />
      )}
    </div>
  );
}
