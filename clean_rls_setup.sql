-- Clean RLS Setup for vendor_onboarding_applications
-- This script safely removes all existing policies and creates new ones

-- Step 1: Disable RLS temporarily to clean up policies
ALTER TABLE vendor_onboarding_applications DISABLE ROW LEVEL SECURITY;

-- Step 2: Re-enable RLS
ALTER TABLE vendor_onboarding_applications ENABLE ROW LEVEL SECURITY;

-- Step 3: Create the policies (since we disabled/enabled RLS, all old policies are gone)

-- Policy 1: Allow anonymous users to INSERT new applications
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

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'vendor_onboarding_applications';
