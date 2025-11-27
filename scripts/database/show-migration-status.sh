#!/bin/bash
# Show Migration Status
# Simple script to show which migrations are pending
# Usage: ./scripts/database/show-migration-status.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Migration Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Running: supabase migration list"
echo ""

supabase migration list --local

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 How to Read This:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Remote Column = Already LIVE in production ✅"
echo "  Local Column  = In your local folder, NOT pushed yet ⚠️"
echo ""
echo "Example:"
echo "  Local          | Remote         | Time"
echo "  ---------------|----------------|-----"
echo "                 | 20250105000000 | ...  ← This IS in production"
echo "  20251115000001 |                | ...  ← This is NOT in production"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for duplicates
echo "🔍 Checking for duplicate timestamps..."
echo ""

DUPES=$(find supabase/migrations -maxdepth 1 -name "*.sql" -type f -exec basename {} \; | cut -d'_' -f1 | sort | uniq -c | awk '$1 > 1 {print $2}')

if [ -z "$DUPES" ]; then
    echo "✅ No duplicate timestamps found"
else
    echo "⚠️  DUPLICATE TIMESTAMPS FOUND:"
    echo ""
    for timestamp in $DUPES; do
        echo "  • $timestamp:"
        find supabase/migrations -maxdepth 1 -name "${timestamp}_*.sql" -type f -exec basename {} \; | sed 's/^/    - /'
    done
    echo ""
    echo "⚠️  You need to fix these before pushing!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Quick Actions:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Pull production:     ./scripts/database/pull-production.sh"
echo "  Push to production:  ./scripts/database/push-migration.sh"
echo "  Test locally:        supabase db reset"
echo "  Open Studio:         open http://127.0.0.1:54323"
echo ""






