# Life Vision V3 - Deployment Checklist

**Pre-Deployment Verification Guide**

---

## ✅ Pre-Deployment Checklist

### 1. Database Migration
- [ ] Review migration file: `migrations/001_add_life_vision_v3_fields.sql`
- [ ] Backup production database
- [ ] Run migration on staging first
- [ ] Verify new columns exist:
  - `refinements.ideal_state` (TEXT)
  - `refinements.blueprint_data` (JSONB)
  - `vision_versions.activation_message` (TEXT)
  - `vision_versions.richness_metadata` (JSONB)
  - Note: `forward` and `conclusion` already exist
- [ ] Verify GIN indexes created
- [ ] Test rollback on staging (optional)

**Migration Command**:
```bash
psql -d your_database < migrations/001_add_life_vision_v3_fields.sql
```

### 2. Build Verification
- [ ] Build passes without errors: `npm run build`
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] All new pages compile
- [ ] All API routes compile

**Build Command**:
```bash
npm run build
# Should show: ✓ Compiled successfully
```

### 3. Environment Variables
- [ ] OpenAI API key configured
- [ ] Supabase credentials configured
- [ ] All required environment variables set
- [ ] Token tracking enabled

### 4. AI Model Configuration
- [ ] Add new AI model config keys in admin panel (or use temporary mappings):
  - `LIFE_VISION_IDEAL_STATE` (currently mapped to `VISION_GENERATION`)
  - `LIFE_VISION_BLUEPRINT` (currently mapped to `BLUEPRINT_GENERATION`)
  - `LIFE_VISION_FINAL_ASSEMBLY` (currently mapped to `VISION_GENERATION`)
  - `LIFE_VISION_ACTIVATION_REFLECTION` (currently mapped to `VISION_GENERATION`)

### 5. API Endpoint Testing
- [ ] Test `/api/viva/ideal-state` (POST)
- [ ] Test `/api/viva/blueprint` (POST & GET)
- [ ] Test `/api/viva/final-assembly` (POST)
- [ ] Test `/api/vibration/scenes/generate` (enhanced with dynamic count)
- [ ] Test `/api/viva/master-vision` (enhanced with richness metadata)

See `06-TESTING-GUIDE.md` for curl examples.

### 6. Frontend Page Testing
- [ ] Test `/life-vision/new/category/[key]` (Step 1)
- [ ] Test `/life-vision/new/category/[key]/imagination` (Step 2)
- [ ] Test `/life-vision/new/category/[key]/blueprint` (Step 3)
- [ ] Test `/life-vision/new/category/[key]/scenes` (Step 4)
- [ ] Test `/life-vision/new/assembly` (Step 5)
- [ ] Test `/life-vision/new/final` (Step 6)

### 7. Mobile Responsiveness
- [ ] Test on 375px (iPhone SE)
- [ ] Test on 768px (iPad)
- [ ] Test on 1024px+ (Desktop)
- [ ] No off-screen flow
- [ ] All buttons tappable
- [ ] All text readable

### 8. Complete Flow Testing

#### Test Case 1: Sparse Input (Minimal Text)
- [ ] Create vision with minimal input (~50-100 words per category)
- [ ] Verify: Generates 1-3 scenes
- [ ] Verify: Concise sections (90-110% of input)
- [ ] Verify: No generic fluff added

#### Test Case 2: Moderate Input (Standard Detail)
- [ ] Create vision with moderate input (~200-300 words per category)
- [ ] Verify: Generates 2-4 scenes
- [ ] Verify: Standard sections (90-110% of input)
- [ ] Verify: User voice preserved

#### Test Case 3: Rich Input (Lots of Detail)
- [ ] Create vision with rich input (~500+ words per category)
- [ ] Verify: Generates 4-8 scenes
- [ ] Verify: Detailed sections (90-110% of input)
- [ ] Verify: All details preserved

### 9. Database Verification
- [ ] New data saves to `refinements.ideal_state`
- [ ] New data saves to `refinements.blueprint_data`
- [ ] New data saves to `vision_versions.activation_message`
- [ ] New data saves to `vision_versions.richness_metadata`
- [ ] Existing `forward` and `conclusion` fields work correctly

