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

// Extract quality suffix from filename
function extractQuality(filename) {
  if (filename.includes('-thumb')) return 'thumb';
  if (filename.includes('-original')) return 'original';
  if (filename.includes('-1080p')) return '1080p';
  if (filename.includes('-720p')) return '720p';
  return null;
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

    // Extract quality type
    const quality = extractQuality(objectKey);
    if (!quality) {
      console.log('⏭️ Skipping unrecognized output:', objectKey);
      continue;
    }

    console.log(`🎬 Processing ${quality} file:`, objectKey);

    try {
          // Extract user ID from path
    const pathParts = objectKey.split('/');
    const userId = pathParts[1]; // user-uploads/[userId]/journal/uploads/processed/file.mp4
      
      // Extract filename and base name  
      const filename = pathParts[pathParts.length - 1]
      
      // Remove all quality suffixes to get base filename
      let baseFilename = filename
      
      // Remove quality suffixes from filename
      if (quality === 'thumb') {
        baseFilename = filename.replace(/\.(jpg|png|webp)$/i, '')
      } else if (quality === 'original') {
        baseFilename = filename.replace(/-original\.(mp4|mov)$/i, '')
      } else if (quality === '1080p') {
        baseFilename = filename.replace(/-1080p\.mp4$/i, '')
      } else if (quality === '720p') {
        baseFilename = filename.replace(/-720p\.mp4$/i, '')
      }
      
      const folder = pathParts[2] // journal, vision-board, evidence, etc
      const subfolder = pathParts[3] // uploads (or processed in some cases)
      
      const processedUrl = `https://media.vibrationfit.com/${objectKey}`
      
      console.log(`🔍 Quality: ${quality}`)
      console.log('🔍 Folder detected:', folder)
      console.log('🔍 Base filename:', baseFilename)
      console.log('🔍 Processed URL:', processedUrl)
      
      // Determine which table to update based on folder
      let tableName
      if (folder === 'journal') {
        tableName = 'journal_entries'
      } else if (folder === 'vision-board') {
        tableName = 'vision_board_items'
      } else if (folder === 'evidence') {
        tableName = 'evidence_items'
      } else {
        console.log(`⚠️ Unknown folder: ${folder}, defaulting to journal_entries`)
        tableName = 'journal_entries'
      }
      
      // Handle different quality outputs
      
      if (quality === 'thumb') {
        // Store thumbnail URL in thumbnail_urls
        const possibleExtensions = ['', '.mov', '.mp4', '.avi', '.mkv', '.webm']
        const originalUrls = possibleExtensions.map(ext => 
          `https://media.vibrationfit.com/user-uploads/${userId}/${folder}/${subfolder}/${baseFilename}${ext}`
        )
        
        console.log('🔍 Searching for entries with URLs:', originalUrls)
        
        const searchUrl = `${SUPABASE_URL}/rest/v1/${tableName}?user_id=eq.${userId}&select=id,thumbnail_urls`
        
        const searchResponse = await makeRequest(searchUrl, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (searchResponse.status === 200 && searchResponse.data) {
          for (const entry of searchResponse.data) {
            if (!entry.thumbnail_urls || !Array.isArray(entry.thumbnail_urls)) continue
            
            const matchingUrl = originalUrls.find(url => entry.thumbnail_urls.includes(url))
            if (!matchingUrl) continue
            
            console.log(`   Found matching URL in entry ${entry.id}: ${matchingUrl}`)
            
            // Replace matching URL with thumbnail URL
            const updatedThumbnails = entry.thumbnail_urls.map(url => 
              url === matchingUrl ? processedUrl : url
            )
            
            const updateUrl = `${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${entry.id}`
            
            const updateResponse = await makeRequest(updateUrl, {
              method: 'PATCH',
              headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({ thumbnail_urls: updatedThumbnails })
            })
            
            if (updateResponse.status === 204 || updateResponse.status === 200) {
              console.log(`✅ Successfully updated thumbnail for entry ${entry.id}`)
            }
          }
        }
      } else if (quality === '1080p') {
        // Try to find URLs with common video extensions (.mov, .mp4, etc.)
        const possibleExtensions = ['', '.mov', '.mp4', '.avi', '.mkv', '.webm']
        const originalUrls = possibleExtensions.map(ext => 
          `https://media.vibrationfit.com/user-uploads/${userId}/${folder}/${subfolder}/${baseFilename}${ext}`
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
          console.error('❌ Failed to search entries:', searchResponse.status, searchResponse.data)
          continue
        }
        
        const entries = searchResponse.data
        console.log(`📝 Found ${entries.length} entries`)
        
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
            console.log(`✅ Successfully updated ${tableName} entry ${entry.id} with ${quality} video`)
          } else {
            console.error(`❌ Failed to update entry ${entry.id}:`, updateResponse.status, updateResponse.data)
          }
        }
      }
      
      // Update video_mapping table for any quality
      const originalS3Key = objectKey.replace('/processed/', '/').replace(`-${quality}.mp4`, '.mov').replace(`-${quality}`, '')
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
            [`processed_${quality}_url`]: processedUrl,
            [`processed_${quality}_s3_key`]: objectKey,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
        })
        console.log(`✅ Updated video_mapping for ${quality}`)
      } catch (mappingError) {
        console.log(`⚠️ Could not update video_mapping:`, mappingError.message)
      }

    } catch (error) {
      console.error('❌ Failed to update database:', error.message, error.stack);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Processed events' }) };
};

