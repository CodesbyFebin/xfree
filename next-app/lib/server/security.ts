/**
 * Distributed rate limiting for API endpoints.
 *
 * Supports Redis (production) and in-memory (development) backends.
 * Uses an atomic sliding window algorithm (sorted-set Lua script) for accurate rate limiting.
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
  close(): Promise<void>;
}

const SLIDING_WINDOW_LUA_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requestId = ARGV[4]

local windowStart = now - windowMs

redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

local count = redis.call('ZCARD', key)

if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local resetAt = 0
  if #oldest > 0 then
    resetAt = tonumber(oldest[2]) + windowMs
  else
    resetAt = now + windowMs
  end
  local retryAfter = math.ceil((resetAt - now) / 1000)
  return {0, count, resetAt, retryAfter}
end

redis.call('ZADD', key, now, requestId)
redis.call('PEXPIRE', key, windowMs)

local newCount = count + 1
local resetAt = now + windowMs
return {1, newCount, resetAt, 0}
`;

class InMemoryRateLimiter implements RateLimiter {
  private store = new Map<string, { entries: Array<{ timestamp: number; id: string }>; resetAt: number }>();
  private readonly maxKeys = 10000;
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
    this.cleanupInterval.unref();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.store.entries()) {
      if (bucket.resetAt <= now) {
        this.store.delete(key);
      }
    }
    if (this.store.size > this.maxKeys) {
      const entries = Array.from(this.store.entries());
      entries.sort((a, b) => a[1].resetAt - b[1].resetAt);
      const toDelete = entries.slice(0, entries.length - this.maxKeys);
      for (const [key] of toDelete) {
        this.store.delete(key);
      }
    }
  }

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const resetAt = now + windowMs;
    const requestId = `${now}-${Math.random().toString(36).slice(2)}`;

    let bucket = this.store.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { entries: [{ timestamp: now, id: requestId }], resetAt };
      this.store.set(key, bucket);
      return { allowed: true, remaining: limit - 1, resetAt };
    }

    bucket.entries = bucket.entries.filter((e) => e.timestamp > windowStart);

    if (bucket.entries.length >= limit) {
      const oldest = bucket.entries[0];
      const retryAfter = Math.ceil((oldest.timestamp + windowMs - now) / 1000);
      return { allowed: false, remaining: 0, resetAt: bucket.resetAt, retryAfter };
    }

    bucket.entries.push({ timestamp: now, id: requestId });
    bucket.resetAt = resetAt;
    return { allowed: true, remaining: limit - bucket.entries.length, resetAt };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async close(): Promise<void> {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

class RedisRateLimiter implements RateLimiter {
  private client: RedisClientType | null = null;
  private connected = false;
  private connecting = false;
  private connectionError: Error | null = null;
  private scriptSha: string | null = null;

  constructor(private readonly redisUrl: string) {}

  private async ensureClient(): Promise<RedisClientType> {
    if (this.client && this.connected) {
      return this.client;
    }

    if (this.connecting) {
      await this.waitForConnection();
      if (this.client && this.connected) {
        return this.client;
      }
    }

    return this.connect();
  }

  private async waitForConnection(): Promise<void> {
    let attempts = 0;
    while (this.connecting && attempts < 50) {
      await new Promise((r) => setTimeout(r, 20));
      attempts++;
    }
  }

  private async connect(): Promise<RedisClientType> {
    if (this.client && this.connected) {
      return this.client;
    }

    this.connecting = true;
    this.connectionError = null;

    try {
      this.client = createClient({ url: this.redisUrl });
      this.client.on('error', (err) => {
        console.error('[RateLimiter] Redis client error:', err);
        this.connected = false;
        this.connectionError = err;
      });
      this.client.on('end', () => {
        this.connected = false;
      });

      await this.client.connect();
      this.scriptSha = await this.client.scriptLoad(SLIDING_WINDOW_LUA_SCRIPT);
      this.connected = true;
      return this.client;
    } catch (error) {
      this.connected = false;
      this.connectionError = error instanceof Error ? error : new Error(String(error));
      await this.destroyClient();
      throw this.connectionError;
    } finally {
      this.connecting = false;
    }
  }

  private async destroyClient(): Promise<void> {
    if (this.client) {
      try {
        await this.client.destroy();
      } catch {
      }
      this.client = null;
      this.scriptSha = null;
    }
  }

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    if (limit <= 0 || windowMs <= 0) {
      throw new Error('Invalid rate limit parameters: limit and windowMs must be positive');
    }

    const fullKey = `rate_limit:${key}`;
    const now = Date.now();
    const requestId = `${now}-${crypto.randomBytes(8).toString('hex')}`;

    try {
      const client = await this.ensureClient();

      const result = await client.evalSha(this.scriptSha!, {
        keys: [fullKey],
        arguments: [limit.toString(), windowMs.toString(), now.toString(), requestId],
      }) as [number, number, number, number];

      const [allowed, count, resetAt, retryAfter] = result;

      if (allowed === 0) {
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter,
        };
      }

      return {
        allowed: true,
        remaining: limit - count,
        resetAt,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('NOSCRIPT')) {
        this.scriptSha = null;
        return this.consume(key, limit, windowMs);
      }
      console.error('[RateLimiter] Redis error during consume:', error);
      this.connected = false;
      await this.destroyClient();
      throw new Error('Rate limiter unavailable');
    }
  }

  async reset(key: string): Promise<void> {
    try {
      const client = await this.ensureClient();
      await client.del(`rate_limit:${key}`);
    } catch (error) {
      console.error('[RateLimiter] Redis error during reset:', error);
    }
  }

  async close(): Promise<void> {
    this.connected = false;
    await this.destroyClient();
  }
}

export function createRateLimiter(): RateLimiter {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return new RedisRateLimiter(redisUrl);
  }
  return new InMemoryRateLimiter();
}

let limiter: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!limiter) {
    limiter = createRateLimiter();
  }
  return limiter;
}

export async function closeRateLimiter(): Promise<void> {
  if (limiter) {
    await limiter.close();
    limiter = null;
  }
}

/**
 * Authentication utilities for API endpoints.
 */

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  keyType?: 'studio' | 'provider';
}

