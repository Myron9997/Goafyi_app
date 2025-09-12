-- Vendor Documents Storage Setup
-- This creates storage buckets and policies for vendor document uploads

-- 1. Create storage bucket for vendor documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-documents',
  'vendor-documents',
  false, -- Private bucket for security
  10485760, -- 10MB file size limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
);

-- 2. Create storage bucket for vendor onboarding applications (temporary)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-onboarding',
  'vendor-onboarding',
  false, -- Private bucket for security
  10485760, -- 10MB file size limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
);

-- 3. RLS Policies for vendor-onboarding bucket (applications)

-- Policy: Anyone can upload files during onboarding (for new applications)
CREATE POLICY "Anyone can upload onboarding documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'vendor-onboarding' AND
  auth.role() = 'anon'
);

-- Policy: Only admins can view onboarding documents
CREATE POLICY "Admins can view onboarding documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'vendor-onboarding' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy: Only admins can delete onboarding documents
CREATE POLICY "Admins can delete onboarding documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'vendor-onboarding' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 4. RLS Policies for vendor-documents bucket (approved vendors)

-- Policy: Vendors can upload their own documents
CREATE POLICY "Vendors can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'vendor-documents' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'vendor'
  )
);

-- Policy: Vendors can view their own documents
CREATE POLICY "Vendors can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'vendor-documents' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'vendor'
  )
);

-- Policy: Admins can view all vendor documents
CREATE POLICY "Admins can view all vendor documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'vendor-documents' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy: Admins can delete vendor documents
CREATE POLICY "Admins can delete vendor documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'vendor-documents' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 5. Helper function to generate unique file paths
CREATE OR REPLACE FUNCTION generate_vendor_document_path(
  application_id UUID,
  document_type TEXT,
  file_extension TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN 'applications/' || application_id || '/' || document_type || '_' || extract(epoch from now()) || '.' || file_extension;
END;
$$ LANGUAGE plpgsql;

-- 6. Helper function to get signed URL for document access
CREATE OR REPLACE FUNCTION get_document_url(
  bucket_name TEXT,
  file_path TEXT,
  expires_in INTEGER DEFAULT 3600
)
RETURNS TEXT AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- This function would be called from your application code
  -- to generate signed URLs for document access
  RETURN 'https://your-project.supabase.co/storage/v1/object/sign/' || bucket_name || '/' || file_path || '?token=...';
END;
$$ LANGUAGE plpgsql;
