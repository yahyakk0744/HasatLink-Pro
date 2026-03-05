import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import {
  getDashboardStats,
  getEnhancedStats,
  getAdminListings,
  updateListingStatus,
  deleteAdminListing,
  toggleFeatureListing,
  bulkDeleteListings,
  getAdminUsers,
  getUserDetail,
  toggleBanUser,
  toggleVerifyUser,
  toggleSuspendUser,
  deleteAdminUser,
  getAdminMarketPrices,
  createMarketPrice,
  updateMarketPrice,
  deleteMarketPrice,
  broadcastNotification,
  getNotificationHistory,
  getReports,
  createReport,
  resolveReport,
  deleteReport,
  getProfanityLogs,
  getAdminRatings,
} from '../controllers/adminController';
import { adminHardDeleteRating } from '../controllers/ratingController';

const router = Router();

// Dashboard
router.get('/admin/stats', auth, admin, getDashboardStats);
router.get('/admin/stats/enhanced', auth, admin, getEnhancedStats);

// Listings
router.get('/admin/listings', auth, admin, getAdminListings);
router.put('/admin/listings/:id/status', auth, admin, updateListingStatus);
router.put('/admin/listings/:id/feature', auth, admin, toggleFeatureListing);
router.post('/admin/listings/bulk-delete', auth, admin, bulkDeleteListings);
router.delete('/admin/listings/:id', auth, admin, deleteAdminListing);

// Users
router.get('/admin/users', auth, admin, getAdminUsers);
router.get('/admin/users/:userId/detail', auth, admin, getUserDetail);
router.put('/admin/users/:userId/ban', auth, admin, toggleBanUser);
router.put('/admin/users/:userId/verify', auth, admin, toggleVerifyUser);
router.put('/admin/users/:userId/suspend', auth, admin, toggleSuspendUser);
router.delete('/admin/users/:userId', auth, admin, deleteAdminUser);

// Market Prices (Hal Fiyatları)
router.get('/admin/market-prices', auth, admin, getAdminMarketPrices);
router.post('/admin/market-prices', auth, admin, createMarketPrice);
router.put('/admin/market-prices/:id', auth, admin, updateMarketPrice);
router.delete('/admin/market-prices/:id', auth, admin, deleteMarketPrice);

// Notifications
router.post('/admin/notifications/broadcast', auth, admin, broadcastNotification);
router.get('/admin/notifications/history', auth, admin, getNotificationHistory);

// Reports
router.get('/admin/reports', auth, admin, getReports);
router.post('/admin/reports', auth, createReport);
router.put('/admin/reports/:id/resolve', auth, admin, resolveReport);
router.delete('/admin/reports/:id', auth, admin, deleteReport);

// Moderation
router.get('/admin/profanity-logs', auth, admin, getProfanityLogs);

// Ratings
router.get('/admin/ratings', auth, admin, getAdminRatings);
router.delete('/admin/ratings/:id', auth, admin, adminHardDeleteRating);

export default router;
