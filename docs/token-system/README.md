# Token System Documentation

**Last Updated:** December 13, 2024

---

## 📚 Documentation Index

### Core Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [RECONCILIATION_REALITY_CHECK.md](./RECONCILIATION_REALITY_CHECK.md) | **Start here** - What reconciliation actually does | Everyone |
| [WHAT_RECONCILIATION_ACTUALLY_DOES.md](./WHAT_RECONCILIATION_ACTUALLY_DOES.md) | Detailed explanation of limitations and reality | Developers, Product |
| [RECONCILIATION_QUICK_START.md](./RECONCILIATION_QUICK_START.md) | 5-minute setup guide | Developers, Admins |
| [OPENAI_RECONCILIATION_GUIDE.md](./OPENAI_RECONCILIATION_GUIDE.md) | Complete reconciliation guide with all options | Developers |
| [OPENAI_CSV_FORMAT.md](./OPENAI_CSV_FORMAT.md) | CSV format reference and troubleshooting | Developers |
| [RECONCILIATION_FLOW.md](./RECONCILIATION_FLOW.md) | Visual flow diagrams and process overview | Developers |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues and solutions | Developers, Admins |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Technical implementation details | Developers |

### Legacy Documentation

| Document | Status | Notes |
|----------|--------|-------|
| `../OPENAI_RECONCILIATION_IMPLEMENTATION.md` | ✅ Complete | Initial implementation guide (Nov 2025) |
| `../OPENAI_RECONCILIATION_UPDATE_GUIDE.md` | ✅ Complete | API route update patterns |
| `../RECONCILIATION_SUMMARY.md` | ✅ Complete | Implementation summary |

---

## 🎯 Quick Links

### For Developers

**First time setup:**
1. Read [RECONCILIATION_QUICK_START.md](./RECONCILIATION_QUICK_START.md)
2. Export CSV from OpenAI
3. Run: `npm run reconcile:openai path/to/csv`

**Monthly routine:**
1. Export previous month from OpenAI
2. Run reconciliation script
3. Review discrepancies
4. Update pricing if needed

### For Admins

**Check reconciliation status:**
```sql
SELECT 
  reconciliation_status,
  COUNT(*) as count,
  SUM(actual_cost_cents) / 100.0 as cost_usd
FROM token_usage
WHERE openai_request_id IS NOT NULL
GROUP BY reconciliation_status;
```

**View recent discrepancies:**
```sql
SELECT * FROM token_usage
WHERE reconciliation_status = 'discrepancy'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔧 Implementation Files

| File | Purpose |
|------|---------|
| `src/lib/openai/reconciliation.ts` | Core reconciliation logic |
| `src/app/api/admin/reconcile-openai-costs/route.ts` | Admin API endpoint |
| `scripts/database/reconcile-openai-costs.ts` | CLI reconciliation script |
| `supabase/migrations/20251116141218_add_openai_reconciliation_fields.sql` | Database schema |

---

## 🚀 Common Tasks

### Run Reconciliation

```bash
# Using npm script
npm run reconcile:openai ~/Downloads/openai-usage.csv

# Or directly with tsx
npx tsx scripts/database/reconcile-openai-costs.ts ~/Downloads/openai-usage.csv
```

### Check Status via API

```bash
curl https://your-domain.com/api/admin/reconcile-openai-costs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Pricing

```sql
UPDATE ai_model_pricing
SET 
  input_price_per_1k = 0.15,
  output_price_per_1k = 0.60,
  updated_at = NOW()
WHERE model_name = 'gpt-4o-mini' AND is_active = true;
```

---

## 📊 Database Schema

### Key Tables

**`token_usage`** - Tracks all AI API usage
- `openai_request_id` - OpenAI's unique request ID
- `calculated_cost_cents` - Our estimated cost
- `actual_cost_cents` - OpenAI's actual cost (after reconciliation)
- `reconciliation_status` - pending, matched, discrepancy, not_applicable
- `reconciled_at` - When reconciliation was performed

**`ai_model_pricing`** - Current model pricing
- `model_name` - e.g., 'gpt-4o-mini'
- `input_price_per_1k` - Price per 1K input tokens
- `output_price_per_1k` - Price per 1K output tokens
- `is_active` - Whether this pricing is current

---

## 🔄 Reconciliation Flow

```
1. Export CSV from OpenAI
   ↓
2. Parse CSV (extract request IDs, costs, tokens)
   ↓
3. Match by request_id in token_usage table
   ↓
4. Compare actual_cost vs calculated_cost
   ↓
5. Update reconciliation_status:
   - matched (within 5% or $0.05)
   - discrepancy (differs by >5%)
   ↓
6. Review discrepancies
   ↓
7. Update pricing if needed
   ↓
8. Re-run reconciliation
```

---

## 🎯 Success Metrics

**Good reconciliation:**
- ✅ 95%+ matched
- ✅ <5% discrepancies
- ✅ <1% not found
- ✅ 0 errors

**If results differ:**
- Check OpenAI pricing changes
- Verify `openai_request_id` capture
- Review CSV format

---

## 🆘 Support

**Issues with reconciliation?**
1. Check [OPENAI_CSV_FORMAT.md](./OPENAI_CSV_FORMAT.md) for CSV format
2. Review error messages in script output
3. Check database logs for errors

**Need help?**
- Review implementation files
- Check existing documentation
- Test with small CSV sample first

---

## 📈 Future Enhancements

Potential improvements:
- [ ] Automated monthly reconciliation via cron
- [ ] Admin dashboard for reconciliation status
- [ ] Alerts for large discrepancies
- [ ] Automatic pricing updates from OpenAI API
- [ ] Historical cost trend analysis

---

**Ready to start?** → [RECONCILIATION_QUICK_START.md](./RECONCILIATION_QUICK_START.md)

