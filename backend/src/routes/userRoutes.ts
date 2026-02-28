import { Router } from 'express';
import { register, login, googleLogin, getMe, getUser, updateUser, getUserStats } from '../controllers/userController';
import auth from '../middleware/auth';

const router = Router();

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleLogin);
router.get('/auth/me', auth, getMe);

// User routes
router.get('/users/:userId', getUser);
router.put('/users/:userId', auth, updateUser);
router.get('/users/:userId/stats', getUserStats);

export default router;
