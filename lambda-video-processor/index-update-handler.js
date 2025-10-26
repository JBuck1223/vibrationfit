// Lambda handler for when MediaConvert outputs processed videos
const https = require('https');

const API_URL = 'https://vibrationfit.com/api/media/process-completed';

exports.handler = async (event) => {
  console.log('📹 S3 Processed Video Event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    if (record.eventSource !== 'aws:s3') continue;

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
      
      await new Promise((resolve, reject) => {
        const url = new URL(API_URL);
        const options = {
          hostname: url.hostname,
          port: 443,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log('✅ API response:', res.statusCode, data);
            resolve(data);
          });
        });

        req.on('error', (error) => {
          console.error('❌ API request failed:', error);
          reject(error);
        });

        req.write(payload);
        req.end();
      });

    } catch (error) {
      console.error('❌ Failed to process completed video:', error);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Processed events' }) };
};
