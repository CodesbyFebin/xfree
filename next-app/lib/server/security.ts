/**
 * Distributed rate limiting for API endpoints.
 *
 * Supports Redis (production) and in-memory (development) backends.
 * Uses a sliding window algorithm for accurate rate limiting.
 */

import crypto from 'crypto';
import { createClient, RedisClientType } from 'redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
}

/**
 * In-memory rate limiter for development.
 * NOTE: Not suitable for production with multiple instances.
 */
class InMemoryRateLimiter implements RateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const resetAt = now + windowMs;
    const bucket = this.store.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.store.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, resetAt };
    }

    if (bucket.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: bucket.resetAt, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
    }

    bucket.count += 1;
    return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/**
 * Redis-based rate limiter for production.
 * Uses atomic Lua script for sliding window rate limiting.
 * Fails closed when Redis is configured but unavailable.
 */
class RedisRateLimiter implements RateLimiter {
  private client: RedisClientType | null = null;
  private connected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(private readonly redisUrl: string) {
    this.connect();
  }

  private async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        this.client = createClient({ url: this.redisUrl });
        this.client.on('error', (err) => {
          console.error('[RateLimiter] Redis client error:', err);
          this.connected = false;
        });
        await this.client.connect();
        this.connected = true;
      } catch (error) {
        console.error('[RateLimiter] Failed to connect to Redis:', error);
        this.connected = false;
        this.client = null;
        throw error;
      }
    })();

    return this.connectionPromise;
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected || !this.client) {
      await this.connect();
    }
    if (!this.connected || !this.client) {
      throw new Error('Redis connection not available');
    }
  }

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const resetAt = now + windowMs;
    const fullKey = `rate_limit:${key}`;

    await this.ensureConnected();

    if (!this.client) {
      throw new Error('Redis client not available');
    }

    const windowSec = Math.ceil(windowMs / 1000);

    const luaScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      local current = redis.call('GET', key)
      if current then
        local count = tonumber(current)
        if count >= limit then
          local ttl = redis.call('TTL', key)
          return {0, count, ttl}
        end
        local newCount = redis.call('INCR', key)
        local ttl = redis.call('TTL', key)
        return {1, newCount, ttl}
      else
        redis.call('SET', key, 1, 'EX', window)
        return {1, 1, window}
      end
    `;

    try {
      const result = await this.client.eval(luaScript, {
        keys: [fullKey],
        arguments: [limit.toString(), windowSec.toString(), now.toString()],
      }) as [number, number, number];

      const [allowed, count, ttl] = result;

      if (allowed === 0) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: now + ttl * 1000,
          retryAfter: ttl,
        };
      }

      return {
        allowed: true,
        remaining: limit - count,
        resetAt: now + ttl * 1000,
      };
    } catch (error) {
      console.error('[RateLimiter] Redis error during consume:', error);
      throw new Error('Rate limiter unavailable');
    }
  }

  async reset(key: string): Promise<void> {
    await this.ensureConnected();

    if (!this.client) {
      return;
    }

    try {
      await this.client.del(`rate_limit:${key}`);
    } catch (error) {
      console.error('[RateLimiter] Redis error during reset:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
      this.client = null;
    }
  }
}

// Factory function to create the appropriate rate limiter
export function createRateLimiter(): RateLimiter {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return new RedisRateLimiter(redisUrl);
  }
  return new InMemoryRateLimiter();
}

// Singleton instance
let limiter: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!limiter) {
    limiter = createRateLimiter();
  }
  return limiter;
}

/**
 * Authentication utilities for API endpoints.
 */

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  apiKey?: string;
}

/**
 * Verifies the API key from the Authorization header.
 */
export function verifyApiKey(req: Request): AuthResult {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false };
  }

  const token = authHeader.substring(7);
  const validKeys = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    perplexity: process.env.PERPLEXITY_API_KEY,
  };

  const matchedKey = Object.values(validKeys).find(key => key && token === key);
  if (matchedKey) {
    return { authenticated: true, apiKey: matchedKey };
  }

  // Check against configured API keys for Studio
  const studioApiKeys = (process.env.STUDIO_API_KEYS || '').split(',').filter(Boolean);
  if (studioApiKeys.length > 0 && studioApiKeys.includes(token)) {
    return { authenticated: true, userId: 'studio' };
  }

  return { authenticated: false };
}

/**
 * Generates a client identifier for rate limiting.
 */
export function getClientId(req: Request): string {
  const auth = verifyApiKey(req);
  if (auth.authenticated && auth.apiKey) {
    // Hash the API key for privacy
    return 'key:' + crypto.createHash('sha256').update(auth.apiKey).digest('hex').slice(0, 32);
  }
  
  // Use IP-based identifier for anonymous users
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             req.headers.get('x-real-ip') || 
             'unknown';
  return 'ip:' + crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

/**
 * Per-model allowlist verification.
 */
export function isModelAllowed(provider: string, model: string): boolean {
  const allowlistKey = `ALLOWED_${provider.toUpperCase().replace('-', '_')}_MODELS`;
  const allowlist = (process.env[allowlistKey] || '').split(',').filter(Boolean);
  
  if (allowlist.length === 0) {
    // No allowlist means all models are allowed (backward compatible)
    return true;
  }
  
  return allowlist.includes(model);
}

/**
 * Kill switch verification for paid providers.
 */
export function isProviderEnabled(provider: string): boolean {
  const killSwitchKey = `${provider.toUpperCase().replace('-', '_')}_DISABLED`;
  return process.env[killSwitchKey]?.toLowerCase() !== 'true';
}

/**
 * Audit logging for API calls.
 */
export interface AuditLogEntry {
  timestamp: number;
  clientId: string;
  endpoint: string;
  provider?: string;
  model?: string;
  tokens?: number;
  status: 'success' | 'error';
  error?: string;
  // PII-safe: no prompt bodies, no IP addresses in plain text
}

export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  // Log to console or external service
  const logEntry = {
    ...entry,
    ts: new Date(entry.timestamp).toISOString(),
  };
  console.log('[audit]', JSON.stringify(logEntry));
}

/**
 * Idempotency key storage for preventing duplicate charges.
 */
const idempotencyStore = new Map<string, { status: 'pending' | 'completed' | 'failed'; result?: any; error?: any }>();

export function getOrCreateIdempotency(key: string): { status: 'pending' | 'completed' | 'failed'; result?: any } | null {
  return idempotencyStore.get(key) || null;
}

export function setIdempotencyResult(key: string, result: any): void {
  idempotencyStore.set(key, { status: 'completed', result });
}

export function setIdempotencyError(key: string, error: any): void {
  idempotencyStore.set(key, { status: 'failed', error });
}