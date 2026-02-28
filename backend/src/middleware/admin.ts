import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import User from '../models/User';

const admin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Yetkilendirme gerekli' });
      return;
    }
    const user = await User.findOne({ userId: req.userId });
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: 'Admin yetkisi gerekli' });
      return;
    }
    next();
  } catch {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

export default admin;
