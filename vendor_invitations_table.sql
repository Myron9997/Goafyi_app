-- Create vendor invitations table for secure invitation system
CREATE TABLE IF NOT EXISTS vendor_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  admin_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  
  -- References
  created_by UUID REFERENCES users(id), -- Admin who created the invitation
  used_by UUID REFERENCES users(id) -- User who used the invitation (if any)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_email ON vendor_invitations(email);
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_token ON vendor_invitations(token);
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_status ON vendor_invitations(status);
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_expires_at ON vendor_invitations(expires_at);

-- Enable RLS
ALTER TABLE vendor_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins can view all invitations
CREATE POLICY "Admins can view all invitations" ON vendor_invitations
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations" ON vendor_invitations
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Only admins can update invitations
CREATE POLICY "Admins can update invitations" ON vendor_invitations
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

-- Only admins can delete invitations
CREATE POLICY "Admins can delete invitations" ON vendor_invitations
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE vendor_invitations 
  SET status = 'expired' 
  WHERE status = 'pending' 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically expire invitations
CREATE OR REPLACE FUNCTION trigger_expire_invitations()
RETURNS trigger AS $$
BEGIN
  PERFORM expire_old_invitations();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (runs on any insert/update to the table)
CREATE TRIGGER auto_expire_invitations
  AFTER INSERT OR UPDATE ON vendor_invitations
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_expire_invitations();
