-- Fix the infinite recursion issue in vendor_invitations trigger
-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS auto_expire_invitations ON vendor_invitations;
DROP FUNCTION IF EXISTS trigger_expire_invitations();

-- Create a safer trigger function that only runs on INSERT (not UPDATE)
CREATE OR REPLACE FUNCTION trigger_expire_invitations()
RETURNS trigger AS $$
BEGIN
  -- Only expire old invitations, don't update the current row
  UPDATE vendor_invitations 
  SET status = 'expired' 
  WHERE status = 'pending' 
  AND expires_at < NOW()
  AND id != COALESCE(NEW.id, OLD.id); -- Exclude the current row being inserted/updated
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger that only runs on INSERT (not UPDATE to prevent recursion)
CREATE TRIGGER auto_expire_invitations
  AFTER INSERT ON vendor_invitations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_expire_invitations();

-- Alternative: Create a simpler function that just expires old records without recursion
CREATE OR REPLACE FUNCTION expire_old_invitations_safe()
RETURNS void AS $$
BEGIN
  UPDATE vendor_invitations 
  SET status = 'expired' 
  WHERE status = 'pending' 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
