const fetch = require('node-fetch');                                                                                   
const { randomBytes } = require('crypto');
const echarts = require('echarts');

const PORT = process.env.PORT || '3000';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const testChartConfig = {
  name: `Test Chart ${randomBytes(2).toString('hex')}`,
  description: 'Comprehensive test chart with multiple features',
  data: {
    title: {
      text: 'Advanced Sales Report',
      subtext: '2024 Q1 Performance',
      left: 'center'
    },
    legend: {
      data: ['Sales', 'Target', 'Growth Rate'],
      top: 50
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none'
        },
        restore: {},
        saveAsImage: {}
      }
    },
    xAxis: [
      {
        type: 'category',
        data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        axisPointer: {
          type: 'shadow'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Sales/Target',
        min: 0,
        max: 250,
        axisLabel: {
          formatter: '${value}K'
        }
      },
      {
        type: 'value',
        name: 'Growth Rate',
        min: 0,
        max: 25,
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: 'Sales',
        type: 'bar',
        data: [120, 132, 101, 134, 190, 210],
        itemStyle: {
          color: '#5470C6'
        },
        markPoint: {
          data: [
            { type: 'max', name: 'Max' },
            { type: 'min', name: 'Min' }
          ]
        }
      },
      {
        name: 'Target',
        type: 'bar',
        data: [100, 120, 90, 120, 150, 180],
        itemStyle: {
          color: '#91CC75'
        }
      },
      {
        name: 'Growth Rate',
        type: 'line',
        yAxisIndex: 1,
        data: [20, 18, 12, 14, 27, 23],
        smooth: true,
        itemStyle: {
          color: '#EE6666'
        },
        lineStyle: {
          width: 3
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(238,102,102,0.5)' },
            { offset: 1, color: 'rgba(238,102,102,0.1)' }
          ])
        }
      }
    ],
    dataZoom: [
      {
        type: 'slider',
        show: true,
        start: 0,
        end: 100
      }
    ],
    visualMap: {
      top: 80,
      right: 10,
      pieces: [
        { gt: 0, lte: 100, color: '#93CE07' },
        { gt: 100, lte: 150, color: '#FBD437' },
        { gt: 150, color: '#FD666D' }
      ],
      outOfRange: {
        color: '#999'
      }
    },
    animation: true,
    animationDuration: 1000
  }
};

async function testCreateChart() {
  console.log('\x1b[36m%s\x1b[0m', 'Testing POST /api/chart...');
  
  const response = await fetch(`${BASE_URL}/api/chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testChartConfig)
  });

  if (!response.ok) {
    throw new Error(`POST failed: ${response.status} ${await response.text()}`);
  }

  const { url, svg, password } = await response.json();
  console.log('\x1b[32m%s\x1b[0m', '✓ Chart created successfully');
  console.log('password', password);
  // console.log('svg', svg);
  return url.split('/').filter(Boolean).pop(); // Return the chart ID
}

async function testChartPage(id) {
  console.log('\x1b[36m%s\x1b[0m', `Testing GET /chart/${id}...`);
  
  const response = await fetch(`${BASE_URL}/chart/${id}/`);
  const html = await response.text();

  if (!response.ok) {
    throw new Error(`Page fetch failed: ${response.status}`);
  }

  if (!html.includes('<div id="chart-container"')) {
    throw new Error('Chart container not found in page');
  }

  console.log('\x1b[32m%s\x1b[0m', '✓ Chart page loaded successfully');
}

async function testChartImage(id) {
  console.log('\x1b[36m%s\x1b[0m', `Testing GET /api/chart/image/${id}...`);
  
  const response = await fetch(`${BASE_URL}/api/chart/image/${id}`);
  
  if (!response.ok) {
    throw new Error(`Image fetch failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType !== 'image/png') {
    throw new Error(`Unexpected content type: ${contentType}`);
  }

  const buffer = await response.buffer();
  console.log('\x1b[32m%s\x1b[0m', `✓ Received PNG image (${buffer.byteLength} bytes)`);
}

async function runTests() {
  try {
    const chartId = await testCreateChart();
    await testChartPage(chartId);
    await testChartImage(chartId);
    console.log('\x1b[42m\x1b[30m%s\x1b[0m', ' ALL TESTS PASSED ');
  } catch (error) {
    console.error('\x1b[41m\x1b[30m%s\x1b[0m', ' TEST FAILED ');
    console.error(error);
    process.exit(1);
  }
}

runTests();
