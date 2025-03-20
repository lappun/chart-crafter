import { getRequestContext } from '@cloudflare/next-on-pages';
import { notFound } from 'next/navigation';
import ChartComponent from '@/components/Chart';

export const runtime = 'edge';

export default async function ChartPage({ params }: { params: { id: string } }) {
  const { env } = getRequestContext();
  const { id } = params;
  
  // Get chart data from R2 storage
  const chartData = await env.CHART_BUCKET.get(`${id}.json`);
  if (!chartData) return notFound();

  // Parse chart configuration
  const config = await chartData.json() as ChartRequestData;
  
  return (
    <div className="container mx-auto p-4 flex flex-col min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">{config.name}</h1>
        <p className="text-gray-600">{config.description}</p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <ChartComponent options={config.data} />
      </div>
    </div>
  );
}
