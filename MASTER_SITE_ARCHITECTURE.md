# VibrationFit Master Site Architecture

**Last Updated:** January 2025  
**Version:** 2.0  
**Status:** Production at vibrationfit.com

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Application Structure](#application-structure)
3. [Technical Stack](#technical-stack)
4. [Routing Architecture](#routing-architecture)
5. [Layout System](#layout-system)
6. [Component Architecture](#component-architecture)
7. [API Architecture](#api-architecture)
8. [Data Layer](#data-layer)
9. [Authentication & Authorization](#authentication--authorization)
10. [Storage Architecture](#storage-architecture)
11. [AI Integration Patterns](#ai-integration-patterns)
12. [Design System](#design-system)
13. [State Management](#state-management)
14. [Performance Architecture](#performance-architecture)
15. [Deployment Architecture](#deployment-architecture)
16. [Security Architecture](#security-architecture)

---

## Executive Summary

VibrationFit is a Next.js 15 SaaS application built on the App Router architecture. It serves as a platform for conscious creation, providing users with tools to build life visions, track alignment, and capture evidence of actualization.

### Core Principles

- **Next.js 15 App Router**: Modern file-based routing with Server and Client Components
- **TypeScript**: Full type safety across the application
- **Supabase**: PostgreSQL database with Row Level Security
- **AWS S3**: Media storage (images, videos, audio)
- **Design System**: Consistent UI components via `@/lib/design-system`
- **Vibrational Brand System**: Dark-first design with green/teal/purple accents

---

## Application Structure

```
vibrationfit/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout (AuthProvider, GlobalLayout)
│   │   ├── page.tsx                  # Homepage
│   │   ├── globals.css               # Global styles
│   │   ├── api/                      # API routes (40+ endpoints)
│   │   ├── auth/                     # Authentication pages
│   │   ├── dashboard/                # User dashboard & sub-pages
│   │   ├── life-vision/              # Life Vision system
│   │   ├── vision-board/             # Vision boards & gallery
│   │   ├── journal/                  # Journal entries
│   │   ├── profile/                  # User profiles
│   │   ├── assessment/               # Vibration assessment
│   │   ├── intensive/                # Activation Intensive program
│   │   ├── admin/                    # Admin panel
│   │   └── design-system/            # Design system showcase
│   │
│   ├── components/                   # Reusable React components
│   │   ├── GlobalLayout.tsx          # Route-based layout system
│   │   ├── Header.tsx                # Public header navigation
│   │   ├── Sidebar.tsx               # User/admin sidebar navigation
│   │   ├── Footer.tsx                # Public footer
│   │   ├── AuthProvider.tsx          # Auth context provider
│   │   ├── vision/                   # Vision-related components
│   │   ├── viva/                     # VIVA AI components
│   │   └── [feature-components]      # Feature-specific components
│   │
│   ├── lib/                          # Core libraries & utilities
│   │   ├── design-system/            # Design system components & tokens
│   │   ├── supabase/                 # Supabase client & server instances
│   │   ├── storage/                  # S3 & IndexedDB storage
│   │   ├── ai/                       # AI client configuration
│   │   ├── viva/                     # VIVA AI assistant logic
│   │   ├── services/                 # Business logic services
│   │   ├── stripe/                   # Stripe integration
│   │   └── utils/                    # Utility functions
│   │
│   └── styles/                       # Additional stylesheets
│       └── brand.css                 # Brand-specific styles
│
├── public/                           # Static assets
├── supabase/                         # Supabase migrations & functions
├── functions/                        # AWS Lambda functions
└── [config-files]                    # Config, package.json, etc.
```

---

## Technical Stack

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x (strict mode)
- **Styling**: Tailwind CSS 4.x + Custom Brand System
- **UI Components**: Custom design system (`@/lib/design-system`)
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **Charts**: Recharts
- **Markdown**: React Markdown

### Backend & Data
- **Database**: Supabase (PostgreSQL 14+)
- **Authentication**: Supabase Auth (email/password, magic links)
- **Storage**: AWS S3 (`vibration-fit-client-storage`)
- **Real-time**: Supabase Realtime
- **Row Level Security**: Enabled on all user tables

### AI & Media
- **AI Chat**: OpenAI API (GPT-4) via `@ai-sdk/openai`
- **AI SDK**: Vercel AI SDK (`ai` package)
- **Audio Generation**: ElevenLabs API (planned)
- **Audio Processing**: Client-side MediaRecorder API
- **Video Processing**: AWS MediaConvert + Lambda
- **Image Processing**: Sharp (server-side)

### Payments
- **Stripe**: Subscription & billing management
- **Webhooks**: Stripe webhook handlers

### Deployment
- **Hosting**: Vercel (auto-deploy from GitHub main)
- **Domain**: vibrationfit.com (Cloudflare)
- **Build**: Turbopack enabled
- **CI/CD**: GitHub → Vercel automatic deployments

### Development Tools
- **IDE**: Cursor with Claude AI
- **Package Manager**: npm
- **Linting**: ESLint (Next.js config)
- **Type Checking**: TypeScript strict mode

---

## Routing Architecture

### File-Based Routing (Next.js App Router)

All routes are defined in `src/app/` using Next.js 15 App Router conventions:

```
src/app/
├── page.tsx                    → /
├── pricing/page.tsx            → /pricing
├── auth/login/page.tsx         → /auth/login
├── dashboard/page.tsx          → /dashboard
├── dashboard/activity/page.tsx → /dashboard/activity
├── life-vision/[id]/page.tsx   → /life-vision/:id
└── api/viva/chat/route.ts      → /api/viva/chat
```

### Route Classification

Routes are classified into three types (handled by `GlobalLayout.tsx`):

#### 1. **USER Pages** (Sidebar Layout)
- Dashboard (`/dashboard/*`)
- Life Vision (`/life-vision/*`)
- Vision Board (`/vision-board/*`)
- Journal (`/journal/*`)
- Profile (`/profile/*`)
- Assessment (`/assessment/*`)
- Intensive (`/intensive/*`)
- Actualization Blueprints (`/actualization-blueprints/*`)
- Billing (`/billing`)
- Account Settings (`/account/settings`)

#### 2. **ADMIN Pages** (Sidebar Layout + Admin Nav)
- Admin Panel (`/admin/*`)
- Design System (`/design-system`)
- Sitemap (`/sitemap`)

#### 3. **PUBLIC Pages** (Header + Footer)
- Homepage (`/`)
- Pricing (`/pricing`, `/pricing-hormozi`)
- Authentication (`/auth/*`)
- Checkout (`/checkout`)
- Debug/Testing (`/debug/*`, `/test-recording`)

### Dynamic Routes

- `[id]` - Dynamic ID segments (e.g., `/life-vision/[id]`)
- `[...slug]` - Catch-all routes (not currently used)

### API Routes

All API routes live in `src/app/api/` and use Next.js Route Handlers:

```
src/app/api/
├── viva/chat/route.ts              # VIVA AI chat (streaming)
├── vision/generate/route.ts        # Vision generation
├── assessment/route.ts             # Assessment CRUD
├── upload/presigned/route.ts       # S3 presigned URLs
├── stripe/webhook/route.ts         # Stripe webhooks
└── [feature]/[action]/route.ts     # Feature-specific APIs
```

---

## Layout System

### Root Layout (`src/app/layout.tsx`)

The root layout provides:
- Global metadata & SEO
- Font loading (Poppins)
- AuthProvider wrapper
- GlobalLayout wrapper
- Toaster (notifications)

```tsx
<AuthProvider>
  <GlobalLayout>
    {children}
  </GlobalLayout>
  <Toaster />
</AuthProvider>
```

### GlobalLayout (`src/components/GlobalLayout.tsx`)

**Route-based layout switching:**

1. **USER/ADMIN Pages** → `SidebarLayout` + `PageLayout`
   - Fixed sidebar navigation
   - Mobile drawer navigation
   - Page content container

2. **PUBLIC Pages** → `Header` + `PageLayout` + `Footer`
   - Top navigation header
   - Page content container
   - Footer with links

### PageLayout Component

From design system (`@/lib/design-system`):
- Provides consistent container sizing (`sm`, `md`, `lg`, `xl`)
- Adds consistent padding/margins
- Responsive breakpoints

### Sidebar Component (`src/components/Sidebar.tsx`)

- **User Sidebar**: Dashboard, Life Vision, Journal, Profile, etc.
- **Admin Sidebar**: Admin panel, token usage, AI models
- **Mobile**: Drawer navigation (collapsible)
- **Active State**: Highlights current route

---

## Component Architecture

### Component Categories

#### 1. **Layout Components**
- `GlobalLayout.tsx` - Route-based layout selector
- `Header.tsx` - Public navigation
- `Sidebar.tsx` - User/admin navigation
- `Footer.tsx` - Public footer

#### 2. **Feature Components**
- `vision/` - Vision builder, chat interface, category progress
- `viva/` - VIVA AI chat component
- Profile components (19 files in `profile/components/`)
- Assessment components (QuestionCard, ResultsSummary, etc.)

#### 3. **Shared Components**
- `FileUpload.tsx` - File upload with S3 presigned URLs
- `AudioPlayer.tsx` - Audio playback
- `MediaRecorder.tsx` - Audio recording
- `OptimizedImage.tsx` - Optimized image loading
- `OptimizedVideo.tsx` - Video playback with processing status

#### 4. **Design System Components**
- Located in `src/lib/design-system/components.tsx`
- **Buttons**: Button, GradientButton, AIButton
- **Cards**: Card (default, elevated, outlined)
- **Forms**: Input, Textarea, Badge, ProgressBar
- **Layout**: Container, PageLayout, SidebarLayout
- **Feedback**: Spinner, Toast (via Sonner)

### Component Patterns

#### Server vs Client Components

- **Server Components** (default): Pages, layouts, data fetching
- **Client Components** (`'use client'`): Interactive UI, hooks, browser APIs

#### Data Fetching

- **Server Components**: Direct Supabase queries via `@/lib/supabase/server`
- **Client Components**: Supabase client via `@/lib/supabase/client`
- **API Routes**: Server-side handlers for mutations, webhooks, etc.

---

## API Architecture

### API Route Structure

All API routes follow Next.js Route Handler pattern:

```typescript
// src/app/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Handle GET requests
}

export async function POST(request: NextRequest) {
  // Handle POST requests
}
```

### API Categories

#### **Authentication APIs**
- `/api/auth/auto-login` - Auto-login handler
- `/api/auth/callback` - OAuth callback
- `/api/auth/logout` - Logout handler

#### **Assessment APIs**
- `/api/assessment` - CRUD operations
- `/api/assessment/ai-score` - AI scoring
- `/api/assessment/progress` - Progress tracking
- `/api/assessment/responses` - Response management

#### **VIVA AI APIs**
- `/api/viva/chat` - Streaming chat (Edge Runtime)
- `/api/viva/context` - Load user context
- `/api/viva/vision-generate` - Vision generation
- `/api/viva/master-vision` - Master vision composition

#### **Vision APIs**
- `/api/vision/generate` - Generate vision
- `/api/vision/chat` - Vision chat
- `/api/vision/progress` - Progress tracking
- `/api/vision/conversation` - Conversation management

#### **Upload & Media APIs**
- `/api/upload/presigned` - S3 presigned URLs
- `/api/upload/profile-picture` - Profile picture upload
- `/api/upload/status` - Upload status
- `/api/mediaconvert/trigger` - Trigger video processing
- `/api/media/process-completed` - Media processing callback

#### **Audio APIs**
- `/api/audio/generate` - Audio generation
- `/api/audio/voices` - Voice options
- `/api/audio/mix` - Audio mixing
- `/api/transcribe` - Audio transcription

#### **Profile & User APIs**
- `/api/profile` - Profile CRUD
- `/api/profile/versions` - Profile versioning
- `/api/storage/usage` - Storage usage stats

#### **Stripe APIs**
- `/api/stripe/checkout` - Checkout session
- `/api/stripe/portal` - Customer portal
- `/api/stripe/webhook` - Webhook handler
- `/api/stripe/validate-coupon` - Coupon validation

#### **Admin APIs**
- `/api/admin/users` - User management
- `/api/admin/token-usage` - Token analytics
- `/api/admin/ai-overrides` - AI model overrides

#### **Other APIs**
- `/api/tokens` - Token management
- `/api/activity/feed` - Activity feed
- `/api/referral/generate` - Referral generation

### API Patterns

#### **Streaming Responses** (VIVA Chat)
```typescript
export const runtime = 'edge' // Edge Runtime for streaming

export async function POST(request: Request) {
  const stream = await streamText({ ... })
  return stream.toDataStreamResponse()
}
```

#### **Error Handling**
```typescript
try {
  // API logic
  return NextResponse.json({ success: true, data })
} catch (error) {
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  )
}
```

#### **Authentication**
```typescript
import { createServerClient } from '@/lib/supabase/server'

const supabase = createServerClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## Data Layer

### Database: Supabase (PostgreSQL)

#### **Core Tables**

1. **user_profiles** - User profile data
   - Personal info, demographics, financial data
   - Life story fields (12 categories)
   - Token tracking, subscription tier

2. **vision_versions** - Life vision documents
   - Version-controlled visions (14 sections)
   - Status, completion percentage
   - Audio URLs, refinements

3. **journal_entries** - Journal entries
   - Date, mood (above/below green line)
   - Life category, entry type
   - Content, media URLs

4. **vision_board_items** - Vision board items
   - Kanban status (desire, in_progress, actualized)
   - Category, title, description, images

5. **assessments** - Vibration assessments
   - Assessment progress, completion
   - AI scores, responses

6. **ai_conversations** - AI chat history
   - Messages (user/assistant)
   - Context data, timestamps

7. **token_transactions** - Token usage
   - Token purchases, usage, balances

8. **customer_subscriptions** - Stripe subscriptions
   - Subscription status, tiers, billing

9. **membership_tiers** - Membership definitions
   - Tier names, features, pricing

### Row Level Security (RLS)

All tables enforce RLS policies:
- Users can only access their own data
- Admins have elevated access via service role
- Policies checked on every query

### Data Access Patterns

#### **Server-Side** (Server Components, API Routes)
```typescript
import { createServerClient } from '@/lib/supabase/server'

const supabase = createServerClient()
const { data, error } = await supabase
  .from('vision_versions')
  .select('*')
  .eq('user_id', user.id)
```

#### **Client-Side** (Client Components)
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase
  .from('journal_entries')
  .select('*')
```

### Real-time Subscriptions

```typescript
const channel = supabase
  .channel('vision-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'vision_versions',
  }, (payload) => {
    // Handle real-time update
  })
  .subscribe()
```

---

## Authentication & Authorization

### Authentication System

**Provider**: Supabase Auth

#### **Auth Flows**

1. **Email/Password**: Traditional signup/login
2. **Magic Link**: Passwordless email authentication
3. **OAuth**: Ready for social providers (not yet implemented)

#### **Auth Pages**

- `/auth/login` - Login page
- `/auth/signup` - Registration page
- `/auth/verify` - Email verification
- `/auth/setup-password` - Password setup
- `/auth/callback` - OAuth callback handler

#### **AuthProvider Component**

Wraps application and provides:
- User session state
- Auth state change listeners
- Redirect logic for protected routes

### Authorization Patterns

#### **Route Protection**

Server Components check auth:
```typescript
import { createServerClient } from '@/lib/supabase/server'

const supabase = createServerClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  redirect('/auth/login')
}
```

#### **Admin Check**

```typescript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('is_admin')
  .eq('user_id', user.id)
  .single()

if (!profile?.is_admin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## Storage Architecture

### AWS S3 Storage

**Bucket**: `vibration-fit-client-storage`

#### **Storage Structure**

```
s3://vibration-fit-client-storage/
└── user-uploads/
    └── {userId}/
        ├── journal/
        │   └── uploads/
        ├── vision-board/
        │   └── uploads/
        ├── evidence/
        │   └── uploads/
        └── profile/
            └── profile-picture.{ext}
```

#### **Presigned URLs**

- Generated server-side via `/api/upload/presigned`
- Client uploads directly to S3
- URLs expire after configured time

#### **Video Processing Pipeline**

1. **Upload**: Client uploads to S3 via presigned URL
2. **Trigger**: S3 event triggers Lambda function
3. **Process**: Lambda triggers AWS MediaConvert job
4. **Output**: MediaConvert creates multiple quality versions + thumbnails
5. **Database**: Lambda updates journal entry with processed URLs
6. **Cleanup**: Original upload deleted after processing

### IndexedDB (Client-Side)

Used for:
- Audio recording temporary storage
- Offline data caching
- Media file buffering

---

## AI Integration Patterns

### VIVA AI Assistant

**Core System**: Located in `src/lib/viva/`

#### **Architecture**

1. **Context Loading** (`/api/viva/context`)
   - Loads user profile, vision, journal entries
   - Builds comprehensive context for AI

2. **Streaming Chat** (`/api/viva/chat`)
   - Edge Runtime for low latency
   - Streaming responses via Vercel AI SDK
   - Real-time token streaming

3. **Vision Generation** (`/api/viva/vision-generate`)
   - AI-assisted vision creation
   - Category-by-category generation
   - Version-controlled output

#### **Components**

- `VivaChat.tsx` - Chat interface component
- `ConversationManager` - Manages conversation state
- `VisionComposer` - Composes vision documents
- `ProfileAnalyzer` - Analyzes user profile for context

### AI SDK Usage

```typescript
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

const result = await streamText({
  model: openai('gpt-4'),
  messages: [...conversationHistory],
  system: systemPrompt,
})

return result.toDataStreamResponse()
```

### Token Management

- Token tracking via `token_transactions` table
- Allowance system for feature gating
- Usage analytics in admin panel

---

## Design System

### Component Library

**Location**: `src/lib/design-system/components.tsx`

#### **Button Variants**

- `primary` - Main CTAs (#199D67 green)
- `secondary` - Supporting actions (#14B8A6 teal)
- `accent` - Premium features (#8B5CF6 purple)
- `ghost` - Subtle actions
- `outline` - Tertiary actions
- `danger` - Destructive actions (#D03739 red)

**Special Buttons**:
- `GradientButton` - Gradient backgrounds (brand, green, teal, purple, cosmic)
- `AIButton` - AI Assistant features

#### **Card Variants**

- `default` - Standard card (#1F1F1F bg, 2px border)
- `elevated` - Lifted card with shadow
- `outlined` - Border-only card

#### **Design Tokens**

**Location**: `src/lib/design-system/tokens.ts`

- Colors: Primary green, secondary teal, accent purple, energy yellow, contrast red
- Spacing: Consistent 4px/8px/16px/32px scale
- Typography: Poppins font family, size scale
- Borders: 2px standard, rounded-2xl (16px) corners

### Brand System

**Reference**: `vibrationfit-brand-kit.html` (single source of truth)

**Core Principles**:
- Dark mode first (#000000 background)
- High contrast for accessibility
- Pill-shaped buttons (rounded-full)
- Hover lift animations (-translate-y-0.5)
- Consistent spacing (32px card padding)

---

## State Management

### Current Approach

**No global state management library** (Redux, Zustand, etc.)

#### **State Solutions**

1. **Server State**: Supabase queries (fetch on demand)
2. **URL State**: Next.js searchParams for filters/pagination
3. **Component State**: React `useState`, `useReducer`
4. **Context**: `AuthProvider` for auth state only
5. **Form State**: Controlled inputs (no form library)

### Future Considerations

For complex state needs:
- Consider React Query for server state caching
- Zustand for global client state (if needed)

---

## Performance Architecture

### Optimization Strategies

#### **1. Next.js Optimizations**

- **Server Components**: Reduce client bundle size
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Next.js font loading
- **Turbopack**: Faster builds during development

#### **2. API Optimization**

- **Edge Runtime**: VIVA chat uses Edge for low latency
- **Streaming**: Real-time AI responses
- **Caching**: API route caching where appropriate

#### **3. Media Optimization**

- **Video Processing**: Multiple quality versions (1080p, 720p, original)
- **Image Optimization**: Sharp for server-side resizing
- **Lazy Loading**: Components lazy-loaded where possible
- **Presigned URLs**: Direct S3 uploads (reduces server load)

#### **4. Database Optimization**

- **Indexes**: Strategic indexes on frequently queried columns
- **RLS Policies**: Efficient policies for fast queries
- **Connection Pooling**: Supabase handles connection pooling

### Performance Metrics

See `guides/VIVA_PERFORMANCE_GUIDE.md` for detailed performance documentation.

---

## Deployment Architecture

### Hosting: Vercel

- **Framework**: Next.js (auto-detected)
- **Build Command**: `npm run build` (Turbopack enabled)
- **Deployment**: Automatic on `main` branch push
- **Preview Deployments**: Automatic for PRs

### Domain: Cloudflare

- **Production**: vibrationfit.com
- **DNS**: Managed via Cloudflare
- **SSL**: Automatic via Vercel/Cloudflare

### Environment Variables

**Vercel Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### AWS Services

- **S3**: Media storage
- **Lambda**: Video processing triggers
- **MediaConvert**: Video transcoding
- **IAM**: Service roles for Lambda/S3 access

---

## Security Architecture

### Authentication Security

- **Supabase Auth**: Industry-standard auth
- **JWT Tokens**: Secure session management
- **HTTPS Only**: All traffic encrypted

### Data Security

- **Row Level Security (RLS)**: Database-level access control
- **Service Role**: Admin operations only (server-side)
- **API Authentication**: All API routes check auth

### Storage Security

- **S3 Bucket Policies**: Restrict access to authenticated users
- **Presigned URLs**: Time-limited, scoped uploads
- **CORS**: Configured for allowed origins only

### API Security

- **Input Validation**: Validate all inputs
- **SQL Injection Protection**: Supabase parameterized queries
- **XSS Prevention**: React auto-escaping
- **CSRF Protection**: Next.js built-in CSRF protection

### Secrets Management

- **Environment Variables**: Never committed to git
- **Vercel Secrets**: Managed via Vercel dashboard
- **Service Role Keys**: Server-only, never exposed to client

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Run dev server (Turbopack)
npm run dev

# Build production
npm run build

# Start production server
npm start
```

### Git Workflow

- **Main Branch**: Production deployments
- **Feature Branches**: PR workflow
- **Pre-deploy Checks**: `npm run pre-deploy` script

### Database Migrations

- **Supabase Migrations**: Located in `supabase/migrations/`
- **Apply Migrations**: Via Supabase CLI or dashboard

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js ESLint config (warnings allowed in builds)
- **Pre-commit**: Consider adding Husky hooks (future)

---

## Architecture Decision Records

### Why Next.js 15 App Router?

- **Modern Routing**: File-based routing with layouts
- **Server Components**: Reduced client bundle size
- **Streaming**: Real-time AI responses
- **Edge Runtime**: Low-latency AI chat

### Why Supabase?

- **PostgreSQL**: Powerful relational database
- **Row Level Security**: Built-in security
- **Real-time**: Live data updates
- **Auth**: Integrated authentication

### Why AWS S3?

- **Scalability**: Handles large media files
- **Cost-Effective**: Pay for storage used
- **CDN Integration**: Can integrate CloudFront (future)
- **MediaConvert**: Integrated video processing

### Why No State Management Library?

- **Server Components**: Reduce need for client state
- **Supabase Real-time**: Live updates without polling
- **Simplicity**: Less complexity for current scale
- **Future**: Can add if needed as app grows

---

## Future Architecture Considerations

### Potential Improvements

1. **State Management**: Add React Query for server state caching
2. **Testing**: Add Jest/Vitest + React Testing Library
3. **Monitoring**: Add error tracking (Sentry)
4. **Analytics**: Add user analytics (PostHog, Mixpanel)
5. **CDN**: CloudFront for media delivery
6. **Caching**: Redis for frequently accessed data
7. **Queue System**: For background jobs (video processing, emails)

### Scalability Considerations

- **Database**: Supabase scales automatically
- **Storage**: S3 scales infinitely
- **API**: Vercel Edge Network scales globally
- **Video Processing**: MediaConvert scales with demand

---

## Quick Reference

### Key File Locations

- **Pages**: `src/app/*/page.tsx`
- **API Routes**: `src/app/api/*/route.ts`
- **Components**: `src/components/`
- **Design System**: `src/lib/design-system/`
- **Supabase Client**: `src/lib/supabase/client.ts`
- **Supabase Server**: `src/lib/supabase/server.ts`
- **Layout System**: `src/components/GlobalLayout.tsx`

### Common Patterns

- **Server Component Data Fetching**: Use `@/lib/supabase/server`
- **Client Component Data Fetching**: Use `@/lib/supabase/client`
- **API Route Auth**: Check `await supabase.auth.getUser()`
- **File Upload**: Use `/api/upload/presigned` + direct S3 upload
- **AI Chat**: Use `VivaChat` component from `@/components/viva/VivaChat`

---

**Document Maintained By**: Development Team  
**Last Architecture Review**: January 2025  
**Next Review**: As needed when major changes occur

