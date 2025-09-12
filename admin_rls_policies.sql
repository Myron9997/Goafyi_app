-- Admin RLS Policies for GoaFYI
-- Run this in your Supabase SQL editor to enable admin access

-- 1. Create admin role if it doesn't exist
-- Note: This assumes you have a user with role 'admin' in your users table

-- 2. Admin policies for users table
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Admin policies for vendors table
CREATE POLICY "Admins can view all vendors" ON vendors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all vendors" ON vendors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert vendors" ON vendors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete vendors" ON vendors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Admin policies for bookings table
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all bookings" ON bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Admin policies for booking_requests table
CREATE POLICY "Admins can view all booking requests" ON booking_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all booking requests" ON booking_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Admin policies for packages table (if exists)
CREATE POLICY "Admins can view all packages" ON packages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all packages" ON packages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Admin policies for ratings table (if exists)
CREATE POLICY "Admins can view all ratings" ON ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all ratings" ON ratings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Create an admin user (replace with your admin email)
-- INSERT INTO users (id, email, full_name, role) 
-- VALUES (
--   'your-admin-user-id-here',
--   'admin@goafyi.com',
--   'Admin User',
--   'admin'
-- );

-- Note: You'll need to:
-- 1. Create an admin user account through Supabase Auth
-- 2. Update the users table to set role = 'admin' for that user
-- 3. Use that admin account to sign in to the admin panel
