import { useState, useCallback } from 'react';
import api from '../config/api';
import type { Notification } from '../types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data } = await api.get<Notification[]>(`/notifications/${userId}`);
      setNotifications(data);
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchUnreadCount = useCallback(async (userId: string) => {
    try {
      const { data } = await api.get<{ count: number }>(`/notifications/${userId}/unread-count`);
      setUnreadCount(data.count);
    } catch {}
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async (userId: string) => {
    try {
      await api.put(`/notifications/${userId}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  return { notifications, unreadCount, loading, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead };
};
