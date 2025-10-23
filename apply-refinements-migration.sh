#!/bin/bash

# Script to apply the refinements table rename migration
# This will rename vibe_assistant_logs to refinements

echo "🔄 Applying refinements table rename migration..."

# Check if we're connected to Supabase
if ! npx supabase status > /dev/null 2>&1; then
    echo "❌ Supabase is not running locally. Please start it with:"
    echo "   npx supabase start"
    echo ""
    echo "Or apply the migration directly to your production database:"
    echo "   npx supabase db push"
    exit 1
fi

# Apply the migration
echo "📝 Applying migration..."
npx supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo "📊 Table 'vibe_assistant_logs' has been renamed to 'refinements'"
    echo ""
    echo "🎉 You can now use the new table name in your queries:"
    echo "   .from('refinements')"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
