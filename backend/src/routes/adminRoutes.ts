import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import {
  getDashboardStats,
  getAdminListings,
  updateListingStatus,
  deleteAdminListing,
  getAdminUsers,
  toggleBanUser,
  toggleVerifyUser,
  deleteAdminUser,
  getAdminMarketPrices,
  createMarketPrice,
  updateMarketPrice,
  deleteMarketPrice,
  broadcastNotification,
} from '../controllers/adminController';

const router = Router();

// Dashboard
router.get('/admin/stats', auth, admin, getDashboardStats);

// Listings
router.get('/admin/listings', auth, admin, getAdminListings);
router.put('/admin/listings/:id/status', auth, admin, updateListingStatus);
router.delete('/admin/listings/:id', auth, admin, deleteAdminListing);

// Users
router.get('/admin/users', auth, admin, getAdminUsers);
router.put('/admin/users/:userId/ban', auth, admin, toggleBanUser);
router.put('/admin/users/:userId/verify', auth, admin, toggleVerifyUser);
router.delete('/admin/users/:userId', auth, admin, deleteAdminUser);

// Market Prices (Hal Fiyatları)
router.get('/admin/market-prices', auth, admin, getAdminMarketPrices);
router.post('/admin/market-prices', auth, admin, createMarketPrice);
router.put('/admin/market-prices/:id', auth, admin, updateMarketPrice);
router.delete('/admin/market-prices/:id', auth, admin, deleteMarketPrice);

// Notifications
router.post('/admin/notifications/broadcast', auth, admin, broadcastNotification);

export default router;
