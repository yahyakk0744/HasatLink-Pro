import { Router } from 'express';
import { diagnose, getDiagnosisHistory } from '../controllers/aiController';

const router = Router();

router.post('/ai/diagnose', diagnose);
router.get('/ai/history/:userId', getDiagnosisHistory);

export default router;
