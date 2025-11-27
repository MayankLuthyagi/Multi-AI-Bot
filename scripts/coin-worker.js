/**
 * Background Worker for Cryptocurrency Price Updates
 * 
 * This script runs continuously and updates all tracked coin prices
 * at regular intervals by calling the cron API endpoint.
 * 
 * Run with: node scripts/coin-worker.js
 * Or with nodemon for auto-restart: npx nodemon scripts/coin-worker.js
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';
const UPDATE_INTERVAL = parseInt(process.env.COIN_UPDATE_INTERVAL || '60000'); // Default 60 seconds

async function updateCoinPrices() {
    try {
        console.log(`[${new Date().toISOString()}] Fetching coin prices...`);

        const response = await fetch(`${API_URL}/api/coins/cron`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.success) {
            console.log(`✅ Updated ${data.updated} coins successfully`);
            if (data.failed > 0) {
                console.warn(`⚠️  Failed to update ${data.failed} coins`);
                if (data.errors) {
                    data.errors.forEach(err => {
                        console.warn(`   - ${err.symbol}: ${err.error}`);
                    });
                }
            }
            if (data.updates && data.updates.length > 0) {
                console.log('📊 Price updates:');
                data.updates.forEach(update => {
                    console.log(`   ${update.symbol}: $${update.price}`);
                });
            }
        } else {
            console.error('❌ Failed to update coins:', data.error);
        }

    } catch (error) {
        console.error('❌ Error updating coin prices:', error.message);
    }
}

// Run immediately on start
console.log('🚀 Coin price worker started');
console.log(`📡 API URL: ${API_URL}`);
console.log(`⏱️  Update interval: ${UPDATE_INTERVAL}ms (${UPDATE_INTERVAL / 1000}s)`);
console.log('');

updateCoinPrices();

// Schedule regular updates
setInterval(updateCoinPrices, UPDATE_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down coin worker...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down coin worker...');
    process.exit(0);
});
