import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

const startTime = Date.now();

export async function GET() {
  const { env } = getRequestContext();
  
  try {
    const status = {
      status: 'operational',
      version: '0.1.0',
      timestamp: Date.now(),
      storage: {
        r2: 'connected' as const,
        last_stored_item: (await env.CHART_BUCKET.list({ limit: 1 })).objects[0]?.key || 'none'
      },
      uptime: Date.now() - startTime
    };

    return NextResponse.json(status);
  } catch (error: unknown) {
    let message = `${error}`;
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json(
      {
        status: 'degraded', 
        error: message,
        storage: { r2: 'disconnected' }
      },
      { status: 500 }
    );
  }
}
