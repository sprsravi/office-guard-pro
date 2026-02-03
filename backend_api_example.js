/**
 * Backend API Example - Node.js/Express with MySQL
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new folder for your backend
 * 2. Run: npm init -y
 * 3. Run: npm install express mysql2 cors dotenv
 * 4. Create a .env file with your MySQL credentials
 * 5. Run this file with: node backend_api_example.js
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'visitor_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
