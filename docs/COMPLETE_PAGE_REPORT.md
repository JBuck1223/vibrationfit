# VibrationFit Complete Page Report

**Last Updated:** December 10, 2025  
**Status:** Active  
**Total Pages:** 136 Page Files

This report provides a comprehensive breakdown of all classified pages in the VibrationFit application, organized by page type (USER, ADMIN, PUBLIC).

---

## 📊 Executive Summary

| Category | Count | Percentage |
|----------|-------|------------|
| **USER Pages** | 88 | 65% |
| **ADMIN Pages** | 34 | 25% |
| **PUBLIC Pages** | 14 | 10% |
| **Total Classified** | 136 | 100% |

---

## 👤 USER PAGES (88 Pages)

User pages are core app functionality for logged-in users. They use SidebarLayout + MobileBottomNav + PageLayout.

### Dashboard & Analytics (11 Pages)

| Route | File | Purpose |
|-------|------|---------|
| `/dashboard` | `src/app/dashboard/page.tsx` | Main dashboard overview |
| `/dashboard/activity` | `src/app/dashboard/activity/page.tsx` | Activity feed timeline |
| `/dashboard/add-tokens` | `src/app/dashboard/add-tokens/page.tsx` | Purchase Creation Credits |
| `/dashboard/storage` | `src/app/dashboard/storage/page.tsx` | File storage management |
| `/dashboard/token-history` | `src/app/dashboard/token-history/page.tsx` | Token usage history |
| `/dashboard/tokens` | `src/app/dashboard/tokens/page.tsx` | Token balance overview |
| `/dashboard/north-star` | `src/app/dashboard/north-star/page.tsx` | North star goals tracking |
| `/viva` | `src/app/viva/page.tsx` | VIVA AI Assistant chat |

### Life Vision System (25 Pages)

The core vision creation and management system.

**Main Vision Pages:**
| Route | File | Purpose |
|-------|------|---------|
| `/life-vision` | `src/app/life-vision/page.tsx` | All visions list |
| `/life-vision/active` | `src/app/life-vision/active/page.tsx` | Active vision quick access |
| `/life-vision/audio` | `src/app/life-vision/audio/page.tsx` | All vision audio tracks |
| `/life-vision/new` | `src/app/life-vision/new/page.tsx` | Create new vision |
| `/life-vision/manual` | `src/app/life-vision/manual/page.tsx` | Manual vision creation |
| `/life-vision/new/assembly` | `src/app/life-vision/new/assembly/page.tsx` | Vision assembly flow |
| `/life-vision/new/final` | `src/app/life-vision/new/final/page.tsx` | Final vision review |
| `/life-vision/[id]` | `src/app/life-vision/[id]/page.tsx` | Vision detail page |
| `/life-vision/[id]/draft` | `src/app/life-vision/[id]/draft/page.tsx` | Edit vision draft |
| `/life-vision/[id]/refine` | `src/app/life-vision/[id]/refine/page.tsx` | Refine vision with AI |
| `/life-vision/[id]/experiment` | `src/app/life-vision/[id]/experiment/page.tsx` | Vision experiments |
| `/life-vision/[id]/print` | `src/app/life-vision/[id]/print/page.tsx` | Print/PDF preview |

**Category Creation (4 Pages):**
| Route | File | Purpose |
|-------|------|---------|
| `/life-vision/new/category/[key]` | `src/app/life-vision/new/category/[key]/page.tsx` | Category creation flow |
| `/life-vision/new/category/[key]/blueprint` | `src/app/life-vision/new/category/[key]/blueprint/page.tsx` | Category blueprint |
| `/life-vision/new/category/[key]/imagination` | `src/app/life-vision/new/category/[key]/imagination/page.tsx` | Category imagination |
| `/life-vision/new/category/[key]/scenes` | `src/app/life-vision/new/category/[key]/scenes/page.tsx` | Category scenes |

