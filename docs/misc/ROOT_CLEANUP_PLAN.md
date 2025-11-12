# 🧹 VibrationFit Root Folder Cleanup Plan

**Current Status:** 431MB+ of temporary files, AWS artifacts, and production data dumps cluttering project root

**Goal:** Clean, professional project root with only essential configuration files

---

## 📊 Current Root Inventory

### ❌ HUGE Problems (431MB+)
```
lambda-layers/              410MB  ← AWS Lambda dependencies
lambda-video-processor/      21MB  ← AWS video processor code
```
**Total AWS artifacts:** 431MB

### 📁 Folders That Don't Belong (150KB)
```
Jordan/                      1KB   ← Single markdown file
Video Scripts For.../       20KB   ← Development scripts
Videos and Scripts/         20KB   ← More scripts
certs/                     228KB   ← SSL certificates
functions/                  24KB   ← AWS function code
s3-backup/                  88KB   ← S3 backup data
```

### 📄 Files That Don't Belong (280KB+)
```
Production Data Dumps (207KB):
- production-assessment_insights.json
- production-assessment_responses.json
- production-assessments.json
- production-customer_subscriptions.json
- production-journals.json
- production-membership_tiers.json
- production-payment_history.json
- production-profiles.json
- production-refinements.json
- production-token_transactions.json
- production-token_usage.json
- production-user-profile-720adebb-e6c0-4f6c-a5fc-164d128e083a.json
- production-visions.json

Scripts (27KB):
- apply-refinements-migration.sh
- build_questions.py (23KB)
- quick-test.sh
- setup-mediaconvert.sh
- test-deployment.sh

AWS Configs (1KB):
- environment.json (7.7KB)
- lambda-s3-policy.json
- lambda-trust-policy.json
```

### ✅ Files That SHOULD Stay
```
Configuration (essential):
- package.json
- package-lock.json
- tsconfig.json
- next.config.ts
- next-env.d.ts
- eslint.config.mjs
- postcss.config.mjs
- vercel.json

Documentation (essential):
- README.md
- PRODUCT_BRIEF.md

Folders (essential):
- src/
- public/
- docs/
- guides/
- scripts/
- supabase/
- rules/
- node_modules/
- email-templates/
```

---

## 🎯 Cleanup Strategy

### Phase 1: GITIGNORE Large AWS Artifacts (431MB)
**Action:** Add to `.gitignore` IMMEDIATELY, then remove from tracking

**Why:** These are way too large for git (431MB!). Should be deployed to AWS, not stored in repo.

**Commands:**
```bash
# Add to .gitignore
echo "lambda-layers/" >> .gitignore
echo "lambda-video-processor/" >> .gitignore

# Remove from git tracking (keeps local files)
git rm -r --cached lambda-layers/
git rm -r --cached lambda-video-processor/

# Commit
git commit -m "gitignore: Exclude 431MB AWS Lambda artifacts from repo"
```

**Result:** -431MB from repo size! 🎉

---

### Phase 2: Move Production Data Dumps (207KB)
**Action:** Move to `scripts/database/backups/`

**Why:** These are clearly database backups from production. Should be organized with other database scripts.

**Commands:**
```bash
mkdir -p scripts/database/backups
mv production-*.json scripts/database/backups/
```

**Add to `.gitignore`:**
```bash
echo "scripts/database/backups/*.json" >> .gitignore
```

**Result:** Organized backups, protected from accidental commit

---

### Phase 3: Organize AWS Config & Deployment Files
**Action:** Move to `scripts/aws/`

**Why:** These are AWS setup files for Lambda, S3, MediaConvert

**Commands:**
```bash
mkdir -p scripts/aws
mv environment.json scripts/aws/
mv lambda-s3-policy.json scripts/aws/
mv lambda-trust-policy.json scripts/aws/
mv setup-mediaconvert.sh scripts/aws/
mv test-deployment.sh scripts/aws/
mv quick-test.sh scripts/aws/
```

**Keep:** `functions/` folder (if actively used) or move to `scripts/aws/functions/`

---

### Phase 4: Organize Development Scripts
**Action:** Move to appropriate `scripts/` folders

**Commands:**
```bash
# Database migration script
mv apply-refinements-migration.sh scripts/database/

# Assessment builder
mv build_questions.py scripts/database/

# Video development folders
mv "Video Scripts For Development Folder/" scripts/video/
mv "Videos and Scripts/" scripts/video/
```

---

### Phase 5: Move/Delete One-Off Folders

#### Jordan/ (1KB)
**Contents:** `J Text Prompts.md`
```bash
mv Jordan/J\ Text\ Prompts.md docs/misc/
rmdir Jordan/
```

#### certs/ (228KB)
**If SSL certificates for development:**
```bash
# Keep but gitignore
echo "certs/" >> .gitignore
```

**If obsolete certificates:**
```bash
mv certs/ scripts/archive/old-certs/
```

#### s3-backup/ (88KB)
```bash
mv s3-backup/ scripts/database/backups/s3-backup/
echo "scripts/database/backups/s3-backup/" >> .gitignore
```

---

## 📋 Updated .gitignore Recommendations

Add these to `.gitignore`:

```gitignore
# AWS Lambda artifacts (too large for git)
lambda-layers/
lambda-video-processor/

# SSL Certificates (if kept locally)
certs/

# Production data backups
scripts/database/backups/*.json
scripts/database/backups/s3-backup/

# Large zip files
*.zip
lambda-deploy*.zip

# Temporary AWS configs (if they contain secrets)
scripts/aws/environment.json

# Large video files (if any)
*.mp4
*.mov
*.avi
*.webm
```

