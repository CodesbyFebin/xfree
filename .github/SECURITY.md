# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `main`  | ✅ Yes    |
| older   | ❌ No     |

We ship continuously from `main`. Security fixes land there first.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately:

- **Email:** security@xfree.in
- **GitHub:** use the repository's private vulnerability reporting
  (Security → Report a vulnerability) if enabled.

We aim to acknowledge reports within **72 hours** and provide a remediation
timeline within **7 days**.

## What we protect

- **Local tools** process input entirely in your browser. Pasted data is never
  uploaded for these tools. (See the Privacy page.)
- **AI tools** proxy to Google Gemini server-side. The API key never reaches the
  browser. Input you submit to AI tools is sent to Google and is **not** private;
  do not submit confidential data.
- **Contact / feedback / lead** submissions are validated with Zod, protected by
  honeypot fields and per-IP rate limits, and delivered via Resend when
  configured.

## Current hardening (evidence)

- Content-Security-Policy tuned for Google AdSense + Funding Choices
  ([`src/middleware/security-headers.ts`](../src/middleware/security-headers.ts),
  [`vercel.json`](../vercel.json)).
- HSTS, X-Frame-Options: DENY, Referrer-Policy, Permissions-Policy, COOP, CORP
  on every response.
- Zod validation on every request body; AI task allowlist replaces client
  system prompts; `503` (not `500`) when the AI key is absent.
- Central error handler with request IDs; no stack traces in production
  responses.

## Out of scope / known limitations

- The in-memory rate limiter is suitable for low/medium traffic. Swap the store
  in [`src/server/rate-limit.ts`](../src/server/rate-limit.ts) for Redis before
  scaling.
- The site loads Google AdSense, which sets advertising cookies. This is
  disclosed on the Privacy page; a certified CMP for EEA/UK is planned.
