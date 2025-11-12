-- ============================================================================
-- CREATE INTENSIVE SCHEDULES TABLE
-- ============================================================================
-- This table stores schedule definitions (single, range, recurring)
-- Time slots are linked to schedules via schedule_id

CREATE TABLE IF NOT EXISTS intensive_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('single', 'range', 'recurring')),
  name TEXT, -- Optional name for the schedule
  
  -- Common fields
  max_bookings INTEGER DEFAULT 1,
  slot_length INTEGER DEFAULT 30, -- minutes
  
  -- Single schedule fields
  single_date DATE,
  single_time TIME,
  
  -- Range schedule fields
  start_date DATE,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  exclude_weekends BOOLEAN DEFAULT false,
  
  -- Recurring schedule fields
  recurring_start_date DATE,
  recurring_end_date DATE,
  recurring_start_time TIME,
  recurring_end_time TIME,
  days_of_week INTEGER[], -- Array of day numbers: [1,2,3,4] for Mon-Thu
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Add schedule_id to time_slots
ALTER TABLE intensive_time_slots 
ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES intensive_schedules(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intensive_schedules_type ON intensive_schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_intensive_schedules_active ON intensive_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_intensive_time_slots_schedule ON intensive_time_slots(schedule_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_intensive_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_intensive_schedules_timestamp
  BEFORE UPDATE ON intensive_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_intensive_schedules_updated_at();

-- RLS Policies
ALTER TABLE intensive_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage schedules
CREATE POLICY "Admins can manage schedules"
  ON intensive_schedules
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

COMMENT ON TABLE intensive_schedules IS 'Schedule definitions for intensive calibration calls';
COMMENT ON COLUMN intensive_schedules.schedule_type IS 'Type of schedule: single, range, or recurring';
COMMENT ON COLUMN intensive_schedules.days_of_week IS 'Array of day numbers (0=Sunday, 1=Monday, etc.) for recurring schedules';

