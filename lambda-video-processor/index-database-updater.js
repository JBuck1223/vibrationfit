// Lambda function to update database when MediaConvert completes
const https = require('https');

const API_URL = 'https://vibrationfit.com/api/media/process-completed';

exports.handler = async (event) => {
  console.log('📹 S3 Processed Video Event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    if (record.eventSource !== 'aws:s3') continue;

    const bucketName = record.s3.bucket.name;
    const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    // Only process files in /processed/ folder
    if (!objectKey.includes('/processed/')) {
      console.log('⏭️ Skipping non-processed file:', objectKey);
      continue;
    }

    // Only process -720p.mp4 files
    if (!objectKey.endsWith('-720p.mp4')) {
      console.log('⏭️ Skipping non-processed file:', objectKey);
      continue;
    }

    console.log('🎬 Processing completed video:', objectKey);

    try {
      // Extract user ID from path
      const pathParts = objectKey.split('/');
      const userId = pathParts[1]; // user-uploads/[userId]/...

      // Call API to update journal entry
      const payload = JSON.stringify({ s3Key: objectKey, userId });
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload
      });

      if (response.ok) {
        console.log('✅ Database updated successfully');
      } else {
        console.error('❌ Failed to update database:', await response.text());
      }

    } catch (error) {
      console.error('❌ Failed to update database:', error);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Processed events' }) };
};

