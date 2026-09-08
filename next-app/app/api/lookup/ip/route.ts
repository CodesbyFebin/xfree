import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const QuerySchema = z.object({
  ip: z.string().trim().max(64).optional(),
});

// ipwho.is - free, HTTPS, no API key required. Verified working via a
// direct curl before wiring this in (https://ipwho.is/8.8.8.8).
export async function GET(req: NextRequest) {
  const { ip } = QuerySchema.parse({ ip: req.nextUrl.searchParams.get('ip') ?? undefined });

  // No ip param = look up the caller's own address, using the header
  // Vercel sets on every request.
  const target = ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';

  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(target)}`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (data.success === false) {
      return NextResponse.json({ error: data.message || 'Lookup failed' }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'IP lookup service unavailable' }, { status: 502 });
  }
}
