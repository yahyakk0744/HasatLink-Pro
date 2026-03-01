import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
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

  // Socket.IO real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification:new', handleNewNotification);
    return () => { socket.off('notification:new', handleNewNotification); };
  }, [socket]);

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
