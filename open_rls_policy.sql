-- Completely open RLS policy for testing
-- This will allow all operations for now

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
DROP POLICY IF EXISTS "Allow insert for all" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Allow select for admins only" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Allow update for admins only" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Allow delete for admins only" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Allow one submission per email and phone" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Allow anonymous insert" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can delete all applications" ON vendor_onboarding_applications;

-- Create completely open policy for testing
CREATE POLICY "Allow all operations" ON vendor_onboarding_applications
  FOR ALL 
  USING (true)
  WITH CHECK (true);
