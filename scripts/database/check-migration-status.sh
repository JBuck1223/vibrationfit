#!/bin/bash
# Check Migration Status
# 
# Shows which migrations are local vs production
# Usage: ./scripts/database/check-migration-status.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Migration Status Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check local migrations
echo -e "${BLUE}📁 Local Migrations:${NC}"
echo ""

if [ -d "supabase/migrations" ]; then
    LOCAL_MIGRATIONS=$(find supabase/migrations -maxdepth 1 -name "*.sql" -type f | sort)
    LOCAL_COUNT=$(echo "$LOCAL_MIGRATIONS" | wc -l | tr -d ' ')
    
    echo -e "${GREEN}Found $LOCAL_COUNT migration files:${NC}"
    echo ""
    
    echo "$LOCAL_MIGRATIONS" | while read -r file; do
        filename=$(basename "$file")
        echo "  • $filename"
    done
else
    echo -e "${RED}No migrations folder found${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Try to check remote status
echo -e "${BLUE}🌐 Checking Production Status...${NC}"
echo ""

if supabase projects list > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Logged in to Supabase${NC}"
    echo ""
    
    # Try to list migrations
    echo "Fetching migration status from production..."
    echo ""
    
    if supabase migration list 2>&1 | grep -q "password"; then
        echo -e "${YELLOW}⚠️  Database password required${NC}"
        echo ""
        echo "To check production status, you'll need to:"
        echo "  1. Run: supabase link --project-ref nxjhqibnlbwzzphewncj"
        echo "  2. Enter your database password when prompted"
        echo "  3. Then run: supabase migration list"
        echo ""
    else
        supabase migration list 2>&1 || true
    fi
else
    echo -e "${YELLOW}⚠️  Not logged in to Supabase${NC}"
    echo ""
    echo "To check which migrations are in production:"
    echo "  1. Run: supabase login"
    echo "  2. Run: supabase link --project-ref nxjhqibnlbwzzphewncj"
    echo "  3. Run: supabase migration list"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}💡 Quick Commands:${NC}"
echo ""
echo "  List local migrations:     supabase migration list --local"
echo "  List remote migrations:    supabase migration list"
echo "  Show pending migrations:   supabase migration list --pending"
echo "  Pull production schema:    ./scripts/database/pull-production.sh"
echo ""



