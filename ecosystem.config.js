/**
 * PM2 Ecosystem Configuration
 * ============================
 * This file configures PM2 to keep your API server running 24/7
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2-startup install   (auto-start on Windows boot)
 */

module.exports = {
  apps: [{
    name: 'visitor-api',
    script: 'index.js',
    
    // Auto-restart settings
    watch: false,                    // Don't watch for file changes in production
    autorestart: true,               // Auto-restart if process crashes
    max_restarts: 50,                // Max restarts before stopping (resets after stable)
    min_uptime: 5000,                // Consider started after 5 seconds
    restart_delay: 3000,             // Wait 3 seconds between restarts
    
    // Performance
    instances: 1,                    // Single instance (XAMPP is single-server)
    exec_mode: 'fork',              // Fork mode for single instance
    
    // Memory management
    max_memory_restart: '500M',      // Restart if memory exceeds 500MB
    
    // Logging
    log_date_format: 'DD-MM-YYYY HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true,
    log_file: './logs/combined.log',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DB_HOST: 'localhost',
      DB_USER: 'root',
      DB_PASSWORD: '',
      DB_NAME: 'visitor_management',
      DB_PORT: 3306,
    },
    
    // Cron restart - restart every day at 3 AM as a safety measure
    cron_restart: '0 3 * * *',
    
    // Graceful shutdown
    kill_timeout: 10000,             // 10 seconds to gracefully shutdown
    listen_timeout: 10000,           // 10 seconds to listen
  }]
};
