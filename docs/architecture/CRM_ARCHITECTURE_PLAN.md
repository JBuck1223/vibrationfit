# VibrationFit CRM System Architecture

## 🎯 **Recommended Approach: `crm.vibrationfit.com`**

### **Why Separate Subdomain:**
- **Performance**: CRM analytics won't slow down main user app
- **Security**: Dedicated admin environment with different auth
- **Scalability**: Can scale independently based on admin usage
- **Development**: Parallel development without affecting main app
- **User Experience**: Clean separation of user vs admin interfaces

## 🏗️ **Technical Architecture**

### **Database Strategy:**
- **Shared Supabase Instance**: Same database, different schemas
- **Dedicated CRM Schema**: `crm_*` tables for CRM-specific data
- **User Data Access**: Read-only access to main app tables
- **Real-time Sync**: Live updates from main app to CRM

### **Tech Stack:**
- **Frontend**: Next.js 15 (same as main app for consistency)
- **Database**: Supabase (shared instance)
- **Authentication**: Supabase Auth with admin-only access
- **Real-time**: Supabase Realtime for live user activity
- **Analytics**: Custom dashboard with charts and metrics

## 📊 **Core CRM Features**

### **1. User Analytics Dashboard**
```typescript
interface UserAnalytics {
  totalUsers: number
  activeUsers: number // last 30 days
  newUsers: number // last 30 days
  userRetention: {
    day1: number
    day7: number
    day30: number
  }
  featureUsage: {
    assessment: number
    visionGeneration: number
    intensive: number
    // ... other features
  }
  revenue: {
    total: number
    monthly: number
    averagePerUser: number
  }
}
```

### **2. Individual User Profiles**
```typescript
interface UserProfile {
  // Basic Info
  id: string
  email: string
  name: string
  joinedAt: Date
  lastActiveAt: Date
  
  // Usage Stats
  totalSessions: number
  assessmentCompletions: number
  visionGenerations: number
  intensiveProgress: number
  
  // Engagement Metrics
  averageSessionDuration: number
  featureUsageFrequency: Record<string, number>
  tokenUsage: TokenSummary
  
  // Revenue
  totalSpent: number
  subscriptionStatus: string
  paymentHistory: Payment[]
  
  // Communication History
  messages: Message[]
  tags: string[]
  notes: string
}
```

### **3. Communication System**
```typescript
interface CommunicationSystem {
  // One-on-One Messaging
  directMessages: {
    sendMessage(userId: string, message: Message): Promise<void>
    getConversation(userId: string): Promise<Message[]>
    markAsRead(messageId: string): Promise<void>
  }
  
  // Mass Communication
  campaigns: {
    createCampaign(campaign: Campaign): Promise<string>
    sendToSegment(segment: UserSegment, campaign: Campaign): Promise<void>
    trackOpenRates(campaignId: string): Promise<OpenRate[]>
    trackClickRates(campaignId: string): Promise<ClickRate[]>
  }
  
  // Email Templates
  templates: {
    createTemplate(template: EmailTemplate): Promise<string>
    previewTemplate(templateId: string, data: any): Promise<string>
    sendTemplate(templateId: string, userIds: string[]): Promise<void>
  }
}
```

### **4. App Usage Statistics**
```typescript
interface AppStatistics {
  // Real-time Metrics
  activeUsersNow: number
  sessionsToday: number
  newSignupsToday: number
  
  // Feature Usage
  assessmentCompletions: {
    daily: number[]
    weekly: number[]
    monthly: number[]
  }
  
  visionGeneration: {
    totalGenerated: number
    averagePerUser: number
    successRate: number
  }
  
  intensiveFlow: {
    started: number
    completed: number
    completionRate: number
    averageCompletionTime: number
  }
  
  // Token Usage
  tokenConsumption: {
    total: number
    byModel: Record<string, number>
    byUser: Record<string, number>
    dailyBreakdown: number[]
  }
  
  // Revenue Metrics
  revenue: {
    daily: number[]
    monthly: number[]
    byPlan: Record<string, number>
    churnRate: number
  }
}
```

## 🔧 **Implementation Plan**

### **Phase 1: Foundation (Week 1)**
- [ ] Set up `crm.vibrationfit.com` subdomain
- [ ] Create CRM database schema
- [ ] Implement basic authentication
- [ ] Build user analytics dashboard

### **Phase 2: User Management (Week 2)**
- [ ] Individual user profiles
- [ ] User search and filtering
- [ ] User segmentation
- [ ] Basic communication system

### **Phase 3: Advanced Analytics (Week 3)**
- [ ] Real-time user activity tracking
- [ ] Feature usage analytics
- [ ] Revenue analytics
- [ ] Token usage tracking

### **Phase 4: Communication Tools (Week 4)**
- [ ] Mass email campaigns
- [ ] Email templates
- [ ] Campaign tracking
- [ ] One-on-one messaging

## 🗄️ **Database Schema**

### **CRM-Specific Tables:**
```sql
-- User segments for targeting
CREATE TABLE crm_user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- SQL conditions for segment
  user_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication campaigns
CREATE TABLE crm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'push', 'in_app')),
  subject TEXT,
  content TEXT NOT NULL,
  segment_id UUID REFERENCES crm_user_segments(id),
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign tracking
CREATE TABLE crm_campaign_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES crm_campaigns(id),
  user_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced')),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Direct messages
CREATE TABLE crm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  from_admin_id UUID REFERENCES auth.users(id),
  subject TEXT,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tags and notes
CREATE TABLE crm_user_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'vip')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚀 **Benefits of This Approach:**

1. **Scalability**: CRM can grow independently
2. **Security**: Separate admin environment
3. **Performance**: No impact on main app
4. **Development**: Parallel team workflows
5. **User Experience**: Clean separation of concerns
6. **Analytics**: Dedicated analytics environment
7. **Communication**: Professional admin tools

## 🎯 **Next Steps:**

1. **Approve Architecture**: Confirm separate subdomain approach
2. **Set Up Infrastructure**: Create `crm.vibrationfit.com`
3. **Database Schema**: Implement CRM tables
4. **Authentication**: Admin-only access system
5. **Analytics Dashboard**: Real-time user metrics
6. **Communication Tools**: Email and messaging system

This architecture will give you a powerful, scalable CRM system that grows with your business! 🚀
