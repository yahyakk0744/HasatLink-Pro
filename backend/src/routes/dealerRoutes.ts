import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import {
  getNearbyDealers,
  trackDealerClick,
  trackDealerContact,
  getAllDealers,
  createDealer,
  updateDealer,
  deleteDealer,
  toggleDealerActive,
} from '../controllers/dealerController';

const router = Router();

// Public
router.get('/dealers/nearby', getNearbyDealers);
router.post('/dealers/:id/click', trackDealerClick);
router.post('/dealers/:id/contact', trackDealerContact);

// Admin only
router.get('/admin/dealers', auth, admin, getAllDealers);
router.post('/admin/dealers', auth, admin, createDealer);
router.put('/admin/dealers/:id', auth, admin, updateDealer);
router.delete('/admin/dealers/:id', auth, admin, deleteDealer);
router.patch('/admin/dealers/:id/toggle', auth, admin, toggleDealerActive);

export default router;
