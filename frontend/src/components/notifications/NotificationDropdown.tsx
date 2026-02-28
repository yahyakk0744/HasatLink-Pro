import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useNotificationContext } from '../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { t } = useTranslation();
  const { notifications, markAsRead, markAllAsRead } = useNotificationContext();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-[#D6D0C8]/50 overflow-hidden animate-fade-in z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#D6D0C8]/50">
        <h3 className="text-sm font-semibold tracking-tight">{t('notifications.title')}</h3>
        <button onClick={() => markAllAsRead()} className="text-[10px] font-medium text-[#2D6A4F] uppercase">
          {t('notifications.markAllRead')}
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto p-2 space-y-1">
        {notifications.length ? (
          notifications.slice(0, 10).map(n => (
            <NotificationItem key={n._id} notification={n} onClick={() => markAsRead(n._id)} />
          ))
        ) : (
          <p className="text-center text-sm text-[#6B6560] py-8">{t('notifications.empty')}</p>
        )}
      </div>
      <Link
        to="/bildirimler"
        onClick={onClose}
        className="block text-center text-xs font-medium text-[#2D6A4F] uppercase py-3 border-t border-[#D6D0C8]/50 hover:bg-[#F5F3EF]"
      >
        {t('notifications.title')} &rarr;
      </Link>
    </div>
  );
}
