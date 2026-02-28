import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import NotificationItem from '../components/notifications/NotificationItem';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotificationContext();

  if (!user) return <Navigate to="/giris" replace />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t('notifications.title')}</h1>
        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map(n => (
            <NotificationItem key={n._id} notification={n} onClick={() => markAsRead(n._id)} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Bell size={48} />} title={t('notifications.empty')} />
      )}
    </div>
  );
}
