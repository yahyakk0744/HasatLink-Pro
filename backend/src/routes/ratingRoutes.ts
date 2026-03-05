import { Router } from 'express';
import { getUserRatings, createRating, deleteRatingComment, updateRating, addSellerReply, deleteSellerReply } from '../controllers/ratingController';
import auth from '../middleware/auth';

const router = Router();

router.get('/ratings/user/:userId', getUserRatings);
router.post('/ratings', auth, createRating);
router.put('/ratings/:id', auth, updateRating);
router.delete('/ratings/:id/comment', auth, deleteRatingComment);
router.post('/ratings/:id/reply', auth, addSellerReply);
router.delete('/ratings/:id/reply', auth, deleteSellerReply);

export default router;
