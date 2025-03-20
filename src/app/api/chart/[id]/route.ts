import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { env } = getRequestContext();
  const { id } = params;

  // Get and validate authorization header
  const authHeader = request.headers.get('Authorization');
  const providedKey = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  
  if (!env.MASTER_KEY || providedKey !== env.MASTER_KEY) {
    return new Response('Invalid or missing authorization token', { 
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' }
    });
  }

  // Delete both the chart data and image
  try {
    await Promise.all([
      env.CHART_BUCKET.delete(`${id}.json`),
      env.CHART_BUCKET.delete(`${id}.png`)
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deletion failed:', error);
    return new Response('Failed to delete chart', { status: 500 });
  }
}