### 10. Token Tracking
- [ ] Token usage logged for all new APIs
- [ ] Action types tracked correctly
- [ ] Metadata includes richness stats
- [ ] No tracking errors in logs

### 11. Error Handling
- [ ] All API endpoints handle errors gracefully
- [ ] Frontend displays error messages
- [ ] Loading states show correctly
- [ ] No white screens on error

### 12. Performance
- [ ] API responses under 30 seconds
- [ ] Scene generation completes successfully
- [ ] Master assembly handles all 12 categories
- [ ] No timeout errors

---

## 🚀 Deployment Steps

### Step 1: Staging Deployment
1. Deploy to staging environment
2. Run database migration
3. Run through complete checklist above
4. Test with real users (3-5 people)
5. Collect feedback

### Step 2: Production Deployment
1. Backup production database
2. Run database migration during low-traffic window
3. Deploy application code
4. Smoke test critical paths:
   - Create new vision (sparse input)
   - Create new vision (rich input)
   - View richness stats
   - Generate final sections
5. Monitor error logs for 24 hours
6. Monitor token usage

### Step 3: Post-Deployment Monitoring
- [ ] Monitor API error rates
- [ ] Monitor API response times
- [ ] Monitor token usage costs
- [ ] Monitor user feedback
- [ ] Check database performance

---

## 🐛 Rollback Plan

If issues are detected:

### Database Rollback
```sql
-- Drop new indexes
DROP INDEX IF EXISTS idx_refinements_blueprint_data;
DROP INDEX IF EXISTS idx_vision_versions_richness_metadata;

-- Drop new columns
ALTER TABLE refinements DROP COLUMN IF EXISTS ideal_state;
ALTER TABLE refinements DROP COLUMN IF EXISTS blueprint_data;

ALTER TABLE vision_versions DROP COLUMN IF EXISTS activation_message;
ALTER TABLE vision_versions DROP COLUMN IF EXISTS richness_metadata;

-- Note: forward and conclusion columns already existed, do NOT drop them
```

### Code Rollback
1. Revert to previous deployment
2. Run old version
3. Database will still work (new columns just unused)
4. Investigate issues
5. Fix and redeploy

---

## 📊 Success Metrics

After deployment, track:

### Immediate (Day 1-3)
- [ ] Zero critical errors
- [ ] API response times < 30s
- [ ] Build remains passing
- [ ] No database errors

### Short-term (Week 1-2)
- [ ] User completion rate increases
- [ ] Scene quality feedback positive
- [ ] Density preservation working (90-110%)
- [ ] Token usage within budget

### Long-term (Month 1+)
- [ ] User engagement increases
- [ ] Vision quality scores improve
- [ ] Support tickets decrease
- [ ] User satisfaction scores up

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Migration fails with "column already exists"
- **Solution**: Check if `forward` and `conclusion` columns exist. Migration only adds NEW V3 columns.

**Issue**: API returns 500 errors
- **Solution**: Check AI model config keys are mapped correctly. Review logs for specific error.

**Issue**: Scenes don't generate
- **Solution**: Check OpenAI API key. Verify scene generation API is receiving correct input.

**Issue**: Richness stats don't display
- **Solution**: Verify `richnessMetadata` is being returned from `/api/viva/master-vision`. Check database column exists.

**Issue**: Mobile layout broken
- **Solution**: Check for off-screen flow. Verify responsive classes applied. Test on actual device.

---

## 📞 Support Checklist

Before reaching out for help:
1. [ ] Check error logs
2. [ ] Review this deployment checklist
3. [ ] Test on staging first
4. [ ] Document exact steps to reproduce
5. [ ] Note any error messages
6. [ ] Check database state
7. [ ] Verify environment variables

---

## ✅ Final Sign-Off

Before marking deployment complete:

- [ ] All checklist items verified
- [ ] Staging tested successfully
- [ ] Production deployed successfully
- [ ] Smoke tests passing
- [ ] Error monitoring active
- [ ] Team notified
- [ ] Documentation updated

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Verified By**: _______________  

---

**Status**: Ready for Deployment  
**Last Updated**: January 10, 2025

