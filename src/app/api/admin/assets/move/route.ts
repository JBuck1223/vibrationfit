import { NextResponse } from 'next/server'
import { S3Client, CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const SITE_ASSETS_PREFIX = 'site-assets/'

export async function POST(request: Request) {
  try {
    const { fileKeys, targetFolder } = await request.json()

    if (!fileKeys || !Array.isArray(fileKeys) || fileKeys.length === 0) {
      return NextResponse.json(
        { error: 'No files provided', message: 'fileKeys must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!targetFolder) {
      return NextResponse.json(
        { error: 'No target folder provided', message: 'targetFolder is required' },
        { status: 400 }
      )
    }

    const moved: string[] = []
    const errors: string[] = []

    for (const fileKey of fileKeys) {
      try {
        const fileName = fileKey.split('/').pop()
        if (!fileName) {
          errors.push(`Invalid file key: ${fileKey}`)
          continue
        }

        const hasExtension = /\.\w+$/.test(fileName)
        const isGroupedVideoKey = !hasExtension

        if (isGroupedVideoKey) {
          // This is a synthetic base key from variant grouping (e.g. "site-assets/video/intensive/tracking").
          // No actual S3 object exists at this key -- list and move all variant files by prefix.
          const listResponse = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: BUCKET_NAME,
              Prefix: `${fileKey}-`,
            })
          )

          const variants = listResponse.Contents || []
          if (variants.length === 0) {
            errors.push(`No variant files found for: ${fileKey}`)
            continue
          }

          let movedAny = false
          for (const obj of variants) {
            if (!obj.Key) continue
            const variantFileName = obj.Key.split('/').pop()
            if (!variantFileName) continue

            const newVariantKey = `${SITE_ASSETS_PREFIX}${targetFolder}/${variantFileName}`
            if (obj.Key === newVariantKey) continue

            try {
              await s3Client.send(
                new CopyObjectCommand({
                  Bucket: BUCKET_NAME,
                  CopySource: `${BUCKET_NAME}/${obj.Key}`,
                  Key: newVariantKey,
                })
              )
              await s3Client.send(
                new DeleteObjectCommand({
                  Bucket: BUCKET_NAME,
                  Key: obj.Key,
                })
              )
              movedAny = true
            } catch (variantError) {
              console.error(`Error moving variant ${obj.Key}:`, variantError)
            }
          }

          if (movedAny) moved.push(fileKey)
        } else {
          // Regular file with an extension -- move directly
          const newKey = `${SITE_ASSETS_PREFIX}${targetFolder}/${fileName}`

          if (fileKey === newKey) {
            errors.push(`File already in target folder: ${fileName}`)
            continue
          }

          await s3Client.send(
            new CopyObjectCommand({
              Bucket: BUCKET_NAME,
              CopySource: `${BUCKET_NAME}/${fileKey}`,
              Key: newKey,
            })
          )

          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: fileKey,
            })
          )

          moved.push(fileKey)

          // If this is a video file, also move its variants
          if (fileKey.match(/\.(mp4|webm|mov|avi)$/i)) {
            const baseNameMatch = fileName.match(/^(.+?)-(?:original|1080p|720p|thumb)(?:\.\d+)?\.\w+$/)
            if (baseNameMatch) {
              const baseName = baseNameMatch[1]
              const fileDir = fileKey.substring(0, fileKey.lastIndexOf('/'))

              const listResponse = await s3Client.send(
                new ListObjectsV2Command({
                  Bucket: BUCKET_NAME,
                  Prefix: `${fileDir}/${baseName}-`,
                })
              )

              if (listResponse.Contents) {
                for (const obj of listResponse.Contents) {
                  if (obj.Key && obj.Key !== fileKey) {
                    const variantFileName = obj.Key.split('/').pop()
                    if (variantFileName) {
                      const newVariantKey = `${SITE_ASSETS_PREFIX}${targetFolder}/${variantFileName}`
                      try {
                        await s3Client.send(
                          new CopyObjectCommand({
                            Bucket: BUCKET_NAME,
                            CopySource: `${BUCKET_NAME}/${obj.Key}`,
                            Key: newVariantKey,
                          })
                        )
                        await s3Client.send(
                          new DeleteObjectCommand({
                            Bucket: BUCKET_NAME,
                            Key: obj.Key,
                          })
                        )
                      } catch (variantError) {
                        console.error(`Error moving variant ${obj.Key}:`, variantError)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error moving file ${fileKey}:`, error)
        errors.push(`${fileKey}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (moved.length === 0) {
      return NextResponse.json(
        {
          error: 'No files were moved',
          message: 'All file move operations failed',
          errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      movedCount: moved.length,
      moved,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Move files error:', error)
    return NextResponse.json(
      {
        error: 'Failed to move files',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

