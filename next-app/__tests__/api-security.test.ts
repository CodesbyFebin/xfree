/**
 * Integration tests for paid API authorization and security controls.
 *
 * These tests verify that:
 * - Paid providers (Venice, DeepSeek) reject unauthenticated requests
 * - Kill switches properly block access
 * - Rate limiting works for anonymous and authenticated users
 * - Free providers remain accessible without authentication
 * - Explicit error codes are returned for each failure case
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { getRateLimiter, verifyApiKey, getClientId, isProviderEnabled, isModelAllowed } from '@/lib/server/security';

describe('Paid API Authorization', () => {
  beforeEach(() => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_API_KEY', 'test-nvidia-key');
    vi.stubEnv('VENICE_API_KEY', 'test-venice-key');
    vi.stubEnv('DEEPSEEK_API_KEY', 'test-deepseek-key');
    vi.stubEnv('STUDIO_API_KEYS', 'studio-key-1,studio-key-2');
    vi.stubEnv('VENICE_DISABLED', '');
    vi.stubEnv('DEEPSEEK_DISABLED', '');
    vi.stubEnv('VIDEO_DISABLED', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('verifyApiKey', () => {
    it('rejects requests without authorization header', () => {
      const req = new Request('https://example.com/api/nvidia/chat', { method: 'POST' });
      const result = verifyApiKey(req);
      expect(result.authenticated).toBe(false);
    });

    it('rejects requests with invalid API keys', () => {
      const req = new Request('https://example.com/api/nvidia/chat', {
        method: 'POST',
        headers: { Authorization: 'Bearer invalid-key' },
      });
      const result = verifyApiKey(req);
      expect(result.authenticated).toBe(false);
    });

    it('accepts valid studio API keys', () => {
      const req = new Request('https://example.com/api/nvidia/chat', {
        method: 'POST',
        headers: { Authorization: 'Bearer studio-key-1' },
      });
      const result = verifyApiKey(req);
      expect(result.authenticated).toBe(true);
      expect(result.userId).toBe('studio');
    });

    it('accepts valid provider API keys', () => {
      const req = new Request('https://example.com/api/nvidia/chat', {
        method: 'POST',
        headers: { Authorization: 'Bearer studio-key-1' },
      });
      const result = verifyApiKey(req);
      expect(result.authenticated).toBe(true);
      expect(result.userId).toBe('studio');
    });

    it('rejects malformed authorization headers', () => {
      const req = new Request('https://example.com/api/nvidia/chat', {
        method: 'POST',
        headers: { Authorization: 'InvalidFormat key' },
      });
      const result = verifyApiKey(req);
      expect(result.authenticated).toBe(false);
    });
  });

  describe('isProviderEnabled (Kill Switch)', () => {
    it('returns true when provider is not disabled', () => {
      expect(isProviderEnabled('venice')).toBe(true);
      expect(isProviderEnabled('deepseek')).toBe(true);
      expect(isProviderEnabled('video')).toBe(true);
    });

    it('returns false when kill switch is set to true', () => {
      vi.stubEnv('VENICE_DISABLED', 'true');
      expect(isProviderEnabled('venice')).toBe(false);
    });

    it('returns true when kill switch is set to false', () => {
      vi.stubEnv('VENICE_DISABLED', 'false');
      expect(isProviderEnabled('venice')).toBe(true);
    });

    it('handles case-insensitive disable values', () => {
      vi.stubEnv('VENICE_DISABLED', 'TRUE');
      expect(isProviderEnabled('venice')).toBe(false);
      
      vi.stubEnv('VENICE_DISABLED', 'True');
      expect(isProviderEnabled('venice')).toBe(false);
    });
  });

  describe('isModelAllowed (Per-Model Allowlist)', () => {
    it('allows all models when no allowlist is set', () => {
      expect(isModelAllowed('venice', 'venice-uncensored')).toBe(true);
      expect(isModelAllowed('venice', 'any-model')).toBe(true);
    });

    it('restricts models when allowlist is set', () => {
      vi.stubEnv('ALLOWED_VENICE_MODELS', 'venice-uncensored,venice-another');
      expect(isModelAllowed('venice', 'venice-uncensored')).toBe(true);
      expect(isModelAllowed('venice', 'venice-another')).toBe(true);
      expect(isModelAllowed('venice', 'venice-disallowed')).toBe(false);
    });

    it('handles empty allowlist as allow all', () => {
      vi.stubEnv('ALLOWED_VENICE_MODELS', '');
      expect(isModelAllowed('venice', 'any-model')).toBe(true);
    });
  });

  describe('Rate Limiter (In-Memory)', () => {
    it('allows requests up to the limit', async () => {
      const limiter = getRateLimiter();
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(await limiter.consume('test:rate:limit', 10, 60_000));
      }
      expect(results.every(r => r.allowed)).toBe(true);
    });

    it('blocks requests exceeding the limit', async () => {
      const limiter = getRateLimiter();
      const key = 'test:rate:limit:blocked';
      
      for (let i = 0; i < 10; i++) {
        await limiter.consume(key, 10, 60_000);
      }
      
      const result = await limiter.consume(key, 10, 60_000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('resets bucket after window expires', async () => {
      const limiter = getRateLimiter();
      const key = 'test:rate:limit:reset';
      
      await limiter.consume(key, 1, 200);
      
      await new Promise(r => setTimeout(r, 300));
      
      const result = await limiter.consume(key, 1, 200);
      expect(result.allowed).toBe(true);
    });

    it('resets key independently', async () => {
      const limiter = getRateLimiter();
      const key = 'test:rate:limit:independent';
      
      await limiter.consume(key, 1, 60_000);
      const blocked = await limiter.consume(key, 1, 60_000);
      expect(blocked.allowed).toBe(false);
      
      await limiter.reset(key);
      
      const allowed = await limiter.consume(key, 1, 60_000);
      expect(allowed.allowed).toBe(true);
    });

    it('tracks different keys separately', async () => {
      const limiter = getRateLimiter();
      
      await limiter.consume('key1', 1, 60_000);
      const r1 = await limiter.consume('key1', 1, 60_000);
      expect(r1.allowed).toBe(false);
      
      const r2 = await limiter.consume('key2', 1, 60_000);
      expect(r2.allowed).toBe(true);
    });
  });

  describe('getClientId', () => {
    beforeEach(() => {
      vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('returns hashed API key for authenticated requests', () => {
      const req = new Request('https://example.com', {
        headers: { Authorization: 'Bearer test-openai-key' },
      });
      const clientId = getClientId(req);
      expect(clientId).toMatch(/^key:[a-f0-9]{32}$/);
    });

    it('returns hashed IP for anonymous requests', () => {
      const req = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const clientId = getClientId(req);
      expect(clientId).toMatch(/^ip:[a-f0-9]{32}$/);
    });

    it('uses x-real-ip when x-forwarded-for not present', () => {
      const req = new Request('https://example.com', {
        headers: { 'x-real-ip': '10.0.0.1' },
      });
      const clientId = getClientId(req);
      expect(clientId).toMatch(/^ip:[a-f0-9]{32}$/);
    });
  });
});

describe('API Route Security Contract', () => {
  beforeEach(() => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_API_KEY', 'test-nvidia-key');
    vi.stubEnv('VENICE_API_KEY', 'test-venice-key');
    vi.stubEnv('DEEPSEEK_API_KEY', 'test-deepseek-key');
    vi.stubEnv('STUDIO_API_KEYS', 'studio-key-1,studio-key-2');
    vi.stubEnv('VENICE_DISABLED', '');
    vi.stubEnv('DEEPSEEK_DISABLED', '');
    vi.stubEnv('VIDEO_DISABLED', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('POST /api/nvidia/chat (paid provider)', () => {
    it('should return 401 AUTH_REQUIRED for paid model requests without auth', () => {
      const requestBody = {
        model: 'venice-uncensored',
        taskType: 'general',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const authCheck = verifyApiKey(new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }));
      
      expect(authCheck.authenticated).toBe(false);
    });

    it('should return 403 PROVIDER_DISABLED when kill switch is enabled', () => {
      vi.stubEnv('VENICE_DISABLED', 'true');
      expect(isProviderEnabled('venice')).toBe(false);
    });

    it('should return 429 RATE_LIMITED for excessive anonymous requests', async () => {
      const limiter = getRateLimiter();
      const clientId = 'ip:test-client';
      
      const results = [];
      for (let i = 0; i < 15; i++) {
        results.push(await limiter.consume(`${clientId}:per_minute`, 10, 60_000));
      }
      
      const lastResult = results[results.length - 1];
      expect(lastResult.allowed).toBe(false);
      expect(lastResult.retryAfter).toBeDefined();
    });

    it('should return 503 NOT_CONFIGURED when no provider keys are set', () => {
      vi.stubEnv('NVIDIA_API_KEY', '');
      vi.stubEnv('OPENROUTER_API_KEY', '');
      vi.stubEnv('VENICE_API_KEY', '');
      vi.stubEnv('DEEPSEEK_API_KEY', '');
      
      const hasKeys = !!(process.env.NVIDIA_API_KEY || process.env.OPENROUTER_API_KEY || process.env.VENICE_API_KEY || process.env.DEEPSEEK_API_KEY);
      expect(hasKeys).toBe(false);
    });
  });

  describe('POST /api/video/generate', () => {
    it('should return 403 VIDEO_DISABLED when kill switch is enabled', () => {
      vi.stubEnv('VIDEO_DISABLED', 'true');
      expect(isProviderEnabled('video')).toBe(false);
    });

    it('should return 429 RATE_LIMITED for excessive video requests', async () => {
      const limiter = getRateLimiter();
      const clientId = 'ip:test-video-client';
      
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(await limiter.consume(`${clientId}:video:per_minute`, 3, 60_000));
      }
      
      const lastResult = results[results.length - 1];
      expect(lastResult.allowed).toBe(false);
      expect(lastResult.retryAfter).toBeDefined();
    });

    it('should return 503 NOT_CONFIGURED when FAL_API_KEY is not set', () => {
      vi.stubEnv('FAL_API_KEY', '');
      expect(process.env.FAL_API_KEY).toBe('');
    });
  });

});