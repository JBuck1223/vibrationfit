# Lambda Audio Mixer - Compatibility Guide

**Last Updated:** December 23, 2024  
**Status:** Active

## Overview

The new flexible audio mixing system is **fully compatible** with the existing Lambda audio mixer function (`audio-mixer`) deployed on AWS.

## Lambda Function Details

### Current Deployment
- **Function Name:** `audio-mixer`
- **Runtime:** Node.js 18.x/20.x (ES Modules)
- **Memory:** 1024 MB
- **Timeout:** 900 seconds (15 minutes)
- **Layer:** FFmpeg Lambda Layer
- **Region:** us-east-2

### Expected Input Parameters

```javascript
{
  voiceUrl: string,        // Full URL to voice track (S3 or CloudFront)
  bgUrl: string,           // Full URL to background track (S3 or CloudFront)
  outputKey: string,       // S3 key for output file
  voiceVolume: number,     // Decimal 0-1 (e.g., 0.7 for 70%)
  bgVolume: number,        // Decimal 0-1 (e.g., 0.3 for 30%)
  trackId: string,         // Optional: Supabase audio_tracks.id for status updates
  variant: string          // Optional: Variant name (not used in mixing logic)
}
```

### Lambda Functionality

1. **Downloads audio files** from S3/CloudFront URLs
2. **Mixes audio** using FFmpeg with specified volumes
3. **Loops background** track to match voice duration
4. **Uploads result** to S3 with proper CDN URL
5. **Updates Supabase** `audio_tracks` table with mix status

### Output Format
- **Codec:** MP3 (libmp3lame)
- **Bitrate:** 192kbps
- **CDN URL:** `https://media.vibrationfit.com/[outputKey]`

## Integration with New System

### Old System (audio_variants)
**API Route:** `/api/audio/mix`

```typescript
// Fixed variant system
const { data: variantData } = await supabase
  .from('audio_variants')
  .select('voice_volume, bg_volume, background_track')
  .eq('id', variant)
  .single()

// Convert to decimal and invoke Lambda
await lambda.send(new InvokeCommand({
  FunctionName: 'audio-mixer',
  Payload: JSON.stringify({
    voiceUrl,
    bgUrl: variantData.background_track,
    voiceVolume: variantData.voice_volume / 100,
    bgVolume: variantData.bg_volume / 100,
    outputKey,
    trackId,
    variant
  })
}))
```

### New System (flexible mixing)
**API Route:** `/api/audio/mix-custom`

```typescript
// User selects track and ratio dynamically
await lambda.send(new InvokeCommand({
  FunctionName: 'audio-mixer',
  Payload: JSON.stringify({
    voiceUrl,                    // Voice track URL
    bgUrl: backgroundTrackUrl,   // ANY background track URL
    voiceVolume: voiceVolume / 100,  // ANY ratio (0-1)
    bgVolume: bgVolume / 100,        // ANY ratio (0-1)
    outputKey,
    trackId
  })
}))
```

## Volume Conversion

**Critical:** Lambda expects volumes as **decimals (0-1)**, but our database stores **percentages (0-100)**.

### Conversion Logic
```typescript
// Database: 70% voice, 30% background
const dbVoiceVolume = 70
const dbBgVolume = 30

// Lambda: Convert to decimal
const lambdaVoiceVolume = dbVoiceVolume / 100  // 0.7
const lambdaBgVolume = dbBgVolume / 100        // 0.3
```

### Examples
| DB Voice % | DB BG % | Lambda Voice | Lambda BG |
|------------|---------|--------------|-----------|
| 100 | 0 | 1.0 | 0.0 |
| 90 | 10 | 0.9 | 0.1 |
| 80 | 20 | 0.8 | 0.2 |
| 70 | 30 | 0.7 | 0.3 |
| 50 | 50 | 0.5 | 0.5 |
| 30 | 70 | 0.3 | 0.7 |
| 10 | 90 | 0.1 | 0.9 |

## URL Formats Supported by Lambda

The Lambda function handles multiple URL formats:

### S3 Direct URLs
```
s3://vibration-fit-client-storage/audio/voice/track.mp3
https://vibration-fit-client-storage.s3.us-east-2.amazonaws.com/audio/voice/track.mp3
```

### CloudFront CDN URLs
```
https://media.vibrationfit.com/audio/voice/track.mp3
https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-1.mp3
```

**Note:** Lambda extracts the S3 key from any of these formats automatically.

## FFmpeg Mixing Process

### Lambda Command
```bash
ffmpeg -i voice.mp3 -i background.mp3 \
  -filter_complex "[0:a]volume=0.7[a0];[1:a]volume=0.3,aloop=loop=-1:size=2e+09[a1];[a0][a1]amix=inputs=2:duration=first" \
  -codec:a libmp3lame -b:a 192k -y output.mp3
```

### Breakdown
1. **`[0:a]volume=0.7[a0]`** - Set voice volume to 70%
2. **`[1:a]volume=0.3`** - Set background volume to 30%
3. **`aloop=loop=-1:size=2e+09`** - Loop background infinitely
4. **`amix=inputs=2:duration=first`** - Mix both, use voice duration
5. **`-codec:a libmp3lame -b:a 192k`** - Encode as MP3 at 192kbps

