#!/bin/bash
# List Pending Migrations
# 
# Shows which migrations are local but not yet in production
# Usage: ./scripts/database/list-pending-migrations.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Pending Migrations Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}Analyzing migrations...${NC}"
echo ""

# Get migration status
MIGRATION_OUTPUT=$(supabase migration list --local 2>&1)

# Check for already in production
IN_PROD=$(echo "$MIGRATION_OUTPUT" | grep -E "^\s+\|" | grep -v "Local" | grep -v "---" | awk -F'|' '{if ($2 != "" && $2 !~ /^[[:space:]]*$/) print $2}' | tr -d ' ')

# Get local only migrations
LOCAL_ONLY=$(echo "$MIGRATION_OUTPUT" | grep -E "^\s+\w" | awk '{print $1}')

# Count them
PROD_COUNT=$(echo "$IN_PROD" | grep -v '^$' | wc -l | tr -d ' ')
LOCAL_COUNT=$(echo "$LOCAL_ONLY" | grep -v '^$' | wc -l | tr -d ' ')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Already in Production: $PROD_COUNT migrations${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -z "$IN_PROD" ] && [ "$PROD_COUNT" -gt 0 ]; then
    echo "$IN_PROD" | while read -r timestamp; do
        if [ ! -z "$timestamp" ]; then
            filename=$(find supabase/migrations -name "${timestamp}_*.sql" -type f 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "unknown")
            echo -e "  ${GREEN}✓${NC} $timestamp - $filename"
        fi
    done
else
    echo "  (No migrations in production yet)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}⚠️  Pending (Not Yet in Production): $LOCAL_COUNT migrations${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -z "$LOCAL_ONLY" ] && [ "$LOCAL_COUNT" -gt 0 ]; then
    # Track duplicates
    declare -A seen_timestamps
    has_duplicates=false
    
    echo "$LOCAL_ONLY" | while read -r timestamp; do
        if [ ! -z "$timestamp" ]; then
            # Find the actual file
            files=$(find supabase/migrations -maxdepth 1 -name "${timestamp}_*.sql" -type f 2>/dev/null)
            
            if [ ! -z "$files" ]; then
                echo "$files" | while read -r filepath; do
                    filename=$(basename "$filepath")
                    
                    # Check for duplicate timestamp
                    count=$(find supabase/migrations -maxdepth 1 -name "${timestamp}_*.sql" -type f 2>/dev/null | wc -l | tr -d ' ')
                    
                    if [ "$count" -gt 1 ]; then
                        echo -e "  ${RED}⚠${NC}  $filename ${RED}← DUPLICATE TIMESTAMP!${NC}"
                    else
                        echo -e "  ${YELLOW}○${NC}  $filename"
                    fi
                done
            fi
        fi
    done
else
    echo "  (All migrations are in production)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🔍 Checking for Issues...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for duplicate timestamps
DUPLICATES=$(find supabase/migrations -maxdepth 1 -name "*.sql" -type f | xargs basename -a | cut -d'_' -f1 | sort | uniq -d)

if [ ! -z "$DUPLICATES" ]; then
    echo -e "${RED}❌ DUPLICATE TIMESTAMPS FOUND:${NC}"
    echo ""
    
    echo "$DUPLICATES" | while read -r dup; do
        echo -e "${RED}  • $dup:${NC}"
        find supabase/migrations -maxdepth 1 -name "${dup}_*.sql" -type f | xargs basename -a | while read -r file; do
            echo "    - $file"
        done
        echo ""
    done
    
    echo -e "${YELLOW}⚠️  Fix required: Each migration needs a unique timestamp${NC}"
    echo ""
else
    echo -e "${GREEN}✓ No duplicate timestamps${NC}"
    echo ""
fi

# Check for non-standard files
NON_STANDARD=$(find supabase/migrations -maxdepth 1 -type f ! -name "*.sql" ! -name "README*" 2>/dev/null)

if [ ! -z "$NON_STANDARD" ]; then
    echo -e "${YELLOW}⚠️  Non-migration files found:${NC}"
    echo "$NON_STANDARD" | xargs basename -a | while read -r file; do
        echo "  • $file"
    done
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}💡 What To Do Next${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -z "$DUPLICATES" ]; then
    echo -e "${YELLOW}1. Fix duplicate timestamps:${NC}"
    echo "   • Rename files to have unique timestamps"
    echo "   • Or delete duplicates if they're obsolete"
    echo ""
fi

if [ "$LOCAL_COUNT" -gt 0 ]; then
    echo -e "${BLUE}2. Before pushing pending migrations:${NC}"
    echo "   • Test locally: supabase db reset"
    echo "   • Verify in Studio: open http://127.0.0.1:54323"
    echo "   • Review changes carefully"
    echo ""
    
    echo -e "${BLUE}3. To push to production:${NC}"
    echo "   ./scripts/database/push-migration.sh"
    echo ""
else
    echo -e "${GREEN}✓ All migrations are in production!${NC}"
    echo ""
fi

echo -e "${CYAN}📖 More info:${NC}"
echo "   cat docs/PULL_VS_MIGRATIONS_EXPLAINED.md"
echo ""