**Audio Generation (8 Pages):**
| Route | File | Purpose |
|-------|------|---------|
| `/life-vision/[id]/audio` | `src/app/life-vision/[id]/audio/page.tsx` | Vision audio hub |
| `/life-vision/[id]/audio/generate` | `src/app/life-vision/[id]/audio/generate/page.tsx` | Generate audio tracks |
| `/life-vision/[id]/audio-generate` | `src/app/life-vision/[id]/audio-generate/page.tsx` | Audio generation v2 |
| `/life-vision/[id]/audio/queue` | `src/app/life-vision/[id]/audio/queue/page.tsx` | Audio generation queue |
| `/life-vision/[id]/audio/queue/[batchId]` | `src/app/life-vision/[id]/audio/queue/[batchId]/page.tsx` | Batch details |
| `/life-vision/[id]/audio/record` | `src/app/life-vision/[id]/audio/record/page.tsx` | Record personal audio |
| `/life-vision/[id]/audio/sets` | `src/app/life-vision/[id]/audio/sets/page.tsx` | Audio set management |

### Vision Board & Gallery (4 Pages)

Visual vision board management.

| Route | File | Purpose |
|-------|------|---------|
| `/vision-board` | `src/app/vision-board/page.tsx` | Main vision board |
| `/vision-board/new` | `src/app/vision-board/new/page.tsx` | Create board item |
| `/vision-board/gallery` | `src/app/vision-board/gallery/page.tsx` | Image gallery |
| `/vision-board/[id]` | `src/app/vision-board/[id]/page.tsx` | Board item detail |

### Journal System (4 Pages)

Conscious creation journaling.

| Route | File | Purpose |
|-------|------|---------|
| `/journal` | `src/app/journal/page.tsx` | All journal entries |
| `/journal/new` | `src/app/journal/new/page.tsx` | Create new entry |
| `/journal/[id]` | `src/app/journal/[id]/page.tsx` | Journal entry detail |
| `/journal/[id]/edit` | `src/app/journal/[id]/edit/page.tsx` | Edit journal entry |

### Tracking System (4 Pages)

Daily tracking and abundance monitoring.

| Route | File | Purpose |
|-------|------|---------|
| `/daily-paper` | `src/app/daily-paper/page.tsx` | Daily paper tracking |
| `/daily-paper/new` | `src/app/daily-paper/new/page.tsx` | New daily paper |
| `/daily-paper/resources` | `src/app/daily-paper/resources/page.tsx` | Resources & guides |
| `/abundance-tracker` | `src/app/abundance-tracker/page.tsx` | Abundance tracking |

### Profile & Account (10 Pages)

User profile and account management.

| Route | File | Purpose |
|-------|------|---------|
| `/profile` | `src/app/profile/page.tsx` | All user profiles |
| `/profile/active` | `src/app/profile/active/page.tsx` | Active profile quick access |
| `/profile/compare` | `src/app/profile/compare/page.tsx` | Compare profiles |
| `/profile/edit` | `src/app/profile/edit/page.tsx` | Edit active profile |
| `/profile/new` | `src/app/profile/new/page.tsx` | Create new profile |
| `/profile/[id]` | `src/app/profile/[id]/page.tsx` | Profile detail |
| `/profile/[id]/draft` | `src/app/profile/[id]/draft/page.tsx` | Edit profile draft |
| `/profile/[id]/edit` | `src/app/profile/[id]/edit/page.tsx` | Edit specific profile |
| `/profile/[id]/edit/draft` | `src/app/profile/[id]/edit/draft/page.tsx` | Edit profile draft |
| `/profile/[id]/new` | `src/app/profile/[id]/new/page.tsx` | New profile flow |
| `/profile/[id]/refine` | `src/app/profile/[id]/refine/page.tsx` | Refine profile with AI |
| `/account/settings` | `src/app/account/settings/page.tsx` | Account settings |

### Household Management (2 Pages)

Multi-user household features.

| Route | File | Purpose |
|-------|------|---------|
| `/household/settings` | `src/app/household/settings/page.tsx` | Household settings |
| `/household/invite/[token]` | `src/app/household/invite/[token]/page.tsx` | Invite acceptance |

### Vibration Assessment (5 Pages)

Vibrational frequency assessment system.

