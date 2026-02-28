import { Router } from 'express';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notificationController';

const router = Router();

router.get('/notifications/:userId', getNotifications);
router.get('/notifications/:userId/unread-count', getUnreadCount);
router.put('/notifications/:id/read', markAsRead);
router.put('/notifications/:userId/read-all', markAllAsRead);

export default router;
