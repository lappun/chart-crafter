import { getRequestContext } from '@cloudflare/next-on-pages';
import Link from 'next/link';

export const runtime = 'edge';

export default function DocumentationPage() {
  const { env } = getRequestContext();
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <Link href="/" className="text-blue-600 hover:underline">← Back to home</Link>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p className="mb-4">
            Chart Crafter provides REST API endpoints to create, manage, and visualize charts.
            All API access requires HTTPS and returns JSON responses.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Password Protection</h3>
              <p className="text-sm">
                Each chart creation returns a deletion password in the response.
                Include this in the <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">X-Delete-Password</code> header for deletion requests.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Master Key</h3>
              <p className="text-sm">
                Admins can use the <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">MASTER_KEY</code> environment variable with 
                a <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Bearer</code> token for full access to all operations.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Endpoints</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="font-mono text-lg mb-2">POST /api/chart</h3>
              <p className="mb-2">Create a new chart entry. Example request:</p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto">
                {`curl -X POST ${env.NEXT_PUBLIC_BASE_URL}/api/chart \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Usage Stats",
    "description": "Weekly usage metrics",
    "expiresIn": "7d",
    "data": {
      "xAxis": { "type": "category", "data": ["Mon", "Tue", "Wed"] },
      "yAxis": { "type": "value" },
      "series": [{ "data": [10, 20, 30], "type": "bar" }]
    }
  }'`}
              </pre>
            </div>

            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="font-mono text-lg mb-2">DELETE /api/chart/{"{id}"}</h3>
              <p className="mb-2">Delete a chart using either method:</p>
              <div className="space-y-2">
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm">
                  {`curl -X DELETE ${env.NEXT_PUBLIC_BASE_URL}/api/chart/123 \\
  -H "Authorization: Bearer $MASTER_KEY"`}
                </pre>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">or</p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm">
                  {`curl -X DELETE ${env.NEXT_PUBLIC_BASE_URL}/api/chart/123 \\
  -H "X-Delete-Password: chart-password"`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Format</h2>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">ECharts Configuration</h3>
            <p className="mb-4 text-sm">
              The <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">data</code> field should contain 
              valid <a href="https://echarts.apache.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                ECharts configuration
              </a>. Example minimal configuration:
            </p>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-x-auto">
              {`{
  "xAxis": {
    "type": "category",
    "data": ["Q1", "Q2", "Q3", "Q4"]
  },
  "yAxis": {
    "type": "value"
  },
  "series": [{
    "data": [120, 200, 150, 80],
    "type": "line"
  }]
}`}
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">📅 Expiration Times</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Use shorter durations (1-24h) for sensitive data</li>
                <li>Maximum expiry is 30 days</li>
                <li>Expired charts are automatically purged</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">🔐 Security</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Always use HTTPS for API calls</li>
                <li>Store deletion passwords securely</li>
                <li>Rotate master keys periodically</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