## Supabase Integration

The Lambda function updates the `audio_tracks` table:

### On Success
```sql
UPDATE audio_tracks
SET 
  mix_status = 'completed',
  mixed_audio_url = 'https://media.vibrationfit.com/...',
  mixed_s3_key = 'audio/mixed/...'
WHERE id = trackId
```

### On Failure
```sql
UPDATE audio_tracks
SET 
  mix_status = 'failed',
  error_message = 'Error details...'
WHERE id = trackId
```

## Environment Variables Required

Lambda function needs these environment variables:

```bash
AWS_REGION=us-east-2
BUCKET_NAME=vibration-fit-client-storage
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

## Compatibility Checklist

- ✅ **Parameter names match** - Lambda expects `bgUrl`, we send `bgUrl`
- ✅ **Volume conversion** - We convert % to decimal correctly
- ✅ **Function name** - Using correct `audio-mixer` function name
- ✅ **URL formats** - Sending CloudFront URLs that Lambda can parse
- ✅ **trackId** - Passed for Supabase status updates
- ✅ **Output keys** - Using proper S3 key format
- ✅ **Async invocation** - Fire-and-forget for long processing

## Testing the Integration

### 1. Test Old System (Fixed Variants)
```bash
# Should use audio_variants table
curl -X POST http://localhost:3000/api/audio/mix \
  -H "Content-Type: application/json" \
  -d '{
    "trackId": "uuid",
    "voiceUrl": "https://media.vibrationfit.com/audio/voice/test.mp3",
    "variant": "sleep",
    "outputKey": "audio/mixed/test-sleep.mp3"
  }'
```

### 2. Test New System (Flexible Mixing)
```bash
# Should use audio_background_tracks + audio_mix_ratios
curl -X POST http://localhost:3000/api/audio/mix-custom \
  -H "Content-Type: application/json" \
  -d '{
    "trackId": "uuid",
    "voiceUrl": "https://media.vibrationfit.com/audio/voice/test.mp3",
    "backgroundTrackUrl": "https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-1.mp3",
    "voiceVolume": 70,
    "bgVolume": 30,
    "outputKey": "audio/mixed/test-custom.mp3"
  }'
```

### 3. Verify Lambda Logs
```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/audio-mixer --follow --region us-east-2
```

### 4. Check Supabase Updates
```sql
-- Verify mix_status updated
SELECT id, mix_status, mixed_audio_url, error_message
FROM audio_tracks
WHERE id = '[your-track-id]'
```

## Performance Considerations

### Lambda Execution Time
- **Voice-only (no mixing):** 0 seconds
- **Short track (1-2 min):** 5-10 seconds
- **Long track (10-15 min):** 30-60 seconds

### Cost Estimation
- **Lambda:** ~$0.0001 per mix (1GB-Second)
- **S3 Storage:** ~$0.023/GB/month
- **CloudFront:** ~$0.085/GB transfer

### Optimization Tips
1. **Reuse voice tracks** - Only mix once per variant
2. **Async processing** - Don't block user with Lambda wait
3. **Batch mixing** - Queue multiple tracks together
4. **Cache CDN URLs** - Serve from edge locations

## Troubleshooting

### "Invalid URL format" Error
- **Cause:** Lambda can't parse S3 key from URL
- **Fix:** Ensure URL includes bucket name or CloudFront domain

### "FFmpeg command failed" Error
- **Cause:** Invalid audio file or FFmpeg crash
- **Fix:** Verify audio files are valid MP3, check Lambda logs

### "Supabase update failed" Error
- **Cause:** Invalid trackId or missing env vars
- **Fix:** Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

### Mixed Audio Too Quiet/Loud
- **Cause:** Incorrect volume conversion
- **Fix:** Verify percentage → decimal conversion (divide by 100)

## Migration Notes

### No Changes Required
The Lambda function **does not need to be updated** for the flexible mixing system. It already accepts dynamic `bgUrl` and volume parameters.

### Deployment Steps
1. ✅ Deploy new database tables (already done)
2. ✅ Deploy new API routes (already done)
3. ✅ Test with existing Lambda (no redeployment needed)
4. ❌ **DO NOT redeploy Lambda** (current version works perfectly)

## Future Enhancements

Potential Lambda improvements (not required):

1. **Support more formats** - WAV, OGG, FLAC
2. **Advanced effects** - Reverb, EQ, compression
3. **Fade in/out** - Smooth transitions
4. **Multiple backgrounds** - Layer multiple tracks
5. **Real-time preview** - Stream mixed audio before saving

But for now, the current Lambda function is **perfect for our needs**! 🎉

## Related Files

- Lambda Code: `docs/jordan/audio-mixer-1a7d17f2-ebcc-4e1b-8dae-934f921b684d/index.js`
- Old API Route: `src/app/api/audio/mix/route.ts`
- New API Route: `src/app/api/audio/mix-custom/route.ts`
- Database Schema: `supabase/migrations/20251223161528_flexible_audio_mixing.sql`

