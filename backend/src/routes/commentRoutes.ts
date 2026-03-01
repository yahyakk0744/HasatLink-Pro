import { Router } from 'express';
import { getListingComments, createComment, deleteComment } from '../controllers/commentController';
import auth from '../middleware/auth';

const router = Router();

router.get('/comments/listing/:listingId', getListingComments);
router.post('/comments', auth, createComment);
router.delete('/comments/:id', auth, deleteComment);

export default router;
