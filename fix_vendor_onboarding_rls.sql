-- Fix RLS policies for vendor_onboarding_applications table
-- This allows anonymous users to create applications

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can update vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Anyone can create vendor onboarding applications" ON vendor_onboarding_applications;

-- Create new policies that work properly

-- Policy: Anyone can insert new applications (for signup)
CREATE POLICY "Anyone can create vendor onboarding applications" ON vendor_onboarding_applications
  FOR INSERT WITH CHECK (true);

-- Policy: Only admins can view all applications
CREATE POLICY "Admins can view all vendor onboarding applications" ON vendor_onboarding_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can update applications (for review/approval)
CREATE POLICY "Admins can update vendor onboarding applications" ON vendor_onboarding_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can delete applications
CREATE POLICY "Admins can delete vendor onboarding applications" ON vendor_onboarding_applications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
