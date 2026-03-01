import { Request, Response } from 'express';
import Notification from '../models/Notification';
import PushSubscription from '../models/PushSubscription';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Bildirim hatası', error });
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await Notification.countDocuments({ userId: req.params.userId, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Hata', error });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Hata', error });
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ userId: req.params.userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Hata', error });
  }
};

// POST /api/notifications/push-subscribe
export const pushSubscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys) {
      res.status(400).json({ message: 'Geçersiz abonelik verisi' });
      return;
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userId: (req as any).userId || '',
      },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Push abonelik hatası', error });
  }
};

// GET /api/notifications/push-subscriptions — admin only
export const getPushSubscriptions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await PushSubscription.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Hata', error });
  }
};
