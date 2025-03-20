const fetch = require('node-fetch');                                                                                   
const { randomBytes } = require('crypto'); 

const PORT = process.env.PORT || '3000';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const testChartConfig = {
  name: `Test Chart ${randomBytes(2).toString('hex')}`,
  description: 'Test chart description',
  data: {
    title: { text: 'Sample Chart' },
    xAxis: { data: ['A', 'B', 'C', 'D', 'E'] },
    yAxis: {},
    series: [{
      name: 'Values',
      type: 'bar',
      data: [5, 20, 36, 10, 15]
    }]
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

  const { url, imageString, password } = await response.json();
  console.log('\x1b[32m%s\x1b[0m', '✓ Chart created successfully');
  console.log('password', password);
  console.log('imageString', imageString);
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
