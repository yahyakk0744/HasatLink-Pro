import { Router } from 'express';
import auth from '../middleware/auth';
import adminMiddleware from '../middleware/admin';
import {
  // Access & Settings
  checkAccess,
  getPublicSettings,
  // Regions
  getRegions,
  getRegionDetail,
  // Plots
  rentPlot,
  getMyPlots,
  getPlotDetail,
  // Actions
  performAction,
  // Imece
  createImeceGroup,
  joinImece,
  leaveImece,
  getImeceGroup,
  // Diary
  getDiary,
  uploadDiary,
  // Social
  visitPlot,
  getPlotSocial,
  // Harvest
  getHarvests,
  setShippingAddress,
  // Badges & Waitlist
  getMyBadges,
  joinWaitlist,
  // Admin
  adminUpdateSettings,
  adminGetDashboard,
} from '../controllers/farmController';

const router = Router();

// ─── Public (no auth) ───
router.get('/farm/settings', getPublicSettings);
router.get('/farm/regions', getRegions);
router.get('/farm/regions/:regionId', getRegionDetail);

// ─── Auth required ───
router.get('/farm/access', auth, checkAccess);
router.post('/farm/plots/rent', auth, rentPlot);
router.get('/farm/plots', auth, getMyPlots);
router.get('/farm/plots/:plotId', auth, getPlotDetail);
router.post('/farm/actions', auth, performAction);

// Imece
router.post('/farm/imece', auth, createImeceGroup);
router.post('/farm/imece/join', auth, joinImece);
router.post('/farm/imece/leave', auth, leaveImece);
router.get('/farm/imece/:groupId', auth, getImeceGroup);

// Diary
router.get('/farm/diary', auth, getDiary);

// Social
router.post('/farm/social/visit', auth, visitPlot);
router.get('/farm/social/:plotId', auth, getPlotSocial);

// Harvest
router.get('/farm/harvests', auth, getHarvests);
router.put('/farm/harvests/shipping', auth, setShippingAddress);

// Badges & Waitlist
router.get('/farm/badges', auth, getMyBadges);
router.post('/farm/waitlist', auth, joinWaitlist);

// ─── Admin (auth + admin role) ───
router.post('/farm/diary/upload', auth, adminMiddleware, uploadDiary);
router.put('/farm/admin/settings', auth, adminMiddleware, adminUpdateSettings);
router.get('/farm/admin/dashboard', auth, adminMiddleware, adminGetDashboard);

export default router;
