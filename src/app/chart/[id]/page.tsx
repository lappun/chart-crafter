import type { Metadata } from "next";
import { getRequestContext } from "@cloudflare/next-on-pages";

interface StoredChartData {
  name: string;
  description: string;
  data: ChartRequestData;
  expiresIn: string;
  expiryTime: number;
  password: string;
}

import { notFound } from "next/navigation";
import ChartComponent from "@/components/Chart";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: Promise<any>;
}): Promise<Metadata> {
  const { env } = getRequestContext();
  const { id } = await params;

  const chartData = await env.CHART_BUCKET.get(`${id}.json`);
  if (!chartData) return {};

  const config = (await chartData.json()) as StoredChartData;

  try {
    return {
      title: config.name,
      description: config.description,
      openGraph: {
        title: config.name,
        description: config.description,
        images: [
          {
            url: `${env.NEXT_PUBLIC_BASE_URL}/api/chart/image/${id}`,
            width: 1200,
            height: 630,
            alt: config.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: config.name,
        description: config.description,
        images: [`${env.NEXT_PUBLIC_BASE_URL}/api/chart/image/${id}`],
      },
    };
  } catch (error) {
    console.error("Error generating metadata image:", error);
    return {
      title: config.name,
      description: config.description,
    };
  }
}

export default async function ChartPage({
  params,
  searchParams,
}: {
  params: Promise<any>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { env } = getRequestContext();
  const { id } = await params;

  // Get chart data from R2 storage
  const chartData = await env.CHART_BUCKET.get(`${id}.json`);
  if (!chartData) return notFound();

  // Parse chart configuration
  const config = (await chartData.json()) as StoredChartData;

  const masterKey = (await searchParams)?.masterKey;
  const validMasterKey =
    env.MASTER_KEY &&
    typeof masterKey === "string" &&
    masterKey === env.MASTER_KEY;

  // Check expiration
  if (
    !validMasterKey &&
    (!config.expiryTime || Date.now() > config.expiryTime)
  ) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-xl font-bold mb-4">Chart Expired</h2>
        <p className="text-gray-600">
          This chart is no longer available as it has expired.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex flex-col min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">{config.name}</h1>
        <p className="text-gray-600">{config.description}</p>
        <p className="text-gray-500 text-sm mt-2">
          Expires on{" "}
          {new Date(config.expiryTime).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          })}
        </p>
      </div>
      <div
        id="chart-container"
        className="flex-1 flex items-center justify-center"
      >
        <ChartComponent options={config.data} />
      </div>
    </div>
  );
}
