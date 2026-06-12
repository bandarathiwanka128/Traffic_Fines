-- Run in the Supabase SQL Editor.
CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'POLICE')),
  district VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fine_categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT
);

CREATE TABLE IF NOT EXISTS traffic_fines (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fine_reference VARCHAR(50) UNIQUE NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  driver_name VARCHAR(100),
  driver_license VARCHAR(100) NOT NULL,
  category_id BIGINT NOT NULL REFERENCES fine_categories(id),
  police_officer_id BIGINT NOT NULL REFERENCES users(id),
  district VARCHAR(100),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
  issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fine_id BIGINT NOT NULL REFERENCES traffic_fines(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100) UNIQUE,
  payment_status VARCHAR(20) DEFAULT 'SUCCESS',
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fine_id BIGINT REFERENCES traffic_fines(id),
  phone VARCHAR(20),
  message TEXT,
  status VARCHAR(20) DEFAULT 'PENDING',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fines_reference_category
  ON traffic_fines(fine_reference, category_id);
CREATE INDEX IF NOT EXISTS idx_fines_status_district
  ON traffic_fines(status, district);
CREATE INDEX IF NOT EXISTS idx_fines_officer
  ON traffic_fines(police_officer_id);

INSERT INTO users (full_name, email, password, role, district, phone)
VALUES (
  'System Administrator',
  'admin@trafficfine.gov.lk',
  '$2a$10$qjrEAoEObBd3YQ5H4S0I4ut4Ut8mC6gMf7NdkTkq0HG/EGFS7VnRu',
  'ADMIN',
  'Colombo',
  '+94000000000'
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = 'ADMIN';

INSERT INTO fine_categories (category_name, amount, description)
SELECT seed.category_name, seed.amount, seed.description
FROM (VALUES
  ('Speeding', 3000.00, 'Exceeding the permitted speed limit'),
  ('No Seat Belt', 1000.00, 'Driving without wearing a seat belt'),
  ('Using Mobile Phone', 2000.00, 'Using a mobile phone while driving'),
  ('Traffic Signal Violation', 2500.00, 'Failing to obey a traffic signal'),
  ('Invalid Driving Licence', 5000.00, 'Driving without a valid licence')
) AS seed(category_name, amount, description)
WHERE NOT EXISTS (
  SELECT 1 FROM fine_categories existing
  WHERE existing.category_name = seed.category_name
);
