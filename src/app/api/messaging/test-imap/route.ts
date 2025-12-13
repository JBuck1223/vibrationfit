// Test IMAP connection
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Imap from 'imap'

export async function GET() {
  return new Promise((resolve) => {
    console.log('🔍 Testing IMAP connection...')
    console.log('IMAP_HOST:', process.env.IMAP_HOST)
    console.log('IMAP_PORT:', process.env.IMAP_PORT)
    console.log('IMAP_USER:', process.env.IMAP_USER)
    console.log('IMAP_PASSWORD:', process.env.IMAP_PASSWORD ? '***SET***' : '***NOT SET***')

    if (!process.env.IMAP_HOST || !process.env.IMAP_USER || !process.env.IMAP_PASSWORD) {
      return resolve(NextResponse.json({
        success: false,
        error: 'IMAP credentials not configured in .env.local'
      }, { status: 500 }))
    }

    const imap = new Imap({
      user: process.env.IMAP_USER!,
      password: process.env.IMAP_PASSWORD!,
      host: process.env.IMAP_HOST!,
      port: parseInt(process.env.IMAP_PORT || '993'),
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    })

    imap.once('ready', () => {
      console.log('✅ IMAP connection successful!')
      imap.end()
      resolve(NextResponse.json({
        success: true,
        message: 'IMAP connection successful',
        host: process.env.IMAP_HOST,
        user: process.env.IMAP_USER,
      }))
    })

    imap.once('error', (err: any) => {
      console.error('❌ IMAP connection error:', err.message)
      resolve(NextResponse.json({
        success: false,
        error: err.message
      }, { status: 500 }))
    })

    imap.connect()
  })
}

