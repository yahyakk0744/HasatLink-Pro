import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import {
  getActiveAds,
  trackImpression,
  trackClick,
  getAllAds,
  createAd,
  updateAd,
  deleteAd,
} from '../controllers/adController';

const router = Router();

// Public
router.get('/ads/active', getActiveAds);
router.post('/ads/active/:id/impression', trackImpression);
router.post('/ads/active/:id/click', trackClick);

// Admin only
router.get('/admin/ads', auth, admin, getAllAds);
router.post('/admin/ads', auth, admin, createAd);
router.put('/admin/ads/:id', auth, admin, updateAd);
router.delete('/admin/ads/:id', auth, admin, deleteAd);

export default router;
