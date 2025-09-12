-- RLS Policies for vendor_onboarding_applications with anonymous user support
-- This allows anonymous users to submit applications while protecting admin data

-- Enable RLS
ALTER TABLE vendor_onboarding_applications ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Allow all operations on vendor_onboarding_applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can view all vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can view vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can update vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Admins can delete vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Anyone can create vendor onboarding applications" ON vendor_onboarding_applications;
DROP POLICY IF EXISTS "Allow anonymous insert for vendor onboarding" ON vendor_onboarding_applications;

-- Policy 1: Allow anonymous users to INSERT new applications
-- This is crucial for the signup form to work
CREATE POLICY "Anonymous users can create applications" ON vendor_onboarding_applications
  FOR INSERT 
  WITH CHECK (true);

-- Policy 2: Only authenticated admins can SELECT (view) applications
-- Anonymous users cannot see any applications
CREATE POLICY "Only admins can view applications" ON vendor_onboarding_applications
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
-- Anonymous users cannot modify applications
CREATE POLICY "Only admins can update applications" ON vendor_onboarding_applications
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
-- Anonymous users cannot delete applications
CREATE POLICY "Only admins can delete applications" ON vendor_onboarding_applications
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Test the setup
-- This should show the policies are active
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'vendor_onboarding_applications';
