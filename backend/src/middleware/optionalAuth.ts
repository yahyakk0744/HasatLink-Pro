import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from './auth';

const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
    }
  } catch {
    // Token invalid or expired — continue without auth
  }
  next();
};

export default optionalAuth;
