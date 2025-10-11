// /src/app/api/referral/generate/route.ts
// Generate or get user's referral code

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing referral code
    let { data: referral, error } = await supabase
      .from('user_referrals')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If no referral code exists, create one
    if (!referral) {
      // Get user's first name from profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name')
        .eq('user_id', user.id)
        .single()

      // Generate code
      const firstName = profile?.first_name || 'user'
      const baseCode = firstName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10)
      let finalCode = baseCode
      let counter = 0

      // Ensure uniqueness
      while (counter < 100) {
        const { data: existing } = await supabase
          .from('user_referrals')
          .select('referral_code')
          .eq('referral_code', finalCode)
          .single()

        if (!existing) break

        finalCode = `${baseCode}${Math.floor(Math.random() * 10000)}`
        counter++
      }

      // Insert new referral code
      const { data: newReferral, error: insertError } = await supabase
        .from('user_referrals')
        .insert({
          user_id: user.id,
          referral_code: finalCode,
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 })
      }

      referral = newReferral
    }

    // Get stats
    const { data: stats } = await supabase
      .from('referral_clicks')
      .select('converted')
      .eq('referrer_id', user.id)

    const totalClicks = stats?.length || 0
    const conversions = stats?.filter(s => s.converted).length || 0

    return NextResponse.json({
      referralCode: referral.referral_code,
      referralLink: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?ref=${referral.referral_code}`,
      stats: {
        totalClicks,
        conversions,
        totalReferrals: referral.total_referrals,
        successfulConversions: referral.successful_conversions,
      },
    })

  } catch (error) {
    console.error('Referral generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

