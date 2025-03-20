import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

interface ChartRequest {
  name: string;
  description: string;
  data: ChartRequestData;
  expiresIn?: string;
}

export interface StoredChartData extends ChartRequest {
  expiryTime: number;
  password: string;
}

function generateRandomPassword(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(byte => chars[byte % chars.length])
    .join('');
}

export async function POST(request: Request) {
  const { env } = getRequestContext();
  const data: ChartRequest = await request.json();
  
  if (!data.name || !data.description || !data.data) {
    return new Response('Missing required fields', { status: 400 });
  }

  // Set default expiry if none provided and parse expiry duration
  const expiresIn = data.expiresIn || '1d';
  const expiryMatch = expiresIn.match(/^(\d+)([dh])$/);
  if (!expiryMatch) {
    return new Response('Invalid expiry format. Use e.g. "1h" or "30d"', { status: 400 });
  }

  const value = parseInt(expiryMatch[1]);
  const unit = expiryMatch[2];
  const expiryMs = unit === 'd' ? value * 86400000 : value * 3600000;
  
  if (expiryMs < 3600000 || expiryMs > 2592000000) { // 1h to 30d in ms
    return new Response('Expiry must be between 1 hour and 30 days', { status: 400 });
  }

  // Generate password and expiry timestamp
  const expiryTime = Date.now() + expiryMs;
  const password = generateRandomPassword();

  // Create stored data object
  const storedData: StoredChartData = {
    ...data,
    expiryTime,
    password
  };

  const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const id = `${datePrefix}-${crypto.randomUUID()}`;
  
  await env.CHART_BUCKET.put(`${id}.json`, JSON.stringify(storedData));
  const image = await generateChartImage(data.data);
  const imageString = arrayBufferToBase64(image);
  await env.CHART_BUCKET.put(`${id}.png`, imageString, { httpMetadata: { contentType: 'image/png' } });

  return NextResponse.json({
    id: id,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/echart/${id}/`,
    imageString: imageString,
    password: password,
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function generateChartImage(options: ChartRequestData): Promise<ArrayBuffer> {
  const ResvgWasm = await import('@resvg/resvg-wasm');
  const wasmResponse = await fetch("https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm");
  const wasmArrayBuffer = await wasmResponse.arrayBuffer();
  try {
    await ResvgWasm.initWasm(wasmArrayBuffer);
  } catch (error) {}

  const echarts = await import('echarts');
  const chart = echarts.init(null, null, {
    renderer: 'svg', 
    ssr: true, 
    width: 1200, 
    height: 630
  });
  
  chart.setOption(options);
  const svg = chart.renderToSVGString();
  
  const resvg = new ResvgWasm.Resvg(svg);
  const pngData = resvg.render().asPng();
  
  return pngData.buffer.slice(0) as ArrayBuffer;
}

export async function GET(request: Request) {
  const { env } = getRequestContext();

  // Master key auth validation
  const authHeader = request.headers.get('Authorization');
  const providedKey = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  
  if (!env.MASTER_KEY || providedKey !== env.MASTER_KEY) {
    return new Response('Invalid or missing authorization token', { 
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' }
    });
  }

  try {
    // List all charts
    const { objects } = await env.CHART_BUCKET.list();
    const chartList = await Promise.all(objects.map(async (object) => {
      if (!object.key.endsWith('.json')) return null;
      
      const data = await env.CHART_BUCKET.get(object.key);
      if (!data) return null;
      
      const chart = await data.json<StoredChartData>();
      return {
        id: object.key.replace('.json', ''),
        name: chart.name,
        url: `${env.NEXT_PUBLIC_BASE_URL}/echart/${object.key.replace('.json', '')}`,
        createdAt: object.uploaded,
        expiresAt: chart.expiryTime,
        status: Date.now() > chart.expiryTime ? 'expired' : 'active'
      };
    }));

    return NextResponse.json({
      charts: chartList.filter(chart => chart !== null)
    });
  } catch (error) {
    console.error('List charts failed:', error);
    return new Response('Failed to retrieve chart list', { status: 500 });
  }
}
