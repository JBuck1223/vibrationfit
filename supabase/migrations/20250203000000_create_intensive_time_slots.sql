-- ============================================================================
-- CREATE INTENSIVE TIME SLOTS TABLE
-- ============================================================================
-- This table stores available time slots for intensive calibration calls
-- Admin can manage slots, and users can book appointments

CREATE TABLE IF NOT EXISTS intensive_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  available BOOLEAN DEFAULT true,
  max_bookings INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique date/time combinations
  UNIQUE(date, time)
);

-- Index for efficient date queries
CREATE INDEX IF NOT EXISTS idx_intensive_time_slots_date ON intensive_time_slots(date);
CREATE INDEX IF NOT EXISTS idx_intensive_time_slots_available ON intensive_time_slots(available) WHERE available = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_intensive_time_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_intensive_time_slots_timestamp
  BEFORE UPDATE ON intensive_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_intensive_time_slots_updated_at();

-- RLS Policies
ALTER TABLE intensive_time_slots ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view available slots
CREATE POLICY "Anyone can view available time slots"
  ON intensive_time_slots
  FOR SELECT
  USING (available = true);

-- Policy: Admins can manage all slots
CREATE POLICY "Admins can manage time slots"
  ON intensive_time_slots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.email IN ('buckinghambliss@gmail.com', 'admin@vibrationfit.com')
        OR auth.users.user_metadata->>'is_admin' = 'true'
      )
    )
  );

COMMENT ON TABLE intensive_time_slots IS 'Available time slots for intensive calibration calls';
COMMENT ON COLUMN intensive_time_slots.max_bookings IS 'Maximum number of bookings allowed for this slot';
COMMENT ON COLUMN intensive_time_slots.available IS 'Whether this slot is currently available for booking';

