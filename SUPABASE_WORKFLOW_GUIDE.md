# VibrationFit Supabase Development Workflow

## 🚀 **Complete Development → Production Workflow**

### **Prerequisites**
- ✅ Docker installed and running
- ✅ Supabase CLI installed
- ✅ Local Supabase running (`npx supabase start`)

### **Step 1: Link to Production Project**

```bash
# Get your project ref from https://supabase.com/dashboard
# It's in your project URL: https://supabase.com/dashboard/project/[PROJECT_REF]

# Link local to production
npx supabase link --project-ref YOUR_ACTUAL_PROJECT_REF

# Example:
# npx supabase link --project-ref abcdefghijklmnopqrst
```

### **Step 2: Development Workflow**

```bash
# 1. Start local development
npx supabase start

# 2. Develop your app locally
npm run dev

# 3. View local database
# Open: http://127.0.0.1:54323

# 4. Create new migrations when needed
npx supabase migration new add_new_feature

# 5. Test migrations locally
npx supabase db reset  # Reset and apply all migrations
```

### **Step 3: Push to Production**

```bash
# Push all pending migrations to production
npx supabase db push

# This will:
# ✅ Apply all new migrations to production database
# ✅ Create new tables, columns, functions
# ✅ Update RLS policies
# ✅ Deploy schema changes
```

### **Step 4: Deploy Your App**

```bash
# Push code changes to GitHub
git add .
git commit -m "Add new feature with database changes"
git push origin main

# Vercel automatically deploys your app
# Your app now uses the updated production database
```

## 📊 **Current Migrations Ready to Push**

### **Essential Tables:**
- ✅ `user_profiles` - User data with token tracking
- ✅ `vision_versions` - Vision documents
- ✅ `token_usage` - AI token consumption tracking
- ✅ `assessment_results` - Assessment data
- ✅ `assessment_responses` - Individual responses with AI scoring

### **Features Included:**
- ✅ **Token Tracking System** - Track all AI usage
- ✅ **Assessment AI Scoring** - Custom response scoring
- ✅ **User Profile System** - Complete user management
- ✅ **Vision Management** - Life vision documents
- ✅ **Row Level Security** - Proper access controls

## 🔧 **Environment Variables**

### **Local Development (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
```

### **Production (Vercel):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
```

## 🎯 **Benefits of This Workflow**

### **Development:**
- ✅ **Fast iteration** - No waiting for production deployments
- ✅ **Safe testing** - Test migrations locally first
- ✅ **Full control** - Reset database anytime
- ✅ **Offline development** - No internet needed

### **Production:**
- ✅ **Zero downtime** - Migrations are atomic
- ✅ **Rollback safe** - Each migration is tracked
- ✅ **Version controlled** - All changes in Git
- ✅ **Team collaboration** - Everyone uses same migrations

## 🚀 **Next Steps**

1. **Link to production**: `npx supabase link --project-ref YOUR_REF`
2. **Test locally**: Use the app with local database
3. **Push to production**: `npx supabase db push`
4. **Deploy app**: `git push origin main`

## 📝 **Migration Management**

### **View Migration Status:**
```bash
npx supabase migration list
```

### **Reset Local Database:**
```bash
npx supabase db reset
```

### **Generate Types:**
```bash
npx supabase gen types typescript --local > src/types/supabase.ts
```

### **Backup Production Data:**
```bash
npx supabase db dump --data-only > backup.sql
```

---

**This workflow gives you the same developer experience as Git/GitHub but for your database!** 🎉
