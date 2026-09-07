import { NextRequest, NextResponse } from 'next/server';
import { ToolExecutionResult } from '@/types';

const TOOL_HANDLERS: Record<string, (input: unknown) => Promise<unknown>> = {
  'json-formatter': async (input: unknown) => {
    const { json } = input as { json: string };
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed, null, 2);
  },
  'json-minifier': async (input: unknown) => {
    const { json } = input as { json: string };
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed);
  },
  'hash-generator': async (input: unknown) => {
    const { text, algorithm } = input as { text: string; algorithm: string };
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm as 'SHA-256' | 'SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  },
  'base64-encoder': async (input: unknown) => {
    const { text } = input as { text: string };
    return btoa(text);
  },
  'base64-decoder': async (input: unknown) => {
    const { text } = input as { text: string };
    return atob(text);
  },
  'url-encoder': async (input: unknown) => {
    const { text } = input as { text: string };
    return encodeURIComponent(text);
  },
  'url-decoder': async (input: unknown) => {
    const { text } = input as { text: string };
    return decodeURIComponent(text);
  },
  'uuid-generator': async (input: unknown) => {
    const { count } = input as { count?: number };
    const num = count || 1;
    const uuids: string[] = [];
    for (let i = 0; i < num; i++) {
      uuids.push(
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        })
      );
    }
    return num === 1 ? uuids[0] : uuids;
  },
};

export async function POST(request: NextRequest): Promise<NextResponse<ToolExecutionResult>> {
  try {
    const body = await request.json();
    const { toolId, input } = body as { toolId: string; input: unknown };

    if (!toolId) {
      return NextResponse.json(
        { success: false, error: 'Missing toolId' },
        { status: 400 }
      );
    }

    const handler = TOOL_HANDLERS[toolId];
    if (!handler) {
      return NextResponse.json(
        { success: false, error: `Tool ${toolId} not found` },
        { status: 404 }
      );
    }

    const start = performance.now();
    const result = await handler(input);
    const executionTime = performance.now() - start;

    return NextResponse.json({
      success: true,
      result,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: 0,
    });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoints: Object.keys(TOOL_HANDLERS),
    method: 'POST',
    body: {
      toolId: 'string',
      input: 'unknown',
    },
  });
}
