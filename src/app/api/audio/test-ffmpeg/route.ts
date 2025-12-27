import { NextResponse } from 'next/server'
import { spawn } from 'child_process'

export async function GET() {
  try {
    // Test if FFmpeg is available
    const ffmpeg = spawn('ffmpeg', ['-version'])
    
    let output = ''
    let error = ''
    
    ffmpeg.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    ffmpeg.stderr.on('data', (data) => {
      error += data.toString()
    })
    
    const exitCode = await new Promise((resolve) => {
      ffmpeg.on('close', resolve)
    })
    
    if (exitCode === 0) {
      return NextResponse.json({
        success: true,
        message: 'FFmpeg is available!',
        version: output.split('\n')[0],
        fullOutput: output
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'FFmpeg found but returned error',
        error,
        exitCode
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'FFmpeg not found on server',
      error: error.message,
      help: 'Install FFmpeg: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)'
    }, { status: 500 })
  }
}

