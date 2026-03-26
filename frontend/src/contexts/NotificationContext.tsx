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

// ─── Shared AudioContext (created on first user interaction to bypass autoplay policy) ───
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browsers suspend until user interaction)
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// Unlock AudioContext on first user interaction
function unlockAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

// Register unlock listeners once
if (typeof window !== 'undefined') {
  const events = ['click', 'touchstart', 'keydown'];
  const handler = () => {
    unlockAudioContext();
    events.forEach(e => document.removeEventListener(e, handler, true));
  };
  events.forEach(e => document.addEventListener(e, handler, { once: true, capture: true }));
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { permission, requestPermission } = usePushNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const weatherCheckedRef = useRef(false);
  const pushSubscribedRef = useRef(false);
  const permissionToastShownRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const [notifsResult, countResult] = await Promise.allSettled([
        api.get<Notification[]>(`/notifications/${user.userId}`),
        api.get<{ count: number }>(`/notifications/${user.userId}/unread-count`),
      ]);
      if (notifsResult.status === 'fulfilled') {
        setNotifications(notifsResult.value.data);
      }
      if (countResult.status === 'fulfilled') {
        setUnreadCount(countResult.value.data.count);
      }
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

  // Play a short D5 notification sound via Web Audio API (messages)
  const playNotificationSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 587.33; // D5
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }, []);

  // Play Apple Chime (two-tone E5→G5) for offers/transactions
  const playChimeSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // First note: E5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 659.25;
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc1.start(now);
      osc1.stop(now + 0.15);
      // Second note: G5
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 783.99;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.4);
    } catch {}
  }, []);

  // Socket.IO real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Play different sounds: D5 note for messages, chime for offers
      if (notification.type === 'mesaj') {
        playNotificationSound();
      } else if (notification.type === 'teklif') {
        playChimeSound();
      }

      // Show receipt toast for accepted offers
      if (notification.type === 'teklif' && (notification as any).receipt) {
        const r = (notification as any).receipt;
        toast.custom(
          (t) => (
            <div
              className={`${t.visible ? 'animate-slide-up' : 'opacity-0'} max-w-sm w-full backdrop-blur-2xl bg-black/80 shadow-2xl rounded-3xl border border-white/10 p-5 cursor-pointer transition-opacity duration-300`}
              style={{ zIndex: 9999 }}
              onClick={() => { toast.dismiss(t.id); window.location.href = `/ilan/${r.listingId}`; }}
            >
              <div className="text-center mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">İşlem Onaylandı</p>
                <p className="text-white text-sm font-semibold mt-1 truncate">{r.listingTitle}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Alıcı</span>
                  <span className="text-white font-medium">{r.buyerName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Satıcı</span>
                  <span className="text-white font-medium">{r.sellerName}</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Tutar</span>
                  <span className="text-emerald-400 font-bold">{Number(r.offerPrice).toLocaleString('tr-TR')} TL</span>
                </div>
              </div>
            </div>
          ),
          { duration: 5000, position: 'top-right' }
        );
      }

      // Show visual toast for messages when user is NOT on the messages page
      if (notification.type === 'mesaj' && !window.location.pathname.startsWith('/mesajlar')) {
        toast.custom(
          (t) => (
            <div
              className={`${t.visible ? 'animate-slide-up' : 'opacity-0'} max-w-sm w-full backdrop-blur-2xl bg-white/90 dark:bg-black/80 shadow-2xl rounded-2xl border border-white/20 dark:border-white/10 p-4 cursor-pointer transition-opacity duration-300`}
              style={{ zIndex: 9999 }}
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
  }, [socket, playNotificationSound, playChimeSound]);

  useEffect(() => {
    if (user?.userId) {
      fetchNotifications();

      // Check weather alerts once on login
      if (!weatherCheckedRef.current) {
        weatherCheckedRef.current = true;
        checkWeatherAlerts();
      }

      // Auto-subscribe to push notifications if not already subscribed
      if (!pushSubscribedRef.current) {
        pushSubscribedRef.current = true;
        if (permission === 'denied' && !permissionToastShownRef.current) {
          // Show a friendly toast to enable notifications
          permissionToastShownRef.current = true;
          setTimeout(() => {
            toast.custom(
              (t) => (
                <div
                  className={`${t.visible ? 'animate-slide-up' : 'opacity-0'} max-w-sm w-full backdrop-blur-2xl bg-white/95 dark:bg-[#1A1A1A]/95 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-800 p-4 transition-opacity duration-300`}
                  style={{ zIndex: 9999 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <span className="text-lg">🔔</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Bildirimleri Açın
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Mesajları ve güncellemeleri kaçırmamak için tarayıcı bildirimlerini etkinleştirin.
                      </p>
                    </div>
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="text-gray-400 hover:text-gray-600 text-xs shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ),
              { duration: 6000, position: 'top-right' }
            );
          }, 3000);
        } else if (permission !== 'denied') {
          requestPermission().catch(() => {});
        }
      }

      // Fallback poll every 30 seconds (Socket.IO handles real-time)
      const notifInterval = setInterval(fetchNotifications, 30000);
      // Check weather alerts every 30 minutes
      const weatherInterval = setInterval(checkWeatherAlerts, 30 * 60 * 1000);

      return () => {
        clearInterval(notifInterval);
        clearInterval(weatherInterval);
      };
    } else {
      weatherCheckedRef.current = false;
      // Close AudioContext when user logs out
      if (sharedAudioCtx && sharedAudioCtx.state !== 'closed') {
        sharedAudioCtx.close().catch(() => {});
        sharedAudioCtx = null;
      }
    }
  }, [user?.userId, fetchNotifications, checkWeatherAlerts, permission, requestPermission]);

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
