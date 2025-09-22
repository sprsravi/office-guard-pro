-- Visitor Management System Database Schema
-- MySQL Database for Office/Company Visitor Management
-- © All rights reserved by IT-Team

-- Create database
CREATE DATABASE IF NOT EXISTS visitor_management;
USE visitor_management;

-- Table for storing visitor information
CREATE TABLE visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    company VARCHAR(100) NOT NULL,
    id_type ENUM('Aadhaar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID', 'Employee ID') NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    photo_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_mobile (mobile),
    INDEX idx_company (company)
);

-- Table for departments
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default departments
INSERT INTO departments (name) VALUES
('Administration'),
('Customer Support'),
('Sales'),
('Finance'),
('GRC'),
('HR'),
('IT-Infrastructure'),
('Marketing'),
('Operation'),
('Technology');

-- Table for host employees
CREATE TABLE hosts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    mobile VARCHAR(20),
    department_id INT,
    designation VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_email (email),
    INDEX idx_department (department_id)
);

-- Table for visitor check-ins/check-outs
CREATE TABLE visitor_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT NOT NULL,
    host_id INT NOT NULL,
    department_id INT NOT NULL,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP NULL,
    purpose TEXT,
    location VARCHAR(100),
    appointment_time DATETIME,
    electronic_devices TEXT,
    feedback TEXT,
    status ENUM('checked-in', 'checked-out', 'overstay') DEFAULT 'checked-in',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_id) REFERENCES visitors(id),
    FOREIGN KEY (host_id) REFERENCES hosts(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_visitor (visitor_id),
    INDEX idx_host (host_id),
    INDEX idx_department (department_id),
    INDEX idx_check_in (check_in_time),
    INDEX idx_status (status)
);

-- Table for system settings
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('company_name', 'Your Company Name', 'Company name for the visitor management system'),
('timezone', 'Asia/Kolkata', 'System timezone'),
('max_visit_duration', '8', 'Maximum visit duration in hours'),
('auto_checkout_after', '12', 'Auto checkout after hours'),
('require_appointment', 'false', 'Whether appointment is required'),
('enable_sms', 'false', 'Enable SMS notifications'),
('enable_email', 'true', 'Enable email notifications'),
('alert_emails', 'admin@company.com', 'Comma-separated list of alert email recipients');

-- Table for appointments
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT NOT NULL,
    host_id INT NOT NULL,
    department_id INT NOT NULL,
    appointment_time DATETIME NOT NULL,
    purpose TEXT,
    status ENUM('scheduled', 'confirmed', 'cancelled', 'completed') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_id) REFERENCES visitors(id),
    FOREIGN KEY (host_id) REFERENCES hosts(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_appointment_time (appointment_time),
    INDEX idx_status (status)
);

-- Table for device tracking
CREATE TABLE visitor_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_log_id INT NOT NULL,
    device_type VARCHAR(50),
    device_brand VARCHAR(50),
    device_model VARCHAR(50),
    serial_number VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_log_id) REFERENCES visitor_logs(id) ON DELETE CASCADE,
    INDEX idx_visitor_log (visitor_log_id)
);

-- Table for notification logs
CREATE TABLE notification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_log_id INT NOT NULL,
    notification_type ENUM('email', 'sms') NOT NULL,
    recipient VARCHAR(100) NOT NULL,
    subject VARCHAR(200),
    message TEXT,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_log_id) REFERENCES visitor_logs(id),
    INDEX idx_visitor_log (visitor_log_id),
    INDEX idx_status (status)
);

-- Views for reporting
CREATE VIEW visitor_summary AS
SELECT 
    v.id,
    v.name,
    v.email,
    v.mobile,
    v.company,
    d.name as department,
    h.name as host_name,
    vl.check_in_time,
    vl.check_out_time,
    vl.status,
    vl.purpose,
    CASE 
        WHEN vl.check_out_time IS NOT NULL THEN 
            TIMESTAMPDIFF(MINUTE, vl.check_in_time, vl.check_out_time)
        ELSE 
            TIMESTAMPDIFF(MINUTE, vl.check_in_time, NOW())
    END as duration_minutes
FROM visitors v
JOIN visitor_logs vl ON v.id = vl.visitor_id
JOIN departments d ON vl.department_id = d.id
JOIN hosts h ON vl.host_id = h.id;

-- View for daily statistics
CREATE VIEW daily_stats AS
SELECT 
    DATE(check_in_time) as visit_date,
    COUNT(*) as total_visitors,
    COUNT(CASE WHEN status = 'checked-in' THEN 1 END) as checked_in,
    COUNT(CASE WHEN status = 'checked-out' THEN 1 END) as checked_out,
    COUNT(CASE WHEN status = 'overstay' THEN 1 END) as overstay
