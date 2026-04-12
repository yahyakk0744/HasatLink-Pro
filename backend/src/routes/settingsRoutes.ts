import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import {
  getSettings,
  getAdminSettings,
  updateSettings,
  toggleFeature,
  toggleMaintenance,
} from '../controllers/settingsController';

const router = Router();

// Public — feature flag map + site bilgileri
router.get('/settings', getSettings);

// Admin — tam ayarlar
router.get('/admin/settings', auth, admin, getAdminSettings);
router.put('/admin/settings', auth, admin, updateSettings);
router.patch('/admin/settings/feature/:name', auth, admin, toggleFeature);
router.patch('/admin/settings/maintenance', auth, admin, toggleMaintenance);

export default router;
