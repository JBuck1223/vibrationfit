# New Mac Setup Guide for VibrationFit

**Last Updated:** January 16, 2026

This guide covers everything needed to set up a new Mac for VibrationFit development.

---

## Quick Start (If Everything is Already Installed)

```bash
# Navigate to project
cd /Volumes/PRO-G40/Dev/vibrationfit

# Start dev server
npm run dev

# Open in browser
open http://localhost:3000
```

---

## Required Dependencies

### 1. Homebrew (macOS Package Manager)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, run the two commands it shows to add Homebrew to your PATH:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Verify: `brew --version`

---

### 2. Node.js (JavaScript Runtime)

```bash
brew install node
```

Verify:
- `node --version` (should be v20+ or v22+)
- `npm --version`

---

### 3. Git (Version Control)

Usually pre-installed with Xcode CLI tools, but if not:

```bash
brew install git
```

Verify: `git --version`

Configure your identity:

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

### 4. PostgreSQL 17 (For Schema Pulls)

```bash
brew install postgresql@17
```

This installs PostgreSQL client tools for pulling production schema. Use the versioned path:

```bash
/opt/homebrew/opt/postgresql@17/bin/pg_dump ...
/opt/homebrew/opt/postgresql@17/bin/psql ...
```

See `docs/HOLY_GRAIL_SUPABASE_CONNECTION.md` for usage.

---

### 5. Cursor IDE

```bash
brew install --cask cursor
```

Or download from [cursor.com](https://cursor.com)

---

## Optional Dependencies (NOT Required)

| Tool | Why Skip |
|------|----------|
| Supabase CLI | Never worked reliably; use direct pg_dump instead |
| Docker | Only needed for Supabase CLI |

---

## Cursor Configuration

### MCP Servers

Create `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "fal": {
      "url": "https://docs.fal.ai/mcp"
    }
  }
}
```

### Keybindings

Create `~/Library/Application Support/Cursor/User/keybindings.json`:

```json
[
    {
        "key": "cmd+i",
        "command": "composerMode.agent"
    }
]
```

### Settings

Create `~/Library/Application Support/Cursor/User/settings.json`:

```json
{
    "window.commandCenter": true,
    "editor.accessibilitySupport": "off"
}
```

### One-Liner Setup

Run this to create all Cursor config files:

```bash
# Create directories
mkdir -p ~/.cursor
mkdir -p ~/Library/Application\ Support/Cursor/User

# MCP config
cat > ~/.cursor/mcp.json << 'EOF'
{
  "mcpServers": {
    "fal": {
      "url": "https://docs.fal.ai/mcp"
    }
  }
}
EOF

# Keybindings
cat > ~/Library/Application\ Support/Cursor/User/keybindings.json << 'EOF'
[
    {
        "key": "cmd+i",
        "command": "composerMode.agent"
    }
]
EOF

# Settings
cat > ~/Library/Application\ Support/Cursor/User/settings.json << 'EOF'
{
    "window.commandCenter": true,
    "editor.accessibilitySupport": "off"
}
EOF

echo "✅ Cursor configured!"
```

---

## Environment Variables

The `.env.local` file contains secrets and is NOT in git. It should already exist at:

```
/Volumes/PRO-G40/Dev/vibrationfit/.env.local
```

If missing, download from Vercel:
1. Go to [vercel.com](https://vercel.com) → Project → Settings → Environment Variables
2. Click "..." → Download .env.local
3. Move to project root

### Required Variables

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard |
| `OPENAI_API_KEY` | OpenAI Dashboard |
| `STRIPE_SECRET_KEY` | Stripe Dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard |
| `AWS_ACCESS_KEY_ID` | AWS IAM |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM |

---

## Project Locations on SSD

| Project | Path |
|---------|------|
| VibrationFit | `/Volumes/PRO-G40/Dev/vibrationfit` |
| Startup Design System | `/Volumes/PRO-G40/Dev/startup-design-system` |

### Quick Access Aliases

Add to `~/.zshrc`:

```bash
alias vfit="cd /Volumes/PRO-G40/Dev/vibrationfit"
alias sds="cd /Volumes/PRO-G40/Dev/startup-design-system"
```

Then run `source ~/.zshrc` to activate.

---

## Git Workflow

This project uses a branch-based workflow:

```
jordan (your branch) → dev (staging) → main (production/Vercel)
```

### Daily Commands

```bash
# Start work
git checkout jordan
git pull origin jordan

# Save work
git add -A
git commit -m "your message"
git push origin jordan
```

### Helper Scripts

```bash
./workflow/start-work.sh    # Sync and start
./workflow/save-work.sh     # Commit and push
./workflow/merge-to-dev.sh  # Merge to staging
```

See `workflow/WORKFLOW.md` for full details.

---

## Common Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Generate documentation
npm run docs:generate
```

---

## Viewing Hidden Files

Files starting with `.` (like `.env.local`, `.cursorrules`) are hidden in Finder.

Toggle visibility: **Cmd + Shift + .**

---

## Troubleshooting

### "command not found: npm"
Node.js not installed or not in PATH. Run:
```bash
brew install node
```

### "command not found: brew"
Homebrew not installed or not in PATH. Re-run the install command and follow the PATH instructions.

### Can't see .env.local
Press **Cmd + Shift + .** in Finder, or view in Cursor (shows hidden files by default).

### SSD not mounting
Check Disk Utility. Ensure PRO-G40 is connected via USB-C/Thunderbolt.

### Git permission denied
Set up SSH key or use HTTPS with token. The project currently uses HTTPS.

---

## Verification Checklist

Run these to verify your setup:

```bash
brew --version        # Should show version
node --version        # Should be v20+ or v22+
npm --version         # Should show version
git --version         # Should show version
ls /Volumes/PRO-G40/Dev/vibrationfit/.env.local  # Should exist
```

Then test the dev server:

```bash
cd /Volumes/PRO-G40/Dev/vibrationfit
npm run dev
# Visit http://localhost:3000
```

---

## Need Help?

- **Schema/Database:** See `docs/HOLY_GRAIL_SUPABASE_CONNECTION.md`
- **Git Workflow:** See `workflow/WORKFLOW.md`
- **Design System:** See `docs/agent-guides/DESIGN_SYSTEM_REFERENCE.md`
- **Project Rules:** See `.cursorrules` in project root
