import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('Test API: Route called successfully')
  return NextResponse.json({ message: 'Test API working', timestamp: new Date().toISOString() })
}
