#!/bin/bash
# Push New Migration to Production
# 
# This script helps you safely push migrations to production
# Usage: ./scripts/database/push-migration.sh

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Push Migration to Production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if logged in
if ! supabase projects list > /dev/null 2>&1; then
    echo "❌ Not logged in to Supabase"
    echo "Please run: supabase login"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Check if linked
if ! supabase link --project-ref nxjhqibnlbwzzphewncj > /dev/null 2>&1; then
    echo "🔗 Linking to project..."
    supabase link --project-ref nxjhqibnlbwzzphewncj
fi

echo "✅ Project linked"
echo ""

# Show pending migrations
echo "📋 Checking for pending migrations..."
echo ""

if ! supabase migration list --pending 2>&1 | grep -q "No pending migrations"; then
    supabase migration list --pending || true
else
    echo "✅ No pending migrations found"
    echo ""
    echo "💡 To create a new migration:"
    echo "   supabase migration new my_feature_name"
    echo ""
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  SAFETY CHECKLIST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Before pushing to production, make sure:"
echo ""
echo "  ☐ Migration tested locally (supabase db reset)"
echo "  ☐ No syntax errors"
echo "  ☐ RLS policies tested"
echo "  ☐ Data integrity verified"
echo "  ☐ Team notified (if applicable)"
echo "  ☐ Backup plan ready"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test local first
read -p "Did you test locally with 'supabase db reset'? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "⚠️  Please test locally first:"
    echo "   supabase db reset"
    echo "   open http://127.0.0.1:54323"
    echo ""
    exit 1
fi

echo ""
read -p "Ready to push to PRODUCTION? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Pushing to production..."
    echo ""
    
    supabase db push
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Migration pushed to production!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 Don't forget to:"
    echo "   • Update supabase/COMPLETE_SCHEMA_DUMP.sql"
    echo "   • Update supabase/CURRENT_SCHEMA.md"
    echo "   • Verify in production dashboard"
    echo "   • Test your app"
    echo ""
else
    echo ""
    echo "⏭️  Push cancelled"
    echo ""
    echo "💡 When ready, run:"
    echo "   supabase db push"
    echo ""
fi


