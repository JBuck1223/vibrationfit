#!/bin/bash

# VibrationFit Git Workflow: Merge to Dev
# This script merges both jordan and vanessa branches into dev, tests the build, and syncs back

set -e  # Exit on error

echo "🔄 Starting merge to dev workflow..."
echo ""

# Store current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Step 1: Merge Jordan into dev
echo "Step 1/6: Merging jordan into dev..."
git checkout dev
git pull origin dev
git merge jordan --no-edit
echo "✅ Jordan merged into dev"
echo ""

# Step 2: Test build after jordan merge
echo "Step 2/6: Testing build after jordan merge..."
npm run build
echo "✅ Build successful after jordan merge"
echo ""

# Step 3: Merge Vanessa into dev
echo "Step 3/6: Merging Vanessa into dev..."
git merge Vanessa --no-edit
echo "✅ Vanessa merged into dev"
echo ""

# Step 4: Test build after vanessa merge
echo "Step 4/6: Testing build after both merges..."
npm run build
echo "✅ Build successful after all merges"
echo ""

# Step 5: Push dev to remote
echo "Step 5/6: Pushing dev to remote..."
git push origin dev
echo "✅ Dev pushed to origin"
echo ""

# Step 6: Sync dev back to jordan and vanessa
echo "Step 6/6: Syncing dev back to jordan and vanessa..."

# Sync to jordan
git checkout jordan
git merge dev --no-edit
git push origin jordan
echo "✅ Jordan synced with dev"

# Sync to Vanessa
git checkout Vanessa
git merge dev --no-edit
git push origin Vanessa
echo "✅ Vanessa synced with dev"
echo ""

# Return to original branch
git checkout "$CURRENT_BRANCH"

echo "✨ SUCCESS! All branches are now in sync:"
echo "   - jordan ✅"
echo "   - Vanessa ✅"
echo "   - dev ✅"
echo ""
echo "You can continue working on jordan or Vanessa!"

