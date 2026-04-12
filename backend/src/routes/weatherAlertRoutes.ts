import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import {
  getMyAlerts,
  markRead,
  broadcastAlert,
} from '../controllers/weatherAlertController';

const router = Router();

// Kullanıcı
router.get('/weather-alerts/my', auth, getMyAlerts);
router.post('/weather-alerts/:id/read', auth, markRead);

// Admin
router.post('/admin/weather-alerts/broadcast', auth, admin, broadcastAlert);

export default router;
