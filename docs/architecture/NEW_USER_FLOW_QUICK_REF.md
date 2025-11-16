# 🎯 New User Flow - Quick Reference
**One-Page Overview for MVP Lock-In**

---

## The Flow (Purchase → Completion)

```mermaid
flowchart TD
    A[Purchase $499 Intensive] --> B[Stripe Checkout]
    B --> C[Webhook Creates User]
    C --> D[Auto-Login Magic Link]
    D --> E[/intensive/dashboard]
    
    E --> F{During Intensive<br/>0-99% Complete}
    
    F -->|Try to access<br/>other pages| G[Middleware Redirects<br/>Back to Intensive]
    F -->|Complete steps| H[Progress Increases]
    
    H --> I{100% Complete?}
    I -->|No| F
    I -->|Yes| J[Celebration Screen]
    
    J --> K[Mark intensive.completed]
    K --> L[Redirect to /dashboard]
    L --> M[Full Platform Access]
    
    style A fill:#199D67
    style E fill:#14B8A6
    style J fill:#FFB701
    style M fill:#8B5CF6
```

---

## Current Issues vs. MVP Solution

| Issue | Current State | MVP Solution |
|-------|--------------|-------------|
| **Access Control** | Users can visit any page during intensive | Middleware redirects non-intensive pages to `/intensive/dashboard` |
| **Navigation** | Full sidebar visible, distracting | Simplified nav during intensive (only relevant items) |
| **IntensiveBar** | Not everywhere | Added to GlobalLayout (shows on every page) |
| **Completion** | No celebration or transition | Celebration screen → Mark complete → Unlock access |
| **Empty States** | Blank pages with no data | Beautiful CTAs on every empty page |
| **Dashboard Confusion** | Two dashboards, unclear | Regular dashboard redirects to intensive until 100% |

---

## The 3 Modes

### 🟢 Mode 1: Intensive Active (0-99%)
**User sees:**
- IntensiveBar on every page
- Simplified navigation
- Only intensive-relevant pages accessible
- Redirected if they stray

**Pages allowed:**
- `/intensive/*`
- `/profile/edit?intensive=true`
- `/assessment?intensive=true`
- `/vision/build?intensive=true`
- `/life-vision?intensive=true` (audio only)
- `/vision-board?intensive=true`
- `/journal/new?intensive=true`

### 🟡 Mode 2: Intensive Complete (100%, not acknowledged)
**User sees:**
- Celebration screen on `/intensive/dashboard`
- "Enter Your Dashboard" button
- IntensiveBar shows 100%

**Action:**
- Click button → Mark intensive as 'completed' → Redirect to `/dashboard`

### 🟣 Mode 3: Full Platform Access
**User sees:**
- No IntensiveBar
- Full navigation menu
- All pages accessible
- Empty states with CTAs

---

## Implementation Priority

### **🔴 Phase 1: MUST HAVE** (Ship-Blocker)
1. Intensive-mode middleware (access control)
2. IntensiveBar in GlobalLayout
3. Completion gate (mark 'completed')
4. Dashboard redirect logic

**Time:** 4-6 hours

### **🟡 Phase 2: SHOULD HAVE** (Polish)
1. Simplified navigation during intensive
2. Empty state improvements
3. Celebration animation

**Time:** 3-4 hours

### **🟢 Phase 3: NICE TO HAVE** (Future)
1. Welcome tooltips
2. Progress milestones (25%, 50%, 75%)
3. Email/SMS reminders

**Time:** 2-3 hours

---

## Key Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `/src/middleware.ts` | Add intensive-mode check & redirect | 🔴 P1 |
| `/src/components/GlobalLayout.tsx` | Add `<IntensiveBar />` | 🔴 P1 |
| `/src/app/intensive/dashboard/page.tsx` | Add completion ceremony | 🔴 P1 |
| `/src/app/dashboard/page.tsx` | Add intensive redirect check | 🔴 P1 |
| `/src/components/Sidebar.tsx` | Add simplified nav mode | 🟡 P2 |
| `/src/app/life-vision/page.tsx` | Improve empty state | 🟡 P2 |
| `/src/app/journal/page.tsx` | Improve empty state | 🟡 P2 |
| `/src/app/vision-board/page.tsx` | Improve empty state | 🟡 P2 |

