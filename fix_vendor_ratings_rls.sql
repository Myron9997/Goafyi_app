-- Fix RLS policies for vendor_ratings table
-- Run this in your Supabase SQL editor

-- Drop any existing policies on vendor_ratings table
DROP POLICY IF EXISTS "Admins can view all vendor ratings" ON vendor_ratings;
DROP POLICY IF EXISTS "Admins can update all vendor ratings" ON vendor_ratings;
DROP POLICY IF EXISTS "Public can view vendor ratings" ON vendor_ratings;

-- Create admin policies for vendor_ratings table
CREATE POLICY "Admins can view all vendor ratings" ON vendor_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all vendor ratings" ON vendor_ratings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow public to view ratings (since ratings should be public for transparency)
CREATE POLICY "Public can view vendor ratings" ON vendor_ratings
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own ratings
CREATE POLICY "Users can insert own ratings" ON vendor_ratings
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Allow users to update their own ratings
CREATE POLICY "Users can update own ratings" ON vendor_ratings
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Verify the policies were created
SELECT 'Vendor ratings RLS policies created successfully' as status;
