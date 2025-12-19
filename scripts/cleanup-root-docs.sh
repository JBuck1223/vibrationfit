#!/bin/bash
# Cleanup script to move root markdown files to appropriate locations
# Run with: bash scripts/cleanup-root-docs.sh

set -e

ROOT_DIR="/Users/jordanbuckingham/Desktop/vibrationfit"
cd "$ROOT_DIR"

echo "🧹 Cleaning up root markdown files for Cursor cost optimization..."
echo ""

# Create directories if they don't exist
mkdir -p docs/archived/status-docs
mkdir -p docs/features
mkdir -p docs/technical
mkdir -p docs/guides

# Status docs - move to archive (these are historical records)
echo "📦 Archiving status docs..."
for file in *_COMPLETE.md *_FIX.md *_FIXES.md *_STATUS.md *_SUMMARY.md *_TRACKING_COMPLETE.md; do
  if [ -f "$file" ]; then
    echo "  → $file → docs/archived/status-docs/"
    mv "$file" "docs/archived/status-docs/"
  fi
done

# Implementation guides - move to docs/features/
echo ""
echo "📚 Moving implementation guides..."
for file in *_IMPLEMENTATION.md; do
  if [ -f "$file" ]; then
    echo "  → $file → docs/features/"
    mv "$file" "docs/features/"
  fi
done

# Technical guides - move to docs/technical/ or docs/guides/
echo ""
echo "🔧 Moving technical docs..."
for file in *_AUDIT.md *_GUIDE.md *_OPTIMIZATION*.md; do
  if [ -f "$file" ]; then
    if [[ "$file" == *"AUDIT"* ]]; then
      echo "  → $file → docs/technical/"
      mv "$file" "docs/technical/"
    else
      echo "  → $file → docs/guides/"
      mv "$file" "docs/guides/"
    fi
  fi
done

# Keep essential files in root
echo ""
echo "✅ Keeping essential files in root:"
echo "  - FEATURE_REGISTRY.md (referenced in .cursorrules)"
echo "  - PRODUCT_BRIEF.md (core project reference)"
echo "  - README.md (standard project file)"
echo "  - COST_TRACKING_REALITY.md (active reference)"

echo ""
echo "✨ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Status docs → docs/archived/status-docs/"
echo "  - Implementation guides → docs/features/"
echo "  - Technical docs → docs/technical/ or docs/guides/"
echo ""
echo "💡 Next steps:"
echo "  1. Review moved files to ensure they're in the right place"
echo "  2. Update any references to moved files"
echo "  3. Check your next Cursor bill for cost reduction"

