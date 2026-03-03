import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      currentSituation,
      desiredVision,
      triedBefore,
      commitment,
      ableToInvest,
    } = body as {
      name: string
      email: string
      phone: string
      currentSituation: string
      desiredVision: string
      triedBefore: string
      commitment: string
      ableToInvest: string
    }

    if (!name || !email || !phone || !currentSituation || !desiredVision || !triedBefore || !commitment || !ableToInvest) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('premium_applications')
      .insert({
        name,
        email,
        phone,
        current_situation: currentSituation,
        desired_vision: desiredVision,
        tried_before: triedBefore,
        commitment_level: parseInt(commitment, 10),
        able_to_invest: ableToInvest === 'yes',
        status: 'pending',
      })

    if (error) {
      console.error('Failed to save premium application:', error)
      return NextResponse.json({ error: 'Failed to save application' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Premium application error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
