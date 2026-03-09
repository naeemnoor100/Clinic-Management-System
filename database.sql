-- Note: Create the database manually if it doesn't exist.
-- CREATE DATABASE IF NOT EXISTS clinic_db;
-- USE clinic_db;

CREATE TABLE IF NOT EXISTS clinics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default clinic for the no-login mode
INSERT INTO clinics (id, username, password_hash) 
SELECT 1, 'default_clinic', 'no_password' 
WHERE NOT EXISTS (SELECT * FROM clinics WHERE id = 1);

CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    patient_code VARCHAR(50),
    name VARCHAR(255),
    age INT,
    gender VARCHAR(50),
    phone VARCHAR(50),
    address TEXT,
    allergies TEXT,
    chronic_conditions TEXT,
    notes TEXT,
    PRIMARY KEY (id, clinic_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medications (
    id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    brand_name VARCHAR(255),
    scientific_name VARCHAR(255),
    company_name VARCHAR(255),
    type VARCHAR(100),
    unit VARCHAR(100),
    strength VARCHAR(100),
    category VARCHAR(100),
    stock INT,
    reorder_level INT,
    price_per_unit DECIMAL(10, 2),
    PRIMARY KEY (id, clinic_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS visits (
    id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    patient_id VARCHAR(50),
    date DATE,
    symptoms TEXT,
    diagnosis TEXT,
    vitals TEXT, -- Changed from JSON to TEXT for compatibility
    fee_amount DECIMAL(10, 2),
    payment_status VARCHAR(50),
    PRIMARY KEY (id, clinic_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS visit_medications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    medication_id VARCHAR(50),
    custom_name VARCHAR(255),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    quantity INT,
    FOREIGN KEY (visit_id, clinic_id) REFERENCES visits(id, clinic_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pharmacy_sales (
    id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    customer_name VARCHAR(255),
    date DATE,
    total_amount DECIMAL(10, 2),
    payment_status VARCHAR(50),
    PRIMARY KEY (id, clinic_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pharmacy_sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    medication_id VARCHAR(50),
    quantity INT,
    price_at_time DECIMAL(10, 2),
    FOREIGN KEY (sale_id, clinic_id) REFERENCES pharmacy_sales(id, clinic_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scientific_names (
    id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    label VARCHAR(255),
    PRIMARY KEY (id, clinic_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS company_names (
    id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    label VARCHAR(255),
    PRIMARY KEY (id, clinic_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS med_types (
    id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    label VARCHAR(255),
    PRIMARY KEY (id, clinic_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS med_categories (
    id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    label VARCHAR(255),
    PRIMARY KEY (id, clinic_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS symptoms (
    id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    label VARCHAR(255),
    PRIMARY KEY (id, clinic_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vital_definitions (
    id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    label VARCHAR(255),
    unit VARCHAR(50),
    PRIMARY KEY (id, clinic_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prescription_templates (
    id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    name VARCHAR(255),
    diagnosis VARCHAR(255),
    min_age INT,
    max_age INT,
    PRIMARY KEY (id, clinic_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS template_meds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id VARCHAR(50) NOT NULL,
    clinic_id INT NOT NULL,
    medication_id VARCHAR(50),
    custom_name VARCHAR(255),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    quantity INT,
    FOREIGN KEY (template_id, clinic_id) REFERENCES prescription_templates(id, clinic_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clinic_settings (
    clinic_id INT PRIMARY KEY,
    patient_counter INT DEFAULT 0,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);
