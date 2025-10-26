#!/bin/bash

# Check Database Connection
# This script helps verify access to Supabase for schema extraction

echo "🔍 VibrationFit Database Connection Checker"
echo "=========================================="
echo ""

# Check if required variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not set"
    exit 1
fi

echo "✅ Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql not found. Install PostgreSQL client:"
    echo "   brew install postgresql"
    echo ""
    echo "Or use Supabase CLI instead:"
    echo "   supabase db dump --schema-only > schema.sql"
    exit 1
fi

echo "To connect via psql, you'll need:"
echo ""
echo "1. Your database password (Supabase Dashboard → Settings → Database)"
echo "2. Extract project ref from URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "3. Connection string format:"
echo "   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
echo ""
echo "Or install Supabase CLI:"
echo "   brew install supabase/tap/supabase"
echo ""
echo "Then run:"
echo "   supabase link --project-ref [PROJECT-REF]"
echo "   supabase db dump --schema-only > supabase-schema-export.sql"
