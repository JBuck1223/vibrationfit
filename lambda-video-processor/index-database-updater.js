// Lambda function to update database when MediaConvert completes
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nxjhqibnlbwzzphewncj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Helper function to make HTTP request
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = responseData ? JSON.parse(responseData) : {};
          resolve({ status: res.statusCode, data });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
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
      
      // Extract filename and build URLs
      const filename = pathParts[pathParts.length - 1] // e.g., 1761510066424-3qh5ka3ik76-img-8912-720p.mp4
      const baseFilename = filename.replace('-720p.mp4', '') // e.g., 1761510066424-3qh5ka3ik76-img-8912
      
      const folder = pathParts[2] // journal
      const processedFolder = pathParts[3] // uploads
      
      const processedUrl = `https://media.vibrationfit.com/${objectKey}`
      const originalUrl = `https://media.vibrationfit.com/user-uploads/${userId}/${folder}/${processedFolder}/${baseFilename}`
      
      console.log('🔍 Searching for entry with URL:', originalUrl)
      console.log('🔍 Will update to:', processedUrl)
      
      // Query Supabase REST API for journal entries
      const searchUrl = `${SUPABASE_URL}/rest/v1/journal?user_id=eq.${userId}&select=id,image_urls`
      
      const searchResponse = await makeRequest(searchUrl, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (searchResponse.status !== 200 || !searchResponse.data) {
        console.error('❌ Failed to search journal entries:', searchResponse.status, searchResponse.data)
        continue
      }
      
      const entries = searchResponse.data
      console.log(`📝 Found ${entries.length} journal entries`)
      
      // Find entries containing the original URL and update them
      for (const entry of entries) {
        if (!entry.image_urls || !Array.isArray(entry.image_urls)) continue
        
        const hasOriginalUrl = entry.image_urls.includes(originalUrl)
        if (!hasOriginalUrl) continue
        
        // Replace original URL with processed URL
        const updatedUrls = entry.image_urls.map(url => 
          url === originalUrl ? processedUrl : url
        )
        
        // Update via Supabase REST API
        const updateUrl = `${SUPABASE_URL}/rest/v1/journal?id=eq.${entry.id}`
        
        const updateResponse = await makeRequest(updateUrl, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ image_urls: updatedUrls })
        })
        
        if (updateResponse.status === 204 || updateResponse.status === 200) {
          console.log(`✅ Successfully updated journal entry ${entry.id}`)
        } else {
          console.error(`❌ Failed to update entry ${entry.id}:`, updateResponse.status, updateResponse.data)
        }
      }

    } catch (error) {
      console.error('❌ Failed to update database:', error.message, error.stack);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Processed events' }) };
};

