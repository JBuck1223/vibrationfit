# Git Branch Sync Workflow

This guide captures the branch-based workflow for moving in-progress changes between machines while keeping `main` clean and up-to-date.

## 1. Prep: confirm branch and working tree

```bash
# See what’s modified/untracked
git status

# Create or switch to a feature branch if you’re still on main
git checkout -b voice-profile-intake-v2   # only once
# or, when the branch already exists
# git checkout voice-profile-intake-v2
```

## 2. Commit a checkpoint (even if it’s WIP)

```bash
# Stage everything you want to keep
git add .

# Optional: run tests or lint before saving
# npm test
# npm run lint

# Create a descriptive WIP commit
git commit -m "WIP: voice profile intake v2"
```

Keeping a commit (instead of a stash) means your snapshot is visible on every machine and can’t be forgotten.

## 3. Rebase onto the latest `origin/main`

```bash
# Fetch without merging yet
git fetch origin

# Replay your branch commits on top of the updated main
git rebase origin/main
```

- If conflicts appear, follow the prompts (`git status` shows the files).
- Resolve conflicts, `git add` the fixed files, then continue:
  ```bash
  git rebase --continue
  ```
- If you need to abort the rebase for any reason:
  ```bash
  git rebase --abort
  ```

## 4. Push the branch (backup + share)

```bash
# Push once with -u so future pushes can omit the remote/branch
git push -u origin voice-profile-intake-v2
```

From another machine you can simply:
```bash
git fetch origin
git checkout voice-profile-intake-v2
git pull        # or git pull --rebase
```

## 5. Repeat as you work

- Continue committing logical chunks on the feature branch.
- Rebase periodically to keep in sync with new work landing on `main`.
- When the feature is ready, either merge via PR or squash the branch into `main`.

## 6. Optional: cleaning up

After a successful merge into `main`:
```bash
git checkout main
git pull
git branch -d voice-profile-intake-v2       # delete local branch
git push origin --delete voice-profile-intake-v2  # delete remote branch (optional)
```

## Troubleshooting notes

- **Need to pause mid-edit without committing?** Use `git stash push -u` to park changes briefly, but prefer commits for anything that must travel between machines.
- **SSH keys:** make sure each machine has its key added to your Git host so pushes/pulls succeed without extra prompts.
- **History hygiene:** rebase keeps history linear. If your team prefers merge commits, replace the rebase step with `git pull origin main` (merge) before pushing.

This routine keeps every machine aligned, gives you a recoverable history, and makes it easy to collaborate or review work in progress.
