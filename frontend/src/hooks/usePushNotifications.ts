import { useState, useCallback } from 'react';
import api from '../config/api';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || undefined,
        });
        setSubscription(sub);
        // Save subscription to backend
        try {
          await api.post('/notifications/push-subscribe', { subscription: sub.toJSON() });
        } catch {}
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  return { permission, subscription, requestPermission };
};
