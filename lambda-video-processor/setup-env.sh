#!/bin/bash

# Get the Supabase service key from user's .env.local or prompt
SERVICE_KEY=""

if [ -f "../.env.local" ]; then
  SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" ../.env.local | cut -d'=' -f2)
fi

if [ -z "$SERVICE_KEY" ]; then
  echo "Please enter your Supabase Service Role Key:"
  read SERVICE_KEY
fi

# Update Lambda environment variables
aws lambda update-function-configuration \
  --function-name video-processor-database-updater \
  --environment "Variables={SUPABASE_URL=https://nxjhqibnlbwzzphewncj.supabase.co,SUPABASE_SERVICE_KEY=${SERVICE_KEY}}" \
  --region us-east-2

echo "✅ Environment variables set!"

