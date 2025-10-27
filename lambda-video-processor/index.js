// AWS Lambda function to automatically trigger MediaConvert when videos are uploaded to S3
const { MediaConvertClient, CreateJobCommand } = require('@aws-sdk/client-mediaconvert');
const { AudioDefaultSelection, OutputGroupType, AacCodingMode } = require('@aws-sdk/client-mediaconvert');

// Configure MediaConvert client (use Lambda execution role)
const mediaConvertClient = new MediaConvertClient({
  region: process.env.AWS_REGION || 'us-east-2',
  endpoint: process.env.MEDIACONVERT_ENDPOINT,
});

const BUCKET_NAME = process.env.BUCKET_NAME || 'vibration-fit-client-storage';
const MEDIACONVERT_ROLE_ARN = process.env.MEDIACONVERT_ROLE_ARN;

exports.handler = async (event) => {
  console.log('📹 S3 Event received:', JSON.stringify(event, null, 2));

  // Process each S3 event
  for (const record of event.Records) {
    if (record.eventSource !== 'aws:s3') continue;

    const bucketName = record.s3.bucket.name;
    const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`📁 Processing: s3://${bucketName}/${objectKey}`);

    // Check if it's a video file
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const isVideo = videoExtensions.some(ext => objectKey.toLowerCase().endsWith(ext));

    if (!isVideo) {
      console.log('⏭️  Skipping non-video file:', objectKey);
      continue;
    }

    // Check if it's already processed (avoid recursive triggers)
    if (objectKey.includes('/processed/')) {
      console.log('⏭️  Skipping processed file:', objectKey);
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

