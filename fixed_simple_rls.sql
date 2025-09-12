-- Fixed simple RLS policy for vendor_onboarding_applications
-- This avoids the NEW reference issue

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

-- Policy 1: Allow anonymous users to INSERT (we'll handle duplicates in the API)
CREATE POLICY "Allow anonymous insert" ON vendor_onboarding_applications
  FOR INSERT 
  WITH CHECK (true);

-- Policy 2: Only admins can SELECT (view) applications
CREATE POLICY "Admins can view all applications" ON vendor_onboarding_applications
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy 3: Only admins can UPDATE applications
CREATE POLICY "Admins can update all applications" ON vendor_onboarding_applications
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

-- Policy 4: Only admins can DELETE applications
CREATE POLICY "Admins can delete all applications" ON vendor_onboarding_applications
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
