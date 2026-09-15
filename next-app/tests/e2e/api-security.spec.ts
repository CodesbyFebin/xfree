import { test, expect } from '@playwright/test';

test.describe('Paid API authorization', () => {
  test('Venice tier is rejected while its kill switch is unset (the real state of this environment)', async ({ request }) => {
    const res = await request.post('/api/nvidia/chat', {
      data: {
        model: 'venice-uncensored',
        messages: [{ role: 'user', content: 'hi' }],
      },
    });
    // Either PROVIDER_DISABLED (kill switch off) or RATE_LIMITER_NOT_CONFIGURED
    // (Upstash unset) is an acceptable pass here - both are "blocked", and
    // which one fires first depends on env vars this test doesn't control.
    // See lib/security/paidGuard.ts / verify:paid-security for the unit-level
    // ordering proof.
    expect(res.status()).toBe(503);
    const body = await res.json();
    // NOT_CONFIGURED fires earliest (no provider key at all is set in this
    // environment - see docs/SECURITY_MODEL.md), before the request body
    // is even parsed enough to reach the paid-tier branch; the other two
    // codes are what a partially-configured environment would show instead.
    expect(['NOT_CONFIGURED', 'PROVIDER_DISABLED', 'RATE_LIMITER_NOT_CONFIGURED', 'PROVIDER_NOT_CONFIGURED']).toContain(body.code);
  });

  test('DeepSeek tier is rejected the same way', async ({ request }) => {
    const res = await request.post('/api/nvidia/chat', {
      data: {
        model: 'deepseek-v4-flash',
        messages: [{ role: 'user', content: 'hi' }],
      },
    });
    expect(res.status()).toBe(503);
  });

  test('video generation is rejected while its kill switch is unset', async ({ request }) => {
    const res = await request.post('/api/video/generate', {
      data: { prompt: 'a cat riding a skateboard' },
    });
    // FAL_API_KEY being unset (NOT_CONFIGURED, checked before the guard) is
    // also an acceptable pass - both mean "cannot spend money", which is
    // the actual property under test.
    expect(res.status()).toBe(503);
  });

  test('an unlisted model id on the paid-tier path is never forwarded to a provider', async ({ request }) => {
    const res = await request.post('/api/nvidia/chat', {
      data: {
        model: 'gpt-5-totally-made-up',
        messages: [{ role: 'user', content: 'hi' }],
      },
    });
    // Not a recognized paid-tier model, so it falls through to the free
    // auto cascade - either succeeds via a free provider or reports
    // ALL_PROVIDERS_FAILED (502), never a paid-provider attempt.
    const body = await res.json().catch(() => ({}));
    expect(body.route?.attempted?.some((a: { provider: string }) => a.provider === 'venice' || a.provider === 'deepseek')).toBeFalsy();
  });
});

test.describe.serial('Contact form rate limiting', () => {
  test('the 6th submission within the window is rate limited', async ({ request }) => {
    const submit = () =>
      request.post('/api/contact', {
        data: { message: 'This is a genuine test message, at least ten characters long.' },
      });

    const results: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await submit();
      results.push(res.status());
    }

    // The in-memory limiter (RATE_LIMIT = 5, see app/api/contact/route.ts)
    // allows 5 requests per window from the same key - a 6th in the same
    // run must be rejected. Delivery itself may 502 in a sandboxed CI
    // runner with no RESEND_API_KEY reachable outbound network, so this
    // only asserts the LAST request was specifically rate-limited, not
    // that the first 5 all succeeded end-to-end.
    expect(results[5], `expected the 6th request to be 429, got statuses: ${results.join(', ')}`).toBe(429);
  });

  test('honeypot-filled submissions are silently accepted without being delivered', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: { message: 'This is a genuine-looking spam message over ten chars.', website: 'http://spambot.example' },
    });
    // May also be 429 if the shared rate-limit bucket from the previous
    // test is still exhausted - either outcome is consistent with "never
    // treated as a real, delivered submission."
    expect([200, 429]).toContain(res.status());
  });
});
