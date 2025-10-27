// /src/app/api/mediaconvert/trigger/route.ts
// API endpoint to manually trigger MediaConvert jobs

import { NextRequest, NextResponse } from 'next/server'
import { MediaConvertClient, CreateJobCommand, AudioDefaultSelection, OutputGroupType, AacCodingMode } from '@aws-sdk/client-mediaconvert'

const mediaConvertClient = new MediaConvertClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.MEDIACONVERT_ENDPOINT, // Required for MediaConvert
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

    // Extract base filename without extension
    const baseName = filename.replace(/\.[^/.]+$/, '')

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
        OutputGroups: [
          // THUMBNAIL OUTPUT (processed first)
          {
            Name: 'Thumbnail Group',
            OutputGroupSettings: {
              Type: OutputGroupType.FILE_GROUP_SETTINGS,
              FileGroupSettings: {
                Destination: `s3://${BUCKET_NAME}/user-uploads/${userId}/${folder}/processed/`,
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
                    CaptureTimecode: '00:00:01:00' // 1 second timestamp
                  }
                }
              },
              ContainerSettings: {
                Container: 'RAW'
              }
            }]
          },
          // ORIGINAL COMPRESSED OUTPUT (MP4, source quality)
          {
            Name: 'File Group Original',
            OutputGroupSettings: {
              Type: OutputGroupType.FILE_GROUP_SETTINGS,
              FileGroupSettings: {
                Destination: `s3://${BUCKET_NAME}/user-uploads/${userId}/${folder}/processed/`
              }
            },
            Outputs: [{
              NameModifier: '-original',
              VideoDescription: {
                CodecSettings: {
                  Codec: 'H_264',
                  H264Settings: {
                    QualityTuningLevel: 'SINGLE_PASS_HQ',
                    RateControlMode: 'QVBR',
                    QvbrSettings: {
                      QvbrQualityLevel: 8 // High quality, balances size/quality
                    },
                    CodecProfile: 'HIGH',
                    CodecLevel: 'AUTO'
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
                Destination: `s3://${BUCKET_NAME}/user-uploads/${userId}/${folder}/processed/`
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
                    Bitrate: 5000000, // 5Mbps for high quality 1080p
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
                    Bitrate: 2500000, // 2.5Mbps for 720p
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
        'original-filename': filename
      }
    }

    const command = new CreateJobCommand(jobSettings as any)
    const response = await mediaConvertClient.send(command)
    
    console.log('✅ MediaConvert job created:', response.Job?.Id)

    return NextResponse.json({
      success: true,
      jobId: response.Job?.Id,
      status: response.Job?.Status,
      inputKey,
      outputPath: `s3://${BUCKET_NAME}/user-uploads/${userId}/${folder}/processed/`,
      expectedOutputs: {
        thumbnail: `${baseName}-thumb`,
        original: `${baseName}-original.mp4`,
        video1080p: `${baseName}-1080p.mp4`,
        video720p: `${baseName}-720p.mp4`
      }
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
