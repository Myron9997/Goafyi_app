-- Complete database migration for booking requests system
-- Run this in your Supabase SQL editor

-- 1. Create booking_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  notes TEXT,
  requested_changes TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  counter_offer_details TEXT,
  counter_offer_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create booking_request_dates table if it doesn't exist
CREATE TABLE IF NOT EXISTS booking_request_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Drop existing constraint if it exists
ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS booking_requests_status_check;

-- 4. Add the updated constraint with all status values
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

-- 5. Add new columns if they don't exist
ALTER TABLE booking_requests 
ADD COLUMN IF NOT EXISTS counter_offer_details TEXT,
ADD COLUMN IF NOT EXISTS counter_offer_price DECIMAL(10,2);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_requests_vendor_id ON booking_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_user_id ON booking_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_request_dates_request_id ON booking_request_dates(request_id);
CREATE INDEX IF NOT EXISTS idx_booking_request_dates_event_date ON booking_request_dates(event_date);

-- 7. Add RLS policies
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_request_dates ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for booking_requests
-- Vendors can read/write their own requests
CREATE POLICY "Vendors can manage their requests" ON booking_requests
  FOR ALL USING (vendor_id = auth.uid());

-- Users can read/write their own requests
CREATE POLICY "Users can manage their requests" ON booking_requests
  FOR ALL USING (user_id = auth.uid());

-- 9. RLS Policies for booking_request_dates
-- Users can read/write dates for their requests
CREATE POLICY "Users can manage request dates" ON booking_request_dates
  FOR ALL USING (
    request_id IN (
      SELECT id FROM booking_requests 
      WHERE user_id = auth.uid() OR vendor_id = auth.uid()
    )
  );

-- 10. Add comments for documentation
COMMENT ON TABLE booking_requests IS 'Stores booking requests from users to vendors';
COMMENT ON TABLE booking_request_dates IS 'Stores the dates for each booking request';
COMMENT ON COLUMN booking_requests.counter_offer_details IS 'Details of the counter offer made by vendor';
COMMENT ON COLUMN booking_requests.counter_offer_price IS 'New price proposed in counter offer';
COMMENT ON COLUMN booking_requests.status IS 'Current status of the booking request';

-- 11. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booking_requests_updated_at 
  BEFORE UPDATE ON booking_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
