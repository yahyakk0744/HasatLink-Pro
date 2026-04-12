import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import {
  getProviders,
  getProvider,
  trackContact,
  createProvider,
  updateProvider,
  deleteProvider,
  calculateDistance,
} from '../controllers/logisticsController';

const router = Router();

// Public
router.get('/logistics', getProviders);
router.get('/logistics/distance', calculateDistance);
router.get('/logistics/:id', getProvider);
router.post('/logistics/:id/contact', trackContact);

// Admin CRUD
router.post('/admin/logistics', auth, admin, createProvider);
router.put('/admin/logistics/:id', auth, admin, updateProvider);
router.delete('/admin/logistics/:id', auth, admin, deleteProvider);

export default router;