| Route | File | Purpose |
|-------|------|---------|
| `/assessment` | `src/app/assessment/page.tsx` | Start new assessment |
| `/assessment/in-progress` | `src/app/assessment/in-progress/page.tsx` | Assessment in progress |
| `/assessment/history` | `src/app/assessment/history/page.tsx` | Past assessments |
| `/assessment/[id]` | `src/app/assessment/[id]/page.tsx` | Assessment detail |
| `/assessment/[id]/in-progress` | `src/app/assessment/[id]/in-progress/page.tsx` | Assessment flow |
| `/assessment/[id]/results` | `src/app/assessment/[id]/results/page.tsx` | Assessment results |

### Voice Profile System (3 Pages)

Voice analysis and profile creation.

| Route | File | Purpose |
|-------|------|---------|
| `/voice-profile` | `src/app/voice-profile/page.tsx` | Voice profile hub |
| `/voice-profile/analyze` | `src/app/voice-profile/analyze/page.tsx` | Analyze voice |
| `/voice-profile/analyze/initial` | `src/app/voice-profile/analyze/initial/page.tsx` | Initial voice analysis |

### Activation Intensive Program (10 Pages)

Premium intensive coaching program.

| Route | File | Purpose |
|-------|------|---------|
| `/intensive` | `src/app/intensive/page.tsx` | Intensive program home |
| `/intensive/activate` | `src/app/intensive/activate/page.tsx` | Activation flow |
| `/intensive/activation-protocol` | `src/app/intensive/activation-protocol/page.tsx` | Protocol steps |
| `/intensive/builder` | `src/app/intensive/builder/page.tsx` | Vision builder |
| `/intensive/calibration` | `src/app/intensive/calibration/page.tsx` | Calibration exercises |
| `/intensive/call-prep` | `src/app/intensive/call-prep/page.tsx` | Coaching call prep |
| `/intensive/check-email` | `src/app/intensive/check-email/page.tsx` | Email check reminder |
| `/intensive/dashboard` | `src/app/intensive/dashboard/page.tsx` | Intensive dashboard |
| `/intensive/intake` | `src/app/intensive/intake/page.tsx` | Initial intake form |
| `/intensive/refine-vision` | `src/app/intensive/refine-vision/page.tsx` | Vision refinement |
| `/intensive/schedule-call` | `src/app/intensive/schedule-call/page.tsx` | Schedule coaching call |

### Billing & Payments (1 Page)

Payment and subscription management.

| Route | File | Purpose |
|-------|------|---------|
| `/billing` | `src/app/billing/page.tsx` | Billing & subscription |

### Framework & Resources (2 Pages)

Educational framework and resources.

| Route | File | Purpose |
|-------|------|---------|
| `/framework/emotional-guidance-scale` | `src/app/framework/emotional-guidance-scale/page.tsx` | Emotional Guidance Scale |

### Vibrational System (1 Page)

Scene builder and vibrational tools.

| Route | File | Purpose |
|-------|------|---------|
| `/scenes/builder` | `src/app/scenes/builder/page.tsx` | Scene builder tool |

---

## 🔧 ADMIN PAGES (34 Pages)

Admin pages use SidebarLayout (admin nav) + MobileBottomNav + PageLayout. All routes starting with `/admin` are automatically classified as ADMIN.

### User Management (2 Pages)

| Route | File | Purpose |
|-------|------|---------|
| `/admin/users` | `src/app/admin/users/page.tsx` | User list & management |
| `/admin/token-usage` | `src/app/admin/token-usage/page.tsx` | Token usage analytics |

### CRM & Marketing (18 Pages)

**Dashboard:**
| Route | File | Purpose |
|-------|------|---------|
| `/admin/crm/dashboard` | `src/app/admin/crm/dashboard/page.tsx` | CRM overview & metrics |

