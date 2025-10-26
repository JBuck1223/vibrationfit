# Audio Mixer Lambda Deployment Guide

## Overview
This Lambda function mixes voice-only audio tracks with background music (ocean waves) using FFmpeg.

## Prerequisites
- AWS CLI configured with credentials
- AWS Lambda service access
- FFmpeg Lambda layer (or build your own)

## Deployment Steps

### 1. Install Dependencies
\`\`\`bash
cd functions/audio-mixer
npm install
\`\`\`

### 2. Create Deployment Package
\`\`\`bash
zip -r audio-mixer.zip .
\`\`\`

### 3. Deploy via AWS Console

1. Go to AWS Lambda Console
2. Click "Create function"
3. Name: `audio-mixer`
4. Runtime: Node.js 18.x or 20.x
5. Architecture: x86_64
6. Upload the `audio-mixer.zip` file
7. In Configuration > General:
   - Memory: 1024 MB
   - Timeout: 900 seconds (15 minutes)
8. Add FFmpeg layer (use public layer or create custom)
9. In Configuration > Environment variables:
   - `AWS_REGION`: us-east-2
   - `AWS_ACCESS_KEY_ID`: your access key
   - `AWS_SECRET_ACCESS_KEY`: your secret key
   - `BUCKET_NAME`: vibration-fit-client-storage
   - `SUPABASE_URL`: your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: your service role key

### 4. Add FFmpeg Layer

Use this public layer ARN:
\`\`\`
arn:aws:lambda:us-east-2:487912785921:layer:ffmpeg:1
\`\`\`

Or create your own:
1. Download FFmpeg binary for Lambda
2. Package as a layer
3. Upload to Lambda
4. Attach to function

## Testing

Test the function with:
\`\`\`json
{
  "voiceUrl": "https://media.vibrationfit.com/path/to/voice.mp3",
  "bgUrl": "https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-1.mp3",
  "outputKey": "test/mixed-output.mp3",
  "variant": "sleep",
  "voiceVolume": 0.3,
  "bgVolume": 0.7,
  "trackId": "test-track-id"
}
\`\`\`

## Monitoring

Check CloudWatch logs for:
- FFmpeg execution logs
- S3 upload success
- Supabase update confirmation

## Troubleshooting

- **FFmpeg not found**: Ensure FFmpeg layer is attached
- **Timeout errors**: Increase function timeout or check audio file sizes
- **S3 upload failures**: Verify IAM permissions for S3 write access
- **Supabase update failures**: Check service role key and Supabase URL

## Cost Optimization

- Lambda with 1024MB memory: ~$0.0000166667 per 100ms
- S3 storage: $0.023 per GB/month
- Data transfer: $0.09 per GB

For 100 audio mixes/month:
- Lambda: ~$1.50
- S3: ~$0.01
- Transfer: ~$0.09
**Total: ~$1.60/month**
