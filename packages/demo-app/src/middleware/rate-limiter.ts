import type { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

function createLimiter(maxRequests: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();

  // Clean up expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(ip);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(ip, bucket);
    }

    bucket.count++;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - bucket.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > maxRequests) {
      res.status(429).json({ error: 'Too many requests', code: 'RATE_LIMITED' });
      return;
    }
    next();
  };
}

export const readLimiter = createLimiter(60, 60 * 1000);
export const writeLimiter = createLimiter(5, 60 * 1000);
