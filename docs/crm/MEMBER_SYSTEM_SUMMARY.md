# Member Success System - Quick Reference

**Last Updated:** November 26, 2024

## 📍 All Routes

### Pages
- `/admin/crm/dashboard` - CRM overview dashboard
- `/admin/crm/members` - Member list (table view)
- `/admin/crm/members/[id]` - Member detail page (6 tabs)
- `/admin/crm/members/board` - Member Kanban board

### API Routes
- `GET /api/crm/members` - List all members
- `GET /api/crm/members/[id]` - Get member details
- `PATCH /api/crm/members/[id]` - Update member
- `POST /api/crm/metrics/update` - Refresh activity metrics

---

## 🗂️ Database Tables

**`user_activity_metrics`** - Tracks member engagement
- Profile completion, visions, audio, journals, boards
- Login history, days since last login
- Storage usage, token usage
- Manual fields: engagement_status, health_status, custom_tags, admin_notes

**`user_revenue_metrics`** - Tracks member revenue
- Subscription tier & status
- MRR, LTV, total spent
- Subscription start date & duration

---

## 🎯 Key Features

✅ **Member List** - Sortable table with filters  
✅ **Member Detail** - 6-tab comprehensive view  
✅ **Flexible Kanban** - Group by engagement, health, or tier  
✅ **Manual Classification** - Tag and categorize members  
✅ **Activity Tracking** - Auto-calculated usage metrics  
✅ **Revenue Tracking** - Synced from Stripe  
✅ **SMS Integration** - Send messages directly from member page  
✅ **Support Tickets** - View member's support history  

---

## 🚀 Quick Start

1. **Run migration:**
   ```bash
   npx supabase migration up
   ```

2. **Calculate metrics:**
   - Visit `/admin/crm/dashboard`
   - Click "🔄 Refresh Metrics"

3. **Start managing members:**
   - View list: `/admin/crm/members`
   - View board: `/admin/crm/members/board`

---

## 📚 Full Documentation

See `/docs/crm/MEMBER_SUCCESS_GUIDE.md` for complete details.




