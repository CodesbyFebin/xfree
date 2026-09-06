import { NextResponse } from 'next/server';
import { generateAiTxt } from '@/lib/static';

export async function GET() {
  const content = generateAiTxt();
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