**Campaigns (4 Pages):**
| Route | File | Purpose |
|-------|------|---------|
| `/admin/crm/campaigns` | `src/app/admin/crm/campaigns/page.tsx` | All campaigns |
| `/admin/crm/campaigns/new` | `src/app/admin/crm/campaigns/new/page.tsx` | Create campaign |
| `/admin/crm/campaigns/[id]` | `src/app/admin/crm/campaigns/[id]/page.tsx` | Campaign detail |
| `/admin/crm/campaigns/[id]/edit` | `src/app/admin/crm/campaigns/[id]/edit/page.tsx` | Edit campaign |

**Leads Management (3 Pages):**
| Route | File | Purpose |
|-------|------|---------|
| `/admin/crm/leads` | `src/app/admin/crm/leads/page.tsx` | All leads |
| `/admin/crm/leads/board` | `src/app/admin/crm/leads/board/page.tsx` | Leads Kanban board |
| `/admin/crm/leads/[id]` | `src/app/admin/crm/leads/[id]/page.tsx` | Lead detail |

**Members Management (3 Pages):**
| Route | File | Purpose |
|-------|------|---------|
| `/admin/crm/members` | `src/app/admin/crm/members/page.tsx` | All members |
| `/admin/crm/members/board` | `src/app/admin/crm/members/board/page.tsx` | Members Kanban board |
| `/admin/crm/members/[id]` | `src/app/admin/crm/members/[id]/page.tsx` | Member detail |

**Customers Management (3 Pages):**
| Route | File | Purpose |
|-------|------|---------|
| `/admin/crm/customers` | `src/app/admin/crm/customers/page.tsx` | All customers |
| `/admin/crm/customers/board` | `src/app/admin/crm/customers/board/page.tsx` | Customers Kanban board |
| `/admin/crm/customers/[id]` | `src/app/admin/crm/customers/[id]/page.tsx` | Customer detail |

**Support & Tools (2 Pages):**
| Route | File | Purpose |
|-------|------|---------|
| `/admin/crm/support/board` | `src/app/admin/crm/support/board/page.tsx` | Support tickets board |
| `/admin/crm/utm-builder` | `src/app/admin/crm/utm-builder/page.tsx` | UTM link builder |

### Content Management (6 Pages)

| Route | File | Purpose |
|-------|------|---------|
| `/admin/assets` | `src/app/admin/assets/page.tsx` | Media asset management |
| `/admin/emails` | `src/app/admin/emails/page.tsx` | Email templates hub |
| `/admin/emails/list` | `src/app/admin/emails/list/page.tsx` | All emails list |
| `/admin/emails/[id]` | `src/app/admin/emails/[id]/page.tsx` | Email detail |
| `/admin/emails/[id]/edit` | `src/app/admin/emails/[id]/edit/page.tsx` | Edit email template |
| `/admin/vibrational-event/sources` | `src/app/admin/vibrational-event/sources/page.tsx` | Vibrational data sources |

### AI & Intelligence (2 Pages)

| Route | File | Purpose |
|-------|------|---------|
| `/admin/ai-models` | `src/app/admin/ai-models/page.tsx` | AI model configuration |
| `/admin/audio-mixer` | `src/app/admin/audio-mixer/page.tsx` | Audio mixing tools |

### Intensive Program Admin (1 Page)

| Route | File | Purpose |
|-------|------|---------|
| `/admin/intensive/schedule-call` | `src/app/admin/intensive/schedule-call/page.tsx` | Schedule intensive calls |

### Developer Tools (5 Pages)

| Route | File | Purpose |
|-------|------|---------|
| `/sitemap` | `src/app/sitemap/page.tsx` | Complete site navigation |
| `/design-system` | `src/app/design-system/page.tsx` | Design system home |
| `/design-system/old` | `src/app/design-system/old/page.tsx` | Legacy design system |
| `/design-system/component/[componentName]` | `src/app/design-system/component/[componentName]/page.tsx` | Component showcase |
| `/design-system/template/[templateName]` | `src/app/design-system/template/[templateName]/page.tsx` | Template showcase |
| `/design-system/experiment/[experimentId]` | `src/app/design-system/experiment/[experimentId]/page.tsx` | Design experiments |

