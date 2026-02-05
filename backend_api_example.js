 /**
  * Backend API - Production Ready for XAMPP
  * 
  * XAMPP DEPLOYMENT INSTRUCTIONS:
  * ================================
  * 1. Create folder: C:\xampp\htdocs\visitor-api
  * 2. Copy this file as: index.js
  * 3. Open Command Prompt in that folder
  * 4. Run: npm init -y
  * 5. Run: npm install express mysql2 cors dotenv pm2 -g
  * 6. Import visitor_management.sql into phpMyAdmin
  * 7. Start with: pm2 start index.js --name visitor-api
  * 8. Auto-start on boot: pm2 startup && pm2 save
  * 
  * Your API will be available at: http://localhost:3001/api
  */
 
 const express = require('express');
 const mysql = require('mysql2/promise');
 const cors = require('cors');
 require('dotenv').config();
 
 const app = express();
 
 // CORS - Allow your frontend domain
 app.use(cors({
   origin: [
     'http://localhost:5173',
     'http://localhost:3000',
     'https://id-preview--ee2dac0b-288b-4421-97b4-34deb5944767.lovable.app',
     'https://ee2dac0b-288b-4421-97b4-34deb5944767.lovableproject.com',
     // Add your production domain here:
     // 'https://your-domain.com'
   ],
   credentials: true
 }));
 app.use(express.json());
 
 // ============ MYSQL CONNECTION POOL WITH KEEP-ALIVE ============
 // This configuration prevents daily connection drops
 
 const pool = mysql.createPool({
   host: process.env.DB_HOST || 'localhost',
   user: process.env.DB_USER || 'root',
   password: process.env.DB_PASSWORD || '',  // XAMPP default is empty
   database: process.env.DB_NAME || 'visitor_management',
   port: process.env.DB_PORT || 3306,
   waitForConnections: true,
   connectionLimit: 10,
   queueLimit: 0,
   // CRITICAL: These settings prevent connection timeout
   enableKeepAlive: true,
   keepAliveInitialDelay: 10000,  // 10 seconds
   // Reconnect on connection loss
   maxIdle: 10,
   idleTimeout: 60000,  // 60 seconds
 });
 
 // ============ KEEP-ALIVE PING (Every 5 minutes) ============
 // Prevents MySQL from closing idle connections
 
 setInterval(async () => {
   try {
     await pool.query('SELECT 1');
     console.log(`[${new Date().toISOString()}] Database keep-alive ping successful`);
   } catch (error) {
     console.error(`[${new Date().toISOString()}] Database keep-alive failed:`, error.message);
   }
 }, 5 * 60 * 1000);  // 5 minutes
 
 // ============ STARTUP CONNECTION TEST ============
 
 (async () => {
   try {
     await pool.query('SELECT 1');
     console.log('✅ Database connected successfully');
   } catch (error) {
     console.error('❌ Database connection failed:', error.message);
     console.log('Please check your MySQL settings and ensure XAMPP MySQL is running');
   }
 })();

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      message: error.message 
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

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single visitor
app.get('/api/visitors/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM visitors WHERE id = ?', [req.params.id]);
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
      id_proof_number, vehicle_number, notes
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO visitors 
       (name, email, phone, company, purpose, host_name, host_department, 
        badge_number, photo_url, id_proof_type, id_proof_number, vehicle_number, 
        check_in_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'checked_in', ?)`,
      [name, email, phone, company, purpose, host_name, host_department,
       badge_number, photo_url, id_proof_type, id_proof_number, vehicle_number, notes]
    );

    const [visitor] = await pool.query('SELECT * FROM visitors WHERE id = ?', [result.insertId]);
    res.status(201).json(visitor[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-out visitor
app.put('/api/visitors/:id/checkout', async (req, res) => {
  try {
    await pool.query(
      `UPDATE visitors SET check_out_time = NOW(), status = 'checked_out' WHERE id = ?`,
      [req.params.id]
    );
    const [visitor] = await pool.query('SELECT * FROM visitors WHERE id = ?', [req.params.id]);
    res.json(visitor[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ HOSTS API ============

// Get all hosts
app.get('/api/hosts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hosts WHERE is_active = TRUE ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new host
app.post('/api/hosts', async (req, res) => {
  try {
    const { name, email, phone, department, designation } = req.body;
    const [result] = await pool.query(
      'INSERT INTO hosts (name, email, phone, department, designation) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, department, designation]
    );
    const [host] = await pool.query('SELECT * FROM hosts WHERE id = ?', [result.insertId]);
    res.status(201).json(host[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DEPARTMENTS API ============

// Get all departments
app.get('/api/departments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM departments WHERE is_active = TRUE ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PURPOSES API ============

// Get all visit purposes
app.get('/api/purposes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM visit_purposes WHERE is_active = TRUE ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ STATISTICS API ============

// Get dashboard statistics
app.get('/api/statistics/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's visitors
    const [todayVisitors] = await pool.query(
      'SELECT COUNT(*) as count FROM visitors WHERE DATE(check_in_time) = ?',
      [today]
    );

    // Currently checked in
    const [checkedIn] = await pool.query(
      "SELECT COUNT(*) as count FROM visitors WHERE status = 'checked_in'"
    );

    // This week's visitors
    const [weekVisitors] = await pool.query(
      'SELECT COUNT(*) as count FROM visitors WHERE check_in_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );

    // This month's visitors
    const [monthVisitors] = await pool.query(
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

// Get visitor statistics by date range
app.get('/api/statistics/visitors', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const [rows] = await pool.query(
      'SELECT * FROM visitor_statistics WHERE visit_date BETWEEN ? AND ? ORDER BY visit_date DESC',
      [startDate, endDate]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ EXPORT API ============

// Export visitors as CSV data
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

    const [rows] = await pool.query(query, params);
    
    // Convert to CSV
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Purpose', 'Host', 'Department', 'Check In', 'Check Out', 'Status'];
    const csvRows = rows.map(r => [
      r.id, r.name, r.email, r.phone, r.company, r.purpose, r.host_name, 
      r.host_department, r.check_in_time, r.check_out_time, r.status
    ].join(','));
    
    const csv = [headers.join(','), ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=visitors.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
 const server = app.listen(PORT, () => {
   console.log('');
   console.log('==========================================');
   console.log('   VISITOR MANAGEMENT API SERVER');
   console.log('==========================================');
   console.log(`✅ Server running on: http://localhost:${PORT}`);
   console.log(`✅ API Endpoint: http://localhost:${PORT}/api`);
   console.log(`✅ Health Check: http://localhost:${PORT}/api/health`);
   console.log('');
   console.log('PM2 Commands:');
   console.log('  pm2 logs visitor-api   - View logs');
   console.log('  pm2 restart visitor-api - Restart server');
   console.log('  pm2 stop visitor-api    - Stop server');
   console.log('==========================================');
   console.log('');
 });
 
 // ============ GRACEFUL SHUTDOWN ============
 
 process.on('SIGTERM', () => {
   console.log('SIGTERM received. Closing server...');
   server.close(() => {
     pool.end();
     console.log('Server closed. Database pool ended.');
     process.exit(0);
   });
 });
 
 process.on('SIGINT', () => {
   console.log('SIGINT received. Closing server...');
   server.close(() => {
     pool.end();
     console.log('Server closed. Database pool ended.');
     process.exit(0);
   });
 });
