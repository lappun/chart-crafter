#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function listCharts() {
  console.log('\x1b[36m%s\x1b[0m', 'Fetching chart list...');
  
  if (!process.env.MASTER_KEY) {
    throw new Error('MASTER_KEY environment variable required');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/chart`, {
      headers: {
        Authorization: `Bearer ${process.env.MASTER_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const { charts } = await response.json();
    
    if (charts.length === 0) {
      console.log('\x1b[33m%s\x1b[0m', 'No charts found');
      return;
    }

    console.log('\x1b[32m%s\x1b[0m', `Found ${charts.length} charts:\n`);
    
    charts.forEach((chart, index) => {
      const created = new Date(chart.createdAt).toISOString();
      const expires = new Date(chart.expiresAt).toISOString();
      
      console.log(`\x1b[1mChart #${index + 1}\x1b[0m`);
      console.log(`ID: ${chart.id}`);
      console.log(`URL: \x1b[34m${chart.url}\x1b[0m`);
      console.log(`Name: ${chart.name}`);
      console.log(`Created: ${created}`);
      console.log(`Expires: ${expires}`);
      console.log(`Status: ${chart.status === 'active' ? '\x1b[32mactive\x1b[0m' : '\x1b[31mexpired\x1b[0m'}`);
      console.log('────────────────────────────────────────');
    });

  } catch (error) {
    console.error('\x1b[41m\x1b[30m%s\x1b[0m', ' FETCH FAILED ');
    console.error(error.message);
    process.exit(1);
  }
}

listCharts();
