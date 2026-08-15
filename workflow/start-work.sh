#!/bin/bash

# VibrationFit Git Workflow: Start Work
# This script helps you start work on either machine by pulling latest changes

set -e  # Exit on error

echo "Welcome to VibrationFit!"
echo ""
echo "Which machine are you on?"
echo "  1) JV MacBook Pro (jordan branch)"
echo "  2) JV Mac Mini (jvmacmini branch)"
echo ""
read -p "Enter 1 or 2: " machine

if [ "$machine" == "1" ]; then
    BRANCH="jordan"
    MACHINE_NAME="JV MacBook Pro"
elif [ "$machine" == "2" ]; then
    BRANCH="jvmacmini"
    MACHINE_NAME="JV Mac Mini"
else
    echo "Invalid selection. Please run again and choose 1 or 2."
    exit 1
fi

echo ""
echo "Setting up $MACHINE_NAME ($BRANCH branch)..."
echo ""

# Checkout the branch
git checkout "$BRANCH"

# Pull latest from remote
echo "Pulling latest changes from origin/$BRANCH..."
git pull origin "$BRANCH"

echo ""
echo "Ready to work on $MACHINE_NAME!"
echo ""
echo "Current branch: $BRANCH"
echo "Last commit:"
git log -1 --oneline
echo ""
echo "Tips:"
echo "   - Commit often: git add -A && git commit -m 'your message'"
echo "   - Save work: ./workflow/save-work.sh"
echo "   - Merge to dev: ./workflow/merge-to-dev.sh"
echo ""
