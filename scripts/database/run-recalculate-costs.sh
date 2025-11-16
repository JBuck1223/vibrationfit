#!/bin/bash

# ============================================================================
# Recalculate Token Usage Costs
# ============================================================================
# This script updates all token_usage rows with accurate costs
# from the ai_model_pricing table
# ============================================================================

cd "$(dirname "$0")/../.."

echo "🔄 Recalculating token usage costs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get password from .env.local
PGPASSWORD=$(grep PGPASSWORD .env.local | cut -d '=' -f2)

# Run the recalculation script
psql "postgresql://postgres:$PGPASSWORD@db.nxjhqibnlbwzzphewncj.supabase.co:5432/postgres" \
  -f scripts/database/recalculate-token-costs.sql

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Cost recalculation complete!"
echo ""
echo "📊 Check your admin dashboard: /admin/token-usage"
echo "   The numbers should now reflect accurate costs!"