FROM visitor_logs
GROUP BY DATE(check_in_time)
ORDER BY visit_date DESC;

-- View for department-wise statistics
CREATE VIEW department_stats AS
SELECT 
    d.name as department,
    COUNT(vl.id) as total_visits,
    COUNT(CASE WHEN vl.status = 'checked-in' THEN 1 END) as currently_in,
    AVG(CASE 
        WHEN vl.check_out_time IS NOT NULL THEN 
            TIMESTAMPDIFF(MINUTE, vl.check_in_time, vl.check_out_time)
        ELSE NULL
    END) as avg_duration_minutes
FROM departments d
LEFT JOIN visitor_logs vl ON d.id = vl.department_id
GROUP BY d.id, d.name
ORDER BY total_visits DESC;

-- Stored procedures
DELIMITER //

-- Procedure to check in a visitor
CREATE PROCEDURE CheckInVisitor(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_mobile VARCHAR(20),
    IN p_company VARCHAR(100),
    IN p_id_type VARCHAR(50),
    IN p_id_number VARCHAR(50),
    IN p_host_id INT,
    IN p_department_id INT,
    IN p_purpose TEXT,
    IN p_location VARCHAR(100),
    IN p_electronic_devices TEXT
)
BEGIN
    DECLARE v_visitor_id INT;
    
    -- Insert or update visitor
    INSERT INTO visitors (name, email, mobile, company, id_type, id_number)
    VALUES (p_name, p_email, p_mobile, p_company, p_id_type, p_id_number)
    ON DUPLICATE KEY UPDATE
        name = p_name,
        company = p_company,
        id_type = p_id_type,
        id_number = p_id_number,
        updated_at = CURRENT_TIMESTAMP;
    
    SET v_visitor_id = LAST_INSERT_ID();
    
    -- Create visitor log entry
    INSERT INTO visitor_logs (visitor_id, host_id, department_id, purpose, location, electronic_devices)
    VALUES (v_visitor_id, p_host_id, p_department_id, p_purpose, p_location, p_electronic_devices);
    
    SELECT v_visitor_id as visitor_id, LAST_INSERT_ID() as log_id;
END //

-- Procedure to check out a visitor
CREATE PROCEDURE CheckOutVisitor(
    IN p_visitor_log_id INT,
    IN p_feedback TEXT
)
BEGIN
    UPDATE visitor_logs 
    SET 
        check_out_time = CURRENT_TIMESTAMP,
        status = 'checked-out',
        feedback = p_feedback,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_visitor_log_id AND status = 'checked-in';
    
    SELECT ROW_COUNT() as affected_rows;
END //

-- Procedure to mark overstay visitors
CREATE PROCEDURE MarkOverstayVisitors()
BEGIN
    UPDATE visitor_logs 
    SET status = 'overstay'
    WHERE status = 'checked-in' 
    AND TIMESTAMPDIFF(HOUR, check_in_time, NOW()) > (
        SELECT CAST(setting_value AS UNSIGNED) 
        FROM settings 
        WHERE setting_key = 'max_visit_duration'
    );
    
    SELECT ROW_COUNT() as overstay_visitors;
END //

DELIMITER ;

-- Triggers
DELIMITER //

-- Trigger to automatically checkout visitors after specified hours
CREATE TRIGGER auto_checkout
AFTER UPDATE ON visitor_logs
FOR EACH ROW
BEGIN
    DECLARE auto_checkout_hours INT DEFAULT 12;
    
    SELECT CAST(setting_value AS UNSIGNED) INTO auto_checkout_hours
    FROM settings WHERE setting_key = 'auto_checkout_after';
    
    IF NEW.status = 'checked-in' AND 
       TIMESTAMPDIFF(HOUR, NEW.check_in_time, NOW()) >= auto_checkout_hours THEN
        UPDATE visitor_logs 
        SET check_out_time = NOW(), status = 'checked-out'
        WHERE id = NEW.id;
    END IF;
END //

DELIMITER ;

-- Create indexes for better performance
CREATE INDEX idx_visitor_email ON visitors(email);
CREATE INDEX idx_visitor_logs_date ON visitor_logs(check_in_time);
CREATE INDEX idx_visitor_logs_status_date ON visitor_logs(status, check_in_time);

-- Sample data (optional - remove in production)
-- INSERT INTO hosts (name, email, department_id, designation) VALUES
-- ('Alice Johnson', 'alice@company.com', 7, 'IT Manager'),
-- ('Bob Smith', 'bob@company.com', 8, 'Marketing Head'),
-- ('Carol Davis', 'carol@company.com', 4, 'Finance Manager');

COMMIT;