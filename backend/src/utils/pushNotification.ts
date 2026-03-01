import webpush from 'web-push';
import PushSubscriptionModel from '../models/PushSubscription';
import { sendSocketNotification } from '../socket';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BBQR8Itsvely1iLKMQrjuNbs3pCFq_m1x9KF3vrODBzLaPpSAd7cyOSJ_RibGPC1R6PKtBTGIWUX06HwgnlVbJA';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'QTsNNIg2oG3rzPyD9NgegzUNl5zGjoWDC8yAjAM808Y';

webpush.setVapidDetails(
  'mailto:info@hasatlink.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE,
);

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

  // Web Push (background/offline)
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
      if (result.status === 'rejected' && (result.reason as any)?.statusCode === 410) {
        expiredIds.push(subscriptions[i]._id.toString());
      }
    });
    if (expiredIds.length > 0) {
      await PushSubscriptionModel.deleteMany({ _id: { $in: expiredIds } });
    }
  } catch {
    // Push send failed — non-critical
  }
}
