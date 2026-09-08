import { NextResponse } from 'next/server';
import { listAvailableModels, NvidiaNotConfiguredError, NvidiaApiError } from '@/lib/nvidia/client';

// Real, live NVIDIA NIM catalog for this server's configured account -
// same dynamic discovery /api/nvidia/chat uses to pick a model, exposed
// directly so Studio's Settings panel can eventually show the actual
// available models instead of a static list.
export async function GET() {
  try {
    const models = await listAvailableModels();
    return NextResponse.json({ success: true, models });
  } catch (err) {
    if (err instanceof NvidiaNotConfiguredError) {
      return NextResponse.json({ error: 'nvidia_not_configured', message: 'NVIDIA Cloud Mode is not configured on this server.' }, { status: 503 });
    }
    if (err instanceof NvidiaApiError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    throw err;
  }
}
