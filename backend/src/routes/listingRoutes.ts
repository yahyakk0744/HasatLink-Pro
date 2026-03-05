import { Router } from 'express';
import { getListings, getListing, createListing, updateListing, deleteListing, waClick, shareListing, getPlatformStats, getMarketAnalytics, getListingViewers } from '../controllers/listingController';
import auth from '../middleware/auth';
import optionalAuth from '../middleware/optionalAuth';

const router = Router();

router.get('/stats/platform', getPlatformStats);
router.get('/stats/market-analytics', getMarketAnalytics);
router.get('/listings', getListings);
router.get('/listings/:id', optionalAuth, getListing);
router.post('/listings', auth, createListing);
router.put('/listings/:id', auth, updateListing);
router.delete('/listings/:id', auth, deleteListing);
router.get('/listings/:id/viewers', auth, getListingViewers);
router.post('/listings/:id/wa-click', waClick);
router.post('/listings/:id/share', auth, shareListing);

export default router;
