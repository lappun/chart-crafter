import type { Metadata } from 'next';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { generateChartBase64String } from '@/app/api/chart/route';

interface StoredChartData {
  name: string;
  description: string;
  data: any;
  expiresIn: string;
  expiryTime: number;
  password: string;
}
import { notFound } from 'next/navigation';
import ChartComponent from '@/components/Chart';

export const runtime = 'edge';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { env } = getRequestContext();
  const { id } = params;

  const chartData = await env.CHART_BUCKET.get(`${id}.json`);
  if (!chartData) return {};

  const config = await chartData.json() as StoredChartData;
  
  try {
    const svgString = await generateChartBase64String(config.data);
    const base64Image = btoa(svgString);

    return {
      title: config.name,
      description: config.description,
      openGraph: {
        title: config.name,
        description: config.description,
        images: [{
          url: `data:image/svg+xml;base64,${base64Image}`,
          width: 1200,
          height: 630,
          alt: config.name,
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: config.name,
        description: config.description,
        images: [`data:image/svg+xml;base64,${base64Image}`],
      },
    };
  } catch (error) {
    console.error('Error generating metadata image:', error);
    return {
      title: config.name,
      description: config.description,
    };
  }
}

export default async function ChartPage({
  params,
  searchParams
}: { 
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { env } = getRequestContext();
  const { id } = params;
  
  // Get chart data from R2 storage
  const chartData = await env.CHART_BUCKET.get(`${id}.json`);
  if (!chartData) return notFound();

  // Parse chart configuration
  const config = await chartData.json() as StoredChartData;
  
  const masterKey = searchParams?.masterKey;
  const validMasterKey = env.MASTER_KEY && 
                        typeof masterKey === 'string' &&
                        masterKey === env.MASTER_KEY;

  // Check expiration
  if (!validMasterKey && (!config.expiryTime || Date.now() > config.expiryTime)) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-xl font-bold mb-4">Chart Expired</h2>
        <p className="text-gray-600">This chart is no longer available as it has expired.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 flex flex-col min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">{config.name}</h1>
        <p className="text-gray-600">{config.description}</p>
        <p className="text-gray-500 text-sm mt-2">
          Expires on {new Date(config.expiryTime).toLocaleDateString(undefined, { 
            year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
          })}
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <ChartComponent options={config.data} />
      </div>
    </div>
  );
}
