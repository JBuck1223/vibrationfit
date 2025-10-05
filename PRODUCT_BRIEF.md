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
  - Fun & Recreation
  - Travel & Adventure
  - Home & Living Environment
  - Parenting & Family
  - Romance & Partnership
  - Health & Vitality
  - Money & Abundance
  - Business & Career
  - Friends & Social Life
  - Giving & Contribution
  - Possessions & Lifestyle
  - Spirituality & Growth

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

## Differentiator: AI Vibrational Assistant

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
- **Frontend:** Next.js 15 (App Router) + React 18 + TypeScript
- **Styling:** Tailwind CSS + Custom Brand System
- **Deployment:** Vercel (auto-deploy from GitHub main branch)
- **Domain:** vibrationfit.com (managed via Cloudflare)

### **Backend & Data**
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Authentication:** Supabase Auth (email/password, magic links, OAuth ready)
- **Storage:** AWS S3 (for audio files, images, videos)
- **Real-time:** Supabase Realtime (for live updates)

### **AI & Audio**
- **AI Chat:** OpenAI API (GPT-4) - *In Progress*
- **Audio Generation:** ElevenLabs API - *Planned*
- **Context System:** Custom vector storage for per-user AI memory

### **Payments** *(Planned)*
- **Stripe:** Subscription management, billing portal

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
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Life Vision Documents
vision_versions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT,
  version INTEGER,
  sections JSONB, -- 12 life categories + meta sections
  audio_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- AI Conversations
ai_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  message TEXT,
  role TEXT, -- 'user' or 'assistant'
  context JSONB, -- relevant vision/journal data
  created_at TIMESTAMP
)

-- Journal Entries (Planned)
journal_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  date DATE,
  mood TEXT, -- 'above_green_line' or 'below_green_line'
  category TEXT, -- one of 12 life categories
  entry_type TEXT, -- 'contrast', 'clarity', 'evidence', 'other'
  content TEXT,
  media_urls TEXT[],
  created_at TIMESTAMP
)

-- Vision Boards (Planned)
vision_board_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  category TEXT,
  title TEXT,
  description TEXT,
  status TEXT, -- 'desire', 'in_progress', 'actualized'
  image_url TEXT,
  created_at TIMESTAMP,
  actualized_at TIMESTAMP
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
- [x] Life Vision form (14 sections: 12 categories + 2 meta)
- [x] Vision list view (all user visions)
- [x] Individual vision view/edit
- [x] Database schema (Supabase PostgreSQL)
- [x] Production deployment (Vercel)
- [x] Custom domain (vibrationfit.com)
- [x] Brand system (colors, typography)
- [x] Responsive design (mobile-first)
- [x] Homepage with hero section

### 🚧 **In Progress**
- [ ] AI Chat integration (OpenAI API)
- [ ] Context-aware AI prompting
- [ ] Audio generation (ElevenLabs)
- [ ] AWS S3 integration (active but not used in UI yet)

### 📋 **Planned (Priority Order)**
1. **Journal System**
   - Daily entries with mood tracking
   - Life category tagging
   - Evidence capture (text, images, video)
   - Pattern recognition with AI

2. **My Alignment Plan (MAP)**
   - Vision boards (Kanban: Desire → In Progress → Actualized)
   - Vision audio player
   - Immersion track library
   - Daily alignment prompts

3. **AI Vibrational Assistant**
   - Chat interface with full user context
   - Vibe I Choose™ Ladder generator
   - Pattern spotting in journals
   - Personalized nudges and reminders

4. **Audio Experience**
   - Text-to-speech vision narration
   - Nature sound overlays
   - Custom music integration
   - Downloadable MP3s

5. **Subscription & Payments**
   - Stripe integration
   - Tiered pricing (Free, Pro, Premium)
   - Billing portal
   - Trial periods

6. **Community Features**
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
npm run dev
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

# AI Services (when implemented)
OPENAI_API_KEY=
ELEVENLABS_API_KEY=

# Stripe (when implemented)
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
**Document Version:** 2.0 (Post-Launch)