// Process the uploaded video using MediaConvert
import { MediaConvertClient, CreateJobCommand } from '@aws-sdk/client-mediaconvert'

const mediaConvertClient = new MediaConvertClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const userId = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
const inputKey = 'user-uploads/720adebb-e6c0-4f6c-a5fc-164d128e083a/journal/uploads/1761408357222-h5zd1mep6le-oliver-test.mov'
const filename = 'oliver-test.mov'

async function processVideo() {
  try {
    console.log('🎬 Starting MediaConvert job for:', filename)
    console.log('📁 Input S3 path:', `s3://${BUCKET_NAME}/${inputKey}`)
    
    const jobSettings = {
      Role: process.env.MEDIACONVERT_ROLE_ARN,
      Settings: {
        Inputs: [{
          FileInput: `s3://${BUCKET_NAME}/${inputKey}`,
          VideoSelector: {},
          AudioSelectors: {
            'Audio Selector 1': {
              DefaultSelection: 'DEFAULT'
            }
          }
        }],
        OutputGroups: [{
          Name: 'File Group',
          OutputGroupSettings: {
            Type: 'FILE_GROUP_SETTINGS',
            FileGroupSettings: {
              Destination: `s3://${BUCKET_NAME}/user-uploads/${userId}/journal/uploads/processed/`
            }
          },
          Outputs: [{
            NameModifier: '-compressed',
            VideoDescription: {
              Width: 1920,
              Height: 1080,
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
                  CodingMode: 'CODING_MODE_2_0'
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
      }
    }

    const command = new CreateJobCommand(jobSettings)
    const response = await mediaConvertClient.send(command)
    
    console.log('✅ MediaConvert job created successfully!')
    console.log('🆔 Job ID:', response.Job?.Id)
    console.log('📊 Job Status:', response.Job?.Status)
    console.log('📁 Output will be at:', `s3://${BUCKET_NAME}/user-uploads/${userId}/journal/uploads/processed/`)
    console.log('🔗 Expected output file:', `oliver-test-compressed.mp4`)
    
    return {
      jobId: response.Job?.Id,
      status: response.Job?.Status,
      outputPath: `s3://${BUCKET_NAME}/user-uploads/${userId}/journal/uploads/processed/`
    }
    
  } catch (error) {
    console.error('❌ MediaConvert job failed:', error)
    throw error
  }
}

// Run the processing
processVideo()
  .then(result => {
    console.log('🎉 Video processing started!')
    console.log('Job ID:', result.jobId)
    console.log('Check status with: curl "http://localhost:3000/api/upload/mediaconvert-status?jobId=' + result.jobId + '"')
  })
  .catch(error => {
    console.error('💥 Failed to start video processing:', error.message)
    process.exit(1)
  })
