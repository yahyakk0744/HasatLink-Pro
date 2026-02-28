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
} from '../controllers/adminController';

const router = Router();

// All routes require auth + admin
router.use(auth, admin);

// Dashboard
router.get('/admin/stats', getDashboardStats);

// Listings
router.get('/admin/listings', getAdminListings);
router.put('/admin/listings/:id/status', updateListingStatus);
router.delete('/admin/listings/:id', deleteAdminListing);

// Users
router.get('/admin/users', getAdminUsers);
router.put('/admin/users/:userId/ban', toggleBanUser);
router.put('/admin/users/:userId/verify', toggleVerifyUser);
router.delete('/admin/users/:userId', deleteAdminUser);

// Market Prices (Hal Fiyatları)
router.get('/admin/market-prices', getAdminMarketPrices);
router.post('/admin/market-prices', createMarketPrice);
router.put('/admin/market-prices/:id', updateMarketPrice);
router.delete('/admin/market-prices/:id', deleteMarketPrice);

export default router;