---

## Database Changes Needed

### Intensive Completion Status Values
```sql
-- Current values in intensive_purchases.completion_status:
'pending'     -- Just purchased, not started
'in_progress' -- Started working on it
'completed'   -- All steps done, acknowledged celebration
'refunded'    -- Refunded

-- New logic:
When progress hits 100% → Stay 'in_progress'
When user clicks "Enter Dashboard" → Update to 'completed'
```

### Check if User is in Intensive Mode
```typescript
// Helper function
async function isUserInIntensiveMode(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('intensive_purchases')
    .select('id, completion_status')
    .eq('user_id', userId)
    .in('completion_status', ['pending', 'in_progress'])
    .maybeSingle()
  
  return !!data
}
```

---

## Testing Checklist

### Test Scenario 1: Brand New User
- [ ] Purchase intensive
- [ ] Auto-login works
- [ ] Lands on `/intensive/dashboard`
- [ ] IntensiveBar visible
- [ ] Try to click "My Visions" in sidebar → Redirected
- [ ] Try to visit `/dashboard` directly → Redirected
- [ ] Complete step 1 → Progress updates
- [ ] IntensiveBar shows correct %

### Test Scenario 2: Intensive Completion
- [ ] Complete all 10 steps
- [ ] Progress hits 100%
- [ ] Celebration screen appears
- [ ] Click "Enter Dashboard"
- [ ] Lands on `/dashboard`
- [ ] IntensiveBar disappears
- [ ] Full navigation visible
- [ ] Can access all pages

### Test Scenario 3: Returning User (Intensive In-Progress)
- [ ] Log out mid-intensive
- [ ] Log back in
- [ ] Lands on appropriate page
- [ ] IntensiveBar shows correct state
- [ ] Still restricted to intensive pages

### Test Scenario 4: Completed User
- [ ] User with completed intensive logs in
- [ ] No IntensiveBar
- [ ] Full access to all features
- [ ] Dashboard shows proper content

---

## Design Specifications

### IntensiveBar Placement
```
┌────────────────────────────────────────────────┐
│  [Sidebar]  │  IntensiveBar: 45% | 52h 12m    │ ← Sticky top
│             │  [Next: Build Vision →]          │
│             ├─────────────────────────────────┤
│             │                                  │
│  Navigation │  Page Content Here               │
│             │                                  │
└────────────────────────────────────────────────┘
```

### Celebration Screen (100%)
```
┌────────────────────────────────────────────────┐
│                                                │
│              🎉 🎊 ✨                          │
│                                                │
│        72-Hour Intensive Complete!             │
│                                                │
│    You've activated your vision in 68 hours    │
│                                                │
│         [Enter Your Dashboard →]               │
│                                                │
│              🎉 🎊 ✨                          │
│                                                │
└────────────────────────────────────────────────┘
```

### Empty State Pattern
```
┌────────────────────────────────────────────────┐
│                                                │
│                   [Icon]                       │
│                                                │
│              Welcome to [Feature]!             │
│                                                │
│         Create your first [item] to start      │
│                                                │
│              [Create [Item] →]                 │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Access Control** | Strict (redirect away from non-intensive pages) | Maintains focus, reduces abandonment |
| **Unlock Timing** | All-or-nothing (100% = unlocked) | Simpler, cleaner transition |
| **IntensiveBar** | Always visible during intensive | Consistent context |
| **Completion Flow** | Explicit (requires button click) | Clear ceremony moment |
| **Empty States** | Show CTAs, not blank pages | Professional, clear guidance |

---

## Success Metrics

**The flow is "flawless" when:**

✅ **0% confusion** - User always knows what to do next  
✅ **0% blank pages** - Every page has content or clear CTA  
✅ **0% broken links** - Can't access restricted pages  
✅ **100% celebration** - Completing intensive feels rewarding  
✅ **< 10s login** - Purchase to dashboard is instant  

---

**Ready to build!** Start with Phase 1 (middleware + GlobalLayout). 🚀

