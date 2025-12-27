# Audio Mixer Lambda

Mixes voice audio tracks with background music using FFmpeg.

## Deployment

### 1. Install Dependencies
```bash
cd functions/audio-mixer
npm install
```

### 2. Add FFmpeg Layer
You need to add an FFmpeg Lambda layer. Use this public layer:
- ARN: `arn:aws:lambda:us-east-2:487912785921:layer:ffmpeg:1`

Or create your own:
```bash
# Download FFmpeg binary for Lambda
# See: https://github.com/serverlesspub/ffmpeg-aws-lambda-layer
```

### 3. Create Deployment Package
```bash
zip -r audio-mixer.zip .
```

### 4. Deploy to Lambda
- Function name: `audio-mixer`
- Runtime: Node.js 18.x or 20.x
- Memory: 1024 MB (for FFmpeg)
- Timeout: 900 seconds (15 minutes for long audio)
- Add FFmpeg layer
- Environment variables:
  - `AWS_REGION`: us-east-2
  - `AWS_ACCESS_KEY_ID`: your access key
  - `AWS_SECRET_ACCESS_KEY`: your secret key
  - `BUCKET_NAME`: vibration-fit-client-storage

### 5. Call from Your API
```javascript
// In your audio generation service
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

const lambda = new LambdaClient({ region: 'us-east-2' })
await lambda.send(new InvokeCommand({
  FunctionName: 'audio-mixer',
  Payload: JSON.stringify({
    voiceUrl: 's3://bucket/voice.mp3',
    bgUrl: 's3://bucket/ocean-waves.mp3',
    outputKey: 'mixed/output.mp3',
    variant: 'sleep',
    voiceVolume: 0.3,
    bgVolume: 0.7
  })
}))
```

## Alternative: Use Existing Service

Consider using AWS Elemental MediaConvert instead of Lambda for:
- Better reliability
- Professional audio processing
- No FFmpeg setup needed

But Lambda is cheaper and simpler for this use case!
