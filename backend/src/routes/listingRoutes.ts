import { Router } from 'express';
import { getListings, getListing, createListing, updateListing, deleteListing, waClick, shareListing } from '../controllers/listingController';
import auth from '../middleware/auth';

const router = Router();

router.get('/listings', getListings);
router.get('/listings/:id', getListing);
router.post('/listings', auth, createListing);
router.put('/listings/:id', auth, updateListing);
router.delete('/listings/:id', auth, deleteListing);
router.post('/listings/:id/wa-click', waClick);
router.post('/listings/:id/share', shareListing);

export default router;
