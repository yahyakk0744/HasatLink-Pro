import { Router } from 'express';
import auth from '../middleware/auth';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications, pushSubscribe, getPushSubscriptions } from '../controllers/notificationController';
import adminMiddleware from '../middleware/admin';

const router = Router();

router.get('/notifications/:userId', auth, getNotifications);
router.get('/notifications/:userId/unread-count', auth, getUnreadCount);
router.put('/notifications/:id/read', auth, markAsRead);
router.put('/notifications/:userId/read-all', auth, markAllAsRead);
router.delete('/notifications/:id', auth, deleteNotification);
router.delete('/notifications/:userId/all', auth, deleteAllNotifications);
router.post('/notifications/push-subscribe', auth, pushSubscribe);
router.get('/notifications/push-subscriptions', auth, adminMiddleware, getPushSubscriptions);

export default router;
