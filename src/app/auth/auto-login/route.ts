import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')
    let email = searchParams.get('email')

    // Always fetch email from Stripe session for reliability
    if (sessionId) {
      console.log('Fetching email from Stripe session:', sessionId)
      
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-09-30.clover',
      })
      
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        email = session.customer_details?.email || session.customer_email
        console.log('Retrieved email from Stripe session:', email)
      } catch (error) {
        console.error('Error fetching Stripe session:', error)
      }
    }
    
    if (!email) {
      console.error('No email found')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Use service role client for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Generate a one-time access token for this user
    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (magicLinkError || !magicLinkData) {
      console.error('Error generating auto-login link:', magicLinkError)
      return NextResponse.redirect(new URL('/intensive/check-email?email=' + email, request.url))
    }

    // Extract the hashed token from the magic link
    const actionLink = magicLinkData.properties.action_link
    const actionUrl = new URL(actionLink)
    const token = actionUrl.searchParams.get('token')
    const type = actionUrl.searchParams.get('type')
    
    console.log('Generated magic link token for:', email)

    if (!token || !type) {
      console.error('No token found in magic link')
      return NextResponse.redirect(new URL('/intensive/check-email?email=' + email, request.url))
    }

    const verifyUrl = new URL('/auth/verify', request.url)
    verifyUrl.searchParams.set('token_hash', token)
    verifyUrl.searchParams.set('type', type)

    return NextResponse.redirect(verifyUrl.toString())

  } catch (error) {
    console.error('Auto-login error:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

