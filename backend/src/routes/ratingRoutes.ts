import { Router } from 'express';
import { getUserRatings, createRating } from '../controllers/ratingController';
import auth from '../middleware/auth';

const router = Router();

router.get('/ratings/user/:userId', getUserRatings);
router.post('/ratings', auth, createRating);

export default router;
