-- Visitor Management System - MySQL Database Schema
-- Run this script in your MySQL database

-- Create database
CREATE DATABASE IF NOT EXISTS visitor_management;
USE visitor_management;

-- Visitors table
CREATE TABLE IF NOT EXISTS visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    purpose VARCHAR(255) NOT NULL,
    host_name VARCHAR(255) NOT NULL,
    host_department VARCHAR(255),
    badge_number VARCHAR(50),
    photo_url TEXT,
    id_proof_type VARCHAR(100),
    id_proof_number VARCHAR(100),
    vehicle_number VARCHAR(50),
    check_in_time DATETIME NOT NULL,
    check_out_time DATETIME,
    status ENUM('checked_in', 'checked_out', 'pre_registered') DEFAULT 'checked_in',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_check_in_time (check_in_time),
    INDEX idx_host_name (host_name)
);

-- Hosts/Employees table
CREATE TABLE IF NOT EXISTS hosts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    department VARCHAR(255),
    designation VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visit purposes table
CREATE TABLE IF NOT EXISTS visit_purposes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-registrations table
CREATE TABLE IF NOT EXISTS pre_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_email VARCHAR(255),
    visitor_phone VARCHAR(50),
    visitor_company VARCHAR(255),
    purpose VARCHAR(255) NOT NULL,
    host_id INT,
    expected_date DATE NOT NULL,
    expected_time TIME,
    status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    approval_code VARCHAR(50) UNIQUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE SET NULL,
    INDEX idx_expected_date (expected_date),
    INDEX idx_status (status)
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values JSON,
    new_values JSON,
    user_id INT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Insert default departments
INSERT INTO departments (name, description) VALUES
('Human Resources', 'HR Department'),
('Information Technology', 'IT Department'),
('Finance', 'Finance & Accounts'),
('Marketing', 'Marketing & Sales'),
('Operations', 'Operations Department'),
('Administration', 'Admin Department');

-- Insert default visit purposes
INSERT INTO visit_purposes (name, description) VALUES
('Meeting', 'Business meeting'),
('Interview', 'Job interview'),
('Delivery', 'Package or goods delivery'),
('Maintenance', 'Equipment or facility maintenance'),
('Consultation', 'Professional consultation'),
('Personal', 'Personal visit'),
('Contractor', 'Contract work'),
('Vendor', 'Vendor meeting');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'Your Company Name', 'string', 'Company name displayed in the system'),
('company_logo', '', 'string', 'URL to company logo'),
('auto_checkout_hours', '8', 'number', 'Auto checkout visitors after X hours'),
('require_photo', 'true', 'boolean', 'Require visitor photo during check-in'),
('require_id_proof', 'true', 'boolean', 'Require ID proof during check-in'),
('notification_email', '', 'string', 'Email for notifications'),
('sms_notifications', 'false', 'boolean', 'Enable SMS notifications');

-- Sample hosts data
INSERT INTO hosts (name, email, phone, department, designation) VALUES
('John Smith', 'john.smith@company.com', '1234567890', 'Information Technology', 'Manager'),
('Sarah Johnson', 'sarah.johnson@company.com', '1234567891', 'Human Resources', 'HR Manager'),
('Mike Wilson', 'mike.wilson@company.com', '1234567892', 'Finance', 'Accountant'),
('Emily Brown', 'emily.brown@company.com', '1234567893', 'Marketing', 'Marketing Lead');

-- View for visitor statistics
CREATE OR REPLACE VIEW visitor_statistics AS
SELECT 
    DATE(check_in_time) as visit_date,
    COUNT(*) as total_visitors,
    SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) as currently_checked_in,
    SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) as checked_out,
    AVG(TIMESTAMPDIFF(MINUTE, check_in_time, COALESCE(check_out_time, NOW()))) as avg_visit_duration_minutes
FROM visitors
GROUP BY DATE(check_in_time);

-- Stored procedure to check out a visitor
DELIMITER //
CREATE PROCEDURE CheckOutVisitor(IN visitor_id INT)
BEGIN
    UPDATE visitors 
    SET 
        check_out_time = NOW(),
        status = 'checked_out',
        updated_at = NOW()
    WHERE id = visitor_id AND status = 'checked_in';
END //
DELIMITER ;

-- Stored procedure to get visitors by date range
DELIMITER //
CREATE PROCEDURE GetVisitorsByDateRange(IN start_date DATE, IN end_date DATE)
BEGIN
    SELECT * FROM visitors
    WHERE DATE(check_in_time) BETWEEN start_date AND end_date
    ORDER BY check_in_time DESC;
END //
DELIMITER ;
