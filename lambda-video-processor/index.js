// AWS Lambda function to automatically trigger MediaConvert when videos are uploaded to S3
// Also updates database when processed files are created
const { MediaConvertClient, CreateJobCommand } = require('@aws-sdk/client-mediaconvert');
const { AudioDefaultSelection, OutputGroupType, AacCodingMode } = require('@aws-sdk/client-mediaconvert');
const https = require('https');

// Configure MediaConvert client (use Lambda execution role)
const mediaConvertClient = new MediaConvertClient({
  region: process.env.AWS_REGION || 'us-east-2',
  endpoint: process.env.MEDIACONVERT_ENDPOINT,
});

const BUCKET_NAME = process.env.BUCKET_NAME || 'vibration-fit-client-storage';
const MEDIACONVERT_ROLE_ARN = process.env.MEDIACONVERT_ROLE_ARN;
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
  // Check for quality suffixes (order matters - check more specific first)
  if (filename.match(/-thumb/i) || filename.match(/-thumb\./i)) return 'thumb';
  if (filename.match(/-1080p/i)) return '1080p';
  if (filename.match(/-720p/i)) return '720p';
  if (filename.match(/-original/i)) return 'original';
  return null;
}

exports.handler = async (event) => {
  console.log('📹 S3 Event received:', JSON.stringify(event, null, 2));

  // Process each S3 event
  for (const record of event.Records) {
    if (record.eventSource !== 'aws:s3') continue;

    const bucketName = record.s3.bucket.name;
    const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`📁 Processing: s3://${bucketName}/${objectKey}`);

    // Check if this is a processed file - if so, update database
    if (objectKey.includes('/processed/')) {
      console.log('🎬 This is a processed file, updating database...');
      console.log('🔍 Object key:', objectKey);
      const quality = extractQuality(objectKey);
      console.log('🔍 Detected quality:', quality);
      await handleProcessedFile(objectKey);
      continue;
    }

    // Check if it's a video file or a processed file
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const isVideo = videoExtensions.some(ext => objectKey.toLowerCase().endsWith(ext));
    const isImage = imageExtensions.some(ext => objectKey.toLowerCase().endsWith(ext));
    const isProcessed = objectKey.includes('/processed/');

    // If it's a thumbnail or other processed file, let handleProcessedFile handle it above
    if (!isVideo && (isProcessed || isImage)) {
      console.log('⏭️  Skipping processed image/non-video file:', objectKey);
      continue;
    }
    
    // If it's not a video and not processed, skip it
    if (!isVideo) {
      console.log('⏭️  Skipping non-video file:', objectKey);
      continue;
    }

    // Extract user ID and folder from path
    // Expected format: user-uploads/{userId}/{folder}/{subfolder}/{filename}
    const pathParts = objectKey.split('/');
    if (pathParts.length < 3 || pathParts[0] !== 'user-uploads') {
      console.log('⚠️  Invalid path format:', objectKey);
      continue;
    }

    const userId = pathParts[1];
    const folder = pathParts[2];
    
    // Build destination path based on upload path
    // user-uploads/userId/journal/uploads/file.mov -> user-uploads/userId/journal/uploads/processed/
    const destinationPath = pathParts.slice(0, -1).join('/') + '/processed/';

    console.log(`🎬 Triggering MediaConvert for video:`, {
      userId,
      folder,
      objectKey,
      destinationPath
    });

    try {
      // Extract base filename without extension
      const filename = objectKey.split('/').pop()
      const baseName = filename.replace(/\.[^/.]+$/, '')
      
      // Create MediaConvert job with multiple outputs
      const jobSettings = {
        Role: MEDIACONVERT_ROLE_ARN,
        Settings: {
          Inputs: [{
            FileInput: `s3://${BUCKET_NAME}/${objectKey}`,
            VideoSelector: {},
            AudioSelectors: {
              'Audio Selector 1': {
                DefaultSelection: AudioDefaultSelection.DEFAULT
              }
            }
          }],
          OutputGroups: [
            // THUMBNAIL OUTPUT (processed first)
            {
              Name: 'Thumbnail Group',
              OutputGroupSettings: {
                Type: OutputGroupType.FILE_GROUP_SETTINGS,
                FileGroupSettings: {
                  Destination: `s3://${BUCKET_NAME}/${destinationPath}`,
                  CustomName: `${baseName}`
                }
              },
              Outputs: [{
                NameModifier: '-thumb',
                VideoDescription: {
                  Width: 1920,
                  Height: 1080,
                  CodecSettings: {
                    Codec: 'FRAME_CAPTURE',
                    FrameCaptureSettings: {
                      Quality: 90,
                      MaxCaptures: 1,
                      CaptureTimecode: '00:00:01:00'
                    }
                  }
                },
                ContainerSettings: {
                  Container: 'RAW'
                }
              }]
            },
            // ORIGINAL COMPRESSED OUTPUT
            {
              Name: 'File Group Original',
              OutputGroupSettings: {
                Type: OutputGroupType.FILE_GROUP_SETTINGS,
                FileGroupSettings: {
                  Destination: `s3://${BUCKET_NAME}/${destinationPath}`
                }
              },
              Outputs: [{
                NameModifier: '-original',
                VideoDescription: {
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      Bitrate: 8000000,
                      QualityTuningLevel: 'SINGLE_PASS_HQ',
                      RateControlMode: 'VBR',
                      CodecProfile: 'HIGH',
                      CodecLevel: 'AUTO',
                      MaxBitrate: 10000000,
                      BufSize: 15000000
                    }
                  }
                },
                AudioDescriptions: [{
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: {
                      Bitrate: 192000,
                      SampleRate: 48000,
                      CodingMode: AacCodingMode.CODING_MODE_2_0
                    }
                  }
                }],
                ContainerSettings: {
                  Container: 'MP4',
                  Mp4Settings: {
                    CslgAtom: 'INCLUDE',
                    FreeSpaceBox: 'EXCLUDE',
                    MoovPlacement: 'PROGRESSIVE_DOWNLOAD'
                  }
                }
              }]
            },
            // 1080p VIDEO OUTPUT
            {
              Name: 'File Group 1080p',
              OutputGroupSettings: {
                Type: OutputGroupType.FILE_GROUP_SETTINGS,
                FileGroupSettings: {
                  Destination: `s3://${BUCKET_NAME}/${destinationPath}`
                }
              },
              Outputs: [{
                NameModifier: '-1080p',
                VideoDescription: {
                  Width: 1920,
                  Height: 1080,
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      Bitrate: 5000000,
                      RateControlMode: 'VBR',
                      CodecProfile: 'HIGH',
                      CodecLevel: 'LEVEL_4_1',
                      MaxBitrate: 6000000,
                      BufSize: 7500000
                    }
                  }
                },
                AudioDescriptions: [{
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: {
                      Bitrate: 192000,
                      SampleRate: 48000,
                      CodingMode: AacCodingMode.CODING_MODE_2_0
                    }
                  }
                }],
                ContainerSettings: {
                  Container: 'MP4',
                  Mp4Settings: {
                    CslgAtom: 'INCLUDE',
                    FreeSpaceBox: 'EXCLUDE',
                    MoovPlacement: 'PROGRESSIVE_DOWNLOAD'
                  }
                }
              }]
            },
            // 720p VIDEO OUTPUT
            {
              Name: 'File Group 720p',
              OutputGroupSettings: {
                Type: OutputGroupType.FILE_GROUP_SETTINGS,
                FileGroupSettings: {
                  Destination: `s3://${BUCKET_NAME}/${destinationPath}`
                }
              },
              Outputs: [{
                NameModifier: '-720p',
                VideoDescription: {
                  Width: 1280,
                  Height: 720,
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      Bitrate: 2500000,
                      RateControlMode: 'VBR',
                      CodecProfile: 'MAIN',
                      CodecLevel: 'LEVEL_4',
                      MaxBitrate: 3000000,
                      BufSize: 3750000
                    }
                  }
                },
                AudioDescriptions: [{
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: {
                      Bitrate: 128000,
                      SampleRate: 48000,
                      CodingMode: AacCodingMode.CODING_MODE_2_0
                    }
                  }
                }],
                ContainerSettings: {
                  Container: 'MP4',
                  Mp4Settings: {
                    CslgAtom: 'INCLUDE',
                    FreeSpaceBox: 'EXCLUDE',
                    MoovPlacement: 'PROGRESSIVE_DOWNLOAD'
                  }
                }
              }]
            }
          ],
          TimecodeConfig: {
            Source: 'ZEROBASED'
          }
        },
        Tags: {
          'user-id': userId,
          'folder': folder,
          'original-filename': objectKey.split('/').pop()
        }
      };

      const command = new CreateJobCommand(jobSettings);
      const response = await mediaConvertClient.send(command);

      console.log('✅ MediaConvert job created:', response.Job?.Id);
      console.log('   Status:', response.Job?.Status);
      console.log('   Outputs: Thumbnail, Original, 1080p, 720p');
      console.log('   Output path:', destinationPath);

    } catch (error) {
      console.error('❌ MediaConvert job failed:', error);
      // Don't throw - we don't want to block the S3 event
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Processed S3 events' })
  };
};

