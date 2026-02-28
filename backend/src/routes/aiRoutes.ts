import { Router } from 'express';
import auth from '../middleware/auth';
import { diagnose, getDiagnosisHistory } from '../controllers/aiController';

const router = Router();

router.post('/ai/diagnose', auth, diagnose);
router.get('/ai/history/:userId', auth, getDiagnosisHistory);

export default router;
