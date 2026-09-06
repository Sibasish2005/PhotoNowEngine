import { NextRequest } from 'next/server';

interface RateLimitRecord {
  timestamps: number[];
}

interface RateLimiterOptions {
  windowMs: number;       // Window duration in ms (e.g. 60000 = 1 minute)
  maxRequests: number;    // Maximum requests per window
}

// In-memory sliding window store
const ipStore = new Map<string, RateLimitRecord>();

// Default configuration: 60 requests per minute per IP
const DEFAULT_CONFIG: RateLimiterOptions = {
  windowMs: 60 * 1000,
  maxRequests: 60,
};

// Maximum tracked IPs to prevent memory exhaustion under spoofed flooding
const MAX_TRACKED_IPS = 10_000;

// Periodic garbage collection every 30 seconds or when table exceeds capacity
let lastCleanup = Date.now();
function pruneStaleRecords(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < 30000 && ipStore.size < MAX_TRACKED_IPS) return;
  lastCleanup = now;

  for (const [ip, record] of ipStore.entries()) {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (validTimestamps.length === 0) {
      ipStore.delete(ip);
    } else {
      record.timestamps = validTimestamps;
    }
  }

  // If still above threshold after pruning stale records, evict oldest entries
  if (ipStore.size >= MAX_TRACKED_IPS) {
    let excess = ipStore.size - (MAX_TRACKED_IPS * 0.8);
    for (const key of ipStore.keys()) {
      if (excess <= 0) break;
      ipStore.delete(key);
      excess--;
    }
  }
}

/**
 * Extracts client IP safely from trusted edge proxy headers to prevent spoofing.
 * On Vercel, `x-vercel-forwarded-for` is injected by the edge infrastructure
 * and cannot be forged by external clients.
 */
export function getClientIp(req: NextRequest): string {
  // 1. Vercel infrastructure header (authoritative, tamper-proof)
  const vercelIp = req.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const ip = vercelIp.split(',')[0]?.trim();
    if (ip) return ip;
  }

  // 2. Cloudflare Connecting IP
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  // 3. Real IP header set by reverse proxy
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  // 4. Standard X-Forwarded-For: use rightmost non-proxy IP to resist prepended spoofing
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) {
      // Return last proxy-verified IP in the chain
      return ips[ips.length - 1];
    }
  }

  return '127.0.0.1';
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix epoch ms
  retryAfterSec: number;
  clientIp: string;
  headers: Record<string, string>;
}

/**
 * Checks and updates rate limit quota for the incoming request
 */
export function checkRateLimit(
  req: NextRequest,
  customConfig?: Partial<RateLimiterOptions>
): RateLimitResult {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const clientIp = getClientIp(req);
  const now = Date.now();

  pruneStaleRecords(config.windowMs);

  let record = ipStore.get(clientIp);
  if (!record) {
    record = { timestamps: [] };
    ipStore.set(clientIp, record);
  }

  // Filter timestamps to only those within the active sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < config.windowMs);

  const requestCount = record.timestamps.length;
  const allowed = requestCount < config.maxRequests;

  let resetTime = now + config.windowMs;
  let retryAfterSec = 0;

  if (record.timestamps.length > 0) {
    const oldestTimestamp = record.timestamps[0];
    resetTime = oldestTimestamp + config.windowMs;
    retryAfterSec = Math.max(1, Math.ceil((resetTime - now) / 1000));
  }

  if (allowed) {
    record.timestamps.push(now);
  }

  const remaining = Math.max(0, config.maxRequests - record.timestamps.length);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
  };

  if (!allowed) {
    headers['Retry-After'] = String(retryAfterSec);
  }

  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    resetTime,
    retryAfterSec,
    clientIp,
    headers,
  };
}

/**
 * Helper to inspect current rate limiter state for telemetry/playground
 */
export function getRateLimiterStats(): {
  trackedIpsCount: number;
  defaultLimit: number;
  windowSeconds: number;
} {
  return {
    trackedIpsCount: ipStore.size,
    defaultLimit: DEFAULT_CONFIG.maxRequests,
    windowSeconds: DEFAULT_CONFIG.windowMs / 1000,
  };
}
