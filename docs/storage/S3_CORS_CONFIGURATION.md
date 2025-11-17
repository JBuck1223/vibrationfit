# S3 CORS Configuration for VibrationFit Uploads

**Last Updated: November 17, 2024**

## Problem: 405 Method Not Allowed Errors

When uploading files (especially images >4MB), you may see **405 errors**. This happens because:

1. Files larger than 25MB use **presigned URLs** to upload directly to S3 from the browser
2. The browser makes a **PUT request** to S3
3. S3 blocks the request if CORS (Cross-Origin Resource Sharing) isn't configured properly

## Solution: Configure S3 Bucket CORS

### Step 1: Access S3 Bucket Settings

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Find and click on bucket: `vibration-fit-client-storage`
3. Click the **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)** section
5. Click **Edit**

### Step 2: Add CORS Configuration

Replace the existing CORS configuration with this:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://vibrationfit.com",
            "https://www.vibrationfit.com",
            "https://*.vercel.app"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3600
    }
]
```

### Step 3: Save and Test

1. Click **Save changes**
2. Wait 1-2 minutes for changes to propagate
3. Test file upload in journal or vision board

## What This CORS Configuration Does

| Setting | Purpose |
|---------|---------|
| **AllowedHeaders: `["*"]`** | Allows all headers (needed for Content-Type, auth headers) |
| **AllowedMethods: PUT** | Critical! Allows browser to upload directly to S3 |
| **AllowedOrigins** | Your frontend domains (localhost + production) |
| **ExposeHeaders: ETag** | Allows browser to read upload confirmation headers |
| **MaxAgeSeconds: 3600** | Caches CORS preflight for 1 hour (reduces OPTIONS requests) |

## Upload Flow Explanation

### Small Files (<25MB)
```
Browser → /api/upload → API optimizes → S3
```
✅ No CORS issues (server-to-server)

### Large Files (>25MB)
```
Browser → /api/upload/presigned → Get presigned URL
Browser → PUT directly to S3 → Upload file
```
⚠️ Requires CORS configuration!

## Fallback Mechanism

The upload system now includes automatic fallback:

1. **Try presigned URL upload** (fast, direct to S3)
2. **If 405 error detected** → Automatically fallback to API route
3. **API route upload** (slower but always works)

This means uploads will still work even without CORS, but:
- ❌ Slower (data goes through Vercel)
- ❌ Higher Vercel bandwidth usage
- ❌ Subject to Vercel timeout limits

## Troubleshooting

### Still Getting 405 Errors?

**Check 1: Correct Bucket**
```bash
# Make sure you're editing the right bucket
echo $AWS_S3_BUCKET  # Should be: vibration-fit-client-storage
```

**Check 2: Wait for Propagation**
- CORS changes can take 1-2 minutes to apply
- Try clearing browser cache
- Try in incognito/private window

**Check 3: Verify Origins**
```bash
# Check your app is running on allowed origin
echo $NEXT_PUBLIC_APP_URL
```

**Check 4: Check Browser Console**
```javascript
// Look for CORS errors in browser console
// Should NOT see: "Access-Control-Allow-Origin" errors
```

### Testing CORS Configuration

Use this curl command to test CORS:

```bash
# Replace with your actual bucket URL
curl -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://vibration-fit-client-storage.s3.us-east-2.amazonaws.com/test
```

Should return:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD
```

## Production Checklist

Before going live, verify:

- [ ] CORS configuration includes production domain
- [ ] Test upload from production URL
- [ ] Check CloudFront (if using) allows PUT/POST methods
- [ ] Verify presigned URLs expire (default: 1 hour)
- [ ] Monitor CloudWatch for S3 403/405 errors

## Additional Security

### Bucket Policy for User Uploads

Ensure your bucket policy allows uploads only to `user-uploads/` prefix:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:role/VibrationFitUploadRole"
            },
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::vibration-fit-client-storage/user-uploads/*"
        }
    ]
}
```

### CloudFront Configuration (if applicable)

If using CloudFront CDN:

1. Go to CloudFront distribution settings
2. Under **Behaviors**, edit the default behavior
3. **Allowed HTTP Methods**: Choose "GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE"
4. **Cache Based on Selected Request Headers**: Choose "Whitelist"
5. Add these headers:
   - `Origin`
   - `Access-Control-Request-Headers`
   - `Access-Control-Request-Method`

## Code Changes Made

The following improvements were added to handle 405 errors:

### 1. Better Error Detection
```typescript
if (response.status === 405) {
  console.error('❌ 405 Method Not Allowed from S3')
  throw new Error('S3 upload blocked (405). Attempting fallback...')
}
```

### 2. Automatic Fallback
```typescript
if (error.message.includes('405')) {
  console.log('🔄 Attempting fallback to API route upload...')
  return await uploadViaApiRoute(folder, file, userId, onProgress)
}
```

### 3. Increased Presigned Threshold
```typescript
const PRESIGNED_THRESHOLD = 25 * 1024 * 1024 // 25MB (was 4MB)
```

This means fewer files use presigned URLs, reducing CORS-related errors.

### 4. CORS Mode Explicitly Set
```typescript
const response = await fetch(uploadUrl, {
  method: 'PUT',
  body: fileClone,
  headers: {
    'Content-Type': file.type,
  },
  mode: 'cors', // ← Explicitly set
})
```

## Summary

**Quick Fix**: Add the CORS configuration above to your S3 bucket's Permissions → CORS section.

**Why**: Browser security requires explicit permission for PUT requests to different domains (S3).

**Backup**: The code now automatically falls back to API route if CORS fails, so uploads continue to work.

## Need Help?

If uploads still fail after configuring CORS:

1. Check browser console for specific error messages
2. Verify AWS credentials in `.env.local`
3. Confirm S3 bucket name matches `BUCKET_NAME` in code
4. Test with smaller files first (<5MB)
5. Check Vercel deployment logs for server-side errors

---

**Related Docs:**
- [AWS S3 CORS Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
- [Presigned URL Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

