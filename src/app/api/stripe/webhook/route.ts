// /src/app/api/stripe/webhook/route.ts
// Stripe webhook handler for subscription events

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    console.error('Stripe not configured - missing STRIPE_SECRET_KEY')
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = await createServerClient()
  
  // Create admin client for user creation
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

  try {
    switch (event.type) {
      // ========================================================================
      // CHECKOUT COMPLETED
      // ========================================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string
          const userId = session.metadata?.user_id
          const tierType = session.metadata?.tier_type

          if (!userId || !tierType) {
            console.error('Missing metadata in checkout session')
            break
          }

          // Get full subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)

          // Get membership tier
          const { data: tier } = await supabase
            .from('membership_tiers')
            .select('id')
            .eq('tier_type', tierType)
            .single()

          if (!tier) {
            console.error('Tier not found:', tierType)
            break
          }

          // Create subscription record
          const { data: newSubscription } = await supabase.from('customer_subscriptions').insert({
            user_id: userId,
            membership_tier_id: tier.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status as any,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            trial_start: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000).toISOString() : null,
            trial_end: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000).toISOString() : null,
          })
          .select()
          .single()

          console.log('✅ Subscription created:', subscriptionId)
          
          // HORMOZI PRICING: Grant tokens based on plan type
          if (tierType === 'vision_pro_annual') {
            // Annual: Grant 5M tokens immediately
            const { data: result, error: grantError } = await supabase
              .rpc('grant_annual_tokens', {
                p_user_id: userId,
                p_subscription_id: newSubscription?.id || null,
              })
            
            if (grantError) {
              console.error('❌ Failed to grant annual tokens:', grantError)
            } else {
              console.log('✅ Annual tokens granted:', result)
            }
            
            // Set storage quota to 100GB
            await supabase
              .from('user_profiles')
              .update({ storage_quota_gb: 100 })
              .eq('user_id', userId)
          } 
          else if (tierType === 'vision_pro_28day') {
            // 28-Day: Drip 375k tokens on first cycle
            const { data: result, error: dripError } = await supabase
              .rpc('drip_tokens_28day', {
                p_user_id: userId,
                p_subscription_id: newSubscription?.id || null,
                p_cycle_number: 1,
              })
            
            if (dripError) {
              console.error('❌ Failed to drip tokens:', dripError)
            } else {
              console.log('✅ First cycle tokens dripped:', result)
            }
            
            // Set storage quota to 25GB
            await supabase
              .from('user_profiles')
              .update({ storage_quota_gb: 25 })
              .eq('user_id', userId)
          }
        } 
        
        // Handle one-time token pack purchases
        else if (session.mode === 'payment' && session.metadata?.purchase_type === 'token_pack') {
          const userId = session.metadata.user_id
          const packId = session.metadata.pack_id
          const tokensAmount = parseInt(session.metadata.tokens_amount)

          if (!userId || !tokensAmount) {
            console.error('Missing metadata in token pack checkout session')
            break
          }

          // Grant tokens to the user
          const { grantTokens } = await import('@/lib/tokens/token-tracker')
          const result = await grantTokens({
            userId,
            tokensToGrant: tokensAmount,
            actionType: 'token_pack_purchase',
            metadata: {
              pack_id: packId,
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent,
              amount_paid: session.amount_total,
            },
          })

          if (result.success) {
            console.log('✅ Token pack granted:', {
              userId,
              packId,
              tokens: tokensAmount,
              newBalance: result.newBalance,
            })
          } else {
            console.error('❌ Failed to grant token pack:', userId)
          }
        }
        
        // Handle $499 Vision Activation Intensive purchases
        else if (session.mode === 'payment' && session.metadata?.purchase_type === 'intensive') {
          const existingUserId = session.metadata.user_id
          const paymentPlan = session.metadata.payment_plan || 'full'
          const customerEmail = session.customer_details?.email

          // Handle guest checkout - create user account if needed
          let userId = existingUserId && existingUserId !== 'guest' ? existingUserId : null
          
          if (!userId && customerEmail) {
            console.log('Creating user account for guest checkout:', customerEmail)
            
            // Create user account in Supabase Auth with magic link (using admin client)
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
              email: customerEmail,
              email_confirm: true, // Skip email confirmation for purchased users
            })

            if (authError) {
              console.error('Error creating user account:', authError)
              break
            }

            userId = authData.user.id
            console.log('Created user account:', userId)

            // Generate both auto-login token AND magic link
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            
            // Generate magic link for email backup (using admin client)
            const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
              type: 'magiclink',
              email: customerEmail,
              options: {
                redirectTo: `${appUrl}/auth/setup-password?intensive=true`,
              },
            })

            if (magicLinkError) {
              console.error('Error generating magic link:', magicLinkError)
            } else {
              console.log('Magic link generated for:', customerEmail)
              console.log('Magic link URL:', magicLinkData.properties.action_link)
            }

            // Store the access token in the intensive purchase for auto-login
            if (magicLinkData?.properties?.hashed_token) {
              // We'll use this to auto-login the user on redirect
              console.log('Auto-login token ready for:', customerEmail)
            }
          }

          if (!userId || userId === 'guest') {
            console.error('Missing valid user_id - unable to create intensive purchase. User creation may have failed.')
            break
          }

          console.log('✅ User ID confirmed:', userId)
          console.log('Creating intensive purchase record...')

          // Create intensive purchase record
          const activationDeadline = new Date()
          activationDeadline.setHours(activationDeadline.getHours() + 72) // 72 hours from now
          
          console.log('Activation deadline:', activationDeadline.toISOString())

          const { data: intensive, error: intensiveError } = await supabaseAdmin
            .from('intensive_purchases')
            .insert({
              user_id: userId,
              stripe_payment_intent_id: session.payment_intent as string,
              stripe_checkout_session_id: session.id,
              amount: session.amount_total || 49900,
              payment_plan: paymentPlan,
              installments_total: paymentPlan === 'full' ? 1 : paymentPlan === '2pay' ? 2 : 3,
              installments_paid: 1, // First payment complete
              completion_status: 'pending',
              activation_deadline: activationDeadline.toISOString(),
            })
            .select()
            .single()

          if (intensiveError) {
            console.error('❌ Failed to create intensive purchase:', intensiveError)
            console.error('User ID that failed:', userId)
            console.error('Payment plan:', paymentPlan)
            break
          }
          
          console.log('✅ Created intensive purchase:', intensive?.id)

          // Create checklist for intensive
          await supabaseAdmin.from('intensive_checklist').insert({
            intensive_id: intensive.id,
            user_id: userId,
          })

          console.log('✅ Intensive purchase created:', {
            userId,
            intensiveId: intensive.id,
            paymentPlan,
            deadline: activationDeadline.toISOString(),
          })

          // TODO: Send welcome email with intensive onboarding instructions
          // TODO: Schedule SMS reminders for 24h, 36h, 72h checkpoints
        }
        
        break
      }

      // ========================================================================
      // SUBSCRIPTION UPDATED
      // ========================================================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('customer_subscriptions')
          .update({
            status: subscription.status as any,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancel_at_period_end: (subscription as any).cancel_at_period_end,
            canceled_at: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000).toISOString() : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log('✅ Subscription updated:', subscription.id)
        break
      }

      // ========================================================================
      // SUBSCRIPTION DELETED
      // ========================================================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('customer_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log('✅ Subscription canceled:', subscription.id)
        break
      }

      // ========================================================================
      // PAYMENT SUCCEEDED
      // ========================================================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        if ((invoice as any).subscription) {
          const customerId = invoice.customer as string
          const subscriptionId = (invoice as any).subscription as string

          // Find user and subscription details
          const { data: subscription } = await supabase
            .from('customer_subscriptions')
            .select(`
              user_id, 
              id,
              membership_tier_id,
              membership_tiers (tier_type)
            `)
            .eq('stripe_customer_id', customerId)
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (subscription) {
            // Record payment
            await supabase.from('payment_history').insert({
              user_id: subscription.user_id,
              subscription_id: subscription.id,
              stripe_payment_intent_id: (invoice as any).payment_intent as string,
              stripe_invoice_id: invoice.id,
              amount: (invoice as any).amount_paid,
              currency: invoice.currency,
              status: 'succeeded',
              description: (invoice as any).description || 'Subscription payment',
              paid_at: new Date((invoice as any).status_transitions.paid_at! * 1000).toISOString(),
            })

            console.log('✅ Payment recorded:', invoice.id)
            
            // HORMOZI PRICING: Handle token dripping for 28-day renewals
            const tierType = (subscription as any).membership_tiers?.tier_type
            
            if (tierType === 'vision_pro_28day' && (invoice as any).billing_reason !== 'subscription_create') {
              // This is a renewal payment (not the first one)
              // Drip 375k tokens for the new cycle
              
              // Get cycle number from token_drips history
              const { count } = await supabase
                .from('token_drips')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', subscription.user_id)
                .eq('subscription_id', subscription.id)
              
              const cycleNumber = (count || 0) + 1
              
              const { data: result, error: dripError } = await supabase
                .rpc('drip_tokens_28day', {
                  p_user_id: subscription.user_id,
                  p_subscription_id: subscription.id,
                  p_cycle_number: cycleNumber,
                })
              
              if (dripError) {
                console.error('❌ Failed to drip tokens on renewal:', dripError)
              } else {
                console.log('✅ Cycle', cycleNumber, 'tokens dripped:', result)
              }
            }
          }
        }
        break
      }

      // ========================================================================
      // PAYMENT FAILED
      // ========================================================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: subscription } = await supabase
          .from('customer_subscriptions')
          .select('user_id, id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (subscription) {
          await supabase.from('payment_history').insert({
            user_id: subscription.user_id,
            subscription_id: subscription.id,
            stripe_invoice_id: invoice.id,
            amount: (invoice as any).amount_due,
            currency: invoice.currency,
            status: 'failed',
            description: 'Payment failed',
          })

          console.log('⚠️ Payment failed:', invoice.id)
        }
        break
      }

      // ========================================================================
      // TRIAL ENDING SOON (7 days before trial ends)
      // ========================================================================
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find user
        const { data: sub } = await supabase
          .from('customer_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (sub) {
          // TODO: Send email notification about trial ending
          console.log('⏰ Trial ending soon for user:', sub.user_id)
        }
        break
      }

      // ========================================================================
      // PAYMENT METHOD UPDATED
      // ========================================================================
      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer
        
        // Update customer info if needed
        console.log('✅ Customer updated:', customer.id)
        break
      }

      // ========================================================================
      // SUBSCRIPTION CREATED (when trial starts or immediate activation)
      // ========================================================================
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('✅ Subscription created:', subscription.id)
        // Usually handled by checkout.session.completed
        break
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

