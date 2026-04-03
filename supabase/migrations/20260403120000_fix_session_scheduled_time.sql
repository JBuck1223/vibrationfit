-- Fix scheduled_at for Alignment Gym session that started 10 min late due to
-- technical difficulties. Display should show the original 12:00 PM slot.
UPDATE video_sessions
SET scheduled_at = scheduled_at - INTERVAL '10 minutes'
WHERE id = 'ebf53904-1a74-4351-ade3-ebe8dac4dc0e';
