import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import { uploadAdImage } from '../middleware/upload';
import { Request, Response } from 'express';

const router = Router();

router.post('/upload/ad-image', auth, admin, uploadAdImage, (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: 'Dosya yüklenmedi' });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

export default router;
