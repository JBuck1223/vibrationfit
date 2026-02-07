#!/bin/bash

# VibrationFit Git Workflow: Merge to Dev
# This script merges jordan, vanessa, and jvmacmini branches into dev, tests the build, and syncs back

set -e  # Exit on error

echo "🔄 Starting merge to dev workflow..."
echo ""

# Store current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Step 1: Merge Jordan into dev
echo "Step 1/8: Merging jordan into dev..."
git checkout dev
git pull origin dev
git merge jordan --no-edit
echo "✅ Jordan merged into dev"
echo ""

# Step 2: Merge Vanessa into dev
echo "Step 2/8: Merging Vanessa into dev..."
git merge Vanessa --no-edit
echo "✅ Vanessa merged into dev"
echo ""

# Step 3: Merge jvmacmini into dev
echo "Step 3/8: Merging jvmacmini into dev..."
git merge jvmacmini --no-edit
echo "✅ jvmacmini merged into dev"
echo ""

# Step 4: Test build after all merges
echo "Step 4/8: Testing build after all merges..."
npm run build
echo "✅ Build successful after all merges"
echo ""

# Step 5: Push dev to remote
echo "Step 5/8: Pushing dev to remote..."
git push origin dev
echo "✅ Dev pushed to origin"
echo ""

# Step 6-8: Sync dev back to all branches
echo "Step 6/8: Syncing dev back to jordan..."
git checkout jordan
git merge dev --no-edit
git push origin jordan
echo "✅ Jordan synced with dev"

echo "Step 7/8: Syncing dev back to Vanessa..."
git checkout Vanessa
git merge dev --no-edit
git push origin Vanessa
echo "✅ Vanessa synced with dev"

echo "Step 8/8: Syncing dev back to jvmacmini..."
git checkout jvmacmini
git merge dev --no-edit
git push origin jvmacmini
echo "✅ jvmacmini synced with dev"
echo ""

# Return to original branch
git checkout "$CURRENT_BRANCH"

echo "✨ SUCCESS! All branches are now in sync:"
echo "   - jordan ✅"
echo "   - Vanessa ✅"
echo "   - jvmacmini ✅"
echo "   - dev ✅"
echo ""
echo "You can continue working on your branch!"

