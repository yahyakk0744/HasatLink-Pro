import { Request, Response, NextFunction } from 'express';

interface RateEntry {
  count: number;
  reset: number;
}

const generalMap = new Map<string, RateEntry>();
const authMap = new Map<string, RateEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of generalMap) {
    if (now > entry.reset) generalMap.delete(key);
  }
  for (const [key, entry] of authMap) {
    if (now > entry.reset) authMap.delete(key);
  }
}, 5 * 60_000);

function checkLimit(map: Map<string, RateEntry>, key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || now > entry.reset) {
    map.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

// General API: 100 requests per minute
export const rateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkLimit(generalMap, ip, 100, 60_000)) {
    res.status(429).json({ message: 'Çok fazla istek, lütfen 1 dakika bekleyin' });
    return;
  }
  next();
};

// Auth endpoints: 10 requests per 15 minutes (brute-force protection)
export const authRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkLimit(authMap, ip, 10, 15 * 60_000)) {
    res.status(429).json({ message: 'Çok fazla giriş denemesi, lütfen 15 dakika bekleyin' });
    return;
  }
  next();
};
