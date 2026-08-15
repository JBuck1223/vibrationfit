# VibrationFit Git Workflow Scripts

Helper scripts for managing the two-machine git workflow safely.

## Workflow Overview

```
jordan (JV MacBook Pro) ──┐
                          ├──→ dev (integration/staging) ──→ main (production)
jvmacmini (JV Mac Mini) ──┘
```

## Quick Start

### 1. Starting Work on a Machine

```bash
./workflow/start-work.sh
```

This will:
- Ask which machine you're on (JV MacBook Pro or JV Mac Mini)
- Checkout the correct branch (`jordan` or `jvmacmini`)
- Pull latest changes from remote

### 2. Saving Your Work

```bash
./workflow/save-work.sh
```

This will:
- Show you what changes you've made
- Ask for a commit message
- Commit and push your changes to your branch

### 3. Merging to Dev (Integration Point)

```bash
./workflow/merge-to-dev.sh
```

This will:
- Merge jordan → dev
- Merge jvmacmini → dev
- Test the build
- Push dev to remote
- Sync dev back to jordan and jvmacmini

**Result:** jordan, jvmacmini, and dev are all identical. Continue working!

### 4. Deploying to Production

```bash
./workflow/deploy-to-main.sh
```

This will:
- Ask for confirmation (this is PRODUCTION!)
- Merge dev → main
- Test production build
- Push to main
- Trigger Vercel deployment

## Manual Commands

If you prefer to run commands manually, here's the workflow:

### Daily Work

**On JV MacBook Pro (jordan):**
```bash
git checkout jordan
git pull origin jordan
# work, make changes
git add -A
git commit -m "feat: your changes"
git push origin jordan
```

**On JV Mac Mini (jvmacmini):**
```bash
git checkout jvmacmini
git pull origin jvmacmini
# work, make changes
git add -A
git commit -m "feat: your changes"
git push origin jvmacmini
```

### Integration to Dev

```bash
# Merge both branches
git checkout dev
git pull origin dev
git merge jordan
npm run build
git merge jvmacmini
npm run build
git push origin dev

# Sync back
git checkout jordan
git merge dev
git push origin jordan

git checkout jvmacmini
git merge dev
git push origin jvmacmini
```

### Deploy to Production

```bash
git checkout main
git pull origin main
git merge dev --no-ff
npm run build
git push origin main
```

## Troubleshooting

### Merge Conflicts

If you get merge conflicts during `merge-to-dev.sh`:

1. The script will stop at the conflict
2. Open the conflicting files
3. Look for `<<<<<<< HEAD` markers
4. Edit to keep the changes you want
5. Remove the conflict markers
6. Run:
   ```bash
   git add .
   git commit -m "Resolve merge conflict"
   ./workflow/merge-to-dev.sh
   ```

### Script Permissions

If you get "Permission denied" errors, make scripts executable:

```bash
chmod +x workflow/*.sh
```

### Starting Fresh

If a branch gets messy:

```bash
git checkout main
git pull origin main
git branch -D messy-branch
git checkout -b messy-branch
```

## Best Practices

1. **Commit often** - Every 15-30 minutes or after each logical change
2. **Pull before starting** - Always run `start-work.sh` before beginning
3. **Test before merging** - The scripts do this automatically
4. **Clear commit messages** - Describe what changed and why
5. **WIP commits are OK** - "WIP: Halfway through X" is better than losing work

## Branch Purpose

- **jordan** - Work from JV MacBook Pro
- **jvmacmini** - Work from JV Mac Mini
- **dev** - Integration/staging (jordan + jvmacmini)
- **main** - Production (deployed to Vercel)

## Safety Features

All scripts include:
- Automatic build testing before pushing
- Exit on error (won't continue if something fails)
- Confirmation prompts for production deploys
- Return to original branch after completion
- Clear success/error messages