// Handle processed files - update database
async function handleProcessedFile(objectKey) {
  // Extract quality type
  const quality = extractQuality(objectKey);
  if (!quality) {
    console.log('⏭️ Skipping unrecognized output:', objectKey);
    return;
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
      // Handle MediaConvert thumbnail naming: remove .0000000.jpg suffix and -thumb prefix
      baseFilename = filename.replace(/-thumb\.\d+\.(jpg|png|webp)$/i, '').replace(/\.(jpg|png|webp)$/i, '')
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
    
    // Handle thumbnails
    if (quality === 'thumb') {
      // Try to find URLs with common video extensions (.mov, .mp4, etc.) and 1080p
      const possibleExtensions = ['', '.mov', '.mp4', '.avi', '.mkv', '.webm']
      const originalUrls = possibleExtensions.map(ext => 
        `https://media.vibrationfit.com/user-uploads/${userId}/${folder}/${subfolder}/${baseFilename}${ext}`
      )
      
      // Also check for 1080p video URL (which may have already replaced the original)
      const videoUrls = [
        ...originalUrls,
        `https://media.vibrationfit.com/user-uploads/${userId}/${folder}/${subfolder}/processed/${baseFilename}-1080p.mp4`,
        `https://media.vibrationfit.com/${objectKey.replace('-thumb.0000000.jpg', '-1080p.mp4')}`
      ]
      
      console.log('🔍 Searching for entries with URLs for thumbnail:', videoUrls)
      
      // Query Supabase REST API for entries
      const searchUrl = `${SUPABASE_URL}/rest/v1/${tableName}?user_id=eq.${userId}&select=id,image_urls,thumbnail_urls`
      
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
        return
      }
      
      const entries = searchResponse.data
      console.log(`📝 Found ${entries.length} entries`)
      
      // Find entries containing any of the possible video URLs and update thumbnails
      for (const entry of entries) {
        if (!entry.image_urls || !Array.isArray(entry.image_urls)) continue
        
        // Check if any of the possible video URLs exist in the entry
        const matchingUrl = videoUrls.find(url => entry.image_urls.includes(url))
        if (!matchingUrl) {
          console.log('   No matching URL found in entry:', entry.id)
          continue
        }
        
        console.log(`   Found matching URL in entry ${entry.id}: ${matchingUrl}`)
        
        // Update thumbnail_urls (add to array if exists, create if doesn't)
        const currentThumbnails = entry.thumbnail_urls || []
        const updatedThumbnails = [...currentThumbnails]
        
        // Add thumbnail URL if it doesn't exist already
        if (!updatedThumbnails.includes(processedUrl)) {
          updatedThumbnails.push(processedUrl)
        }
        
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
          body: JSON.stringify({ thumbnail_urls: updatedThumbnails })
        })
        
        if (updateResponse.status === 204 || updateResponse.status === 200) {
          console.log(`✅ Successfully updated thumbnail_urls for entry ${entry.id}`)
        } else {
          console.error(`❌ Failed to update entry ${entry.id}:`, updateResponse.status, updateResponse.data)
        }
      }
    }
    
    // Only update database for 1080p files
    if (quality === '1080p') {
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
        return
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
  } catch (error) {
    console.error('❌ Failed to update database:', error.message, error.stack);
  }
}

