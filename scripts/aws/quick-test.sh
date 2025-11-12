#!/bin/bash
# Quick test script for journal video upload

echo "🎬 JOURNAL VIDEO UPLOAD TEST"
echo "================================"
echo ""
echo "Choose a test scenario:"
echo ""
echo "1️⃣  Upload a SMALL video (< 20MB)"
echo "   - Uses FFmpeg compression"
echo "   - Should appear immediately"
echo "   - File: user-uploads/{userId}/journal/uploads/{filename}-compressed.mp4"
echo ""
echo "2️⃣  Upload a LARGE video (> 20MB)"
echo "   - Uses MediaConvert"
echo "   - May take a few minutes to process"
echo "   - File: user-uploads/{userId}/journal/uploads/processed/{filename}-compressed.mp4"
echo ""
echo "3️⃣  Check S3 for existing files"
echo "   - Lists all journal uploads"
echo ""
echo "4️⃣  Check MediaConvert jobs"
echo "   - Lists recent MediaConvert jobs"
echo ""
echo "Enter your choice (1-4): "
read -r choice

case $choice in
  1)
    echo ""
    echo "✅ Test Scenario A: Small Video"
    echo "   - Upload a video under 20MB"
    echo "   - Watch console for compression logs"
    echo "   - File should appear in S3 immediately"
    echo ""
    echo "📍 Go to: http://localhost:3000/journal/new"
    echo "   Upload a video file (< 20MB)"
    echo "   Watch DevTools Console for logs"
    ;;
  2)
    echo ""
    echo "✅ Test Scenario B: Large Video"
    echo "   - Upload a video over 20MB"
    echo "   - Watch console for MediaConvert logs"
    echo "   - Check AWS Console for job status"
    echo ""
    echo "📍 Go to: http://localhost:3000/journal/new"
    echo "   Upload a video file (> 20MB)"
    echo "   Watch DevTools Console for logs"
    ;;
  3)
    echo ""
    echo "🔍 Checking S3 for journal uploads..."
    aws s3 ls s3://vibration-fit-client-storage/user-uploads/ --recursive | grep "journal" | tail -20
    ;;
  4)
    echo ""
    echo "🔍 Checking MediaConvert jobs..."
    aws mediaconvert list-jobs --region us-east-2 --max-results 10 --query 'Jobs[*].[Id,Status,CreatedAt]' --output table
    ;;
  *)
    echo "❌ Invalid choice"
    ;;
esac

