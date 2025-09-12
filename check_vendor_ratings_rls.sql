-- SAFE: Check current RLS status for vendor_ratings table
-- This script only READS information, it doesn't change anything

-- 1. Check if vendor_ratings table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendor_ratings') 
    THEN 'vendor_ratings table EXISTS' 
    ELSE 'vendor_ratings table DOES NOT EXIST' 
  END as table_status;

-- 2. Check if RLS is enabled on vendor_ratings table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS is ENABLED' 
    ELSE 'RLS is DISABLED (public access)' 
  END as rls_status
FROM pg_tables 
WHERE tablename = 'vendor_ratings';

-- 3. List all existing policies on vendor_ratings table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'vendor_ratings'
ORDER BY policyname;

-- 4. Check if we can read from vendor_ratings (this will show if there are any ratings)
SELECT COUNT(*) as total_ratings FROM vendor_ratings;

-- 5. Show sample data (if any exists)
SELECT 
  id,
  vendor_id,
  reviewer_id,
  rating,
  created_at
FROM vendor_ratings 
LIMIT 5;
