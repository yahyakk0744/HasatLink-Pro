import { Router } from 'express';
import auth from '../middleware/auth';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notificationController';

const router = Router();

router.get('/notifications/:userId', auth, getNotifications);
router.get('/notifications/:userId/unread-count', auth, getUnreadCount);
router.put('/notifications/:id/read', auth, markAsRead);
router.put('/notifications/:userId/read-all', auth, markAllAsRead);

export default router;
