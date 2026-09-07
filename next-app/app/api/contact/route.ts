import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

// Mirrors src/server/app.ts's POST /api/contact + src/server/delivery.ts
// in the Vite app: same validation, same honeypot, same rate limit, same
// Resend-or-log delivery contract, so the frontend's existing fetch('/api/contact')
// in app/contact/page.tsx (which expected this route to already exist) works.

const ContactSchema = z.object({
  email: z.string().email().max(200).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(4_000),
  website: z.string().max(0).optional(),
});

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();
const RATE_LIMIT = 5;
const WINDOW_MS = 3_600_000;

function rateLimitKey(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const hashed = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
  return `contact:${hashed}`;
}

function checkRateLimit(key: string): { allowed: boolean; resetAt: number } {
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, resetAt: now + WINDOW_MS };
  }
  bucket.count += 1;
  return { allowed: bucket.count <= RATE_LIMIT, resetAt: bucket.resetAt };
}

async function deliverContactMessage(subject: string, text: string, meta: Record<string, unknown>): Promise<{ ok: boolean; provider: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || 'contact@xfree.in';
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'noreply@xfree.in';

  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: `[xfree.in contact] ${subject}`,
          text: `${text}\n\n---\n${JSON.stringify(meta, null, 2)}`,
        }),
      });
      if (!res.ok) return { ok: false, provider: 'resend' };
      return { ok: true, provider: 'resend' };
    } catch {
      return { ok: false, provider: 'resend' };
    }
  }

  console.log(`[contact] ${subject}\n${text}`, meta);
  return { ok: true, provider: 'log' };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const key = rateLimitKey(request);
  const { allowed, resetAt } = checkRateLimit(key);
  if (!allowed) {
    const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'rate_limited', message: `Rate limit exceeded. Retry after ${retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', details: parsed.error.flatten() }, { status: 400 });
  }

  // Honeypot: bots that fill the hidden "website" field get a fake success.
  if (parsed.data.website) {
    return NextResponse.json({ success: true });
  }

  const result = await deliverContactMessage(
    'New contact form submission',
    `From: ${parsed.data.email || 'anonymous'}\n\n${parsed.data.message}`,
    { ip: request.headers.get('x-forwarded-for') || 'unknown' }
  );

  if (!result.ok) {
    return NextResponse.json({ error: 'delivery_failed' }, { status: 502 });
  }

  return NextResponse.json({ success: true, provider: result.provider });
}
