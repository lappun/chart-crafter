import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

interface ChartRequest {
  name: string;
  description: string;
  data: ChartRequestData;
}

export async function POST(request: Request) {
  const { env } = getRequestContext();
  const data: ChartRequest = await request.json();
  
  if (!data.name || !data.description || !data.data) {
    return new Response('Missing required fields', { status: 400 });
  }

  const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const id = `${datePrefix}-${crypto.randomUUID()}`;
  
  await env.CHART_BUCKET.put(`${id}.json`, JSON.stringify(data));
  
  const image = await generateChartBase64String(data.data);
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
