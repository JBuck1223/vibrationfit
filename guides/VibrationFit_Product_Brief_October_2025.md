# VibrationFit — SaaS Product Brief
**Updated: October 2025**  
**Status:** Live in Production at vibrationfit.com

---

## Positioning Statement

Vibration Fit is the SaaS platform for conscious creation. We help members become the conscious creators of their reality by giving them the tools, AI guidance, and daily practices to:

1. **Create an Active Vision** for life in 12 categories.
2. **Create an alignment plan** to stay in consistent alignment with that vision.
3. **Capture evidence of actualization** in real time.

---

## The 3 Core Operations of Conscious Creation (Platform Flow)

### 1. Active Vision

- Members build their **Life I Choose™** document across 12 life categories:
  - **Fun** - Hobbies and joyful activities
  - **Health** - Physical and mental well-being  
  - **Travel** - Places to explore and adventures
  - **Love** - Romantic relationships
  - **Family** - Family relationships and life
  - **Social** - Social connections and friendships
  - **Home** - Living space and environment
  - **Work** - Work and career aspirations
  - **Money** - Financial goals and wealth
  - **Stuff** - Material belongings and things
  - **Giving** - Contribution and legacy
  - **Spirituality** - Spiritual growth and expansion

- **Guided form + AI refinement** makes it easy to articulate a clear, vibrationally aligned vision.
- **Output:** Vision Document + Immersive Audio Tracks (with optional nature/music overlays).

---

### 2. Consistent Alignment

- Members activate their vision daily through **My Alignment Plan (MAP)**:
  - **Vision Boards** (Kanban-style: Desire → In Progress → Actualized)
  - **Vision Audio** (personalized recordings)
  - **Immersion Tracks** (rain, ocean, soft music, nature sounds)
  - **AI Vibrational Assistant** prompts nudges, ladders, and reframes

- MAP = their personal operating system for staying vibrationally fit.

---

### 3. Evidence of Actualization

- Members capture progress in the **Conscious Creation Journal**:
  - Daily log of moods, shifts, synchronicities, and wins
  - Structured fields: Date, Above/Below Green Line, Life Category, Type (contrast, clarity, evidence, other)
  - Rich entries (text, images, video)

- Journal entries become **proof of transformation** — a living record that reinforces new identity.

---

## Differentiator: AI Vibrational Assistant (VIVA)

- Each member has a **personal database** (Vision, Journal, MAP, Ladders, Lexicon)
- The AI Assistant has **full context** of that member's journey
- **Functions:**
  - Generate reframes (Vibe I Choose™ Ladder)
  - Spot patterns in journaling
  - Offer reminders of past wins
  - Suggest refinements to vision or MAP
  - Learn over time (anticipate dips, strengthen alignment)

---

## Business Model

- **SaaS Membership:** Recurring subscription for the Conscious Creation System + AI Assistant
- **Community, live events, and coaching** — available 24/7 through your Vibrational Assistant, and also with real humans

---

## Tech Stack (Current Implementation)

### **Platform**
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + Custom Brand System
- **Deployment:** Vercel (auto-deploy from GitHub main branch)
- **Domain:** vibrationfit.com (managed via Cloudflare)
- **Build System:** Turbopack (Next.js 15)

### **Backend & Data**
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Authentication:** Supabase Auth (email/password, magic links, OAuth ready)
- **Storage:** AWS S3 (for audio files, images, videos)
- **Real-time:** Supabase Realtime (for live updates)

### **AI & Audio**
- **AI Chat:** OpenAI API (GPT-4) + AI SDK v5.0.68
- **Image Generation:** OpenAI DALL-E 3 (via VIVA)
- **Context System:** Custom vector storage for per-user AI memory
- **Audio Generation:** ElevenLabs API - *Planned*

### **Payments**
- **Stripe:** Subscription management, billing portal (v19.1.0)

### **Development**
- **IDE:** Cursor with Claude AI (Sonnet 4.5)
- **Version Control:** GitHub (JBuck1223/vibrationfit)
- **Package Manager:** npm
- **Code Quality:** ESLint + TypeScript strict mode

---

## Database Schema

### **Core Tables (Supabase)**

