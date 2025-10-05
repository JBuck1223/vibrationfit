import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('Profile API: Route called')
  
  try {
    return NextResponse.json({
      profile: {},
      completionPercentage: 0,
      message: 'Profile API working'
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('Profile API POST: Route called')
  
  try {
    return NextResponse.json({ 
      message: 'Profile API POST working',
      profile: {}
    })
  } catch (error) {
    console.error('Profile API POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}