import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Video generation - unlike image generation (Pollinations.ai, genuinely
// free and keyless), no free/keyless text-to-video API exists as of this
// writing (verified before building this: Pollinations' own video
// endpoint requires a key, and every other real option - Replicate,
// Stability, Runway, Luma, fal.ai - needs a paid API key). This route is
// real infrastructure using fal.ai's documented queue-based REST API
// (https://queue.fal.run/{model}, Authorization: Key <FAL_API_KEY>), but
// it needs the site owner to add a real FAL_API_KEY before it does
// anything - same honest "not configured" contract as /api/nvidia/chat
// when no key is set, not a fake success path.
const RequestSchema = z.object({
  prompt: z.string().trim().min(1).max(1000),
});

const FAL_MODEL = 'fal-ai/kling-video/v1.6/standard/text-to-video';
const FAL_BASE = 'https://queue.fal.run';
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // ~60s ceiling - real video generation takes a while

export async function POST(req: NextRequest) {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    return NextResponse.json({ error: 'Video generation is not configured on this server yet' }, { status: 503 });
  }

  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { prompt } = parsed.data;

  try {
    const submit = await fetch(`${FAL_BASE}/${FAL_MODEL}`, {
      method: 'POST',
      headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(15000),
    });
    if (!submit.ok) {
      return NextResponse.json({ error: 'Video provider rejected the request' }, { status: 502 });
    }
    const { status_url, response_url } = (await submit.json()) as { status_url: string; response_url: string };
    if (!status_url || !response_url) {
      return NextResponse.json({ error: 'Video provider returned an unexpected response' }, { status: 502 });
    }

    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const statusRes = await fetch(status_url, { headers: { Authorization: `Key ${falKey}` }, signal: AbortSignal.timeout(10000) });
      if (!statusRes.ok) continue;
      const statusData = (await statusRes.json()) as { status: string };
      if (statusData.status === 'COMPLETED') {
        const resultRes = await fetch(response_url, { headers: { Authorization: `Key ${falKey}` }, signal: AbortSignal.timeout(10000) });
        if (!resultRes.ok) return NextResponse.json({ error: 'Could not fetch the finished video' }, { status: 502 });
        const result = (await resultRes.json()) as { video?: { url?: string } };
        if (!result.video?.url) return NextResponse.json({ error: 'Video provider returned no video' }, { status: 502 });
        return NextResponse.json({ success: true, videoUrl: result.video.url, model: FAL_MODEL });
      }
      if (statusData.status === 'FAILED') {
        return NextResponse.json({ error: 'Video generation failed upstream' }, { status: 502 });
      }
    }
    return NextResponse.json({ error: 'Video generation timed out - try a shorter or simpler prompt' }, { status: 504 });
  } catch (err) {
    return NextResponse.json({ error: 'Video provider could not be reached' }, { status: 502 });
  }
}
