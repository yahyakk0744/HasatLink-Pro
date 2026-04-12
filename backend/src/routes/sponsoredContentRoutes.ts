import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import {
  getPublished,
  getBySlug,
  trackClick,
  getAllForAdmin,
  createSponsored,
  updateSponsored,
  deleteSponsored,
} from '../controllers/sponsoredContentController';

const router = Router();

// Public
router.get('/sponsored', getPublished);
router.get('/sponsored/:slug', getBySlug);
router.post('/sponsored/:id/click', trackClick);

// Admin CRUD
router.get('/admin/sponsored', auth, admin, getAllForAdmin);
router.post('/admin/sponsored', auth, admin, createSponsored);
router.put('/admin/sponsored/:id', auth, admin, updateSponsored);
router.delete('/admin/sponsored/:id', auth, admin, deleteSponsored);

export default router;
