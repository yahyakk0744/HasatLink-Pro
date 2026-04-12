import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import {
  getCalendar,
  getProductCalendar,
  createHarvest,
  updateHarvest,
  deleteHarvest,
} from '../controllers/harvestCalendarController';

const router = Router();

// Public
router.get('/harvest-calendar', getCalendar);
router.get('/harvest-calendar/:product', getProductCalendar);

// Admin CRUD
router.post('/admin/harvest-calendar', auth, admin, createHarvest);
router.put('/admin/harvest-calendar/:id', auth, admin, updateHarvest);
router.delete('/admin/harvest-calendar/:id', auth, admin, deleteHarvest);

export default router;
