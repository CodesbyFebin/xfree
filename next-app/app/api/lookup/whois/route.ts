import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const QuerySchema = z.object({
  domain: z.string().trim().min(3).max(253).regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'Enter a valid domain (e.g. example.com)'),
});

// RDAP (RFC 7482/9083) via rdap.org's public bootstrap - the modern,
// standardized, free replacement for the legacy WHOIS protocol, which
// has no single universal HTTP API. Verified working via a direct curl
// before wiring this in (https://rdap.org/domain/xfree.in).
export async function GET(req: NextRequest) {
  const parsed = QuerySchema.safeParse({ domain: req.nextUrl.searchParams.get('domain') });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid domain' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(parsed.data.domain)}`, {
      signal: AbortSignal.timeout(8000),
      // rdap.org's edge returns 403 for requests without a browser-like
      // User-Agent (confirmed via direct testing - Node's default fetch
      // UA gets blocked, curl's default UA does not).
      headers: {
        accept: 'application/rdap+json',
        'user-agent': 'Mozilla/5.0 (compatible; XFreeBot/1.0; +https://www.xfree.in)',
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `No registration data found (${res.status})` }, { status: res.status === 404 ? 404 : 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'WHOIS/RDAP lookup service unavailable' }, { status: 502 });
  }
}
