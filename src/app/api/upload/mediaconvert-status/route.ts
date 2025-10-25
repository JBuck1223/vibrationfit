import { NextRequest, NextResponse } from 'next/server'
import { MediaConvertClient, GetJobCommand } from '@aws-sdk/client-mediaconvert'

const mediaConvertClient = new MediaConvertClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    const command = new GetJobCommand({ Id: jobId })
    const response = await mediaConvertClient.send(command)
    
    const job = response.Job
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Extract output URLs from job
    const outputs = job.OutputGroupDetails?.[0]?.OutputDetails?.map(output => ({
      url: (output as any).OutputFileUri || (output as any).OutputFilePaths?.[0] || '',
      status: (output as any).Status || 'Unknown'
    })) || []

    return NextResponse.json({
      jobId: job.Id,
      status: job.Status,
      progress: (job as any).JobPercentComplete || 0,
      outputs: outputs,
      createdAt: (job as any).CreatedAt,
      completedAt: (job as any).CompletedAt,
      errorMessage: (job as any).ErrorMessage
    })

  } catch (error) {
    console.error('MediaConvert status check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    )
  }
}
