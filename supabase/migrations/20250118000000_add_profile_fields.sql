-- ============================================================================
-- ADDITIONAL PROFILE FIELDS FOR 12 LIFE CATEGORIES
-- ============================================================================
-- This migration adds structured data fields to complement the story fields
-- for better Viva personalization and profile completion tracking.

begin;

-- ============================================================================
-- PART 1: CREATE ENUMS FOR STRUCTURED DATA
-- ============================================================================

-- Travel frequency enum
do $$ begin
  create type travel_frequency as enum ('never', 'yearly', 'quarterly', 'monthly');
  exception when duplicate_object then null;
end $$;

-- Social preference enum
do $$ begin
  create type social_preference as enum ('introvert', 'ambivert', 'extrovert');
  exception when duplicate_object then null;
end $$;

-- Lifestyle category enum
do $$ begin
  create type lifestyle_category as enum ('minimalist', 'moderate', 'comfortable', 'luxury');
  exception when duplicate_object then null;
end $$;

-- ============================================================================
-- PART 2: ADD NEW COLUMNS
-- ============================================================================

-- Fun & Recreation
alter table public.user_profiles
  add column if not exists hobbies text[] default '{}'::text[],
  add column if not exists leisure_time_weekly text;

-- Travel & Adventure
alter table public.user_profiles
  add column if not exists travel_frequency travel_frequency,
  add column if not exists passport boolean default false not null,
  add column if not exists countries_visited integer default 0 not null check (countries_visited >= 0);

-- Social & Friends
alter table public.user_profiles
  add column if not exists close_friends_count text,
  add column if not exists social_preference social_preference;

-- Possessions & Lifestyle
alter table public.user_profiles
  add column if not exists lifestyle_category lifestyle_category,
  add column if not exists primary_vehicle text;

-- Spirituality & Growth
alter table public.user_profiles
  add column if not exists spiritual_practice text,
  add column if not exists meditation_frequency text,
  add column if not exists personal_growth_focus boolean default false not null;

-- Giving & Legacy
alter table public.user_profiles
  add column if not exists volunteer_status text,
  add column if not exists charitable_giving text,
  add column if not exists legacy_mindset boolean default false not null;

-- ============================================================================
-- PART 3: ADD COLUMN COMMENTS (DOCUMENTATION)
-- ============================================================================

-- Story Field Comments
comment on column public.user_profiles.romance_partnership_story is 'Natural language: Tell us about your love life and relationship status';
comment on column public.user_profiles.family_parenting_story is 'Natural language: Tell us about your family and parenting situation';
comment on column public.user_profiles.career_work_story is 'Natural language: Tell us about your work and career';
comment on column public.user_profiles.money_wealth_story is 'Natural language: Tell us about your financial situation';
comment on column public.user_profiles.home_environment_story is 'Natural language: Tell us about where you live';
comment on column public.user_profiles.health_vitality_story is 'Natural language: Tell us about your health and body';
comment on column public.user_profiles.fun_recreation_story is 'Natural language: Tell us about fun and recreation in your life';
comment on column public.user_profiles.travel_adventure_story is 'Natural language: Tell us about travel and adventure';
comment on column public.user_profiles.social_friends_story is 'Natural language: Tell us about your social life and friendships';
comment on column public.user_profiles.possessions_lifestyle_story is 'Natural language: Tell us about your lifestyle and possessions';
comment on column public.user_profiles.giving_legacy_story is 'Natural language: Tell us about giving back and your legacy';
comment on column public.user_profiles.spirituality_growth_story is 'Natural language: Tell us about your spiritual life and personal growth';

-- Structured Field Comments
comment on column public.user_profiles.hobbies is 'Array of current hobbies (free text)';
comment on column public.user_profiles.leisure_time_weekly is 'Hours per week: 0-5, 6-15, 16-25, 25+';
comment on column public.user_profiles.travel_frequency is 'Travel cadence: never, yearly, quarterly, monthly';
comment on column public.user_profiles.passport is 'Has a valid passport';
comment on column public.user_profiles.countries_visited is 'Total countries visited (current count)';
comment on column public.user_profiles.close_friends_count is '0, 1-3, 4-8, 9+';
comment on column public.user_profiles.social_preference is 'introvert, ambivert, extrovert';
comment on column public.user_profiles.lifestyle_category is 'minimalist, moderate, comfortable, luxury';
comment on column public.user_profiles.primary_vehicle is 'Primary vehicle type (free text)';
comment on column public.user_profiles.spiritual_practice is 'none, religious, spiritual, secular';
comment on column public.user_profiles.meditation_frequency is 'never, rarely, weekly, daily';
comment on column public.user_profiles.personal_growth_focus is 'Actively focused on personal growth (current state)';
comment on column public.user_profiles.volunteer_status is 'none, occasional, regular, frequent';
comment on column public.user_profiles.charitable_giving is 'Annual amount: none, <500, 500-2000, 2000+';
comment on column public.user_profiles.legacy_mindset is 'Thinks about legacy in day-to-day decisions (current state)';
comment on column public.user_profiles.ai_tags is 'AI-generated tags from story fields for Viva context';

commit;
