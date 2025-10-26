// Lambda function to update database when MediaConvert completes
const https = require('https');

const API_URL = 'https://vibrationfit.com/api/media/process-completed';

// Helper function to make HTTP request
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({ status: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

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
      
      console.log('📡 Calling API:', API_URL);
      console.log('📦 Payload:', payload);

      const response = await makeRequest(API_URL, payload);

      if (response.status === 200) {
        console.log('✅ Database updated successfully:', response.data);
      } else {
        console.error('❌ Failed to update database:', response.status, response.data);
      }

    } catch (error) {
      console.error('❌ Failed to update database:', error.message, error.stack);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Processed events' }) };
};

