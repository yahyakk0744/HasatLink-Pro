import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Rate-limit tiers
// ---------------------------------------------------------------------------
interface TierConfig {
  maxRequests: number;
  windowMs: number;
}

const TIERS: Record<string, TierConfig> = {
  public:        { maxRequests: 200,  windowMs: 60_000 },
  authenticated: { maxRequests: 500,  windowMs: 60_000 },
  admin:         { maxRequests: 1000, windowMs: 60_000 },
  auth:          { maxRequests: 10,   windowMs: 15 * 60_000 },
};

// ---------------------------------------------------------------------------
// Store interface — in-memory or Redis
// ---------------------------------------------------------------------------
interface RateLimitStore {
  /** Returns { allowed, remaining, resetAt } */
  check(key: string, maxRequests: number, windowMs: number): Promise<{ allowed: boolean; remaining: number; resetAt: number }>;
}

// ---------------------------------------------------------------------------
// In-memory sliding window store
// ---------------------------------------------------------------------------
class MemoryStore implements RateLimitStore {
  private windows = new Map<string, number[]>();

  constructor() {
    // Cleanup every 2 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.windows) {
        const filtered = timestamps.filter((t) => now - t < 15 * 60_000);
        if (filtered.length === 0) this.windows.delete(key);
        else this.windows.set(key, filtered);
      }
    }, 2 * 60_000);
  }

  async check(key: string, maxRequests: number, windowMs: number) {
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = this.windows.get(key) || [];
    timestamps = timestamps.filter((t) => t > windowStart);
    timestamps.push(now);
    this.windows.set(key, timestamps);

    const count = timestamps.length;
    const remaining = Math.max(0, maxRequests - count);
    const resetAt = now + windowMs;

    return { allowed: count <= maxRequests, remaining, resetAt };
  }
}

// ---------------------------------------------------------------------------
// Redis sliding window store (sorted sets)
// ---------------------------------------------------------------------------
class RedisStore implements RateLimitStore {
  private redis: any;

  constructor(redisUrl: string) {
    // Dynamic import so ioredis is only required when REDIS_URL is set
    const Redis = require('ioredis');
    this.redis = new Redis(redisUrl);
    this.redis.on('error', (err: Error) => {
      console.error('[RateLimit] Redis error:', err.message);
    });
  }

  async check(key: string, maxRequests: number, windowMs: number) {
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `rl:${key}`;

    const pipeline = this.redis.pipeline();
    // Remove old entries
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    // Add current request
    pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
    // Count entries in window
    pipeline.zcard(redisKey);
    // Set TTL
    pipeline.pexpire(redisKey, windowMs);

    const results = await pipeline.exec();
    const count: number = results[2][1];
    const remaining = Math.max(0, maxRequests - count);
    const resetAt = now + windowMs;

    return { allowed: count <= maxRequests, remaining, resetAt };
  }
}

// ---------------------------------------------------------------------------
// Initialize store
// ---------------------------------------------------------------------------
let store: RateLimitStore;
if (process.env.REDIS_URL) {
  console.log('[RateLimit] Using Redis store');
  store = new RedisStore(process.env.REDIS_URL);
} else {
  console.log('[RateLimit] Using in-memory store');
  store = new MemoryStore();
}

// ---------------------------------------------------------------------------
// Helper: determine tier from request
// ---------------------------------------------------------------------------
function getTier(req: Request): TierConfig {
  const user = (req as any).user;
  if (user?.role === 'admin') return TIERS.admin;
  if (user) return TIERS.authenticated;
  if (req.headers.authorization) return TIERS.authenticated;
  return TIERS.public;
}

function getKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function setHeaders(res: Response, limit: number, remaining: number, resetAt: number): void {
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));
}

// ---------------------------------------------------------------------------
// Middleware exports
// ---------------------------------------------------------------------------

/** General API rate limiter — tier-aware (public / authenticated / admin) */
export const rateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tier = getTier(req);
    const key = getKey(req);
    const { allowed, remaining, resetAt } = await store.check(key, tier.maxRequests, tier.windowMs);

    setHeaders(res, tier.maxRequests, remaining, resetAt);

    if (!allowed) {
      res.status(429).json({ message: 'Çok fazla istek, lütfen 1 dakika bekleyin' });
      return;
    }
    next();
  } catch (err) {
    // If rate-limit check fails (e.g. Redis down), allow the request
    console.error('[RateLimit] Check failed, allowing request:', err);
    next();
  }
};

/** Auth endpoints: 10 requests per 15 minutes (brute-force protection) */
export const authRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tier = TIERS.auth;
    const key = `auth:${getKey(req)}`;
    const { allowed, remaining, resetAt } = await store.check(key, tier.maxRequests, tier.windowMs);

    setHeaders(res, tier.maxRequests, remaining, resetAt);

    if (!allowed) {
      res.status(429).json({ message: 'Çok fazla giriş denemesi, lütfen 15 dakika bekleyin' });
      return;
    }
    next();
  } catch (err) {
    console.error('[RateLimit] Auth check failed, allowing request:', err);
    next();
  }
};
