#!/bin/bash

# VibrationFit Git Workflow: Merge to Dev
# This script merges jordan and jvmacmini into dev, tests the build, and syncs back

set -e  # Exit on error

echo "Starting merge to dev workflow..."
echo ""

# Store current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Step 1: Merge Jordan (JV MacBook Pro) into dev
echo "Step 1/6: Merging jordan into dev..."
git checkout dev
git pull origin dev
git merge jordan --no-edit
echo "Jordan merged into dev"
echo ""

# Step 2: Merge jvmacmini (JV Mac Mini) into dev
echo "Step 2/6: Merging jvmacmini into dev..."
git merge jvmacmini --no-edit
echo "jvmacmini merged into dev"
echo ""

# Step 3: Test build after all merges
echo "Step 3/6: Testing build after all merges..."
npm run build
echo "Build successful after all merges"
echo ""

# Step 4: Push dev to remote
echo "Step 4/6: Pushing dev to remote..."
git push origin dev
echo "Dev pushed to origin"
echo ""

# Step 5-6: Sync dev back to both machine branches
echo "Step 5/6: Syncing dev back to jordan..."
git checkout jordan
git merge dev --no-edit
git push origin jordan
echo "Jordan synced with dev"

echo "Step 6/6: Syncing dev back to jvmacmini..."
git checkout jvmacmini
git merge dev --no-edit
git push origin jvmacmini
echo "jvmacmini synced with dev"
echo ""

# Return to original branch
git checkout "$CURRENT_BRANCH"

echo "SUCCESS! All branches are now in sync:"
echo "   - jordan (JV MacBook Pro)"
echo "   - jvmacmini (JV Mac Mini)"
echo "   - dev"
echo ""
echo "You can continue working on your branch!"
