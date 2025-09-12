-- Setup Admin User for GoaFYI
-- Run this in your Supabase SQL editor

-- 1. First, let's check if the user already exists and get their current role
-- This will help us understand the current state
SELECT id, email, role, created_at 
FROM users 
WHERE email = 'myronrebello97@gmail.com';

-- 2. Check if they have a vendor profile
SELECT v.id, v.business_name, v.category, v.is_verified, v.user_id
FROM vendors v
JOIN users u ON v.user_id = u.id
WHERE u.email = 'myronrebello97@gmail.com';

-- 3. Update the user to have admin role (this won't conflict with vendor role)
-- A user can be both a vendor and an admin
UPDATE users 
SET role = 'admin'
WHERE email = 'myronrebello97@gmail.com';

-- 4. Verify the update
SELECT id, email, role, full_name, created_at 
FROM users 
WHERE email = 'myronrebello97@gmail.com';

-- 5. If the user doesn't exist yet, create them
-- (Only run this if the SELECT above returns no results)
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

-- 6. Final verification - check both user and vendor status
SELECT 
  u.id,
  u.email,
  u.role,
  u.full_name,
  v.id as vendor_id,
  v.business_name,
  v.category,
  v.is_verified as vendor_verified
FROM users u
LEFT JOIN vendors v ON v.user_id = u.id
WHERE u.email = 'myronrebello97@gmail.com';

-- 7. Ensure the user can access both admin and vendor features
-- The user will have role = 'admin' but can still access vendor features
-- through their vendor profile (if it exists)

-- Note: 
-- - The user will be able to sign in with email: myronrebello97@gmail.com
-- - Password: Kn0wledge@289!!
-- - They will have admin privileges in the admin panel
-- - If they have a vendor profile, they can still access vendor features
-- - No conflicts will occur as the admin role is separate from vendor functionality
