# 🗄️ Archived Scripts & Files

**This folder contains obsolete scripts, production data dumps, and AWS artifacts that are no longer needed but kept for reference.**

---

## 📂 Contents

### `certs/` (225KB)
- `cacert.pem` - CA certificate bundle (obsolete)
- **Why archived:** No longer needed for connections

### `functions/` (24KB)
- `audio-mixer/` - Old Lambda function code
- **Why archived:** Already deployed to AWS Lambda

### `production-*.json` (207KB)
**13 production database dumps:**
- assessment_insights, assessment_responses, assessments
- customer_subscriptions, journals, membership_tiers
- payment_history, profiles, refinements
- token_transactions, token_usage, visions
- user-profile-720adebb-e6c0-4f6c-a5fc-164d128e083a

**Why archived:** Old database exports used for debugging/migration, no longer needed

### `s3-backup/` (88KB)
- S3 backup data
- **Why archived:** Obsolete backup data

---

## 🗑️ Cleanup Policy

**Once a script/file is moved here:**
1. ✅ Kept for 30-60 days for reference
2. ✅ Can be permanently deleted after verification period
3. ✅ Large files (>1MB) should be deleted immediately after archiving

**If you need to restore something:**
```bash
# Move back to appropriate location
mv scripts/archive/[file] scripts/[category]/
```

---

## 📊 Archive Statistics

| Category | Size | Files | Status |
|----------|------|-------|--------|
| Production Data | 207KB | 13 | Safe to delete |
| Certs | 225KB | 1 | Safe to delete |
| Functions | 24KB | 1 folder | Safe to delete |
| S3 Backups | 88KB | 1 folder | Safe to delete |
| **Total** | **544KB** | **16** | **All safe to delete** |

---

**Last Cleanup:** November 12, 2025 - Root folder cleanup removed 431MB+ of AWS artifacts