---

## 🎯 Final Root Structure (After Cleanup)

```
vibrationfit/
├── README.md                    ✅ Essential
├── PRODUCT_BRIEF.md             ✅ Essential
├── package.json                 ✅ Essential
├── package-lock.json            ✅ Essential
├── tsconfig.json                ✅ Essential
├── next.config.ts               ✅ Essential
├── next-env.d.ts                ✅ Essential
├── eslint.config.mjs            ✅ Essential
├── postcss.config.mjs           ✅ Essential
├── vercel.json                  ✅ Essential
├── .cursorrules                 ✅ Essential
├── .gitignore                   ✅ Essential (updated)
├── src/                         ✅ Source code
├── public/                      ✅ Static assets
├── docs/                        ✅ Documentation (91 files)
├── guides/                      ✅ Feature guides
├── scripts/                     ✅ Utility scripts
├── supabase/                    ✅ Database
├── rules/                       ✅ Agent rules
├── email-templates/             ✅ Email templates
├── node_modules/                ✅ Dependencies
├── certs/                       ? (gitignored if kept)
└── functions/                   ? (evaluate if needed)
```

**Removed:**
- ❌ Jordan/
- ❌ Video Scripts For Development Folder/
- ❌ Videos and Scripts/
- ❌ s3-backup/
- ❌ 13 production-*.json files
- ❌ 5 shell scripts (.sh)
- ❌ 1 Python script (build_questions.py)
- ❌ 3 AWS config files (.json)
- ❌ lambda-layers/ (gitignored)
- ❌ lambda-video-processor/ (gitignored)

---

## 📊 Impact Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Root files** | ~40 | ~12 | -70% |
| **Root folders** | ~20 | ~12 | -40% |
| **Repo size** | 431MB+ | <5MB | -99% |
| **AWS artifacts** | In repo | Gitignored | ✅ |
| **Prod data dumps** | In root | Organized | ✅ |
| **Scripts** | Scattered | Organized | ✅ |

---

## ⚠️ Questions to Answer First

### 1. Lambda Layers & Video Processor (431MB)
**Q:** Are these still needed locally?
- ✅ **Yes, actively developing** → Keep local but gitignore
- ⚠️ **Deployed to AWS, not actively changing** → Delete local, pull from AWS when needed
- ❌ **Obsolete** → Delete

### 2. Production JSON Dumps (207KB)
**Q:** Are these backups still needed?
- ✅ **Yes, for reference** → Move to `scripts/database/backups/` and gitignore
- ❌ **Obsolete (data in database)** → Delete

### 3. Certs Folder (228KB)
**Q:** What are these certificates for?
- ✅ **Development SSL certs** → Keep but gitignore
- ❌ **Obsolete certs** → Delete

### 4. Functions Folder (24KB)
**Q:** Is this AWS Lambda function code?
- ✅ **Actively used** → Keep or move to `scripts/aws/functions/`
- ❌ **Obsolete** → Delete or archive

---

## 🚀 Execution Plan

### Step 1: Gitignore Large Files (DO FIRST!)
```bash
# Add to .gitignore
cat >> .gitignore << 'EOF'

# AWS Lambda artifacts (431MB - too large for git)
lambda-layers/
lambda-video-processor/

# Production backups
scripts/database/backups/*.json

# Large zips
*.zip
lambda-deploy*.zip
EOF

# Remove from git tracking
git rm -r --cached lambda-layers/
git rm -r --cached lambda-video-processor/
git commit -m "gitignore: Exclude 431MB AWS artifacts"
git push
```

### Step 2: Move Production Data
```bash
mkdir -p scripts/database/backups
mv production-*.json scripts/database/backups/
```

### Step 3: Organize AWS Files
```bash
mkdir -p scripts/aws
mv environment.json lambda-s3-policy.json lambda-trust-policy.json scripts/aws/
mv setup-mediaconvert.sh test-deployment.sh quick-test.sh scripts/aws/
```

### Step 4: Organize Scripts
```bash
mv apply-refinements-migration.sh scripts/database/
mv build_questions.py scripts/database/
mv "Video Scripts For Development Folder" scripts/video/video-dev-scripts/
mv "Videos and Scripts" scripts/video/videos-and-scripts/
```

### Step 5: Clean Up Misc
```bash
mkdir -p docs/misc
mv Jordan/J\ Text\ Prompts.md docs/misc/
rmdir Jordan/
mv s3-backup/ scripts/database/backups/
```

### Step 6: Commit Everything
```bash
git add -A
git commit -m "refactor: Massive root cleanup - organize 431MB+ of scattered files"
git push
```

---

## ✅ Success Criteria

After cleanup:
- ✅ Root has only essential config files
- ✅ No production data in root
- ✅ No AWS deployment artifacts tracked in git
- ✅ All scripts organized in `scripts/` folder
- ✅ Repo size reduced by ~99%
- ✅ .gitignore prevents future pollution
- ✅ .cursorrules guides future agents

---

## 📝 Post-Cleanup Updates

### Update .cursorrules
Add AWS deployment rules:
```markdown
**AWS Deployment:**
1. ❌ NEVER commit Lambda layers to git (use AWS deployment)
2. ❌ NEVER commit production data dumps to root
3. ✅ Place AWS configs in `scripts/aws/`
4. ✅ Keep Lambda functions in `scripts/aws/functions/` if needed locally
```

### Update scripts/README.md
Add new categories:
```markdown
### `aws/` - AWS deployment configs and scripts
- environment.json
- lambda policies
- MediaConvert setup scripts
```

---

**Ready to execute?** Answer the questions above, then I'll run the cleanup! 🚀

