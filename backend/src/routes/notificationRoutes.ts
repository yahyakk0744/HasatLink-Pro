import { Router } from 'express';
import auth from '../middleware/auth';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, pushSubscribe, getPushSubscriptions } from '../controllers/notificationController';
import adminMiddleware from '../middleware/admin';

const router = Router();

router.get('/notifications/:userId', auth, getNotifications);
router.get('/notifications/:userId/unread-count', auth, getUnreadCount);
router.put('/notifications/:id/read', auth, markAsRead);
router.put('/notifications/:userId/read-all', auth, markAllAsRead);
router.post('/notifications/push-subscribe', pushSubscribe);
router.get('/notifications/push-subscriptions', auth, adminMiddleware, getPushSubscriptions);

export default router;
