-- Production RLS Policies for vendor_onboarding_applications
-- These policies properly handle anonymous users and maintain security

-- First, enable RLS
ALTER TABLE vendor_onboarding_applications ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow all operations on vendor_onboarding_applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can view all vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can update vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Anyone can create vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can delete vendor onboarding applications" ON vendor_onboarding_applications;

-- Policy 1: Allow anonymous users to INSERT new applications
-- This is needed for the signup form to work
CREATE POLICY "Allow anonymous insert for vendor onboarding" ON vendor_onboarding_applications
  FOR INSERT 
  WITH CHECK (true);

-- Policy 2: Only authenticated admins can SELECT (view) applications
CREATE POLICY "Admins can view vendor onboarding applications" ON vendor_onboarding_applications
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy 3: Only authenticated admins can UPDATE applications
CREATE POLICY "Admins can update vendor onboarding applications" ON vendor_onboarding_applications
  FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy 4: Only authenticated admins can DELETE applications
CREATE POLICY "Admins can delete vendor onboarding applications" ON vendor_onboarding_applications
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Test the policies
-- This should work: Anonymous users can insert
-- This should work: Admins can view/update/delete
-- This should fail: Non-admin users cannot view/update/delete
