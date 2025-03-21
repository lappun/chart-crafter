import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { Resvg, initWasm, ResvgRenderOptions } from "@resvg/resvg-wasm";
import { svg2png, initialize } from "svg2png-wasm";
// @ts-ignore
import resvg_wasm from "./wasm/index_bg.wasm?module";
// @ts-ignore
import svg2png_wasm from "./wasm/svg2png_wasm_bg.wasm?module";

type Svg2PngType = 'SVG2PNG' | 'RESVG';

const SVG2PNT: Svg2PngType = 'SVG2PNG'

export const runtime = "edge";
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

export async function POST(request: Request) {
  const { env } = getRequestContext();
  const data: ChartRequest = await request.json();

  if (!data.name || !data.description || !data.data) {
    return new Response("Missing required fields", { status: 400 });
  }

  // Set default expiry if none provided and parse expiry duration
  const expiresIn = data.expiresIn || "1d";
  const expiryMatch = expiresIn.match(/^(\d+)([dh])$/);
  if (!expiryMatch) {
    return new Response('Invalid expiry format. Use e.g. "1h" or "30d"', {
      status: 400,
    });
  }

  const value = parseInt(expiryMatch[1]);
  const unit = expiryMatch[2];
  const expiryMs = unit === "d" ? value * 86400000 : value * 3600000;

  if (expiryMs < 3600000 || expiryMs > 2592000000) {
    // 1h to 30d in ms
    return new Response("Expiry must be between 1 hour and 30 days", {
      status: 400,
    });
  }

  // Generate password and expiry timestamp
  const expiryTime = Date.now() + expiryMs;
  function generateRandomPassword(length = 12): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map((byte) => chars[byte % chars.length])
      .join("");
  }
  const password = generateRandomPassword();

  // Create stored data object
  const storedData: StoredChartData = {
    ...data,
    expiryTime,
    password,
  };

  const datePrefix = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const id = `${datePrefix}-${crypto.randomUUID()}`;

  await env.CHART_BUCKET.put(`${id}.json`, JSON.stringify(storedData));
  const { svg, png } = await generateChartImage(data.data);
  await env.CHART_BUCKET.put(`${id}.png`, png);

  return NextResponse.json({
    id: id,
    url: `${env.NEXT_PUBLIC_BASE_URL}/chart/${id}/`,
    thumbnail: `${env.NEXT_PUBLIC_BASE_URL}/api/chart/image/${id}/`,
    password: password,
    svg: svg,
  } as ChartGenerationResult);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function loadFontAsUint8Array() {
  const { env } = getRequestContext();
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/fonts/Roboto.ttf`);
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  return uint8Array;
}

async function convertImageByResvg(svg: string): Promise<ArrayBuffer> {
  try {
    await initWasm(resvg_wasm);
  } catch (error) {
    console.debug("ignroe this error", error);
  }
  const fontData = await loadFontAsUint8Array();
  const opts: ResvgRenderOptions = {
    font: {
      fontBuffers: [fontData!], // require, If you use text in svg
      sansSerifFamily:"Roboto",
    }
  };
  const resvg = new Resvg(svg, opts as ResvgRenderOptions);
  const pngData = resvg.render().asPng();
  return pngData.buffer.slice(0) as ArrayBuffer;
}

async function convertImageBySvg2png(svg: string): Promise<ArrayBuffer> {
  try {
    await initialize(svg2png_wasm);
  } catch (error) {
    console.debug("ignroe this error", error);
  }
  const fontData = await loadFontAsUint8Array();
  const pngData = await svg2png(svg, {
    backgroundColor: 'white',
    fonts: [
      fontData!, // require, If you use text in svg
    ],
    defaultFontFamily: {
      // optional
      sansSerifFamily: "Roboto",
    },
  });
  return pngData.buffer.slice(0) as ArrayBuffer;
}

async function generateChartImage(
  options: ChartRequestData
): Promise<{ svg: string; png: string }> {
  const echarts = await import("echarts");
  const chart = echarts.init(null, null, {
    renderer: "svg",
    ssr: true,
    width: 1200,
    height: 630,
  });

  chart.setOption(options);
  const svg = chart.renderToSVGString();
  let pngBuffer: ArrayBuffer;
  if (SVG2PNT === 'RESVG') {
    pngBuffer = await convertImageByResvg(svg);
  } else {
    pngBuffer = await convertImageBySvg2png(svg);
  }
  const png = arrayBufferToBase64(pngBuffer);
  return { svg, png };
}

export async function GET(request: Request) {
  const { env } = getRequestContext();

  // Master key auth validation
  const authHeader = request.headers.get("Authorization");
  const providedKey = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!env.MASTER_KEY || providedKey !== env.MASTER_KEY) {
    return new Response("Invalid or missing authorization token", {
      status: 401,
      headers: { "WWW-Authenticate": "Bearer" },
    });
  }

  try {
    // List all charts
    const { objects } = await env.CHART_BUCKET.list();
    const chartList = await Promise.all(
      objects.map(async (object) => {
        if (!object.key.endsWith(".json")) return null;

        const data = await env.CHART_BUCKET.get(object.key);
        if (!data) return null;

        const chart = await data.json<StoredChartData>();
        const id = object.key.replace(".json", "");
        return {
          id: id,
          name: chart.name,
          url: `${env.NEXT_PUBLIC_BASE_URL}/chart/${id}`,
          thumbnail: `${env.NEXT_PUBLIC_BASE_URL}/api/chart/image/${id}`,
          createdAt: object.uploaded,
          expiresAt: chart.expiryTime,
          status: Date.now() > chart.expiryTime ? "expired" : "active",
        };
      })
    );

    return NextResponse.json({
      charts: chartList.filter((chart) => chart !== null),
    });
  } catch (error) {
    console.error("List charts failed:", error);
    return new Response("Failed to retrieve chart list", { status: 500 });
  }
}
