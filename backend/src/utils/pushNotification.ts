import webpush from 'web-push';
import PushSubscriptionModel from '../models/PushSubscription';
import { sendSocketNotification } from '../socket';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

let vapidConfigured = false;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(
    'mailto:info@hasatlink.com',
    VAPID_PUBLIC,
    VAPID_PRIVATE,
  );
  vapidConfigured = true;
} else {
  console.warn('[PushNotification] VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set — web push notifications will be skipped');
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

/**
 * Send push notification to all subscriptions for a user.
 * Also sends via Socket.IO for in-app real-time delivery.
 */
export async function sendPushToUser(userId: string, payload: NotificationPayload, notificationDoc?: any) {
  // Socket.IO real-time (in-app)
  if (notificationDoc) {
    sendSocketNotification(userId, notificationDoc);
  }

  // Web Push (background/offline) — skip if VAPID not configured
  if (!vapidConfigured) {
    return;
  }

  try {
    const subscriptions = await PushSubscriptionModel.find({ userId });
    if (subscriptions.length === 0) return;

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon.svg',
      url: payload.url || '/',
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys?.p256dh || '', auth: sub.keys?.auth || '' } },
          pushPayload,
        ),
      ),
    );

    // Clean up expired/invalid subscriptions
    const expiredIds: string[] = [];
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        if ((result.reason as any)?.statusCode === 410) {
          expiredIds.push(subscriptions[i]._id.toString());
        } else {
          console.error(`[PushNotification] Failed to send to subscription ${subscriptions[i]._id}:`, result.reason);
        }
      }
    });
    if (expiredIds.length > 0) {
      await PushSubscriptionModel.deleteMany({ _id: { $in: expiredIds } });
    }
  } catch (error) {
    console.error('[PushNotification] Error sending push notifications:', error);
  }
}
