'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { type EChartsOption } from 'echarts';

export default function ChartComponent({ options }: { options: EChartsOption }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    // Initialize chart
    const chart = echarts.init(chartRef.current);
    chart.setOption(options);
    
    // Handle window resize
    const resizeHandler = () => chart.resize();
    window.addEventListener('resize', resizeHandler);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeHandler);
      chart.dispose();
    };
  }, [options]);

  return <div ref={chartRef} className="w-full h-[600px]" />;
}
