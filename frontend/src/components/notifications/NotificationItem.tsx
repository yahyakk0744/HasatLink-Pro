import type { Notification } from '../../types';
import { timeAgo } from '../../utils/formatters';
import { TrendingUp, BarChart3, Bell, FileText, Star, CloudSnow } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const typeIcons: Record<string, any> = {
  borsa: TrendingUp,
  istatistik: BarChart3,
  sistem: Bell,
  ilan: FileText,
  rating: Star,
  hava: CloudSnow,
};

const typeColors: Record<string, string> = {
  borsa: '#2D6A4F',
  istatistik: '#0077B6',
  sistem: '#A47148',
  ilan: '#1A1A1A',
  rating: '#A47148',
  hava: '#0077B6',
};

export default function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || Bell;
  const color = typeColors[notification.type] || '#6B6560';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl transition-colors ${
        notification.isRead ? 'opacity-60' : 'bg-[#F5F3EF]'
      } hover:bg-[#EBE7E0]`}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{notification.title}</p>
        <p className="text-xs text-[#6B6560] line-clamp-2">{notification.message}</p>
        <p className="text-[10px] text-[#6B6560] mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
      {!notification.isRead && <div className="w-2 h-2 rounded-full bg-[#2D6A4F] shrink-0 mt-2" />}
    </button>
  );
}
