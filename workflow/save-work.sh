#!/bin/bash

# VibrationFit Git Workflow: Save Work
# This script commits and pushes your current work

set -e  # Exit on error

CURRENT_BRANCH=$(git branch --show-current)

echo "💾 Saving work on branch: $CURRENT_BRANCH"
echo ""

# Check if there are changes
if git diff --quiet && git diff --cached --quiet; then
    echo "✅ No changes to save!"
    exit 0
fi

# Show what will be committed
echo "📋 Files to be committed:"
git status --short
echo ""

# Ask for commit message
read -p "Enter commit message: " commit_message

if [ -z "$commit_message" ]; then
    echo "❌ Commit message cannot be empty"
    exit 1
fi

# Add all changes
echo ""
echo "📦 Adding all changes..."
git add -A

# Commit
echo "💾 Committing..."
git commit -m "$commit_message"

# Push to remote
echo "☁️  Pushing to origin/$CURRENT_BRANCH..."
git push origin "$CURRENT_BRANCH"

echo ""
echo "✅ Work saved successfully!"
echo ""
echo "Last commit:"
git log -1 --oneline
echo ""

