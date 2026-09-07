import { NextRequest, NextResponse } from 'next/server';
import { TOOLS } from '@/lib/data/tools';

export const runtime = 'edge';

interface SolveRequest {
  toolId: string;
  input: string;
  options?: Record<string, unknown>;
}

function executeLocalTool(toolId: string, input: string): { success: boolean; result?: string; error?: string } {
  try {
    switch (toolId) {
      case 'json-formatter': {
        const parsed = JSON.parse(input);
        return { success: true, result: JSON.stringify(parsed, null, 2) };
      }
      case 'json-minify': {
        const parsed = JSON.parse(input);
        return { success: true, result: JSON.stringify(parsed) };
      }
      case 'base64-encode': {
        return { success: true, result: btoa(input) };
      }
      case 'base64-decode': {
        try {
          return { success: true, result: atob(input) };
        } catch {
          return { success: false, error: 'Invalid Base64 input' };
        }
      }
      case 'url-encode': {
        return { success: true, result: encodeURIComponent(input) };
      }
      case 'url-decode': {
        try {
          return { success: true, result: decodeURIComponent(input) };
        } catch {
          return { success: false, error: 'Invalid URL-encoded input' };
        }
      }
      case 'hash-generator': {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        let sha256 = '';
        crypto.subtle.digest('SHA-256', data).then(hash => {
          sha256 = Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        });
        return { success: true, result: 'SHA-256 hash generation requires client-side Web Crypto API' };
      }
      case 'uuid-generator': {
        const uuid = crypto.randomUUID();
        return { success: true, result: uuid };
      }
      case 'password-generator': {
        const length = 16;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        const randomValues = crypto.getRandomValues(new Uint8Array(length));
        const password = Array.from(randomValues, byte => charset[byte % charset.length]).join('');
        return { success: true, result: password };
      }
      default:
        return { success: false, error: `Tool ${toolId} requires client-side execution` };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Execution failed' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SolveRequest = await request.json();
    const { toolId, input, options } = body;

    if (!toolId || typeof toolId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid toolId parameter' },
        { status: 400 }
      );
    }

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid input parameter' },
        { status: 400 }
      );
    }

    const tool = TOOLS.find(t => t.id === toolId);

    if (!tool) {
      return NextResponse.json(
        { error: `Tool ${toolId} not found` },
        { status: 404 }
      );
    }

    if (!tool.indexable) {
      return NextResponse.json(
        { error: `Tool ${toolId} is not publicly available` },
        { status: 403 }
      );
    }

    const execution = executeLocalTool(toolId, input);

    const response = {
      toolId,
      toolName: tool.title,
      success: execution.success,
      result: execution.result,
      error: execution.error,
      metadata: {
        executionMode: tool.execution ?? 'local',
        timestamp: new Date().toISOString(),
        privacy: tool.execution === 'local' ? 'Client-side only' : 'Server-processed',
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
