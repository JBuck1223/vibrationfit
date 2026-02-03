# VibrationFit Git Workflow - Quick Reference

## 🎯 Branch Structure

```
jordan (Machine 1) ──────┐
                         ├──→ dev (staging) ──→ main (production → Vercel)
Vanessa (Machine 2) ─────┤
jvmacmini (JV Mac Mini) ─┘
```

## 🚀 Common Commands

### Start Working
```bash
./workflow/start-work.sh
```

### Save Your Work
```bash
./workflow/save-work.sh
```

### Merge to Dev (Integration Point)
```bash
./workflow/merge-to-dev.sh
```

### Deploy to Production
```bash
./workflow/deploy-to-main.sh
```

## 📋 Manual Workflow

### Daily Work on Machine 1 (Jordan)
```bash
git checkout jordan
git pull origin jordan
# make changes
git add -A
git commit -m "your message"
git push origin jordan
```

### Daily Work on Machine 2 (Vanessa)
```bash
git checkout Vanessa
git pull origin Vanessa
# make changes
git add -A
git commit -m "your message"
git push origin Vanessa
```

### Daily Work on JV Mac Mini
```bash
git checkout jvmacmini
git pull origin jvmacmini
# make changes
git add -A
git commit -m "your message"
git push origin jvmacmini
```

### Integration to Dev
```bash
# Merge all branches to dev
git checkout dev
git pull origin dev
git merge jordan
git merge Vanessa
git merge jvmacmini
npm run build
git push origin dev

# Sync back to all branches
git checkout jordan
git merge dev
git push origin jordan

git checkout Vanessa
git merge dev
git push origin Vanessa

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

## 💡 Best Practices

1. **Commit often** - Every 15-30 minutes
2. **Pull before starting** - Always sync first
3. **Test before merging** - Run `npm run build`
4. **Clear messages** - Describe what and why
5. **WIP commits OK** - Better than losing work

## 🔧 Current Setup Status

✅ Dev branch created and pushed  
✅ Jordan branch synced with dev  
✅ Vanessa branch synced with dev  
✅ JV Mac Mini branch (jvmacmini) synced with dev  
✅ Helper scripts installed and executable  

## 📚 Full Documentation

- Helper Scripts: `workflow/README.md`
- Detailed Guide: `.cursor/plans/two_machine_git_workflow_91e81ce4.plan.md`

## ⚠️ Important Notes

- **main** = Production (Vercel auto-deploys)
- **dev** = Staging (test here first)
- **jordan** = Machine 1 work
- **Vanessa** = Machine 2 work
- **jvmacmini** = JV Mac Mini work

Always merge through dev before going to main!