function parseStudioKeys(): string[] {
  const raw = process.env.STUDIO_API_KEYS || '';
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export function verifyApiKey(req: Request): AuthResult {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return { authenticated: false };
  }

  const studioKeys = parseStudioKeys();
  if (studioKeys.length > 0 && studioKeys.includes(token)) {
    return { authenticated: true, userId: 'studio', keyType: 'studio' };
  }

  return { authenticated: false };
}

const TRUSTED_PROXY_HEADER = 'x-client-id';

export function getClientId(req: Request, options?: { trustProxy?: boolean }): string {
  const auth = verifyApiKey(req);
  if (auth.authenticated) {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    return 'key:' + crypto.createHash('sha256').update(token).digest('hex').slice(0, 32);
  }

  const trustProxy = options?.trustProxy ?? (process.env.TRUST_PROXY === 'true');

  let ip = 'unknown';
  if (trustProxy) {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      ip = forwarded.split(',')[0]?.trim() || 'unknown';
    } else {
      ip = req.headers.get('x-real-ip') || 'unknown';
    }
  } else {
    const customId = req.headers.get(TRUSTED_PROXY_HEADER);
    if (customId) {
      ip = customId;
    }
  }

  return 'ip:' + crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

export function isModelAllowed(provider: string, model: string): boolean {
  const allowlistKey = `ALLOWED_${provider.toUpperCase().replace('-', '_')}_MODELS`;
  const allowlist = (process.env[allowlistKey] || '')
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m.length > 0);

  if (allowlist.length === 0) {
    return true;
  }

  return allowlist.includes(model);
}

export function isProviderEnabled(provider: string): boolean {
  const killSwitchKey = `${provider.toUpperCase().replace('-', '_')}_DISABLED`;
  return process.env[killSwitchKey]?.toLowerCase() !== 'true';
}

export interface AuditLogEntry {
  timestamp: number;
  clientId: string;
  endpoint: string;
  provider?: string;
  model?: string;
  tokens?: number;
  status: 'success' | 'error' | 'rate_limited' | 'unauthorized' | 'forbidden' | 'timeout' | 'invalid_request';
  error?: string;
}

