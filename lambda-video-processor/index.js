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
    // Expected format: user-uploads/{userId}/{folder}/{filename}
    const pathParts = objectKey.split('/');
    if (pathParts.length < 3 || pathParts[0] !== 'user-uploads') {
      console.log('⚠️  Invalid path format:', objectKey);
      continue;
    }

    const userId = pathParts[1];
    const folder = pathParts[2];

    console.log(`🎬 Triggering MediaConvert for video:`, {
      userId,
      folder,
      objectKey
    });

    try {
      // Create MediaConvert job
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
          OutputGroups: [{
            Name: 'File Group',
            OutputGroupSettings: {
              Type: OutputGroupType.FILE_GROUP_SETTINGS,
              FileGroupSettings: {
                Destination: `s3://${BUCKET_NAME}/user-uploads/${userId}/${folder}/processed/`
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
                    Bitrate: 2000000, // 2Mbps
                    RateControlMode: 'CBR',
                    CodecProfile: 'MAIN',
                    CodecLevel: 'LEVEL_4_1',
                    MaxBitrate: 2500000,
                    BufSize: 3000000
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
          }]
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
      console.log('   Output path: user-uploads/' + userId + '/' + folder + '/processed/');

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

