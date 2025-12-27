#!/bin/bash

# Solfeggio Binaural - Generate and Upload
# This script generates all tracks and uploads them to S3 in one command

set -e  # Exit on error

echo "🎵 Solfeggio Binaural Beat Generator & Uploader"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# S3 bucket and path
S3_BUCKET="vibration-fit-client-storage"
S3_PATH="site-assets/audio/mixing-tracks/solfeggio/binaural"
S3_URI="s3://${S3_BUCKET}/${S3_PATH}"
CDN_URL="https://media.vibrationfit.com/${S3_PATH}"

# Output directory
OUTPUT_DIR="./output/solfeggio-binaural"

# Step 1: Check dependencies
echo -e "${BLUE}📋 Checking dependencies...${NC}"

if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ FFmpeg not found${NC}"
    echo "Install: brew install ffmpeg"
    exit 1
fi
echo -e "${GREEN}✅ FFmpeg installed${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Install: brew install node"
    exit 1
fi
echo -e "${GREEN}✅ Node.js installed${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    echo "Install: brew install awscli"
    exit 1
fi
echo -e "${GREEN}✅ AWS CLI installed${NC}"

# Check AWS credentials
if ! aws s3 ls s3://${S3_BUCKET} &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured or no access to bucket${NC}"
    echo "Run: aws configure"
    exit 1
fi
echo -e "${GREEN}✅ AWS credentials configured${NC}"
echo ""

# Step 2: Generate tracks
echo -e "${BLUE}🎵 Generating Solfeggio Binaural tracks...${NC}"
echo "This will take about 10 minutes..."
echo ""

node generate-solfeggio-binaural.js

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Generation failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Generation complete!${NC}"
echo ""

# Step 3: Check output
if [ ! -d "$OUTPUT_DIR" ]; then
    echo -e "${RED}❌ Output directory not found: ${OUTPUT_DIR}${NC}"
    exit 1
fi

FILE_COUNT=$(find "$OUTPUT_DIR" -name "*.mp3" | wc -l | tr -d ' ')
echo -e "${BLUE}📊 Found ${FILE_COUNT} audio files to upload${NC}"

if [ "$FILE_COUNT" -eq "0" ]; then
    echo -e "${RED}❌ No MP3 files found${NC}"
    exit 1
fi

# Step 4: Upload to S3
echo ""
echo -e "${BLUE}📤 Uploading to S3...${NC}"
echo "Destination: ${S3_URI}"
echo ""

aws s3 cp "$OUTPUT_DIR/" "$S3_URI/" \
    --recursive \
    --content-type "audio/mpeg" \
    --cache-control "max-age=31536000" \
    --acl public-read

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Upload complete!${NC}"
echo ""

# Step 5: Verify
echo -e "${BLUE}🔍 Verifying upload...${NC}"
UPLOADED_COUNT=$(aws s3 ls "$S3_URI/" | grep ".mp3" | wc -l | tr -d ' ')
echo "Files on S3: ${UPLOADED_COUNT}"

if [ "$UPLOADED_COUNT" -eq "$FILE_COUNT" ]; then
    echo -e "${GREEN}✅ All files uploaded successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: File count mismatch (local: ${FILE_COUNT}, S3: ${UPLOADED_COUNT})${NC}"
fi

# Step 6: Summary
echo ""
echo "================================================"
echo -e "${GREEN}🎉 All done!${NC}"
echo "================================================"
echo ""
echo "📍 Files are now accessible at:"
echo "   ${CDN_URL}/"
echo ""
echo "Example URLs:"
echo "   ${CDN_URL}/528hz-theta.mp3"
echo "   ${CDN_URL}/journey-sleep-journey.mp3"
echo ""
echo "📝 Next steps:"
echo "   1. Copy SQL statements from generation output above"
echo "   2. Run them in Supabase SQL editor"
echo "   3. View tracks in /admin/audio-mixer"
echo ""
echo "🔗 Quick links:"
echo "   Admin Panel: https://vibrationfit.com/admin/audio-mixer"
echo "   Supabase: https://supabase.com/dashboard/project/[your-project]/sql"
echo ""

