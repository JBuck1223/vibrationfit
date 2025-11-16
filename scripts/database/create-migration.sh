#!/bin/bash
# Create New Migration
# 
# Interactive script to create a new migration with best practices
# Usage: ./scripts/database/create-migration.sh [migration-name]

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Create New Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get migration name
if [ -z "$1" ]; then
    echo "Enter migration name (use underscores, e.g., add_user_preferences):"
    read -r MIGRATION_NAME
else
    MIGRATION_NAME=$1
fi

# Validate name
if [ -z "$MIGRATION_NAME" ]; then
    echo "❌ Migration name is required"
    exit 1
fi

# Remove spaces and convert to lowercase
MIGRATION_NAME=$(echo "$MIGRATION_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')

echo ""
echo "Creating migration: $MIGRATION_NAME"
echo ""

# Pull latest schema first
echo "📥 Pulling latest schema from production..."
if supabase projects list > /dev/null 2>&1; then
    if supabase db pull 2>&1 | grep -q "Error"; then
        echo "⚠️  Could not pull from production (not linked or not logged in)"
        echo "   Continuing with local state..."
    else
        echo "✅ Schema pulled"
    fi
else
    echo "⚠️  Not logged in - skipping pull"
    echo "   Run 'supabase login' to sync with production"
fi

echo ""

# Create migration
echo "📄 Creating migration file..."
MIGRATION_FILE=$(supabase migration new "$MIGRATION_NAME" | grep -o 'supabase/migrations/[^ ]*')

echo ""
echo "✅ Migration created!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Edit your migration in Cursor:"
echo "   $MIGRATION_FILE"
echo ""
echo "2. Add your SQL changes (examples below)"
echo ""
echo "3. Test locally:"
echo "   supabase db reset"
echo "   open http://127.0.0.1:54323"
echo ""
echo "4. Push to production:"
echo "   ./scripts/database/push-migration.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Migration Examples:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "-- Add column:"
echo "ALTER TABLE profiles ADD COLUMN bio TEXT;"
echo ""
echo "-- Create table:"
echo "CREATE TABLE user_preferences ("
echo "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
echo "  user_id UUID REFERENCES auth.users(id) NOT NULL,"
echo "  theme TEXT DEFAULT 'dark',"
echo "  created_at TIMESTAMPTZ DEFAULT NOW()"
echo ");"
echo ""
echo "-- Enable RLS:"
echo "ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;"
echo ""
echo "-- Create policy:"
echo "CREATE POLICY \"Users manage own preferences\""
echo "  ON user_preferences FOR ALL"
echo "  USING (auth.uid() = user_id);"
echo ""
echo "-- Create index:"
echo "CREATE INDEX idx_profiles_email ON profiles(email);"
echo ""

# Open in Cursor (if available)
if command -v cursor &> /dev/null; then
    read -p "Open in Cursor now? (Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        cursor "$MIGRATION_FILE"
    fi
elif command -v code &> /dev/null; then
    read -p "Open in VS Code now? (Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        code "$MIGRATION_FILE"
    fi
fi

echo ""
echo "Happy migrating! 🚀"
echo ""


