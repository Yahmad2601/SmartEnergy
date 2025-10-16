-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Admin can see all users
CREATE POLICY "admin_all_users" ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users AS u 
      WHERE u.id = current_setting('app.user_id', true)::varchar 
      AND u.role = 'admin'
    )
  );

-- Students can only see their own user record
CREATE POLICY "student_own_user" ON users
  FOR SELECT
  USING (id = current_setting('app.user_id', true)::varchar);

-- Blocks table policies
-- Everyone can read blocks
CREATE POLICY "read_blocks" ON blocks
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete blocks
CREATE POLICY "admin_manage_blocks" ON blocks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = current_setting('app.user_id', true)::varchar 
      AND users.role = 'admin'
    )
  );

-- Lines table policies
-- Everyone can read lines
CREATE POLICY "read_lines" ON lines
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete lines
CREATE POLICY "admin_manage_lines" ON lines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = current_setting('app.user_id', true)::varchar 
      AND users.role = 'admin'
    )
  );

-- Energy logs policies
-- Admins can see all energy logs
CREATE POLICY "admin_all_energy_logs" ON energy_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = current_setting('app.user_id', true)::varchar 
      AND users.role = 'admin'
    )
  );

-- Students can only see energy logs for their assigned line
CREATE POLICY "student_own_energy_logs" ON energy_logs
  FOR SELECT
  USING (
    line_id IN (
      SELECT line_id FROM users 
      WHERE users.id = current_setting('app.user_id', true)::varchar
    )
  );

-- Payments policies
-- Admins can see all payments
CREATE POLICY "admin_all_payments" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = current_setting('app.user_id', true)::varchar 
      AND users.role = 'admin'
    )
  );

-- Students can only see their own payments
CREATE POLICY "student_own_payments" ON payments
  FOR ALL
  USING (user_id = current_setting('app.user_id', true)::varchar);

-- Alerts policies
-- Admins can see all alerts
CREATE POLICY "admin_all_alerts" ON alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = current_setting('app.user_id', true)::varchar 
      AND users.role = 'admin'
    )
  );

-- Students can see alerts for their assigned line
CREATE POLICY "student_own_alerts" ON alerts
  FOR SELECT
  USING (
    line_id IN (
      SELECT line_id FROM users 
      WHERE users.id = current_setting('app.user_id', true)::varchar
    )
  );

-- AI Predictions policies
-- Admins can see all predictions
CREATE POLICY "admin_all_predictions" ON ai_predictions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = current_setting('app.user_id', true)::varchar 
      AND users.role = 'admin'
    )
  );

-- Students can see predictions for their assigned line
CREATE POLICY "student_own_predictions" ON ai_predictions
  FOR SELECT
  USING (
    line_id IN (
      SELECT line_id FROM users 
      WHERE users.id = current_setting('app.user_id', true)::varchar
    )
  );
