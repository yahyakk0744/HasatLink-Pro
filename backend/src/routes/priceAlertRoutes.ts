import { Router } from 'express';
import { createAlert, getMyAlerts, deleteAlert, toggleAlert } from '../controllers/priceAlertController';
import auth from '../middleware/auth';

const router = Router();

router.post('/price-alerts', auth, createAlert);
router.get('/price-alerts', auth, getMyAlerts);
router.delete('/price-alerts/:id', auth, deleteAlert);
router.put('/price-alerts/:id/toggle', auth, toggleAlert);

export default router;
