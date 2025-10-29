# Profile System

**Last Updated:** January 31, 2025
**Version:** 2.0
**Status:** Production - Current

## Overview

The Profile System stores comprehensive user information across all 12 life categories, including structured data and natural language stories.

## Current Features (As of January 2025)

### Profile Structure

1. **12 Category Stories**
   - Natural language descriptions for each life area
   - Field names: `fun_story`, `health_story`, `travel_story`, `love_story`, `family_story`, `social_story`, `home_story`, `work_story`, `money_story`, `stuff_story`, `giving_story`, `spirituality_story`
   - Can be written or recorded (audio/video)

2. **Structured Fields**
   - Demographics: age, location, relationship status
   - Work: occupation, employment type, company
   - Financial: household income, savings, debt
   - Family: children, partner info
   - Lifestyle: hobbies, interests, preferences

3. **Evidence/Media**
   - Photos, videos related to each category
   - Stored in S3 under `profile` folder structure
   - Organized by category

### Access Points

- View Profile: `/profile`
- Edit Profile: `/profile/edit`
- Create New: `/profile/new`
- View Specific Version: `/profile/[id]`

## Database Schema

### `user_profiles` Table
- `id` (UUID)
- `user_id` (UUID) - Links to auth.users
- 12 story fields (fun_story, health_story, etc.)
- Structured fields (relationship_status, occupation, etc.)
- `completion_percentage` (integer)
- Version control support
- `created_at`, `updated_at`

## Integration Points

- **Life Vision**: Profile stories inform AI prompts
- **Assessment**: Profile complements assessment data
- **VIVA**: Uses profile for personalization
- **Storage**: Photos/videos in S3 `profile` folders

## Common User Questions

**Q: What's the difference between profile and vision?**  
A: Profile = who you are now (current situation). Vision = who you're becoming (desired future).

**Q: Do I need to complete my profile?**  
A: Profile completion (70%+) is required for Life Vision creation with VIVA, but you can update it anytime.

---

**Keep This Updated:** Profile field changes should be reflected here!
