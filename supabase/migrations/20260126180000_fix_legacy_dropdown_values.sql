-- Migration: Fix legacy dropdown values to match current UI options
-- This updates old format values that don't match current dropdown options
-- Created: 2026-01-26

-- =====================================================
-- LEISURE TIME WEEKLY
-- Old formats: "20+ hours", "Less than 5 hours", "5-10 hours", "10-20 hours"
-- New formats: "0-5", "6-15", "16-25", "25+"
-- =====================================================
UPDATE user_profiles
SET leisure_time_weekly = CASE
    WHEN leisure_time_weekly ILIKE '%less than 5%' OR leisure_time_weekly ILIKE '%0-5%' THEN '0-5'
    WHEN leisure_time_weekly ILIKE '%5-10%' OR leisure_time_weekly ILIKE '%6-15%' THEN '6-15'
    WHEN leisure_time_weekly ILIKE '%10-20%' OR leisure_time_weekly ILIKE '%16-25%' THEN '16-25'
    WHEN leisure_time_weekly ILIKE '%20+%' OR leisure_time_weekly ILIKE '%25+%' THEN '25+'
    ELSE leisure_time_weekly
END
WHERE leisure_time_weekly IS NOT NULL
  AND leisure_time_weekly NOT IN ('0-5', '6-15', '16-25', '25+', '');

-- =====================================================
-- CLOSE FRIENDS COUNT
-- Old formats: "0-2", "3-5", "6-10", "10+"
-- New formats: "0", "1-3", "4-8", "9+"
-- =====================================================
UPDATE user_profiles
SET close_friends_count = CASE
    WHEN close_friends_count IN ('0', '0-2') THEN '0'
    WHEN close_friends_count IN ('1-3', '3-5') THEN '1-3'
    WHEN close_friends_count IN ('4-8', '6-10') THEN '4-8'
    WHEN close_friends_count IN ('9+', '10+') THEN '9+'
    ELSE close_friends_count
END
WHERE close_friends_count IS NOT NULL
  AND close_friends_count NOT IN ('0', '1-3', '4-8', '9+', '');

-- =====================================================
-- SPIRITUAL PRACTICE
-- Old formats: "Meditation", "Prayer", "Yoga", "Nature", etc.
-- New formats: "none", "religious", "spiritual", "secular"
-- =====================================================
UPDATE user_profiles
SET spiritual_practice = CASE
    WHEN spiritual_practice ILIKE '%none%' OR spiritual_practice ILIKE '%no practice%' THEN 'none'
    WHEN spiritual_practice ILIKE '%prayer%' OR spiritual_practice ILIKE '%religious%' OR spiritual_practice ILIKE '%church%' THEN 'religious'
    WHEN spiritual_practice ILIKE '%meditation%' OR spiritual_practice ILIKE '%yoga%' OR spiritual_practice ILIKE '%spiritual%' THEN 'spiritual'
    WHEN spiritual_practice ILIKE '%mindful%' OR spiritual_practice ILIKE '%secular%' OR spiritual_practice ILIKE '%nature%' OR spiritual_practice ILIKE '%journal%' THEN 'secular'
    ELSE spiritual_practice
END
WHERE spiritual_practice IS NOT NULL
  AND spiritual_practice NOT IN ('none', 'religious', 'spiritual', 'secular', '');

-- =====================================================
-- MEDITATION FREQUENCY
-- Old formats: "Never", "Occasionally", "Weekly", "Daily" (capitalized)
-- New formats: "never", "rarely", "weekly", "daily" (lowercase)
-- =====================================================
UPDATE user_profiles
SET meditation_frequency = CASE
    WHEN LOWER(meditation_frequency) = 'never' THEN 'never'
    WHEN LOWER(meditation_frequency) IN ('occasionally', 'rarely') THEN 'rarely'
    WHEN LOWER(meditation_frequency) = 'weekly' THEN 'weekly'
    WHEN LOWER(meditation_frequency) = 'daily' THEN 'daily'
    ELSE meditation_frequency
END
WHERE meditation_frequency IS NOT NULL
  AND meditation_frequency NOT IN ('never', 'rarely', 'weekly', 'daily', '');

-- =====================================================
-- VOLUNTEER STATUS
-- Old formats: "Not currently", "Occasionally", "Monthly", "Weekly"
-- New formats: "none", "occasional", "regular", "frequent"
-- =====================================================
UPDATE user_profiles
SET volunteer_status = CASE
    WHEN volunteer_status ILIKE '%not%' OR volunteer_status ILIKE '%none%' THEN 'none'
    WHEN volunteer_status ILIKE '%occasional%' THEN 'occasional'
    WHEN volunteer_status ILIKE '%monthly%' OR volunteer_status ILIKE '%regular%' THEN 'regular'
    WHEN volunteer_status ILIKE '%weekly%' OR volunteer_status ILIKE '%frequent%' THEN 'frequent'
    ELSE volunteer_status
END
WHERE volunteer_status IS NOT NULL
  AND volunteer_status NOT IN ('none', 'occasional', 'regular', 'frequent', '');

-- =====================================================
-- CHARITABLE GIVING
-- Old formats: "None", "Under $100/year", "$100-$500/year", etc.
-- New formats: "none", "<500", "500-2000", "2000+"
-- =====================================================
UPDATE user_profiles
SET charitable_giving = CASE
    WHEN charitable_giving ILIKE '%none%' OR charitable_giving = '' THEN 'none'
    WHEN charitable_giving ILIKE '%under%' OR charitable_giving ILIKE '%<100%' OR charitable_giving ILIKE '%100-500%' OR charitable_giving = '<500' THEN '<500'
    WHEN charitable_giving ILIKE '%500%' OR charitable_giving ILIKE '%1000%' OR charitable_giving ILIKE '%1,000%' OR charitable_giving = '500-2000' THEN '500-2000'
    WHEN charitable_giving ILIKE '%2000%' OR charitable_giving ILIKE '%2,000%' OR charitable_giving ILIKE '%5000%' OR charitable_giving ILIKE '%5,000%' OR charitable_giving = '2000+' THEN '2000+'
    ELSE charitable_giving
END
WHERE charitable_giving IS NOT NULL
  AND charitable_giving NOT IN ('none', '<500', '500-2000', '2000+', '');

-- =====================================================
-- EMPLOYMENT TYPE
-- Old formats: "Employee", "Contractor/Freelancer"
-- New formats: "Employed", "Freelance/Contractor", etc.
-- =====================================================
UPDATE user_profiles
SET employment_type = CASE
    WHEN employment_type = 'Employee' THEN 'Employed'
    WHEN employment_type IN ('Contractor/Freelancer', 'Freelancer', 'Contractor') THEN 'Freelance/Contractor'
    WHEN employment_type = 'Prefer not to say' THEN 'Employed' -- Default fallback
    ELSE employment_type
END
WHERE employment_type IS NOT NULL
  AND employment_type NOT IN ('Employed', 'Business Owner', 'Freelance/Contractor', 'Retired', 'Student (Full Time)', 'Student (Working)', 'Unemployed', '');

-- Log what was updated (for verification)
DO $$
BEGIN
    RAISE NOTICE 'Legacy dropdown values migration completed successfully';
END $$;
