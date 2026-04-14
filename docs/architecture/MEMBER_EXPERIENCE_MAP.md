# VibrationFit Member Experience Map

**Last Updated:** March 31, 2026
**Status:** Active

## What We Need Help With

VibrationFit has ~120 member-facing pages spread across 21 product areas. The current experience is fragmented -- members bounce between separate pages for every action (view, edit, generate audio, export PDF, etc.). Nothing feels like a cohesive workspace.

We want to transform the 6 highest-traffic areas into outcome-based "studios" where members feel like everything they need is right where they are. Instead of organizing by feature (generate page, mix page, record page), we organize by outcome (what do you want to accomplish?).

Each studio follows the same pattern:
- 3-4 primary tabs organized by outcome
- Secondary filters to narrow within a tab
- Context selectors (which vision version, which profile) so members never leave the area
- Persistent elements (audio player, save bar) that stay across tabs

The six studios and their outcome-based tabs:

- **Audio Studio:** Ritual (daily listening) / Create (make new audio) / Explore (discover sounds)
- **Life Vision Studio:** My Vision (read and experience) / Refine (edit and improve) / Versions (history and comparison)
- **Vision Board Studio:** My Board (browse and experience) / Create (add new items) / Gallery (images and inspiration)
- **Journal Studio:** Entries (read and reflect) / Write (create and edit) / Learn (guidance and resources)
- **Profile Studio:** My Profile (review) / Edit (modify) / Versions (history and comparison)
- **Abundance Tracker:** Log (daily tracking) / Goals (targets) / Reports (insights)

We are starting with the Audio Studio as the proving ground. Once that pattern is validated, we roll it out across the other five areas.

Below is the complete inventory of every member-facing route, organized by area, followed by the list of dead pages we are removing.

---

## Areas and Routes

### CREATION

**Life Vision** (13 routes)
- `/life-vision` - Version list hub
- `/life-vision/active` - Redirect to active vision
- `/life-vision/new` - VIVA guided creation wizard
- `/life-vision/new/category/[key]` - Per-category creation step
- `/life-vision/new/assembly` - VIVA assembly
- `/life-vision/household` - Household visions
- `/life-vision/refine/new` - Intensive refine onboarding
- `/life-vision/[id]` - Vision detail, inline edit, audio, PDF
- `/life-vision/[id]/draft` - Draft review and commit
- `/life-vision/[id]/refine` - VIVA refine chat and diffs
- `/life-vision/[id]/print` - PDF preview and download

**Vision Board** (8 routes)
- `/vision-board` - Main board with grid/list, filters, lightbox
- `/vision-board/[id]` - Single item view/edit
- `/vision-board/new` - Create new item
- `/vision-board/ideas` - VIVA idea generation
- `/vision-board/queue` - Batch-create from ideas
- `/vision-board/gallery` - Image library
- `/vision-board/export` - PDF/image export
- `/vision-board/resources` - Intensive training video

**Journal** (5 routes)
- `/journal` - Entry feed with stats, filters, search
- `/journal/new` - Create entry
- `/journal/[id]` - Read-only entry detail
- `/journal/[id]/edit` - Edit entry
- `/journal/resources` - Intensive training video

**Profile** (9 routes)
- `/profile` - Version list dashboard
- `/profile/new` - Intensive onboarding
- `/profile/compare` - Side-by-side version comparison
- `/profile/active` - Redirect to active profile
- `/profile/active/edit` - Redirect to active profile editor
- `/profile/[id]` - Read-only detail
- `/profile/[id]/edit` - Full editor
- `/profile/[id]/draft` - Draft review and commit
- `/profile/[id]/refine` - Refinement summary

### DAILY PRACTICE

**Audio Studio** (7 routes + 14 legacy being consolidated)
- `/audio` - Entry redirect to Ritual
- `/audio/ritual` - Play vision audio, stories, music
- `/audio/create` - Links to generate, mix, record flows
- `/audio/explore` - Background track browser
- `/audio/generate` - Voice generation
- `/audio/mix` - Audio mixing
- `/audio/record` - Personal recording
- Legacy: 14 routes under `/life-vision/[id]/audio/*` consolidating into above

**Stories** (6 routes)
- `/story` - Story library with filters
- `/story/new` - Creation wizard
- `/story/[storyId]` - Story detail/editor
- `/story/[storyId]/audio` - Story audio hub
- `/story/[storyId]/audio/generate` - Generate TTS
- `/story/[storyId]/audio/record` - Record narration

**MAP** (4 routes)
- `/map` - Hub with badges, milestones
- `/map/new` - Create map
- `/map/active` - Redirect to active map
- `/map/[id]` - Map detail by day/category

**Daily Paper** (5 routes)
- `/daily-paper` - Entry list with streaks
- `/daily-paper/new` - Compose entry
- `/daily-paper/[id]` - View entry
- `/daily-paper/[id]/edit` - Edit entry
- `/daily-paper/resources` - Training video

