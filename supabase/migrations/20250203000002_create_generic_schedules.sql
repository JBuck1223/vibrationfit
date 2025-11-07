-- ============================================================================
-- CREATE GENERIC SCHEDULES SYSTEM
-- ============================================================================
-- This generalizes the scheduling system to support multiple event types
-- and meeting types (one-on-one vs group)

-- Create generic schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event/Meeting classification
  event_type TEXT NOT NULL DEFAULT 'intensive_calibration', 
  -- e.g., 'intensive_calibration', 'group_workshop', 'coaching_session', 'webinar', 'masterclass'
  
  meeting_type TEXT NOT NULL DEFAULT 'one_on_one', 
  -- 'one_on_one' or 'group'
  -- For one_on_one: max_bookings = 1
  -- For group: max_bookings > 1 (max attendees per slot)
  
  -- Schedule definition
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('single', 'range', 'recurring')),
  name TEXT, -- Optional name for the schedule
  
  -- Common fields
  max_bookings INTEGER DEFAULT 1, -- For group meetings, this is max attendees per slot
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
  is_active BOOLEAN DEFAULT true,
  
  -- Additional metadata for flexibility
  metadata JSONB -- Store event-specific data (zoom link, description, etc.)
);

-- Create generic time slots table (replaces intensive_time_slots)
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  
  -- Slot details
  date DATE NOT NULL,
  time TIME NOT NULL,
  available BOOLEAN DEFAULT true,
  max_bookings INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  
  -- Event type (denormalized for performance)
  event_type TEXT NOT NULL DEFAULT 'intensive_calibration',
  meeting_type TEXT NOT NULL DEFAULT 'one_on_one',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique date/time combinations per event type
  UNIQUE(date, time, event_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedules_event_type ON schedules(event_type);
CREATE INDEX IF NOT EXISTS idx_schedules_meeting_type ON schedules(meeting_type);
CREATE INDEX IF NOT EXISTS idx_schedules_type ON schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_time_slots_schedule ON time_slots(schedule_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);
CREATE INDEX IF NOT EXISTS idx_time_slots_event_type ON time_slots(event_type);
CREATE INDEX IF NOT EXISTS idx_time_slots_meeting_type ON time_slots(meeting_type);
CREATE INDEX IF NOT EXISTS idx_time_slots_available ON time_slots(available) WHERE available = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_time_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_schedules_timestamp
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_schedules_updated_at();

CREATE TRIGGER update_time_slots_timestamp
  BEFORE UPDATE ON time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_time_slots_updated_at();

-- RLS Policies
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view available slots
CREATE POLICY "Anyone can view available time slots"
  ON time_slots
  FOR SELECT
  USING (available = true);

-- Policy: Admins can manage schedules
CREATE POLICY "Admins can manage schedules"
  ON schedules
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

-- Policy: Admins can manage time slots
CREATE POLICY "Admins can manage time slots"
  ON time_slots
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

COMMENT ON TABLE schedules IS 'Generic schedule definitions for various event types';
COMMENT ON COLUMN schedules.event_type IS 'Type of event: intensive_calibration, group_workshop, coaching_session, webinar, masterclass, etc.';
COMMENT ON COLUMN schedules.meeting_type IS 'Type of meeting: one_on_one or group';
COMMENT ON COLUMN schedules.max_bookings IS 'Maximum number of bookings/attendees per slot (1 for one-on-one, >1 for group)';

-- Migration: Copy data from intensive_schedules to schedules (if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'intensive_schedules') THEN
    INSERT INTO schedules (
      id, schedule_type, name, max_bookings, slot_length,
      single_date, single_time,
      start_date, end_date, start_time, end_time, exclude_weekends,
      recurring_start_date, recurring_end_date, recurring_start_time, recurring_end_time, days_of_week,
      created_at, updated_at, is_active, event_type, meeting_type
    )
    SELECT 
      id, schedule_type, name, max_bookings, slot_length,
      single_date, single_time,
      start_date, end_date, start_time, end_time, exclude_weekends,
      recurring_start_date, recurring_end_date, recurring_start_time, recurring_end_time, days_of_week,
      created_at, updated_at, is_active,
      'intensive_calibration' as event_type,
      CASE WHEN max_bookings > 1 THEN 'group' ELSE 'one_on_one' END as meeting_type
    FROM intensive_schedules
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Migration: Copy data from intensive_time_slots to time_slots (if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'intensive_time_slots') THEN
    INSERT INTO time_slots (
      schedule_id, date, time, available, max_bookings, current_bookings,
      event_type, meeting_type, created_at, updated_at
    )
    SELECT 
      its.schedule_id, its.date, its.time, its.available, its.max_bookings, 0 as current_bookings,
      'intensive_calibration' as event_type,
      CASE WHEN its.max_bookings > 1 THEN 'group' ELSE 'one_on_one' END as meeting_type,
      its.created_at, its.updated_at
    FROM intensive_time_slots its
    WHERE its.schedule_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
