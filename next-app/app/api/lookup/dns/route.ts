import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'] as const;

const QuerySchema = z.object({
  name: z.string().trim().min(1).max(253),
  type: z.enum(RECORD_TYPES).default('A'),
});

// Cloudflare DNS-over-HTTPS JSON API - a real, public, standardized
// endpoint (RFC 8484-adjacent JSON form). Verified working via a direct
// curl before wiring this in.
export async function GET(req: NextRequest) {
  const parsed = QuerySchema.safeParse({
    name: req.nextUrl.searchParams.get('name'),
    type: req.nextUrl.searchParams.get('type') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid domain or record type' }, { status: 400 });
  }
  const { name, type } = parsed.data;

  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
      { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'DNS lookup service unavailable' }, { status: 502 });
  }
}