**Abundance Tracker** (6 routes)
- `/abundance-tracker` - Event log
- `/abundance-tracker/new` - Log event
- `/abundance-tracker/[id]` - View event
- `/abundance-tracker/[id]/edit` - Edit event
- `/abundance-tracker/goals` - Period goals
- `/abundance-tracker/reports` - Analytics

**Tracking** (2 routes)
- `/tracking` - Streaks, badges, performance
- `/tracking/how-it-works` - Explainer

### COMMUNITY

**Vibe Tribe** (6 routes, 4 are redirects)
- `/vibe-tribe` - Social feed with tag filters
- `/vibe-tribe/new` - Create post
- `/vibe-tribe/wins` - Redirect to ?filter=win
- `/vibe-tribe/wobbles` - Redirect to ?filter=wobble
- `/vibe-tribe/visions` - Redirect to ?filter=vision
- `/vibe-tribe/collaboration` - Redirect to ?filter=collaboration

**Alignment Gym** (2 routes)
- `/alignment-gym` - Session listing
- `/alignment-gym/[id]` - Session detail

**Sessions** (3 routes)
- `/sessions` - Sessions list
- `/session/[id]` - Session detail
- `/session/[id]/recording` - Recording view

**Snapshot** (1 route)
- `/snapshot/[id]` - Member profile snapshot

### PROGRAM

**Intensive** (11 routes)
- `/intensive/start` - Onboarding entry
- `/intensive/welcome` - Welcome step
- `/intensive/check-email` - Post-signup confirmation
- `/intensive/intake` - Intake questionnaire
- `/intensive/intake/unlock` - Unlock step
- `/intensive/dashboard` - Program dashboard
- `/intensive/journey` - Step-by-step journey
- `/intensive/refine-vision` - Vision refinement step
- `/intensive/calibration` - Calibration step
- `/intensive/schedule-call` - Schedule call
- `/intensive/call-prep` - Call preparation

**Assessment** (8 routes)
- `/assessment` - Assessment home
- `/assessment/new` - Start new
- `/assessment/start` - Start flow
- `/assessment/in-progress` - In-progress state
- `/assessment/[id]` - Assessment by ID
- `/assessment/[id]/in-progress` - Specific in-progress
- `/assessment/[id]/results` - Results
- `/assessment/history` - Past assessments

### MEMBER SERVICES

**Account** (11 routes)
- `/account` - Overview
- `/account/settings` - General settings
- `/account/settings/password` - Password change
- `/account/settings/delete` - Account deletion
- `/account/billing` - Billing
- `/account/privacy` - Privacy preferences
- `/household/settings` - Household management
- `/household/invite/[token]` - Invite acceptance
- `/dashboard/tokens` - Token balance
- `/dashboard/add-tokens` - Purchase tokens
- `/dashboard/storage` - Storage usage

**Support** (3 routes)
- `/support` - Support hub
- `/support/tickets` - Ticket list
- `/support/tickets/[id]` - Single ticket

**Billing** (5 routes)
- `/billing` - Billing page
- `/billing/success` - Payment success
- `/checkout` - Checkout entry
- `/checkout/[cartId]` - Cart checkout
- `/checkout/success` - Purchase confirmation

**Referral** (1 route)
- `/referral` - Referral program

### HOME

**Dashboard** (2 routes)
- `/dashboard` - Main hub
- `/dashboard/activity` - Activity feed

**Standalone** (2 routes)
- `/viva` - VIVA assistant
- `/framework/emotional-guidance-scale` - Framework tool

## Summary

| Category | Areas | Routes |
|----------|-------|--------|
| Creation | 4 | 35 |
| Daily Practice | 6 | 30 |
| Community | 4 | 12 |
| Program | 2 | 19 |
| Member Services | 4 | 20 |
| Home | 1 | 4 |
| **Total** | **21** | **~120** |

## Tab Studio Strategy

Six high-traffic areas become tabbed studios:

- **Audio Studio:** Ritual / Create / Explore
- **Life Vision Studio:** My Vision / Refine / Versions
- **Vision Board Studio:** My Board / Create / Gallery
- **Journal Studio:** Entries / Write / Learn
- **Profile Studio:** My Profile / Edit / Versions
- **Abundance Tracker:** Log / Goals / Reports

## Dead Pages (confirmed for removal)

- `/dashboard/north-star` - Dead concept
- `/scenes/builder` - Dead concept
- `/life-vision/manual` - Unused
- `/life-vision/refinements` - Unused
- `/life-vision/[id]/experiment` - Unused
- `/life-vision/[id]/refine/viva` - Duplicate
- `/life-vision/[id]/audio-generate` - Broken duplicate
- `/activation-protocol` - Superseded by /intensive
- `/intensive-intake` - Duplicate of /intensive/intake
- `/intensive/builder` - Admin-only
- `/audio/listen` - Redundant redirect
- `/voice-profile/*` - Archived (3 pages)
- `/tools` - Does not exist
- `/emails/*` - Admin pages in wrong location
