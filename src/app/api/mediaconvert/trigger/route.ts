// /src/app/api/mediaconvert/trigger/route.ts
// API endpoint to manually trigger MediaConvert jobs

import { NextRequest, NextResponse } from 'next/server'
import { MediaConvertClient, CreateJobCommand, AudioDefaultSelection } from '@aws-sdk/client-mediaconvert'

const mediaConvertClient = new MediaConvertClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inputKey, filename, userId, folder } = body
    
    if (!inputKey || !filename || !userId || !folder) {
      return NextResponse.json(
        { error: 'Missing required fields: inputKey, filename, userId, folder' },
        { status: 400 }
      )
    }

    console.log('🎬 Triggering MediaConvert job manually:', {
      inputKey,
      filename,
      userId,
      folder
    })

    const jobSettings = {
      Role: process.env.MEDIACONVERT_ROLE_ARN!,
      Settings: {
        Inputs: [{
          FileInput: `s3://${BUCKET_NAME}/${inputKey}`,
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
            Type: 'FILE_GROUP_SETTINGS',
            FileGroupSettings: {
              Destination: `s3://${BUCKET_NAME}/user-uploads/${userId}/${folder}/processed/`
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
    
    console.log('✅ MediaConvert job created:', response.Job?.Id)

    return NextResponse.json({
      success: true,
      jobId: response.Job?.Id,
      status: response.Job?.Status,
      inputKey,
      outputPath: `s3://${BUCKET_NAME}/user-uploads/${userId}/${folder}/processed/`,
      expectedOutput: `${filename.replace(/\.[^/.]+$/, '')}-compressed.mp4`
    })

  } catch (error) {
    console.error('❌ MediaConvert trigger failed:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'MediaConvert trigger failed',
        details: error
      },
      { status: 500 }
    )
  }
}
