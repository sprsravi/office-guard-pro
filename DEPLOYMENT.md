# 🚀 XAMPP Production Deployment Guide

## Complete Ready-to-Deploy Setup (No Changes Needed!)

---

## Step 1: Install Prerequisites

1. **XAMPP** - Already installed ✅
2. **Node.js** - Download from https://nodejs.org (LTS version)
3. Start **XAMPP Control Panel** → Start **MySQL**

---

## Step 2: Setup Database

1. Open **phpMyAdmin**: http://localhost/phpmyadmin
2. Click **"New"** on the left sidebar
3. Create database named: `visitor_management`
4. Click on the new database → **"Import"** tab
5. Choose file: `visitor_management.sql` from this project
6. Click **"Go"** to import

---

## Step 3: Setup API Server

1. Create folder: `C:\xampp\htdocs\visitor-api`

2. Copy these files into that folder:
   - `backend_api_example.js` → rename to `index.js`
   - `ecosystem.config.js`
   - `start-server.bat`

3. Open **Command Prompt** in `C:\xampp\htdocs\visitor-api`:
   ```cmd
   cd C:\xampp\htdocs\visitor-api
   npm init -y
   npm install express mysql2 cors dotenv
   npm install -g pm2
   ```

4. **Double-click `start-server.bat`** — That's it! 🎉

---

## Step 4: Verify Everything Works

Open browser and go to: http://localhost:3001/api/health

You should see:
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": "0h 0m"
}
```

---

## Step 5: Connect Frontend

The frontend is already configured to connect to `http://localhost:3001/api`.

If you publish the frontend on Lovable, add the `VITE_API_URL` environment variable:
- Value: `http://YOUR-PC-IP:3001/api` (replace with your actual PC IP for network access)

---

## 🔒 Connection Never Drops - Here's Why

| Feature | Setting | Purpose |
|---------|---------|---------|
| **Keep-Alive Ping** | Every 2 minutes | Prevents MySQL idle timeout |
| **Health Monitor** | Every 30 seconds | Detects connection issues early |
| **Auto-Reconnect** | On any failure | Rebuilds connection pool automatically |
| **Session Timeout** | Set to 1 year | MySQL won't close the connection |
| **PM2 Auto-Restart** | On crash | Restarts server if it ever stops |
| **PM2 Cron Restart** | Daily at 3 AM | Fresh restart as safety net |
| **Pool Keep-Alive** | TCP level | Keeps TCP connections alive |
| **Error Protection** | Uncaught errors | Server won't crash on errors |

---

## PM2 Commands Reference

```cmd
pm2 logs visitor-api        # View live logs
pm2 monit                    # Monitor CPU/Memory
pm2 restart visitor-api      # Restart server
pm2 stop visitor-api         # Stop server
pm2 status                   # Check status
pm2 flush                    # Clear logs
```

---

## Auto-Start on Windows Boot

Run these commands once:
```cmd
pm2 save
pm2-startup install
```

Now the API server starts automatically when Windows boots!

---

## MySQL Configuration (Optional - Extra Safety)

Open `C:\xampp\mysql\bin\my.ini` and add under `[mysqld]`:

```ini
[mysqld]
wait_timeout = 31536000
interactive_timeout = 31536000
max_connections = 100
```

Restart MySQL from XAMPP Control Panel after changing.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Port 3001 in use** | Change PORT in `ecosystem.config.js` |
| **MySQL not connecting** | Make sure XAMPP MySQL is running |
| **CORS error in browser** | Your frontend URL is already whitelisted |
| **Server stops after closing CMD** | Use PM2 (not `node index.js` directly) |
| **Need access from other PCs** | Use your PC's IP instead of localhost |

---

## File Structure

```
C:\xampp\htdocs\visitor-api\
├── index.js                 # API server (copy of backend_api_example.js)
├── ecosystem.config.js      # PM2 configuration
├── start-server.bat         # One-click starter
├── package.json             # Dependencies
├── node_modules\            # Installed packages
└── logs\                    # Server logs
    ├── output.log
    ├── error.log
    └── combined.log
```
