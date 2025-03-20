import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

interface ChartRequest {
  name: string;
  description: string;
  data: ChartRequestData;
  expiresIn?: string;
}

interface StoredChartData extends ChartRequest {
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
  await env.CHART_BUCKET.put(`${id}.png`, image);

  return NextResponse.json({
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/echart/${id}/`
  });
}

async function generateChartImage(options: ChartRequestData): Promise<ArrayBuffer> {
  const ResvgWasm = await import('@resvg/resvg-wasm');
  const wasmResponse = await fetch("https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm");
  const wasmArrayBuffer = await wasmResponse.arrayBuffer();
  await ResvgWasm.initWasm(wasmArrayBuffer);

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

async function generateChartBase64String(options: ChartRequestData): Promise<string> {
  const echarts = await import('echarts');
  const chart = echarts.init(null, null, {
    renderer: 'svg', 
    ssr: true, 
    width: 1200, 
    height: 630
  });
  
  chart.setOption(options);
  return chart.renderToSVGString();
}
