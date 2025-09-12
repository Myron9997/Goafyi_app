-- Complete Admin Setup for GoaFYI
-- Run this in your Supabase SQL editor to set up admin access

-- ==============================================
-- 1. ADMIN USER SETUP
-- ==============================================

-- Check current user status
SELECT 'Current user status:' as info;
SELECT id, email, role, full_name, created_at 
FROM users 
WHERE email = 'myronrebello97@gmail.com';

-- Check vendor profile if exists
SELECT 'Vendor profile status:' as info;
SELECT v.id, v.business_name, v.category, v.is_verified, v.user_id
FROM vendors v
JOIN users u ON v.user_id = u.id
WHERE u.email = 'myronrebello97@gmail.com';

-- Update user to admin role (preserves vendor profile if exists)
UPDATE users 
SET role = 'admin', updated_at = NOW()
WHERE email = 'myronrebello97@gmail.com';

-- If user doesn't exist, create them
INSERT INTO users (id, email, full_name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'myronrebello97@gmail.com',
  'Myron Rebello',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- ==============================================
-- 2. RLS POLICIES FOR ADMIN ACCESS
-- ==============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can view all vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can update all vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can insert vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can delete vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Admins can update all booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Admins can view all packages" ON packages;
DROP POLICY IF EXISTS "Admins can update all packages" ON packages;
DROP POLICY IF EXISTS "Admins can view all ratings" ON ratings;
DROP POLICY IF EXISTS "Admins can update all ratings" ON ratings;

-- Users table policies
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

-- Vendors table policies
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

-- Bookings table policies
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

-- Booking requests table policies
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

-- Packages table policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packages') THEN
        EXECUTE 'CREATE POLICY "Admins can view all packages" ON packages
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM users 
              WHERE id = auth.uid() AND role = ''admin''
            )
          )';
        
        EXECUTE 'CREATE POLICY "Admins can update all packages" ON packages
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM users 
              WHERE id = auth.uid() AND role = ''admin''
            )
          )';
    END IF;
END $$;

-- Ratings table policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ratings') THEN
        EXECUTE 'CREATE POLICY "Admins can view all ratings" ON ratings
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM users 
              WHERE id = auth.uid() AND role = ''admin''
            )
          )';
        
        EXECUTE 'CREATE POLICY "Admins can update all ratings" ON ratings
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM users 
              WHERE id = auth.uid() AND role = ''admin''
            )
          )';
    END IF;
END $$;

-- ==============================================
-- 3. VERIFICATION
-- ==============================================

-- Final verification
SELECT 'Final setup verification:' as info;
SELECT 
  u.id,
  u.email,
  u.role,
  u.full_name,
  v.id as vendor_id,
  v.business_name,
  v.category,
  v.is_verified as vendor_verified,
  CASE 
    WHEN v.id IS NOT NULL THEN 'Admin + Vendor'
    ELSE 'Admin Only'
  END as account_type
FROM users u
LEFT JOIN vendors v ON v.user_id = u.id
WHERE u.email = 'myronrebello97@gmail.com';

-- ==============================================
-- 4. INSTRUCTIONS
-- ==============================================

/*
SETUP COMPLETE! 

Admin Credentials:
- Email: myronrebello97@gmail.com
- Password: Kn0wledge@289!!

Access URLs:
- Admin Panel: /admin_access
- Admin Dashboard: /admin/dashboard

Features Available:
✅ Admin panel access with full privileges
✅ View all users, vendors, bookings
✅ Manage vendor verifications
✅ Suspend/activate users
✅ View comprehensive analytics
✅ Real-time data from database

Vendor Features (if vendor profile exists):
✅ Can still access vendor dashboard
✅ Can manage vendor profile
✅ Can view vendor bookings
✅ No conflicts with admin role

Security:
✅ RLS policies protect all data
✅ Admin-only access to sensitive operations
✅ Secure authentication via Supabase Auth
✅ Role-based access control

Next Steps:
1. Sign in to /admin_access with the credentials above
2. Test admin panel functionality
3. Verify vendor features still work (if applicable)
4. Customize admin panel as needed
*/
