import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { StoredChartData } from '../route';

export const runtime = 'edge';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { env } = getRequestContext();
  const { id } = params;

  // Master key check
  const authHeader = request.headers.get('Authorization');
  const providedKey = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  
  if (env.MASTER_KEY && providedKey === env.MASTER_KEY) {
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

  // Password-based deletion flow
  const providedPassword = request.headers.get('X-Delete-Password');
  if (!providedPassword) {
    return new Response('Authorization required via X-Delete-Password header or Bearer token', { 
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' }
    });
  }

  const chartData = await env.CHART_BUCKET.get(`${id}.json`);
  if (!chartData) {
    return new Response('Chart not found', { status: 404 });
  }

  const config = await chartData.json() as StoredChartData;

  if (config.password !== providedPassword) {
    return new Response('Invalid authorization', { 
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' }
    });
  }

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
