import { Router } from 'express';
import auth from '../middleware/auth';
import { uploadDiagnosis } from '../middleware/upload';
import {
  diagnose,
  getDiagnosisHistory,
  getDiseaseLibrary,
  getRegionalAlertsEndpoint,
  getSmartMatches,
  getHarvestPrediction,
} from '../controllers/aiController';

const router = Router();

// Core diagnosis
router.post('/ai/diagnose', auth, uploadDiagnosis, diagnose);
router.get('/ai/history/:userId', auth, getDiagnosisHistory);

// Disease library & regional alerts (public)
router.get('/ai/diseases', getDiseaseLibrary);
router.get('/ai/alerts', getRegionalAlertsEndpoint);

// Smart matching & harvest prediction
router.get('/ai/match/:disease_code', getSmartMatches);
router.get('/ai/harvest/:crop_type', getHarvestPrediction);

export default router;
