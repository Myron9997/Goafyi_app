-- Vendor Onboarding Application Table
-- This table stores vendor applications before they are approved and given access

CREATE TABLE IF NOT EXISTS vendor_onboarding_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  categories TEXT[] NOT NULL, -- Array of selected categories
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  full_address TEXT NOT NULL,
  website TEXT,
  description TEXT,
  
  -- Document uploads (stored as file paths/URLs)
  fssai_license TEXT, -- For food/catering businesses
  business_license TEXT, -- General business license
  gst_certificate TEXT, -- GST registration
  other_documents TEXT[], -- Array of other document paths
  
  -- Application status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admin_notes TEXT, -- Admin can add notes during review
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id) -- Admin who reviewed
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_onboarding_email ON vendor_onboarding_applications(email);
CREATE INDEX IF NOT EXISTS idx_vendor_onboarding_status ON vendor_onboarding_applications(status);
CREATE INDEX IF NOT EXISTS idx_vendor_onboarding_created_at ON vendor_onboarding_applications(created_at);

-- Add RLS policies
ALTER TABLE vendor_onboarding_applications ENABLE ROW LEVEL SECURITY;

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

-- Policy: Anyone can insert new applications (for signup)
CREATE POLICY "Anyone can create vendor onboarding applications" ON vendor_onboarding_applications
  FOR INSERT WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_onboarding_updated_at
  BEFORE UPDATE ON vendor_onboarding_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_onboarding_updated_at();
