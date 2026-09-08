import { NextResponse } from 'next/server';
import { TOOLS } from '@/lib/data/tools';
import { PILLARS } from '@/lib/data/pillars';
import { GUIDES } from '@/lib/data/guides';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    total_live_tools: TOOLS.length,
    total_pillars: PILLARS.length,
    total_guides: GUIDES.length,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    endpoints: {
      sitemap: 'https://www.xfree.in/sitemap.xml',
      llms: 'https://www.xfree.in/llms.txt',
      openapi: 'https://www.xfree.in/api/v1/capabilities/tools',
      github: 'https://github.com/CodesbyFebin/xfree',
    },
  });
}
