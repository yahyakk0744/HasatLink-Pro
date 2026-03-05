import { Router } from 'express';
import auth from '../middleware/auth';
import { uploadDiagnosis } from '../middleware/upload';
import { diagnose, getDiagnosisHistory } from '../controllers/aiController';

const router = Router();

router.post('/ai/diagnose', auth, uploadDiagnosis, diagnose);
router.get('/ai/history/:userId', auth, getDiagnosisHistory);

export default router;
