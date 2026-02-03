-- Migration: Create schedules and time_slots tables for admin scheduling system
-- Created: 2026-02-01

-- ============================================================================
-- STAFF - Team members (coaches, admins, contractors)
-- ============================================================================
-- Separate from user_accounts to keep member data clean and allow for:
-- - Staff-specific fields (rates, bio, certifications, etc.)
-- - External contractors who may not be users
-- - Use beyond scheduling: CRM assignments, support, content attribution
-- - Future scaling with team management features

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to user_accounts (optional - allows external contractors)
  user_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
  
  -- Display info (can differ from user_accounts for scheduling purposes)
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT, -- For public booking pages
  
  -- What this person can do
  event_types TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['intensive_calibration', 'coaching_1on1', 'sales_call']
  
  -- Scheduling preferences
  default_buffer_minutes INTEGER NOT NULL DEFAULT 15, -- Gap between meetings
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  
  -- Weekly availability (when this person can be scheduled)
  -- Format: { "monday": { "enabled": true, "start": "09:00", "end": "17:00" }, ... }
  availability JSONB NOT NULL DEFAULT '{
    "monday": { "enabled": true, "start": "09:00", "end": "17:00" },
    "tuesday": { "enabled": true, "start": "09:00", "end": "17:00" },
    "wednesday": { "enabled": true, "start": "09:00", "end": "17:00" },
    "thursday": { "enabled": true, "start": "09:00", "end": "17:00" },
    "friday": { "enabled": true, "start": "09:00", "end": "17:00" },
    "saturday": { "enabled": false, "start": "10:00", "end": "14:00" },
    "sunday": { "enabled": false, "start": "10:00", "end": "14:00" }
  }'::jsonb,
  
  -- Future extensibility
  hourly_rate DECIMAL(10,2), -- For billing/tracking
  department TEXT, -- e.g., 'Sales', 'Coaching', 'Support'
  manager_id UUID REFERENCES staff(id) ON DELETE SET NULL, -- Team hierarchy
  internal_notes TEXT, -- Admin-only notes
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for staff lookups
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department) WHERE department IS NOT NULL;

-- ============================================================================
-- SCHEDULES - Availability patterns for team members
-- ============================================================================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Team member assignment (NULL = unassigned/any available staff)
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL DEFAULT 'intensive_calibration',
  meeting_type TEXT NOT NULL DEFAULT 'one_on_one' CHECK (meeting_type IN ('one_on_one', 'group')),
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('single', 'range', 'recurring')),
  name TEXT,
  max_bookings INTEGER NOT NULL DEFAULT 1,
  slot_length INTEGER NOT NULL DEFAULT 30,
  
  -- Buffer time between meetings (inherits from staff default if not set)
  buffer_minutes INTEGER NOT NULL DEFAULT 15,
  
  -- Single schedule fields
  single_date DATE,
  single_time TIME,
  
  -- Range schedule fields
  start_date DATE,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  exclude_weekends BOOLEAN DEFAULT true,
  
  -- Recurring schedule fields
  recurring_start_date DATE,
  recurring_end_date DATE,
  recurring_start_time TIME,
  recurring_end_time TIME,
  days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc.
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SCHEDULE TIME SLOTS - Individual bookable slots
-- ============================================================================
CREATE TABLE IF NOT EXISTS schedule_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  
  -- Staff assignment (denormalized for efficient conflict queries)
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL DEFAULT 'intensive_calibration',
  meeting_type TEXT NOT NULL DEFAULT 'one_on_one',
  date DATE NOT NULL,
  time TIME NOT NULL,
  
  -- Duration and buffer for conflict checking
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER NOT NULL DEFAULT 15,
  
  available BOOLEAN NOT NULL DEFAULT true,
  max_bookings INTEGER NOT NULL DEFAULT 1,
  current_bookings INTEGER NOT NULL DEFAULT 0,
  
  -- Link to video_sessions when booked
  video_session_id UUID REFERENCES video_sessions(id) ON DELETE SET NULL,
  
  -- Booking metadata
  booked_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(schedule_id, date, time)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_schedule_time_slots_schedule_id ON schedule_time_slots(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_time_slots_staff_id ON schedule_time_slots(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedule_time_slots_date ON schedule_time_slots(date);
CREATE INDEX IF NOT EXISTS idx_schedule_time_slots_available ON schedule_time_slots(available);
CREATE INDEX IF NOT EXISTS idx_schedule_time_slots_video_session ON schedule_time_slots(video_session_id);
CREATE INDEX IF NOT EXISTS idx_schedule_time_slots_booked_by ON schedule_time_slots(booked_by_user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_staff_id ON schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedules_event_type ON schedules(event_type);
CREATE INDEX IF NOT EXISTS idx_schedules_is_active ON schedules(is_active);

-- Composite index for conflict checking (staff + date + time range)
CREATE INDEX IF NOT EXISTS idx_schedule_time_slots_conflict_check 
  ON schedule_time_slots(staff_id, date, time) 
  WHERE video_session_id IS NOT NULL;

-- Enable RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_time_slots ENABLE ROW LEVEL SECURITY;

-- Admin can do everything with schedules
CREATE POLICY "Admins can manage schedules"
  ON schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
      AND user_accounts.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
      AND user_accounts.role IN ('admin', 'super_admin')
    )
  );

-- Everyone can view active schedules
CREATE POLICY "Anyone can view active schedules"
  ON schedules
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admin can manage schedule_time_slots
CREATE POLICY "Admins can manage schedule_time_slots"
  ON schedule_time_slots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
      AND user_accounts.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
      AND user_accounts.role IN ('admin', 'super_admin')
    )
  );

