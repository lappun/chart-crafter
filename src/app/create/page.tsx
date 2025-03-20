'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CreateChartPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    expiresIn: '1d',
    chartData: JSON.stringify({
      xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      yAxis: { type: 'value' },
      series: [{ data: [150, 230, 224, 218, 135, 147, 260], type: 'line' }]
    }, null, 2)
  });
  const [result, setResult] = useState<ChartGenerationResult>({});
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          data: JSON.parse(formData.chartData)
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json() as ChartGenerationResult;
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chart');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Chart</h1>
        <Link href="/" className="text-blue-600 hover:underline">← Back to home</Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {result.id ? (
        <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Chart Created! 🎉</h2>
          <p className="mb-2"><strong>URL:</strong> <a href={result.url} className="text-blue-600 hover:underline">{result.url}</a></p>
          <p className="mb-4"><strong>Delete Password:</strong> {result.password}</p>
          <button 
            onClick={() => setResult({})}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Create Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Chart Name</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expiration</label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={formData.expiresIn}
              onChange={e => setFormData({...formData, expiresIn: e.target.value})}
            >
              <option value="1h">1 Hour</option>
              <option value="6h">6 Hours</option>
              <option value="1d">1 Day</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Chart Configuration (ECharts JSON)
              <span className="text-xs text-gray-500 ml-2">
                <a 
                  href="https://echarts.apache.org/examples/en/editor.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Get example configs ↗
                </a>
              </span>
            </label>
            <textarea
              required
              className="w-full p-2 border rounded font-mono text-sm focus:ring-2 focus:ring-blue-500"
              rows={12}
              value={formData.chartData}
              onChange={e => setFormData({...formData, chartData: e.target.value})}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Chart
          </button>

          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Note: You&apos;ll receive a deletion password after creation. Keep it safe!
          </div>
        </form>
      )}
    </div>
  );
}
