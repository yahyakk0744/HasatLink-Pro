import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import api from '../config/api';
import type { Notification } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { permission, requestPermission } = usePushNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const weatherCheckedRef = useRef(false);
  const pushSubscribedRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const [notifsRes, countRes] = await Promise.all([
        api.get<Notification[]>(`/notifications/${user.userId}`),
        api.get<{ count: number }>(`/notifications/${user.userId}/unread-count`),
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.count);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, [user?.userId]);

  const checkWeatherAlerts = useCallback(async () => {
    if (!user?.userId) return;
    try {
      await api.get('/weather/alerts');
      await fetchNotifications();
    } catch {
      // Weather alert check failed — non-critical
    }
  }, [user?.userId, fetchNotifications]);

  // Play a short D5 notification sound via Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 587.33; // D5
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio playback failed — non-critical
    }
  }, []);

  // Socket.IO real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Play notification sound for messages and offers
      if (notification.type === 'mesaj' || notification.type === 'teklif') {
        playNotificationSound();
      }

      // Show visual toast for messages when user is NOT on the messages page
      if (notification.type === 'mesaj' && !window.location.pathname.startsWith('/mesajlar')) {
        toast.custom(
          (t) => (
            <div
              className={`${t.visible ? 'animate-slide-up' : 'opacity-0'} max-w-sm w-full bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-800 p-4 cursor-pointer transition-opacity duration-300`}
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = '/mesajlar';
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#2D6A4F]">
                    {notification.title?.[0] || '\uD83D\uDCAC'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
          ),
          { duration: 3000, position: 'top-right' }
        );
      }
    };

    socket.on('notification:new', handleNewNotification);
    return () => { socket.off('notification:new', handleNewNotification); };
  }, [socket, playNotificationSound]);

  useEffect(() => {
    if (user?.userId) {
      fetchNotifications();

      // Check weather alerts once on login
      if (!weatherCheckedRef.current) {
        weatherCheckedRef.current = true;
        checkWeatherAlerts();
      }

      // Auto-subscribe to push notifications if not already subscribed
      if (!pushSubscribedRef.current && permission !== 'denied') {
        pushSubscribedRef.current = true;
        requestPermission().catch(() => {});
      }

      // Fallback poll every 60 seconds (Socket.IO handles real-time)
      const notifInterval = setInterval(fetchNotifications, 60000);
      // Check weather alerts every 30 minutes
      const weatherInterval = setInterval(checkWeatherAlerts, 30 * 60 * 1000);

      return () => {
        clearInterval(notifInterval);
        clearInterval(weatherInterval);
      };
    } else {
      weatherCheckedRef.current = false;
    }
  }, [user?.userId, fetchNotifications, checkWeatherAlerts]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Mark-as-read failed — non-critical
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.userId) return;
    try {
      await api.put(`/notifications/${user.userId}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Mark-all-as-read failed — non-critical
    }
  }, [user?.userId]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationContext must be used within NotificationProvider');
  return context;
};
