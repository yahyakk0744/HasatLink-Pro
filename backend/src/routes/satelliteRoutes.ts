import { Router } from 'express';
import auth from '../middleware/auth';
import optionalAuth from '../middleware/optionalAuth';
import {
  createPolygon,
  getSatelliteImagery,
  getNDVIStats,
  quickAnalyze,
  listPolygons,
  deletePolygon,
  getParcelByCoordinate,
} from '../controllers/satelliteController';

const router = Router();

// TKGM parcel query by coordinate (public)
router.get('/satellite/parcel', optionalAuth, getParcelByCoordinate);

// Quick one-shot analysis — public so anyone can try (create temp polygon → get NDVI → cleanup)
router.post('/satellite/analyze', optionalAuth, quickAnalyze);

// Polygon CRUD
router.post('/satellite/polygon', auth, createPolygon);
router.get('/satellite/polygons', auth, listPolygons);
router.delete('/satellite/polygon/:polygonId', auth, deletePolygon);

// Satellite data for a polygon
router.get('/satellite/imagery/:polygonId', auth, getSatelliteImagery);
router.get('/satellite/ndvi/:polygonId', auth, getNDVIStats);

export default router;
