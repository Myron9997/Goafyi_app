-- Simple working RLS policy for vendor_onboarding_applications
-- This uses a more permissive approach that works with anonymous users

-- Enable RLS
ALTER TABLE vendor_onboarding_applications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all operations on vendor_onboarding_applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can view all vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can view vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can update vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can delete vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Anyone can create vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Allow anonymous insert for vendor onboarding" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Anonymous users can create applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Only admins can view applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Only admins can update applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Only admins can delete applications" ON vendor_onboarding_applications;

-- Create a simple policy that allows INSERT for everyone
-- This is the most permissive approach that works with anonymous users
CREATE POLICY "Allow insert for all" ON vendor_onboarding_applications
  FOR INSERT 
  WITH CHECK (true);

-- Create a policy that only allows SELECT for admins
CREATE POLICY "Allow select for admins only" ON vendor_onboarding_applications
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create a policy that only allows UPDATE for admins
CREATE POLICY "Allow update for admins only" ON vendor_onboarding_applications
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

-- Create a policy that only allows DELETE for admins
CREATE POLICY "Allow delete for admins only" ON vendor_onboarding_applications
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
