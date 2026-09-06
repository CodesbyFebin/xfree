import { NextResponse } from 'next/server';
import { generateLlmsTxt } from '@/lib/static';

export async function GET() {
  const content = generateLlmsTxt();
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
