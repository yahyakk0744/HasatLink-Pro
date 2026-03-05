import { Router } from 'express';
import auth from '../middleware/auth';
import {
  createPolygon,
  getSatelliteImagery,
  getNDVIStats,
  quickAnalyze,
  listPolygons,
  deletePolygon,
} from '../controllers/satelliteController';

const router = Router();

// Quick one-shot analysis (create temp polygon → get NDVI → cleanup)
router.post('/satellite/analyze', auth, quickAnalyze);

// Polygon CRUD
router.post('/satellite/polygon', auth, createPolygon);
router.get('/satellite/polygons', auth, listPolygons);
router.delete('/satellite/polygon/:polygonId', auth, deletePolygon);

// Satellite data for a polygon
router.get('/satellite/imagery/:polygonId', auth, getSatelliteImagery);
router.get('/satellite/ndvi/:polygonId', auth, getNDVIStats);

export default router;
