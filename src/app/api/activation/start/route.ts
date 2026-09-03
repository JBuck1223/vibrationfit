/**
 * Activation Experience — email capture + account + session.
 *
 * POST /api/activation/start  { email, firstName?, visitor_id?, session_id?, ... }
 *
 * New email  → creates a free account (signup_source: 'activation'), grants a
 *              one-time trial token allowance sized for one full Activation,
 *              creates the lead + activation row, and signs the browser in
 *              (magic-link token verified server-side, cookies set on this
 *              response). Returns { activationId }.
 *
 * Known email → NEVER auto-logs-in (that would let anyone hijack a member
 *              account by typing their email). If the browser already has a
 *              session for that email we just create the activation; otherwise
 *              we email a magic link and return { checkEmail: true }.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'
import { toTitleCase } from '@/lib/utils'
import { getUserIdByEmail } from '@/lib/supabase/get-user-by-email'
import { grantTokens } from '@/lib/tokens/transactions'
import { sendServerConversion } from '@/lib/tracking/server-conversions'
import { triggerEvent } from '@/lib/messaging/events'
import { recordActivationEvent } from '@/lib/activation/events'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * One full Activation ≈ 36k tokens (reflection, vision, story, incantation,
 * SparkQuery, audio, song lyrics, ~3 images) — 100k gives regeneration
 * headroom while staying at ~10% of one Vision Pro month.
 */
const ACTIVATION_TOKEN_GRANT = 100_000

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'activation-start', 5)
  if (limited) return limited

  try {
    const body = await request.json()

    // Honeypot: bots fill the hidden "website" field
    if (typeof body.website === 'string' && body.website.trim()) {
      return NextResponse.json({ activationId: crypto.randomUUID() }, { status: 201 })
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    const firstName = typeof body.firstName === 'string' && body.firstName.trim()
      ? toTitleCase(body.firstName.trim())
      : null

    const admin = createAdminClient()
    const supabase = await createClient()

    // -------------------------------------------------------------------
    // 1. Resolve the user: new account, existing session, or check-email
    // -------------------------------------------------------------------
    const existingUserId = await getUserIdByEmail(admin, email)
    let userId: string
    let isNewUser = false

    if (!existingUserId) {
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: randomBytes(32).toString('hex'),
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          full_name: firstName,
          signup_source: 'activation',
        },
      })
      if (createErr || !newUser?.user) {
        console.error('[activation/start] createUser failed:', createErr)
        return NextResponse.json({ error: 'Could not create your account' }, { status: 500 })
      }
      userId = newUser.user.id
      isNewUser = true

      try {
        await grantTokens(userId, ACTIVATION_TOKEN_GRANT, 'trial', {
          source: 'activation_lead_magnet',
        }, admin)
      } catch (grantErr) {
        // Don't fail signup; the generate step will surface an empty balance
        console.error('[activation/start] token grant failed:', grantErr)
      }
    } else {
      // Existing account: only proceed silently when this browser already
      // holds a session for that same user.
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (sessionUser?.id === existingUserId) {
        userId = existingUserId
      } else {
        await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: `${request.nextUrl.origin}/activation/experience`,
          },
        })
        return NextResponse.json({ checkEmail: true }, { status: 200 })
      }
    }

    // -------------------------------------------------------------------
    // 2. Lead + funnel events (new users only get a fresh lead row)
    // -------------------------------------------------------------------
    let leadId: string | null = null
    if (isNewUser) {
      const { data: lead, error: leadErr } = await admin
        .from('leads')
        .insert({
          type: 'activation',
          email,
          first_name: firstName,
          source: body.source || 'activation_funnel',
          status: 'new',
          converted_to_user_id: userId,
          visitor_id: body.visitor_id || null,
          session_id: body.session_id || null,
          utm_source: body.utm_source || null,
          utm_medium: body.utm_medium || null,
          utm_campaign: body.utm_campaign || null,
          utm_content: body.utm_content || null,
          utm_term: body.utm_term || null,
          referrer: body.referrer || null,
          landing_page: body.landing_page || '/activation',
          metadata: { signup_source: 'activation' },
        })
        .select('id')
        .single()
      if (leadErr) {
        console.error('[activation/start] lead insert failed (non-fatal):', leadErr)
      } else {
        leadId = lead.id
      }

      await recordActivationEvent(admin, {
        eventType: 'activation_started',
        userId,
        leadId,
        visitorId: body.visitor_id || null,
        sessionId: body.session_id || null,
        eventData: { is_new_user: true },
      })
      await admin.from('journey_events').insert({
        event_type: 'email_captured',
        user_id: userId,
        lead_id: leadId,
        visitor_id: body.visitor_id || null,
        session_id: body.session_id || null,
        event_data: { source: 'activation' },
      })

      sendServerConversion('lead', {
        email,
        firstName: firstName || undefined,
        contentName: 'activation',
        eventId: leadId || undefined,
        eventSourceUrl: 'https://vibrationfit.com/activation',
        fbc: request.cookies.get('_fbc')?.value,
        fbp: request.cookies.get('_fbp')?.value,
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        visitorId: body.visitor_id || undefined,
      }).catch((err) => console.error('[activation/start] server conversion error:', err))

      triggerEvent('lead.created', {
        email,
        firstName: firstName || undefined,
        name: firstName || undefined,
        leadType: 'activation',
      }).catch((err) => console.error('[activation/start] triggerEvent error:', err))
    } else {
      await recordActivationEvent(admin, {
        eventType: 'activation_started',
        userId,
        visitorId: body.visitor_id || null,
        sessionId: body.session_id || null,
        eventData: { is_new_user: false },
      })
    }

    // -------------------------------------------------------------------
    // 3. Create the activation row
    // -------------------------------------------------------------------
    const { data: activation, error: activationErr } = await admin
      .from('activations')
      .insert({ user_id: userId, status: 'started' })
      .select('id')
      .single()
    if (activationErr || !activation) {
      console.error('[activation/start] activation insert failed:', activationErr)
      return NextResponse.json({ error: 'Could not start your activation' }, { status: 500 })
    }

    // -------------------------------------------------------------------
    // 4. New accounts only: sign this browser in (cookies set on response)
    // -------------------------------------------------------------------
    if (isNewUser) {
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })
      const tokenHash = linkData?.properties?.hashed_token
      if (linkErr || !tokenHash) {
        console.error('[activation/start] generateLink failed:', linkErr)
        return NextResponse.json({ error: 'Could not sign you in' }, { status: 500 })
      }
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: tokenHash,
      })
      if (verifyErr) {
        console.error('[activation/start] verifyOtp failed:', verifyErr)
        return NextResponse.json({ error: 'Could not sign you in' }, { status: 500 })
      }
    }

    return NextResponse.json({ activationId: activation.id, isNewUser }, { status: 201 })
  } catch (error) {
    console.error('[activation/start] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