**Specific Component Pages:**
- `/design-system/component/category-grid` - CategoryGrid showcase
- `/design-system/component/hero` - Hero component showcase
- `/design-system/component/page-header` - PageHeader showcase
- `/design-system/component/save-button` - SaveButton showcase

---

## 🌍 PUBLIC PAGES (14 Pages)

Public pages use Header + Footer + PageLayout (no sidebar). These are accessible without authentication.

### Marketing Pages (1 Page)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `src/app/page.tsx` | Landing page / home |

### Authentication (2 Pages)

| Route | File | Purpose |
|-------|------|---------|
| `/auth/login` | `src/app/auth/login/page.tsx` | Login page |
| `/auth/signup` | `src/app/auth/signup/page.tsx` | Signup page |

**Note:** Other auth routes (`/auth/verify`, `/auth/callback`, `/auth/auto-login`, `/auth/logout`, `/auth/setup-password`) are classified but may not have dedicated page files (handled by API routes or redirects).

### Checkout & Success Pages (2 Pages)

| Route | File | Purpose |
|-------|------|---------|
| `/checkout` | `src/app/checkout/page.tsx` | Payment checkout |
| `/billing/success` | `src/app/billing/success/page.tsx` | Payment success |

### Public Utilities (3 Pages)

| Route | File | Purpose |
|-------|------|---------|
| `/support` | `src/app/support/page.tsx` | Support & help center |
| `/vision/build` | `src/app/vision/build/page.tsx` | Public vision builder |
| `/contact` | `src/app/contact/page.tsx` | Contact form |

### Development/Testing (6 Pages)

| Route | File | Purpose |
|-------|------|---------|
| `/debug/email` | `src/app/debug/email/page.tsx` | Email testing |
| `/test-recording` | `src/app/test-recording/page.tsx` | Test recording |
| `/test-audio-editor` | `src/app/test-audio-editor/page.tsx` | Audio editor test |
| `/test-audio-only` | `src/app/test-audio-only/page.tsx` | Audio-only test |
| `/experiment` | `src/app/experiment/page.tsx` | Experiments hub |
| `/experiment/old-home` | `src/app/experiment/old-home/page.tsx` | Old homepage |

### Marketing/Demo Pages (3 Pages)

| Route | File | Purpose |
|-------|------|---------|
| `/demo` | `src/app/demo/page.tsx` | Product demo |
| `/intensive-intake` | `src/app/intensive-intake/page.tsx` | Intensive intake |
| `/emails` | `src/app/emails/page.tsx` | Email showcase |
| `/emails/[id]` | `src/app/emails/[id]/page.tsx` | Email preview |

---

## 📈 Page Statistics

### By Feature Area

| Feature Area | Page Count | % of Total |
|--------------|------------|------------|
| Life Vision | 25 | 18% |
| CRM & Marketing | 18 | 13% |
| Intensive Program | 11 | 8% |
| Profile System | 10 | 7% |
| Dashboard | 7 | 5% |
| Design System | 6 | 4% |
| Assessment | 6 | 4% |
| Content Management | 6 | 4% |
| Journal | 4 | 3% |
| Vision Board | 4 | 3% |
| Tracking | 4 | 3% |
| Voice Profile | 3 | 2% |
| Other | 32 | 24% |

### Dynamic vs Static Routes

| Type | Count | % of Total |
|------|-------|------------|
| **Static Routes** | 94 | 69% |
| **Dynamic Routes** | 42 | 31% |

**Dynamic Route Examples:**
- `[id]` - UUID-based resource IDs (profiles, visions, journals, etc.)
- `[key]` - Category keys (vision categories)
- `[batchId]` - Batch tracking IDs
- `[componentName]` - Design system components
- `[templateName]` - Design system templates
- `[token]` - Invite tokens

### Authentication Requirements

| Auth Level | Count | % of Total |
|------------|-------|------------|
| **Requires Auth (USER)** | 88 | 65% |
| **Requires Admin** | 34 | 25% |
| **Public (No Auth)** | 14 | 10% |

### Page Depth Analysis

