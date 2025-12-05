#!/bin/bash

# VibrationFit Git Workflow: Deploy to Main (Production)
# This script deploys dev to main after final testing

set -e  # Exit on error

echo "🚀 Starting deployment to PRODUCTION (main)..."
echo ""
echo "⚠️  WARNING: This will deploy to PRODUCTION and trigger Vercel deployment!"
echo ""
read -p "Are you sure you want to deploy dev to main? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "Proceeding with deployment..."
echo ""

# Store current branch
CURRENT_BRANCH=$(git branch --show-current)

# Step 1: Checkout main and update
echo "Step 1/4: Checking out main branch..."
git checkout main
git pull origin main
echo "✅ Main branch updated"
echo ""

# Step 2: Merge dev into main
echo "Step 2/4: Merging dev into main..."
git merge dev --no-ff --no-edit
echo "✅ Dev merged into main"
echo ""

# Step 3: Final production build test
echo "Step 3/4: Running final production build test..."
npm run build
echo "✅ Production build successful"
echo ""

# Step 4: Push to production
echo "Step 4/4: Pushing to production..."
git push origin main
echo "✅ Main pushed to origin"
echo ""

# Return to original branch
git checkout "$CURRENT_BRANCH"

echo "✨ DEPLOYMENT COMPLETE!"
echo "🌐 Vercel is now deploying to production"
echo "📊 Check deployment status at: https://vercel.com"
echo ""
echo "Returned to branch: $CURRENT_BRANCH"

