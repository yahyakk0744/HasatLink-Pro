import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import {
  createContactMessage,
  getContactMessages,
  markContactAsRead,
  deleteContactMessage,
} from '../controllers/contactController';
import { getSettings, updateSettings } from '../controllers/settingsController';

const router = Router();

// Public
router.post('/contact', createContactMessage);
router.get('/settings', getSettings);

// Admin only
router.get('/admin/contacts', auth, admin, getContactMessages);
router.patch('/admin/contacts/:id/read', auth, admin, markContactAsRead);
router.delete('/admin/contacts/:id', auth, admin, deleteContactMessage);
router.put('/admin/settings', auth, admin, updateSettings);

export default router;
