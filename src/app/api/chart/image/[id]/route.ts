import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { env } = getRequestContext();
  const { id } = await params;

  try {
    // Get PNG data from R2 storage
    const pngObject = await env.CHART_BUCKET.get(`${id}.png`);
    if (!pngObject) {
      return new Response('Chart image not found', { status: 404 });
    }

    // Convert stored base64 string back to bytes
    const base64String = await pngObject.text();
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      }
    });
  } catch (error) {
    console.error('Failed to retrieve chart image:', error);
    return new Response('Failed to retrieve chart image', { status: 500 });
  }
}
