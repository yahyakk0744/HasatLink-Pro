import { Router } from 'express';
import { getOgImage, getStoryImage } from '../services/ogImageService';

const router = Router();

router.get('/og/:id', getOgImage);
router.get('/story/:id', getStoryImage);

export default router;
