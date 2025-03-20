import Link from "next/link";
import ChartComponent from "@/components/Chart";

export default function Home() {
  const sampleChartOptions = {
    xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
    yAxis: { type: "value" },
    series: [{ data: [120, 200, 150, 80], type: "line" }],
    title: { text: "Sample Sales Data" }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Chart Crafter</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">Create & share beautiful charts with auto-expiring links</p>
        <div className="w-full max-w-4xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Features</h2>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Secure, temporary chart URLs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Password-protected deletion
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Automatic expiration (1h-30d)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Social media-ready images
                </li>
              </ul>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
              <div className="h-64">
                <ChartComponent options={sampleChartOptions} />
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/create"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Chart
            </Link>
            <Link
              href="/docs"
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Documentation
            </Link>
          </div>
          
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Charts automatically expire based on your configured timeframe.
              <br />
              Deletion requires password or admin credentials.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
