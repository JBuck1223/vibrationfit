-- Migration: Dynamic Calendar & Scheduling System
-- Created: 2026-02-02
-- Description: Full calendar system with bookings, events, and dynamic availability
-- 
-- WHAT THIS DOES:
-- 1. Removes old slot-based scheduling (schedules, schedule_time_slots)
-- 2. Creates bookings table for 1:1 appointments
-- 3. Creates calendar_events table for all events (bookings auto-sync)
-- 4. Adds group session + RSVP support to video_sessions
-- 5. Availability is now calculated dynamically from staff availability minus calendar events

-- ============================================================================
-- CLEANUP OLD SLOT-BASED SYSTEM
-- ============================================================================
DROP TABLE IF EXISTS schedule_time_slots CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP FUNCTION IF EXISTS check_staff_schedule_conflict CASCADE;
DROP FUNCTION IF EXISTS get_available_staff_slots CASCADE;

-- ============================================================================
-- BOOKINGS - 1:1 Appointment requests from clients/users
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- What
  event_type TEXT NOT NULL, -- intensive_calibration, coaching_1on1, sales_call, etc.
  title TEXT,
  description TEXT,
  
  -- When
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- How
  meeting_type TEXT NOT NULL DEFAULT 'video',
  location TEXT, -- For in-person meetings or video link
  
  -- Video integration (optional - only for video meetings)
  video_session_id UUID REFERENCES video_sessions(id) ON DELETE SET NULL,
  
  -- Contact info
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'confirmed',
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  
  -- Notes
  staff_notes TEXT,
  client_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT bookings_meeting_type_check CHECK (meeting_type IN ('video', 'phone', 'in_person')),
  CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'))
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON bookings(staff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_event_type ON bookings(event_type);

-- ============================================================================
-- CALENDAR_EVENTS - All events (bookings + personal + travel + blocked)
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who created it
  
  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Categorization
  event_source TEXT NOT NULL DEFAULT 'manual',
  event_category TEXT NOT NULL DEFAULT 'personal',
  
  -- Timing
  scheduled_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Recurrence (for future Google Calendar sync)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE format
  recurrence_parent_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  -- Availability impact
  blocks_availability BOOLEAN NOT NULL DEFAULT true,
  
  -- Links
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  video_session_id UUID REFERENCES video_sessions(id) ON DELETE SET NULL,
  
  -- Privacy
  is_private BOOLEAN DEFAULT false, -- Hide details from others
  
  -- Visual
  color TEXT, -- Optional custom color
  
  -- Status
  status TEXT NOT NULL DEFAULT 'confirmed',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT calendar_events_source_check CHECK (event_source IN ('booking', 'manual', 'travel', 'external_sync', 'system')),
  CONSTRAINT calendar_events_category_check CHECK (event_category IN (
    'client_call', 'internal', 'speaking', 'travel', 'conference', 'personal', 'blocked', 'focus', 'other'
  )),
  CONSTRAINT calendar_events_status_check CHECK (status IN ('tentative', 'confirmed', 'cancelled'))
);

