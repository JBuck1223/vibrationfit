# 🛠️ Utility Scripts

**Temporary utility scripts for database, video, and deployment tasks.**

⚠️ **These are one-off/debug scripts - NOT production code!**

---

## 📁 Structure

```
scripts/
├── database/     (11) - DB introspection, imports, fixes
├── lambda/       (6)  - AWS Lambda deployment zips
├── video/        (5)  - Video processing test scripts
├── journal/      (3)  - Journal entry updates
└── archive/      (0)  - Deprecated/completed scripts
```

---

## 📂 Folder Details

### `database/` (11 files)
One-off database maintenance scripts:
- `db-introspect*.js` - Database schema introspection
- `import-*.js` - Production data imports
- `pull-from-production.js` - Pull data from prod
- `create-indexes.js` - Create database indexes
- `check-status.js` - Check database status
- `database-fixes.html` - Database fix documentation

**Usage:** Run once, then move to `archive/`

---

### `lambda/` (6 files - 6.3MB)
AWS Lambda deployment packages:
- `function.zip` (6.0MB) - Main Lambda function
- `function-combined.zip` - Combined function
- `lambda-deploy*.zip` - Various deployment packages
- `lambda-database-updater.zip` - Database updater

**Note:** These should be deployed to AWS, not committed to git!

---

### `video/` (5 files)
Video processing test scripts:
- `process-video*.js` - Video processing tests
- `test-ffmpeg.js` - FFmpeg testing
- `trigger-mediaconvert.js` - MediaConvert triggers

**Usage:** Testing only, not production

---

### `journal/` (3 files)
Journal entry maintenance:
- `update-journal-entry.js` - Update journal entries
- `update-journal-by-url.js` - Update by URL
- `pull-user-sidebar.js` - Sidebar data

**Usage:** One-off updates

---

## 📜 Rules

### ✅ What Goes Here
- One-off database scripts
- Deployment packages (temporarily)
- Test/debug scripts
- Data migration utilities

### ❌ What DOESN'T Go Here
- Production code → `src/`
- API endpoints → `src/app/api/`
- Shared utilities → `src/lib/`
- Database migrations → `supabase/migrations/`

### 🗑️ Cleanup Process
1. Run the script
2. Verify it worked
3. Move to `archive/` folder
4. Add notes about what it did

---

## 🚨 Important Notes

1. **Lambda zips (6MB)** - Should be added to `.gitignore`
2. **Database scripts** - Most are now obsolete (we have clean migrations)
3. **Video scripts** - Likely replaced by production code
4. **Archive regularly** - Don't let this folder grow!

---

## 🧹 Suggested Next Steps

1. **Review each script** - Still needed?
2. **Archive completed ones** - Move to `archive/`
3. **Add to .gitignore** - `scripts/lambda/*.zip`
4. **Document replacements** - Where did this logic move to production?

---

**Last Cleanup:** November 12, 2025 - Moved 25 files from project root

