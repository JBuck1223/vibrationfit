/**
 * Activation Experience — email capture + account + session.
 *
 * New email  → create a free account, grant trial tokens, create/resume the
 *              activation, sign this browser in, and send a branded resume email
 *              with a separate magic link.
 *
 * Known email, matching session → resume the latest incomplete activation.
 *
 * Known email, no session → never auto-login. Create or resume the activation,
 *              then email a branded magic link that includes the activation id.
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
import {
  activationResumePath,
  findLatestActivation,
  findLatestIncompleteActivation,
  sendActivationBegunEmail,
  type ActivationResumeRow,
} from '@/lib/activation/resume'

export const dynamic = 'force-dynamic'

const ACTIVATION_TOKEN_GRANT = 100_000

async function createActivationRow(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<ActivationResumeRow> {
  const { data: activation, error } = await admin
    .from('activations')
    .insert({ user_id: userId, status: 'started' })
    .select('id, status, entered_at, opened_at, ready_at, resume_email_sent_at')
    .single()
  if (error || !activation) {
    throw new Error(error?.message || 'Could not start your activation')
  }
  return activation as ActivationResumeRow
}

async function resumeOrCreateActivation(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<{ activation: ActivationResumeRow; created: boolean }> {
  const latest = await findLatestActivation(admin, userId)
  if (latest?.status === 'entered') {
    return { activation: latest, created: false }
  }
  const incomplete = await findLatestIncompleteActivation(admin, userId)
  if (incomplete) return { activation: incomplete, created: false }
  return { activation: await createActivationRow(admin, userId), created: true }
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'activation-start', 5)
  if (limited) return limited

  try {
    const body = await request.json()

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
    const origin = request.nextUrl.origin

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
        console.error('[activation/start] token grant failed:', grantErr)
      }
    } else {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (sessionUser?.id === existingUserId) {
        userId = existingUserId
      } else {
        // Account-takeover guard: create/resume, then email. Never auto-login.
        const { activation, created } = await resumeOrCreateActivation(admin, existingUserId)
        if (created) {
          await recordActivationEvent(admin, {
            eventType: 'activation_started',
            activationId: activation.id,
            userId: existingUserId,
            visitorId: body.visitor_id || null,
            sessionId: body.session_id || null,
            eventData: { is_new_user: false, resumed: false },
          })
        }
        try {
          await sendActivationBegunEmail({
            admin,
            origin,
            email,
            firstName,
            userId: existingUserId,
            activation,
          })
        } catch (emailErr) {
          console.error('[activation/start] resume email failed:', emailErr)
        }
        return NextResponse.json({ checkEmail: true, activationId: activation.id }, { status: 200 })
      }
    }

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
    }

    const { activation, created } = await resumeOrCreateActivation(admin, userId)
    if (created) {
      await recordActivationEvent(admin, {
        eventType: 'activation_started',
        activationId: activation.id,
        userId,
        leadId,
        visitorId: body.visitor_id || null,
        sessionId: body.session_id || null,
        eventData: { is_new_user: isNewUser },
      })
    }

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

    try {
      await sendActivationBegunEmail({
        admin,
        origin,
        email,
        firstName,
        userId,
        activation,
      })
    } catch (emailErr) {
      console.error('[activation/start] resume email failed:', emailErr)
    }

    return NextResponse.json({
      activationId: activation.id,
      isNewUser,
      status: activation.status,
      resumePath: activationResumePath(activation),
    }, { status: created ? 201 : 200 })
  } catch (error) {
    console.error('[activation/start] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
