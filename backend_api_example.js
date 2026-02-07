/**
 * ============================================================
 *   VISITOR MANAGEMENT API - PRODUCTION READY FOR XAMPP
 * ============================================================
 * 
 * XAMPP ONE-TIME SETUP:
 * ================================
 * 1. Create folder: C:\xampp\htdocs\visitor-api
 * 2. Copy these files into that folder:
 *    - This file as: index.js
 *    - ecosystem.config.js
 *    - .env (edit with your settings)
 * 3. Open Command Prompt in that folder and run:
 *    npm init -y
 *    npm install express mysql2 cors dotenv
 *    npm install -g pm2
 * 4. Import visitor_management.sql into phpMyAdmin
 * 5. Start with: pm2 start ecosystem.config.js
 * 6. Auto-start on Windows boot: pm2 save && pm2-startup install
 * 
 * That's it! Your API runs forever at http://localhost:3001/api
 * ============================================================
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ============ CONFIGURATION ============
const CONFIG = {
  PORT: process.env.PORT || 3001,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'visitor_management',
  DB_PORT: parseInt(process.env.DB_PORT) || 3306,
  // Keep-alive ping interval (2 minutes - well within MySQL's default 8hr timeout)
  KEEPALIVE_INTERVAL: 2 * 60 * 1000,
  // Connection health check interval (30 seconds)
  HEALTH_CHECK_INTERVAL: 30 * 1000,
  // Frontend URLs allowed to access the API
  ALLOWED_ORIGINS: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080',
    'https://id-preview--ee2dac0b-288b-4421-97b4-34deb5944767.lovable.app',
    'https://ee2dac0b-288b-4421-97b4-34deb5944767.lovableproject.com',
    // Add your production domain here if hosting frontend elsewhere:
    // 'https://your-domain.com'
  ],
};

// ============ CORS SETUP ============
app.use(cors({
  origin: CONFIG.ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json());

// ============ BULLETPROOF MYSQL CONNECTION POOL ============
// This configuration ensures the connection NEVER drops

let pool = null;
let isDbConnected = false;
let connectionRetryCount = 0;
const MAX_RETRY_DELAY = 30000; // Max 30 seconds between retries

function createPool() {
  return mysql.createPool({
    host: CONFIG.DB_HOST,
    user: CONFIG.DB_USER,
    password: CONFIG.DB_PASSWORD,
    database: CONFIG.DB_NAME,
    port: CONFIG.DB_PORT,
    
    // Connection Pool Settings
    waitForConnections: true,
    connectionLimit: 20,         // Allow up to 20 simultaneous connections
    queueLimit: 0,               // Unlimited queue (never reject)
    maxIdle: 10,                 // Keep 10 idle connections ready
    idleTimeout: 0,              // NEVER close idle connections
    
    // Keep-Alive Settings - Prevents MySQL timeout
    enableKeepAlive: true,
    keepAliveInitialDelay: 5000, // Start keep-alive after 5 seconds
    
    // Connection Timeout Settings
    connectTimeout: 30000,       // 30 seconds to establish connection
    
    // Timezone
    timezone: '+05:30',          // IST - Change to your timezone
  });
}

// Create initial pool
pool = createPool();

// ============ AUTO-RECONNECT ON CONNECTION LOSS ============

async function ensureConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    
    if (!isDbConnected) {
      isDbConnected = true;
      connectionRetryCount = 0;
      console.log(`[${timestamp()}] ✅ Database connection restored!`);
    }
    return true;
  } catch (error) {
    isDbConnected = false;
    console.error(`[${timestamp()}] ❌ Database connection lost: ${error.message}`);
    
    // Attempt to recreate the pool
    try {
      await pool.end().catch(() => {}); // Silently close broken pool
    } catch (e) {
      // Ignore errors from closing broken pool
    }
    
    pool = createPool();
    connectionRetryCount++;
    
    const retryDelay = Math.min(1000 * Math.pow(2, connectionRetryCount), MAX_RETRY_DELAY);
    console.log(`[${timestamp()}] 🔄 Reconnecting in ${retryDelay / 1000}s (attempt ${connectionRetryCount})...`);
    
    return false;
  }
}

// ============ KEEP-ALIVE PING (Every 2 Minutes) ============
// Sends a lightweight query to prevent MySQL from closing idle connections
// MySQL default wait_timeout is 28800 seconds (8 hours)
// Our 2-minute ping ensures we're ALWAYS within that window

setInterval(async () => {
  try {
    await pool.query('SELECT 1');
    if (!isDbConnected) {
      isDbConnected = true;
      connectionRetryCount = 0;
      console.log(`[${timestamp()}] ✅ Database reconnected via keep-alive`);
    }
  } catch (error) {
    console.error(`[${timestamp()}] ⚠️ Keep-alive ping failed: ${error.message}`);
    isDbConnected = false;
    
    // Attempt reconnection
    try {
      await pool.end().catch(() => {});
      pool = createPool();
      await pool.query('SELECT 1');
      isDbConnected = true;
      connectionRetryCount = 0;
      console.log(`[${timestamp()}] ✅ Database auto-reconnected successfully`);
    } catch (reconnectError) {
      console.error(`[${timestamp()}] ❌ Auto-reconnect failed: ${reconnectError.message}`);
    }
  }
}, CONFIG.KEEPALIVE_INTERVAL);

// ============ CONNECTION HEALTH MONITOR (Every 30 Seconds) ============
// Additional safety net - monitors pool health

setInterval(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    if (!isDbConnected) {
      isDbConnected = true;
      connectionRetryCount = 0;
      console.log(`[${timestamp()}] ✅ Database health check: Connected`);
    }
  } catch (error) {
    if (isDbConnected) {
      console.warn(`[${timestamp()}] ⚠️ Health check detected connection issue`);
      isDbConnected = false;
    }
    await ensureConnection();
  }
}, CONFIG.HEALTH_CHECK_INTERVAL);

// ============ HELPER: Safe Database Query ============
// Wraps all queries with auto-reconnect capability

async function safeQuery(sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    // If connection lost, try to reconnect and retry once
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || 
        error.code === 'ECONNRESET' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ER_CON_COUNT_ERROR' ||
        error.code === 'ETIMEDOUT' ||
        error.message.includes('Connection lost')) {
      
      console.warn(`[${timestamp()}] 🔄 Connection lost during query, reconnecting...`);
      const reconnected = await ensureConnection();
      
      if (reconnected) {
        const [rows] = await pool.query(sql, params);
        return rows;
      }
    }
    throw error;
  }
}

// Helper: Safe INSERT query (returns result with insertId)
async function safeInsert(sql, params = []) {
  try {
    const [result] = await pool.query(sql, params);
    return result;
  } catch (error) {
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || 
        error.code === 'ECONNRESET' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.message.includes('Connection lost')) {
      
      console.warn(`[${timestamp()}] 🔄 Connection lost during insert, reconnecting...`);
      const reconnected = await ensureConnection();
      
      if (reconnected) {
        const [result] = await pool.query(sql, params);
        return result;
      }
    }
    throw error;
  }
}

// ============ UTILITY ============

function timestamp() {
  return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

// ============ STARTUP CONNECTION TEST ============

(async () => {
  try {
    await pool.query('SELECT 1');
    isDbConnected = true;
    console.log(`[${timestamp()}] ✅ Database connected successfully to '${CONFIG.DB_NAME}'`);
    
    // Set MySQL session variables for long-running connections
    try {
      await pool.query('SET SESSION wait_timeout = 31536000');      // 1 year
      await pool.query('SET SESSION interactive_timeout = 31536000'); // 1 year
      console.log(`[${timestamp()}] ✅ MySQL session timeout set to maximum (1 year)`);
    } catch (e) {
      console.warn(`[${timestamp()}] ⚠️ Could not set session timeout (non-critical): ${e.message}`);
    }
  } catch (error) {
    isDbConnected = false;
    console.error(`[${timestamp()}] ❌ Initial database connection failed: ${error.message}`);
    console.log(`[${timestamp()}] ℹ️ Make sure XAMPP MySQL is running and database '${CONFIG.DB_NAME}' exists`);
    console.log(`[${timestamp()}] ℹ️ The server will keep trying to reconnect automatically...`);
  }
})();

// ============ MIDDLEWARE: Database Connection Check ============

app.use('/api', (req, res, next) => {
  // Allow health check even when DB is down
  if (req.path === '/health') return next();
  
  if (!isDbConnected) {
    // Try reconnecting before rejecting
    ensureConnection().then(connected => {
      if (connected) {
        next();
      } else {
        res.status(503).json({ 
          error: 'Database temporarily unavailable. Reconnecting automatically...',
          retrying: true 
        });
      }
    });
  } else {
    next();
  }
});

// ============ HEALTH CHECK API ============

app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    
    isDbConnected = true;
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: timestamp(),
      uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
      connections: {
        active: pool.pool._allConnections?.length || 'N/A',
        idle: pool.pool._freeConnections?.length || 'N/A',
      }
    });
  } catch (error) {
    isDbConnected = false;
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      message: error.message,
      autoReconnect: true
    });
  }
});

// ============ VISITORS API ============

// Get all visitors with optional date filter
app.get('/api/visitors', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let query = 'SELECT * FROM visitors WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ' AND DATE(check_in_time) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND DATE(check_in_time) <= ?';
      params.push(endDate);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY check_in_time DESC';
    const rows = await safeQuery(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single visitor
app.get('/api/visitors/:id', async (req, res) => {
  try {
    const rows = await safeQuery('SELECT * FROM visitors WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-in visitor
app.post('/api/visitors/checkin', async (req, res) => {
  try {
    const {
      name, email, phone, company, purpose, host_name,
      host_department, badge_number, photo_url, id_proof_type,
      id_proof_number, vehicle_number, notes,
      has_laptop, laptop_make, laptop_model, laptop_serial
    } = req.body;

    const result = await safeInsert(
      `INSERT INTO visitors 
       (name, email, phone, company, purpose, host_name, host_department, 
        badge_number, photo_url, id_proof_type, id_proof_number, vehicle_number, 
        check_in_time, status, notes, has_laptop, laptop_make, laptop_model, laptop_serial)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'checked_in', ?, ?, ?, ?, ?)`,
      [name, email, phone, company, purpose, host_name, host_department,
       badge_number, photo_url, id_proof_type, id_proof_number, vehicle_number, notes,
       has_laptop === 'yes' || has_laptop === true, laptop_make, laptop_model, laptop_serial]
    );

    const visitor = await safeQuery('SELECT * FROM visitors WHERE id = ?', [result.insertId]);
    res.status(201).json(visitor[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-out visitor
app.put('/api/visitors/:id/checkout', async (req, res) => {
  try {
    await safeQuery(
      `UPDATE visitors SET check_out_time = NOW(), status = 'checked_out' WHERE id = ?`,
      [req.params.id]
    );
    const visitor = await safeQuery('SELECT * FROM visitors WHERE id = ?', [req.params.id]);
    res.json(visitor[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ HOSTS API ============

app.get('/api/hosts', async (req, res) => {
  try {
    const rows = await safeQuery('SELECT * FROM hosts WHERE is_active = TRUE ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hosts', async (req, res) => {
  try {
    const { name, email, phone, department, designation } = req.body;
    const result = await safeInsert(
      'INSERT INTO hosts (name, email, phone, department, designation) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, department, designation]
    );
    const host = await safeQuery('SELECT * FROM hosts WHERE id = ?', [result.insertId]);
    res.status(201).json(host[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DEPARTMENTS API ============

app.get('/api/departments', async (req, res) => {
  try {
    const rows = await safeQuery('SELECT * FROM departments WHERE is_active = TRUE ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PURPOSES API ============

app.get('/api/purposes', async (req, res) => {
  try {
    const rows = await safeQuery('SELECT * FROM visit_purposes WHERE is_active = TRUE ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ STATISTICS API ============

app.get('/api/statistics/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const todayVisitors = await safeQuery(
      'SELECT COUNT(*) as count FROM visitors WHERE DATE(check_in_time) = ?', [today]
    );
    const checkedIn = await safeQuery(
      "SELECT COUNT(*) as count FROM visitors WHERE status = 'checked_in'"
    );
    const weekVisitors = await safeQuery(
      'SELECT COUNT(*) as count FROM visitors WHERE check_in_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    const monthVisitors = await safeQuery(
      'SELECT COUNT(*) as count FROM visitors WHERE MONTH(check_in_time) = MONTH(NOW()) AND YEAR(check_in_time) = YEAR(NOW())'
    );

    res.json({
      todayVisitors: todayVisitors[0].count,
      currentlyCheckedIn: checkedIn[0].count,
      weekVisitors: weekVisitors[0].count,
      monthVisitors: monthVisitors[0].count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/statistics/visitors', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const rows = await safeQuery(
      'SELECT * FROM visitor_statistics WHERE visit_date BETWEEN ? AND ? ORDER BY visit_date DESC',
      [startDate, endDate]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ EXPORT API ============

app.get('/api/visitors/export/csv', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM visitors WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ' AND DATE(check_in_time) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND DATE(check_in_time) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY check_in_time DESC';
    const rows = await safeQuery(query, params);
    
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Purpose', 'Host', 'Department', 'Check In', 'Check Out', 'Status', 'Has Laptop', 'Laptop Make', 'Laptop Model', 'Laptop Serial'];
    const csvRows = rows.map(r => [
      r.id, `"${r.name || ''}"`, `"${r.email || ''}"`, `"${r.phone || ''}"`, 
      `"${r.company || ''}"`, `"${r.purpose || ''}"`, `"${r.host_name || ''}"`, 
      `"${r.host_department || ''}"`, `"${r.check_in_time || ''}"`, `"${r.check_out_time || ''}"`, 
      r.status, r.has_laptop ? 'Yes' : 'No', 
      `"${r.laptop_make || ''}"`, `"${r.laptop_model || ''}"`, `"${r.laptop_serial || ''}"`
    ].join(','));
    
    const csv = [headers.join(','), ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=visitors.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ START SERVER ============

const server = app.listen(CONFIG.PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     VISITOR MANAGEMENT API - PRODUCTION         ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Server:    http://localhost:${CONFIG.PORT}              ║`);
  console.log(`║  API:       http://localhost:${CONFIG.PORT}/api           ║`);
  console.log(`║  Health:    http://localhost:${CONFIG.PORT}/api/health    ║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  Database:  ' + (isDbConnected ? '✅ Connected' : '🔄 Connecting...') + '                       ║');
  console.log('║  Keep-Alive: Every 2 minutes                    ║');
  console.log('║  Health Check: Every 30 seconds                 ║');
  console.log('║  Auto-Reconnect: ✅ Enabled                     ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  PM2 Commands:                                  ║');
  console.log('║    pm2 logs visitor-api    - View logs           ║');
  console.log('║    pm2 restart visitor-api - Restart             ║');
  console.log('║    pm2 monit               - Monitor             ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

// ============ GRACEFUL SHUTDOWN ============

async function gracefulShutdown(signal) {
  console.log(`\n[${timestamp()}] ${signal} received. Shutting down gracefully...`);
  
  server.close(async () => {
    try {
      await pool.end();
      console.log(`[${timestamp()}] Database pool closed.`);
    } catch (e) {
      // Ignore
    }
    console.log(`[${timestamp()}] Server stopped. Goodbye!`);
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error(`[${timestamp()}] Forced shutdown after timeout`);
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============ UNHANDLED ERROR PROTECTION ============
// Prevents the server from crashing on unexpected errors

process.on('uncaughtException', (error) => {
  console.error(`[${timestamp()}] ⚠️ Uncaught Exception:`, error.message);
  // Don't exit - let PM2 handle restart if needed
});

process.on('unhandledRejection', (reason) => {
  console.error(`[${timestamp()}] ⚠️ Unhandled Rejection:`, reason);
  // Don't exit - let PM2 handle restart if needed
});