const SENSITIVE_FIELDS = new Set(['prompt', 'messages', 'apiKey', 'authorization', 'token', 'key', 'secret']);

function sanitizeForAudit(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForAudit);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(k.toLowerCase())) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = sanitizeForAudit(v);
    }
  }
  return out;
}

export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  const logEntry = {
    ...entry,
    ts: new Date(entry.timestamp).toISOString(),
    sanitized: sanitizeForAudit({
      provider: entry.provider,
      model: entry.model,
      tokens: entry.tokens,
      status: entry.status,
      error: entry.error,
    }),
  };
  console.log('[audit]', JSON.stringify(logEntry));
}

export interface IdempotencyRecord {
  status: 'pending' | 'completed' | 'failed';
  result?: unknown;
  error?: unknown;
  bodyHash: string;
  createdAt: number;
  completedAt?: number;
}

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_IDEMPOTENCY_KEYS = 50000;

class InMemoryIdempotencyStore {
  private store = new Map<string, IdempotencyRecord>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    this.cleanupInterval.unref();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now - record.createdAt > IDEMPOTENCY_TTL_MS) {
        this.store.delete(key);
      }
    }
    if (this.store.size > MAX_IDEMPOTENCY_KEYS) {
      const entries = Array.from(this.store.entries());
      entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
      const toDelete = entries.slice(0, entries.length - MAX_IDEMPOTENCY_KEYS);
      for (const [key] of toDelete) {
        this.store.delete(key);
      }
    }
  }

  async acquire(key: string, bodyHash: string): Promise<{ acquired: boolean; existing?: IdempotencyRecord }> {
    const existing = this.store.get(key);
    if (existing) {
      if (existing.bodyHash !== bodyHash) {
        return { acquired: false, existing: { ...existing, error: 'BODY_MISMATCH' } };
      }
      return { acquired: false, existing };
    }
    this.store.set(key, { status: 'pending', bodyHash, createdAt: Date.now() });
    return { acquired: true };
  }

  async complete(key: string, result: unknown): Promise<void> {
    const record = this.store.get(key);
    if (record && record.status === 'pending') {
      record.status = 'completed';
      record.result = result;
      record.completedAt = Date.now();
    }
  }

  async fail(key: string, error: unknown): Promise<void> {
    const record = this.store.get(key);
    if (record && record.status === 'pending') {
      record.status = 'failed';
      record.error = error;
      record.completedAt = Date.now();
    }
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    return this.store.get(key) || null;
  }

  async close(): Promise<void> {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

class RedisIdempotencyStore {
  private client: RedisClientType | null = null;
  private connected = false;
  private connecting = false;

  constructor(private readonly redisUrl: string) {}

  private async ensureClient(): Promise<RedisClientType> {
    if (this.client && this.connected) {
      return this.client;
    }
    if (this.connecting) {
      while (this.connecting) {
        await new Promise((r) => setTimeout(r, 20));
      }
      if (this.client && this.connected) {
        return this.client;
      }
    }
    return this.connect();
  }

  private async connect(): Promise<RedisClientType> {
    this.connecting = true;
    try {
      this.client = createClient({ url: this.redisUrl });
      this.client.on('error', (err) => {
        console.error('[Idempotency] Redis client error:', err);
        this.connected = false;
      });
      this.client.on('end', () => {
        this.connected = false;
      });
      await this.client.connect();
      this.connected = true;
      return this.client;
    } catch (error) {
      this.connected = false;
      if (this.client) {
        try {
          await this.client.destroy();
        } catch {
        }
        this.client = null;
      }
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  private keyPrefix(key: string): string {
    return `idempotency:${key}`;
  }

  async acquire(key: string, bodyHash: string): Promise<{ acquired: boolean; existing?: IdempotencyRecord }> {
    try {
      const client = await this.ensureClient();
      const fullKey = this.keyPrefix(key);
      const now = Date.now();
      const ttlSec = Math.ceil(IDEMPOTENCY_TTL_MS / 1000);

      const existing = await client.get(fullKey);
      if (existing) {
        const parsed = JSON.parse(existing) as IdempotencyRecord;
        if (parsed.bodyHash !== bodyHash) {
          return { acquired: false, existing: { ...parsed, error: 'BODY_MISMATCH' } };
        }
        return { acquired: false, existing: parsed };
      }

      const record: IdempotencyRecord = { status: 'pending', bodyHash, createdAt: now };
      await client.setEx(fullKey, ttlSec, JSON.stringify(record));
      return { acquired: true };
    } catch (error) {
      console.error('[Idempotency] Redis error during acquire:', error);
      this.connected = false;
      throw new Error('Idempotency store unavailable');
    }
  }

  async complete(key: string, result: unknown): Promise<void> {
    try {
      const client = await this.ensureClient();
      const fullKey = this.keyPrefix(key);
      const existing = await client.get(fullKey);
      if (existing) {
        const parsed = JSON.parse(existing) as IdempotencyRecord;
        if (parsed.status === 'pending') {
          parsed.status = 'completed';
          parsed.result = result;
          parsed.completedAt = Date.now();
          const ttlSec = Math.ceil(IDEMPOTENCY_TTL_MS / 1000);
          await client.setEx(fullKey, ttlSec, JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('[Idempotency] Redis error during complete:', error);
    }
  }

  async fail(key: string, error: unknown): Promise<void> {
    try {
      const client = await this.ensureClient();
      const fullKey = this.keyPrefix(key);
      const existing = await client.get(fullKey);
      if (existing) {
        const parsed = JSON.parse(existing) as IdempotencyRecord;
        if (parsed.status === 'pending') {
          parsed.status = 'failed';
          parsed.error = error;
          parsed.completedAt = Date.now();
          const ttlSec = Math.ceil(IDEMPOTENCY_TTL_MS / 1000);
          await client.setEx(fullKey, ttlSec, JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('[Idempotency] Redis error during fail:', error);
    }
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    try {
      const client = await this.ensureClient();
      const fullKey = this.keyPrefix(key);
      const existing = await client.get(fullKey);
      if (existing) {
        return JSON.parse(existing) as IdempotencyRecord;
      }
      return null;
    } catch (error) {
      console.error('[Idempotency] Redis error during get:', error);
      return null;
    }
  }

  async close(): Promise<void> {
    this.connected = false;
    if (this.client) {
      try {
        await this.client.destroy();
      } catch {
      }
      this.client = null;
    }
  }
}

let idempotencyStore: InMemoryIdempotencyStore | RedisIdempotencyStore | null = null;

function getIdempotencyStore(): InMemoryIdempotencyStore | RedisIdempotencyStore {
  if (!idempotencyStore) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      idempotencyStore = new RedisIdempotencyStore(redisUrl);
    } else {
      idempotencyStore = new InMemoryIdempotencyStore();
    }
  }
  return idempotencyStore;
}

export async function closeIdempotencyStore(): Promise<void> {
  if (idempotencyStore) {
    await idempotencyStore.close();
    idempotencyStore = null;
  }
}

export function hashBody(body: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 32);
}

export async function acquireIdempotency(key: string, body: unknown): Promise<{ acquired: boolean; existing?: IdempotencyRecord; bodyHash: string }> {
  const bodyHash = hashBody(body);
  const store = getIdempotencyStore();
  const result = await store.acquire(key, bodyHash);
  return { ...result, bodyHash };
}

export async function completeIdempotency(key: string, result: unknown): Promise<void> {
  const store = getIdempotencyStore();
  await store.complete(key, result);
}

export async function failIdempotency(key: string, error: unknown): Promise<void> {
  const store = getIdempotencyStore();
  await store.fail(key, error);
}

export async function getIdempotency(key: string): Promise<IdempotencyRecord | null> {
  const store = getIdempotencyStore();
  return store.get(key);
}

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowMs: number;
}

export async function consumeRateLimits(limiter: RateLimiter, configs: RateLimitConfig[]): Promise<{ success: boolean; results: RateLimitResult[]; firstFailure?: RateLimitResult }> {
  const results: RateLimitResult[] = [];
  for (const config of configs) {
    const result = await limiter.consume(config.key, config.limit, config.windowMs);
    results.push(result);
    if (!result.allowed) {
      return { success: false, results, firstFailure: result };
    }
  }
  return { success: true, results };
}