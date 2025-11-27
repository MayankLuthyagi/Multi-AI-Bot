# Cryptocurrency Price Worker

This document explains how to run the background worker that automatically updates cryptocurrency prices.

## Overview

The coin price tracking system consists of:

1. **Cron API Endpoint** (`/api/coins/cron`) - Updates all tracked coins
2. **Background Worker** (`scripts/coin-worker.js`) - Runs continuously and calls the API
3. **Client Pages** - Display the collected data in real-time

## Setup

### 1. Environment Variables

Add these to your `.env` or `.env.local` file:

```bash
# Required: Secret key for authenticating cron requests
CRON_SECRET=your-secure-random-secret-key-here

# Optional: Update interval in milliseconds (default: 10000 = 10 seconds)
COIN_UPDATE_INTERVAL=60000

# Optional: API URL (default: http://localhost:3000)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Generate a Secure CRON_SECRET

Run this command to generate a secure random key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add it to your `.env` file.

## Running the Worker

### Development Mode

**Option 1: Basic Node.js**
```bash
node scripts/coin-worker.js
```

**Option 2: With Auto-restart (Recommended)**
```bash
npx nodemon scripts/coin-worker.js
```

### Production Mode

**Option 1: Using PM2 (Recommended for production)**

Install PM2:
```bash
npm install -g pm2
```

Start the worker:
```bash
pm2 start scripts/coin-worker.js --name coin-worker
```

Useful PM2 commands:
```bash
pm2 status              # Check status
pm2 logs coin-worker    # View logs
pm2 restart coin-worker # Restart
pm2 stop coin-worker    # Stop
pm2 delete coin-worker  # Remove
```

**Option 2: Windows Service (Windows only)**

You can use `node-windows` to run as a Windows service:
```bash
npm install -g node-windows
```

**Option 3: systemd (Linux)**

Create a systemd service file at `/etc/systemd/system/coin-worker.service`:

```ini
[Unit]
Description=Cryptocurrency Price Worker
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/project
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /path/to/your/project/scripts/coin-worker.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable coin-worker
sudo systemctl start coin-worker
sudo systemctl status coin-worker
```

## Configuration

### Update Interval

Change how often prices are updated by setting `COIN_UPDATE_INTERVAL`:

```bash
COIN_UPDATE_INTERVAL=5000   # 5 seconds
COIN_UPDATE_INTERVAL=30000  # 30 seconds
COIN_UPDATE_INTERVAL=60000  # 1 minute
```

### Manual Trigger

You can manually trigger an update using curl:

```bash
curl -X GET http://localhost:3000/api/coins/cron \
  -H "Authorization: Bearer your-secret-key"
```

Or using PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/coins/cron" -Headers @{"Authorization"="Bearer your-secret-key"}
```

## Monitoring

The worker outputs logs to the console:

```
🚀 Coin price worker started
📡 API URL: http://localhost:3000
⏱️  Update interval: 10000ms (10s)

[2025-11-28T10:30:00.000Z] Fetching coin prices...
✅ Updated 3 coins successfully
📊 Price updates:
   BTCUSDT: $98765.43
   ETHUSDT: $3456.78
   SHIBUSDT: $0.00002345
```

## Troubleshooting

### Worker won't start
- Check that `CRON_SECRET` is set in your `.env` file
- Verify Next.js app is running on the correct port
- Check `NEXT_PUBLIC_API_URL` matches your app URL

### No coins being updated
- Make sure you've added coins via the web interface (`/info` page)
- Check that CoinDCX API is accessible
- Verify coin symbols match CoinDCX market names (e.g., `BTCUSDT`)

### Unauthorized errors
- Ensure `CRON_SECRET` in `.env` matches the one used by the worker
- The secret must be the same in both the Next.js app and worker

## Cloud Deployment

### Vercel
Vercel doesn't support long-running processes. Use:
- Vercel Cron Jobs (add to `vercel.json`)
- External worker (separate server or service like Railway/Render)

Example `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/coins/cron",
    "schedule": "*/10 * * * * *"
  }]
}
```

### Railway / Render
Deploy the worker as a separate service alongside your Next.js app.

### Docker
Create a `Dockerfile` for the worker and run it as a separate container.

## Security Notes

1. **Never commit your CRON_SECRET** - Add `.env` to `.gitignore`
2. **Use HTTPS in production** - Especially if worker is on a different server
3. **Restrict API access** - Consider IP whitelisting for the cron endpoint
4. **Monitor logs** - Check for suspicious activity or failed requests
