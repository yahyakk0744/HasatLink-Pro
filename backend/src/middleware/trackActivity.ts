import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Cache to avoid updating on every single request (update at most every 5 minutes per user)
const lastUpdate = new Map<string, number>();
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

const trackActivity = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token || !process.env.JWT_SECRET) { next(); return; }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const now = Date.now();
    const last = lastUpdate.get(userId) || 0;
    if (now - last > UPDATE_INTERVAL) {
      lastUpdate.set(userId, now);
      User.updateOne({ userId }, { lastActiveAt: new Date() }).exec().catch(() => {});
    }
  } catch {
    // Non-critical — don't block the request
  }
  next();
};

export default trackActivity;
