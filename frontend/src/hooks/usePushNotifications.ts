import { useState, useCallback } from 'react';
import api from '../config/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Get VAPID key from env or API
        let vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          try {
            const { data } = await api.get('/push/vapid-key');
            vapidKey = data.publicKey;
          } catch {
            return false;
          }
        }

        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
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