-- Everyone can view available schedule_time_slots
CREATE POLICY "Anyone can view available schedule_time_slots"
  ON schedule_time_slots
  FOR SELECT
  TO authenticated
  USING (available = true);

-- Updated_at trigger for schedules
CREATE OR REPLACE FUNCTION update_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_schedules_updated_at();


-- ============================================================================
-- CONFLICT CHECKING FUNCTION
-- ============================================================================

-- Function to check if a staff member has a scheduling conflict
-- Returns TRUE if there IS a conflict, FALSE if the slot is available
CREATE OR REPLACE FUNCTION check_staff_schedule_conflict(
  p_staff_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_duration_minutes INTEGER,
  p_buffer_minutes INTEGER,
  p_exclude_slot_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_slot_start TIMESTAMP;
  v_slot_end TIMESTAMP;
  v_conflict_count INTEGER;
BEGIN
  -- If no staff assigned, no conflict check needed
  IF p_staff_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Calculate slot start and end times (including buffer)
  v_slot_start := (p_date + p_start_time) - (p_buffer_minutes || ' minutes')::INTERVAL;
  v_slot_end := (p_date + p_start_time) + ((p_duration_minutes + p_buffer_minutes) || ' minutes')::INTERVAL;
  
  -- Check for overlapping booked slots
  SELECT COUNT(*)
  INTO v_conflict_count
  FROM schedule_time_slots s
  WHERE s.staff_id = p_staff_id
    AND s.video_session_id IS NOT NULL  -- Only check booked slots
    AND s.id != COALESCE(p_exclude_slot_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND (
      -- The existing slot's time range overlaps with our requested time range
      (s.date + s.time - (s.buffer_minutes || ' minutes')::INTERVAL) < v_slot_end
      AND (s.date + s.time + ((s.duration_minutes + s.buffer_minutes) || ' minutes')::INTERVAL) > v_slot_start
    );
  
  RETURN v_conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get available slots for a staff member on a date
-- Returns slots that don't have conflicts
CREATE OR REPLACE FUNCTION get_available_staff_slots(
  p_staff_id UUID,
  p_date DATE,
  p_event_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  slot_id UUID,
  slot_time TIME,
  duration_minutes INTEGER,
  event_type TEXT,
  meeting_type TEXT,
  staff_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.time,
    s.duration_minutes,
    s.event_type,
    s.meeting_type,
    st.display_name
  FROM schedule_time_slots s
  JOIN staff st ON s.staff_id = st.id
  WHERE s.staff_id = p_staff_id
    AND s.date = p_date
    AND s.available = true
    AND s.video_session_id IS NULL
    AND (p_event_type IS NULL OR s.event_type = p_event_type)
    AND NOT check_staff_schedule_conflict(
      s.staff_id,
      s.date,
      s.time,
      s.duration_minutes,
      s.buffer_minutes,
      NULL
    )
  ORDER BY s.time;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEDULING STAFF RLS POLICIES
-- ============================================================================
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Admin can manage scheduling staff
CREATE POLICY "Admins can manage staff"
  ON staff
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
      AND user_accounts.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
      AND user_accounts.role IN ('admin', 'super_admin')
    )
  );

-- Everyone can view active staff (for booking UI)
CREATE POLICY "Anyone can view active staff"
  ON staff
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Updated_at trigger for staff
CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_schedules_updated_at();

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE staff IS 'Team members (coaches, admins, contractors) - used for scheduling, CRM, support, and more';
COMMENT ON TABLE schedules IS 'Availability patterns for team members - can be single slots, date ranges, or recurring';
COMMENT ON TABLE schedule_time_slots IS 'Individual bookable time slots with conflict-aware booking';
COMMENT ON FUNCTION check_staff_schedule_conflict IS 'Returns TRUE if staff member has a scheduling conflict at the given time';
COMMENT ON FUNCTION get_available_staff_slots IS 'Returns available slots for a staff member, excluding conflicting times';
