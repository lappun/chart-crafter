#!/usr/bin/env node

const PORT = process.env.PORT || '3000';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

async function deleteExpiredCharts() {
  console.log('\x1b[36m%s\x1b[0m', 'Starting expired chart cleanup...');
  
  if (!process.env.MASTER_KEY) {
    throw new Error('MASTER_KEY environment variable required');
  }

  try {
    // Get list of all charts
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

    // Filter expired charts or those without expiry date
    const now = Date.now();
    const expiredCharts = charts.filter(chart => {
      if (typeof chart.expiresAt !== 'number') {
        return true; // Invalid expiry, delete
      }
      return now >= chart.expiresAt;
    });

    if (expiredCharts.length === 0) {
      console.log('\x1b[32m%s\x1b[0m', 'No expired charts found');
      return;
    }

    console.log('\x1b[33m%s\x1b[0m', `Found ${expiredCharts.length} expired charts to delete\n`);
    
    // Delete each expired chart
    let deletedCount = 0;
    for (const chart of expiredCharts) {
      try {
        const deleteResponse = await fetch(`${BASE_URL}/api/chart/${chart.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${process.env.MASTER_KEY}`
          }
        });

        if (deleteResponse.ok) {
          console.log(`\x1b[32mDeleted\x1b[0m chart ${chart.id} (${chart.name})`);
          deletedCount++;
        } else {
          console.log(`\x1b[31mFailed\x1b[0m to delete chart ${chart.id}: ${deleteResponse.status}`);
        }
      } catch (error) {
        console.error(`\x1b[31mError\x1b[0m deleting chart ${chart.id}:`, error.message);
      }
    }

    console.log(`\n\x1b[32mCleanup complete.\x1b[0m Deleted ${deletedCount} of ${expiredCharts.length} expired charts`);

  } catch (error) {
    console.error('\x1b[41m\x1b[30m%s\x1b[0m', ' CLEANUP FAILED ');
    console.error(error.message);
    process.exit(1);
  }
}

deleteExpiredCharts();
