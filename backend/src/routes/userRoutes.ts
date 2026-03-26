import { Router } from 'express';
import { register, login, googleLogin, getMe, getUser, updateUser, getUserStats, updateAccount, toggleFavorite, getFavorites, requestAccountDeletion, cancelAccountDeletion } from '../controllers/userController';
import auth from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimit';

const router = Router();

// Auth routes (brute-force protected)
router.post('/auth/register', authRateLimit, register);
router.post('/auth/login', authRateLimit, login);
router.post('/auth/google', authRateLimit, googleLogin);
router.get('/auth/me', auth, getMe);
router.put('/auth/account', auth, updateAccount);
router.delete('/auth/account', auth, requestAccountDeletion);
router.post('/auth/cancel-deletion', auth, cancelAccountDeletion);

// Favorites routes
router.post('/favorites/toggle', auth, toggleFavorite);
router.get('/favorites', auth, getFavorites);

// User routes
router.get('/users/:userId', getUser);
router.put('/users/:userId', auth, updateUser);
router.get('/users/:userId/stats', getUserStats);

export default router;
