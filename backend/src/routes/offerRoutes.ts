import { Router } from 'express';
import auth from '../middleware/auth';
import { createOffer, getOffersForListing, getMyOffers, updateOfferStatus } from '../controllers/offerController';

const router = Router();

router.post('/offers', auth, createOffer);
router.get('/offers/listing/:listingId', auth, getOffersForListing);
router.get('/offers/my', auth, getMyOffers);
router.put('/offers/:id/status', auth, updateOfferStatus);

export default router;
