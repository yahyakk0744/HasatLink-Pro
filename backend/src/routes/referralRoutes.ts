import { Router } from 'express';
import auth from '../middleware/auth';
import {
  getMyCode,
  getMyReferrals,
  trackReferral,
} from '../controllers/referralController';

const router = Router();

router.get('/referrals/my-code', auth, getMyCode);
router.get('/referrals/my', auth, getMyReferrals);
router.post('/referrals/track', auth, trackReferral);

export default router;
