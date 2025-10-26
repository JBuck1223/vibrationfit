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
      path: urlObj.pathname + (urlObj.search || ''),
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
      
      const folder = pathParts[2] // journal, vision-board, evidence, etc
      const processedFolder = pathParts[3] // uploads
      
      const processedUrl = `https://media.vibrationfit.com/${objectKey}`
      
      console.log('🔍 Folder detected:', folder)
      console.log('🔍 Will update to:', processedUrl)
      
      // Determine which table to update based on folder
      let tableName
      if (folder === 'journal') {
        tableName = 'journal_entries'
      } else if (folder === 'vision-board') {
        tableName = 'vision_board_items' // Adjust to actual table name
      } else if (folder === 'evidence') {
        tableName = 'evidence_items' // Adjust to actual table name
      } else {
        console.log(`⚠️ Unknown folder: ${folder}, defaulting to journal_entries`)
        tableName = 'journal_entries'
      }
      
      // Try to find URLs with common video extensions (.mov, .mp4, etc.)
      const possibleExtensions = ['', '.mov', '.mp4', '.avi', '.mkv', '.webm']
      const originalUrls = possibleExtensions.map(ext => 
        `https://media.vibrationfit.com/user-uploads/${userId}/${folder}/${processedFolder}/${baseFilename}${ext}`
      )
      
      console.log('🔍 Searching for entries with URLs:', originalUrls)
      
      // Query Supabase REST API for entries
      const searchUrl = `${SUPABASE_URL}/rest/v1/${tableName}?user_id=eq.${userId}&select=id,image_urls`
      
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
      
      // Find entries containing any of the possible original URLs and update them
      for (const entry of entries) {
        if (!entry.image_urls || !Array.isArray(entry.image_urls)) continue
        
        // Check if any of the possible URLs exist in the entry
        const matchingUrl = originalUrls.find(url => entry.image_urls.includes(url))
        if (!matchingUrl) {
          console.log('   No matching URL found in entry:', entry.id)
          continue
        }
        
        console.log(`   Found matching URL in entry ${entry.id}: ${matchingUrl}`)
        
        // Replace matching URL with processed URL
        const updatedUrls = entry.image_urls.map(url => 
          url === matchingUrl ? processedUrl : url
        )
        
        // Update via Supabase REST API
        const updateUrl = `${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${entry.id}`
        
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
          console.log(`✅ Successfully updated ${tableName} entry ${entry.id}`)
          
          // Also update the video_mapping table
          const originalS3Key = objectKey.replace('/processed/', '/').replace('-720p.mp4', '.mov')
          const mappingUrl = `${SUPABASE_URL}/rest/v1/video_mapping?original_s3_key=eq.${encodeURIComponent(originalS3Key)}`
          
          try {
            const mappingUpdate = await makeRequest(mappingUrl, {
              method: 'PATCH',
              headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                processed_s3_key: objectKey,
                processed_url: processedUrl,
                status: 'completed',
                updated_at: new Date().toISOString()
              })
            })
            console.log(`✅ Updated video_mapping`)
          } catch (mappingError) {
            console.log(`⚠️ Could not update video_mapping (might not exist yet):`, mappingError.message)
          }
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

