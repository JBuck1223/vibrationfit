#!/bin/bash
# Pull Production Schema to Local
# 
# This script safely pulls your production schema and applies it locally
# Usage: ./scripts/database/pull-production.sh

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Pulling Production Schema to Local"
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

# Pull schema
echo "📥 Pulling remote schema..."
supabase db pull

echo ""
echo "✅ Schema pulled successfully!"
echo ""

# Ask before resetting
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  Ready to apply to local database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "Apply changes to local database? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔄 Resetting local database..."
    supabase db reset
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Local database synced with production!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 Next steps:"
    echo "   • View Studio: open http://127.0.0.1:54323"
    echo "   • Check status: supabase status"
    echo "   • Test connection: node scripts/database/test-supabase-connection.js"
    echo ""
else
    echo ""
    echo "⏭️  Skipped database reset"
    echo "   Run 'supabase db reset' when ready to apply changes"
    echo ""
fi