-- Indexes for calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_staff_id ON calendar_events(staff_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_scheduled_at ON calendar_events(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_at ON calendar_events(end_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_booking_id ON calendar_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_blocks ON calendar_events(staff_id, scheduled_at, end_at) 
  WHERE blocks_availability = true AND status != 'cancelled';

-- ============================================================================
-- ADD STAFF REFERENCE TO VIDEO SESSIONS
-- ============================================================================
ALTER TABLE video_sessions 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;

ALTER TABLE video_sessions 
ADD COLUMN IF NOT EXISTS event_type TEXT;

ALTER TABLE video_sessions 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Group session support
ALTER TABLE video_sessions
ADD COLUMN IF NOT EXISTS is_group_session BOOLEAN DEFAULT false;

ALTER TABLE video_sessions
ADD COLUMN IF NOT EXISTS rsvp_enabled BOOLEAN DEFAULT false;

ALTER TABLE video_sessions
ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_video_sessions_staff_id ON video_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_booking_id ON video_sessions(booking_id);

-- ============================================================================
-- RSVP TRACKING FOR GROUP SESSIONS
-- ============================================================================
ALTER TABLE video_session_participants
ADD COLUMN IF NOT EXISTS rsvp_status TEXT DEFAULT 'invited';

ALTER TABLE video_session_participants
ADD COLUMN IF NOT EXISTS rsvp_at TIMESTAMPTZ;

ALTER TABLE video_session_participants
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

ALTER TABLE video_session_participants
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add constraint separately (can't do inline with IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_participants_rsvp_check'
  ) THEN
    ALTER TABLE video_session_participants
    ADD CONSTRAINT video_participants_rsvp_check 
    CHECK (rsvp_status IN ('invited', 'registered', 'declined', 'maybe'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_video_participants_rsvp ON video_session_participants(session_id, rsvp_status);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER: Auto-create calendar event when booking is created
-- ============================================================================
CREATE OR REPLACE FUNCTION create_calendar_event_for_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO calendar_events (
    staff_id,
    user_id,
    title,
    description,
    scheduled_at,
    end_at,
    timezone,
    event_source,
    event_category,
    blocks_availability,
    booking_id,
    video_session_id,
    status
  ) VALUES (
    NEW.staff_id,
    NEW.user_id,
    COALESCE(NEW.title, 'Booking: ' || NEW.event_type),
    NEW.description,
    NEW.scheduled_at,
    NEW.scheduled_at + (NEW.duration_minutes || ' minutes')::INTERVAL,
    NEW.timezone,
    'booking',
    'client_call',
    true,
    NEW.id,
    NEW.video_session_id,
    CASE WHEN NEW.status = 'pending' THEN 'tentative' ELSE 'confirmed' END
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_create_calendar_event ON bookings;
CREATE TRIGGER booking_create_calendar_event
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_calendar_event_for_booking();

-- ============================================================================
-- TRIGGER: Update calendar event when booking changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_calendar_event_for_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE calendar_events
  SET 
    status = CASE 
      WHEN NEW.status IN ('cancelled', 'no_show') THEN 'cancelled'
      WHEN NEW.status = 'pending' THEN 'tentative'
      ELSE 'confirmed'
    END,
    scheduled_at = NEW.scheduled_at,
    end_at = NEW.scheduled_at + (NEW.duration_minutes || ' minutes')::INTERVAL,
    title = COALESCE(NEW.title, 'Booking: ' || NEW.event_type),
    staff_id = NEW.staff_id
  WHERE booking_id = NEW.id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_update_calendar_event ON bookings;
CREATE TRIGGER booking_update_calendar_event
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_event_for_booking();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Bookings RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "bookings_user_select" ON bookings FOR SELECT
  USING (user_id = auth.uid());

-- Staff can view bookings assigned to them
CREATE POLICY "bookings_staff_select" ON bookings FOR SELECT
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- Admins can view all bookings
CREATE POLICY "bookings_admin_select" ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Users can create bookings
CREATE POLICY "bookings_user_insert" ON bookings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own bookings (cancel, reschedule)
CREATE POLICY "bookings_user_update" ON bookings FOR UPDATE
  USING (user_id = auth.uid());

-- Staff can update bookings assigned to them
CREATE POLICY "bookings_staff_update" ON bookings FOR UPDATE
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- Admins can manage all bookings
CREATE POLICY "bookings_admin_all" ON bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Calendar Events RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Staff can view their own calendar
CREATE POLICY "calendar_staff_select" ON calendar_events FOR SELECT
  USING (
    staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- Admins can view all calendars
CREATE POLICY "calendar_admin_select" ON calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Staff can manage their own calendar
CREATE POLICY "calendar_staff_all" ON calendar_events FOR ALL
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- Admins can manage all calendars
CREATE POLICY "calendar_admin_all" ON calendar_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE bookings IS '1:1 appointment bookings from clients/users. Auto-creates calendar_event.';
COMMENT ON TABLE calendar_events IS 'All calendar events - client calls (from bookings), personal, travel, speaking, blocked time. Blocks availability when blocks_availability=true.';

COMMENT ON COLUMN bookings.event_type IS 'Type of booking: intensive_calibration, coaching_1on1, sales_call, etc.';
COMMENT ON COLUMN bookings.meeting_type IS 'How the meeting happens: video, phone, or in_person';
COMMENT ON COLUMN bookings.video_session_id IS 'Links to Daily.co video session if meeting_type is video';

COMMENT ON COLUMN calendar_events.event_source IS 'Where event came from: booking (auto-created), manual, travel, external_sync';
COMMENT ON COLUMN calendar_events.event_category IS 'Category for display: client_call, speaking, travel, personal, blocked, focus';
COMMENT ON COLUMN calendar_events.blocks_availability IS 'If true, this event blocks booking availability for this staff member';

COMMENT ON COLUMN video_sessions.is_group_session IS 'True for group sessions where multiple people can join';
COMMENT ON COLUMN video_sessions.rsvp_enabled IS 'True if RSVP tracking is enabled';
COMMENT ON COLUMN video_session_participants.rsvp_status IS 'RSVP: invited (default), registered (confirmed attending), declined, maybe';

-- ============================================================================
-- ADD ADMIN ACCESS TO VIDEO SESSIONS
-- ============================================================================
-- Admins should be able to see and manage all video sessions

CREATE POLICY "video_sessions_admin_select" ON video_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "video_sessions_admin_all" ON video_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
