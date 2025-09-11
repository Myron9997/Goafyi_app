-- Fix booking_requests status constraint to include new status values
-- This migration adds the missing status values to the check constraint

-- First, drop the existing constraint
ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS booking_requests_status_check;

-- Add the new constraint with all status values
ALTER TABLE booking_requests ADD CONSTRAINT booking_requests_status_check 
CHECK (status IN (
  'pending', 
  'accepted', 
  'declined', 
  'expired', 
  'countered', 
  'cancelled', 
  'confirmed', 
  'settled_offline'
));

-- Also add the new columns for counter offers if they don't exist
ALTER TABLE booking_requests 
ADD COLUMN IF NOT EXISTS counter_offer_details TEXT,
ADD COLUMN IF NOT EXISTS counter_offer_price DECIMAL(10,2);

-- Add comments for documentation
COMMENT ON COLUMN booking_requests.counter_offer_details IS 'Details of the counter offer made by vendor';
COMMENT ON COLUMN booking_requests.counter_offer_price IS 'New price proposed in counter offer';