| Depth | Count | Examples |
|-------|-------|----------|
| **Level 1** (`/page`) | 15 | `/dashboard`, `/profile`, `/viva` |
| **Level 2** (`/parent/page`) | 42 | `/life-vision/new`, `/journal/new` |
| **Level 3** (`/parent/child/page`) | 48 | `/life-vision/[id]/audio`, `/profile/[id]/edit` |
| **Level 4+** (`/parent/child/grandchild/page`) | 31 | `/life-vision/[id]/audio/queue`, `/admin/crm/leads/board` |

**Deepest Route:** `/life-vision/new/category/[key]/imagination` (5 levels)

---

## 🔍 Page Classification Coverage

### Classified vs Actual Files

| Status | Count |
|--------|-------|
| **Total Page Files** | 136 |
| **Classified in System** | 136 |
| **Coverage** | 100% ✅ |

### Pages NOT in Navigation Menus

Some pages exist but are not directly accessible via navigation (intentionally hidden or workflow-specific):

**Hidden from Navigation:**
- `/life-vision/manual` - Manual creation fallback
- `/life-vision/new/final` - Workflow step
- `/profile/compare` - Comparison tool
- `/assessment/in-progress` - Workflow step
- All test pages (`/test-*`, `/debug/*`, `/experiment/*`)
- All design system component pages (developer tools)
- All draft/edit pages (accessed via actions)

---

## 🎯 Key Insights

### 1. **Life Vision is the Core Feature**
   - 25 pages (18% of total)
   - Most complex feature with deep workflow paths
   - Includes creation, editing, audio generation, and printing

### 2. **Robust Admin Panel**
   - 34 admin pages (25% of total)
   - Comprehensive CRM with Kanban boards
   - Full campaign and customer lifecycle management

### 3. **Multi-User Support**
   - Household settings and invites
   - Profile versioning and comparison
   - Parent profile tracking

### 4. **Audio-First Experience**
   - 8 dedicated audio generation pages
   - Batch processing and queue management
   - Voice profile system

### 5. **Developer-Friendly**
   - Comprehensive design system (6 pages)
   - Component showcase pages
   - Sitemap and navigation tools

### 6. **Progressive Enhancement**
   - Public vision builder (`/vision/build`)
   - Demo pages for non-authenticated users
   - Smooth onboarding flow

---

## 🗺️ Navigation Architecture

### Primary User Journeys

**1. New User Onboarding:**
```
/ → /auth/signup → /dashboard → /profile/new → /life-vision/new
```

**2. Vision Creation Flow:**
```
/life-vision → /life-vision/new → /life-vision/new/category/[key] → 
/life-vision/new/assembly → /life-vision/[id]
```

**3. Audio Generation Flow:**
```
/life-vision/[id] → /life-vision/[id]/audio → /life-vision/[id]/audio/generate → 
/life-vision/[id]/audio/queue → /life-vision/[id]/audio/sets
```

**4. Profile Creation & Refinement:**
```
/profile → /profile/new → /profile/[id] → /profile/[id]/refine → /profile/[id]/edit
```

**5. Assessment Journey:**
```
/assessment → /assessment/[id]/in-progress → /assessment/[id]/results → /assessment/history
```

---

## 📝 Maintenance Notes

### Pages Recently Added
- `/framework/emotional-guidance-scale` - Added Dec 10, 2025

### Pages Recently Removed
- `/voice-profile/quiz` - Removed Dec 10, 2025 (dream/worry refactor)
- `/abundance` - Merged into `/abundance-tracker`
- `/settings/voice-clone` - Archived to experiments (Dec 6, 2025)

### Deprecated Routes (Still Classified)
- `/life-vision/[id]/refine` - Old vibe-assistant refine (Nov 11, 2025)
- `/design-system/old` - Legacy design system

---

## 🔗 Related Documentation

- **Page Classifications:** `src/lib/navigation/page-classifications.ts`
- **Navigation Menus:** `src/lib/navigation/menu-definitions.ts`
- **Feature Registry:** `FEATURE_REGISTRY.md`
- **Design System:** `docs/design-system/`

---

**Report Generated:** December 10, 2025  
**Next Review:** Quarterly or when major features are added

