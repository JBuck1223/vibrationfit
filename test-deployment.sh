#!/bin/bash

echo "🔍 Checking if API endpoint is deployed..."
echo ""

# Check if the endpoint exists
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://vibrationfit.com/api/media/process-completed -H 'Content-Type: application/json' -d '{"test":"test"}')

if [ "$STATUS" = "500" ] || [ "$STATUS" = "400" ]; then
  echo "✅ Endpoint is LIVE! (Got $STATUS - expected for test data)"
  echo ""
  echo "📊 Ready to test! Upload a video to /journal/new and watch:"
  echo "   aws logs tail /aws/lambda/video-processor-database-updater --follow"
  echo ""
elif [ "$STATUS" = "404" ]; then
  echo "⏳ Endpoint not deployed yet (Got 404)"
  echo "   Waiting for Vercel to build..."
  echo ""
  echo "   Run this script again in ~30 seconds:"
  echo "   bash test-deployment.sh"
elif [ "$STATUS" = "405" ]; then
  echo "❌ Endpoint exists but wrong method"
  echo "   Check route.ts file"
else
  echo "❓ Got status: $STATUS"
  echo "   Run script again to check"
fi

echo ""
echo "Last checked: $(date)"