```sql
-- User Profiles
user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT,
  vibe_assistant_tokens_used INTEGER DEFAULT 0,
  vibe_assistant_tokens_remaining INTEGER DEFAULT 100,
  vibe_assistant_total_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Life Vision Documents
vision_versions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  version INTEGER,
  sections JSONB, -- 12 life categories + meta sections
  audio_url TEXT,
  is_active BOOLEAN,
  completion_percent INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- AI Refinements (formerly vibe_assistant_logs)
refinements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  vision_id UUID REFERENCES vision_versions(id),
  category TEXT,
  operation_type TEXT, -- 'refine_vision', 'generate_vision', etc.
  input_text TEXT,
  output_text TEXT,
  status TEXT, -- 'draft', 'committed'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Journal Entries
journal_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE,
  title TEXT,
  content TEXT,
  entry_type TEXT, -- 'contrast', 'clarity', 'evidence', 'other'
  categories TEXT[], -- array of life categories
  image_urls TEXT[], -- array of image URLs
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Vision Board Items
vision_board_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  category TEXT,
  title TEXT,
  description TEXT,
  status TEXT, -- 'desire', 'in_progress', 'actualized'
  image_url TEXT,
  created_at TIMESTAMP,
  actualized_at TIMESTAMP
)

-- Generated Images Gallery
generated_images (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  gallery_id UUID,
  image_url TEXT,
  s3_key TEXT,
  prompt TEXT,
  model TEXT,
  created_at TIMESTAMP
)

-- Token Usage Tracking
token_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT, -- 'assessment_scoring', 'vision_generation', 'vision_refinement', etc.
  model_used TEXT,
  tokens_used INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_estimate NUMERIC(10, 4) DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

### **Row Level Security (RLS)**
- All tables have policies ensuring users can only access their own data
- Service role key used for admin operations only

---

## Current Implementation Status

### ✅ **Completed (Live in Production)**
- [x] Authentication system (login, signup, logout)
- [x] Member dashboard with stats
- [x] Life Vision form (12 categories)
- [x] Vision list view (all user visions)
- [x] Individual vision view/edit with auto-save
- [x] Vision refinement system with VIVA AI
- [x] Draft system for vision refinements
- [x] Journal system with rich media support
- [x] Vision board system (Kanban-style)
- [x] AI image generation (VIVA integration)
- [x] Database schema (Supabase PostgreSQL)
- [x] Production deployment (Vercel)
- [x] Custom domain (vibrationfit.com)
- [x] Brand system (colors, typography)
- [x] Responsive design (mobile-first)
- [x] Homepage with hero section
- [x] AWS S3 integration (images, videos, audio)
- [x] Token usage tracking system
- [x] Design system with reusable components
- [x] Admin pages (user management, token usage, design system)

### 🚧 **In Progress**
- [ ] AI Chat integration (OpenAI API)
- [ ] Context-aware AI prompting
- [ ] Audio generation (ElevenLabs)
- [ ] Advanced pattern recognition in journals

### 📋 **Planned (Priority Order)**
1. **Enhanced AI Features**
   - Advanced pattern spotting in journals
   - Personalized nudges and reminders
   - Vibe I Choose™ Ladder generator
   - Context-aware conversation history

2. **Audio Experience**
   - Text-to-speech vision narration
   - Nature sound overlays
   - Custom music integration
   - Downloadable MP3s

3. **Subscription & Payments**
   - Tiered pricing (Free, Pro, Premium)
   - Billing portal enhancements
   - Trial periods

4. **Community Features**
   - Member forum
   - Live event calendar
   - Group coaching sessions
   - Success story sharing

---

## Development Environment

### **Local Setup**
```bash
# Clone repository
git clone https://github.com/JBuck1223/vibrationfit.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase, AWS, OpenAI, ElevenLabs keys

# Run development server
npm run dev --turbopack
# Open http://localhost:3000
```

### **Required Environment Variables**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# AI Services
OPENAI_API_KEY=
ELEVENLABS_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### **Deployment**
- **Automatic:** Push to `main` branch triggers Vercel deployment
- **Preview:** Pull requests create preview deployments
- **Domain:** vibrationfit.com (production), auto-generated URLs (preview)

---

## Brand System

### **Core Colors**
- **Primary Green:** `#199D67` - "Above the Green Line", growth, alignment
- **Secondary Teal:** `#14B8A6` - Clarity, flow, information
- **Accent Purple:** `#8B5CF6` - Premium, AI assistant, mystical
- **Energy Yellow:** `#FFB701` - Celebrations, wins, actualization
- **Contrast Red:** `#D03739` - "Below Green Line", contrast moments
- **Neutrals:** `#000000` (bg), `#1F1F1F` (cards), `#FFFFFF` (text)

### **Typography**
- **System Font Stack:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Hierarchy:** Clear, modern, accessible

### **Design Principles**
- Dark mode first (reduces eye strain, creates focus)
- High contrast for accessibility
- Vibrant accent colors for emotional impact
- Smooth animations and transitions
- Mobile-first responsive design

---

## Vision Statement

Vibration Fit is the world's first SaaS platform for conscious creation.

Instead of just learning about universal laws, members implement them daily through software. Their Active Vision, Alignment Plan, and Actualization Journal combine into a personal operating system for living above the Green Line.

In addition to a fully operational conscious creation system with support tools, we also anticipate where members can get stuck on their journey to conscious creator and help them alleviate vibrational resistance to their vision in real time.

**The more you feed VibrationFit.com, the smarter it gets on YOU!** Enhancing its ability to help you live the life you choose above the Green Line.

---

## ✨ One-Liner

*"Vibration Fit is a SaaS platform that helps you create a vision for your life, align with it daily, and capture evidence as it actualizes — with an AI Assistant that knows your journey."*

---

## Quick Links

- **Live Site:** https://vibrationfit.com
- **GitHub:** https://github.com/JBuck1223/vibrationfit
- **Supabase Dashboard:** [Project-specific URL]
- **Vercel Dashboard:** [Project-specific URL]
- **AWS S3 Bucket:** [Bucket name]

---

## Contact & Support

- **Development Team:** Claude AI + Cursor IDE
- **Platform Owner:** [Your name/contact]
- **Support Email:** [When implemented]

---

**Last Updated:** October 2025  
**Document Version:** 3.0 (Post-Launch with AI Features)
