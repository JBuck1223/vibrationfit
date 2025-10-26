# 🔍 Lambda Testing Summary

## Issue Found
MediaConvert returned `403 Forbidden` when Lambda tried to create a job.

## Fix Applied
Added MediaConvert permissions to Lambda role:
- Policy: `MediaConvertAccess`
- Permissions: `mediaconvert:CreateJob`, `mediaconvert:GetJob`, `mediaconvert:ListJobs`

## Next Steps
Upload a video via the journal page to test the trigger. Lambda should now have permissions to create MediaConvert jobs.

## How to Test
1. Go to `/journal/new`
2. Upload a `.mov` file (even small test file)
3. File should land in S3
4. Lambda should trigger automatically
5. Check MediaConvert console for new job
6. Job should create `-720p.mp4` in `/processed/` folder

