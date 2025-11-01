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

          // Grant tokens to the user using centralized tracking
          const { trackTokenUsage } = await import('@/lib/tokens/tracking')
          await trackTokenUsage({
            user_id: userId,
            action_type: 'admin_grant',
            model_used: 'stripe',
            tokens_used: tokensAmount,
            cost_estimate: 0, // Token pack purchases don't count as AI cost
            input_tokens: 0,
            output_tokens: 0,
            success: true,
            metadata: {
              stripe_payment_intent: session.payment_intent,
              token_pack_id: packId,
              purchase_amount: session.amount_total,
              purchase_currency: session.currency,
              pack_id: packId,
              stripe_session_id: session.id,
              amount_paid: session.amount_total
            }
          })

          console.log('✅ Token pack granted:', {
            userId,
            packId,
            tokens: tokensAmount
          })
        }
        
        // Handle $499 Vision Activation Intensive purchases (standalone or combined)
        // This handles both standalone intensive purchases AND combined checkout (full payment mode)
        if ((session.mode === 'payment' && session.metadata?.purchase_type === 'intensive') ||
            (session.mode === 'payment' && session.metadata?.product_type === 'combined_intensive_continuity')) {
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

          // Create Vision Pro subscription separately with 56-day trial
          // This ensures Vision Pro doesn't show in intensive checkout but starts after 56 days
          const continuityPlan = session.metadata.continuity_plan || 'annual'
          const continuityPriceId = session.metadata.continuity_price_id || 
                                     (continuityPlan === 'annual' 
                                       ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL 
                                       : process.env.NEXT_PUBLIC_STRIPE_PRICE_28DAY)

          if (continuityPriceId) {
            console.log('Creating Vision Pro subscription with 56-day trial...')
            
            try {
              // Get or create Stripe customer
              const customerId = session.customer as string || 
                                 await stripe.customers.create({
                                   email: customerEmail ?? undefined,
                                   metadata: { user_id: userId },
                                 }).then(c => c.id)

              const tierType = continuityPlan === 'annual' ? 'vision_pro_annual' : 'vision_pro_28day'
              const { data: tier } = await supabase
                .from('membership_tiers')
                .select('id')
                .eq('tier_type', tierType)
                .single()

              if (tier) {
                // Create Vision Pro subscription with 56-day trial
                const visionProSubscription = await stripe.subscriptions.create({
                  customer: customerId,
                  items: [
                    {
                      price: continuityPriceId,
                      quantity: 1,
                    },
                  ],
                  trial_period_days: 56, // Start billing after 56 days
                  metadata: {
                    product_type: 'vision_pro_continuity',
                    tier_type: tierType,
                    intensive_payment_plan: paymentPlan,
                    continuity_plan: continuityPlan,
                    intensive_purchase_id: intensive.id.toString(),
                    billing_starts_day: '56',
                  },
                })

                console.log('✅ Vision Pro subscription created:', visionProSubscription.id)

                // Create subscription record
                const { data: newSubscription } = await supabase.from('customer_subscriptions').insert({
                  user_id: userId,
                  membership_tier_id: tier.id,
                  stripe_customer_id: customerId,
                  stripe_subscription_id: visionProSubscription.id,
                  stripe_price_id: continuityPriceId,
                  status: 'trialing' as any,
                  current_period_start: new Date((visionProSubscription as any).current_period_start * 1000).toISOString(),
                  current_period_end: new Date((visionProSubscription as any).current_period_end * 1000).toISOString(),
                  trial_start: new Date().toISOString(),
                  trial_end: new Date(Date.now() + (56 * 24 * 60 * 60 * 1000)).toISOString(),
                })
                .select()
                .single()

                // Grant trial tokens
                if (tierType === 'vision_pro_annual') {
                  await supabase.rpc('grant_trial_tokens', {
                    p_user_id: userId,
                    p_subscription_id: newSubscription?.id || null,
                    p_tokens: 1000000,
                    p_trial_period_days: 56,
                  })
                  await supabase
                    .from('user_profiles')
                    .update({ storage_quota_gb: 25 })
                    .eq('user_id', userId)
                } else if (tierType === 'vision_pro_28day') {
                  await supabase.rpc('grant_trial_tokens', {
                    p_user_id: userId,
                    p_subscription_id: newSubscription?.id || null,
                    p_tokens: 500000,
                    p_trial_period_days: 56,
                  })
                  await supabase
                    .from('user_profiles')
                    .update({ storage_quota_gb: 25 })
                    .eq('user_id', userId)
                }
              }
            } catch (visionProError) {
              console.error('Failed to create Vision Pro subscription:', visionProError)
              // Don't break - intensive purchase is still valid, Vision Pro can be added manually
            }
          }

          // TODO: Send welcome email with intensive onboarding instructions
          // TODO: Schedule SMS reminders for 24h, 36h, 72h checkpoints
        }
        
        // Handle Combined Checkout: Intensive + Vision Pro Continuity
        // Vision Pro is NOT in checkout - created separately in webhook with 56-day trial
        // Supports both payment mode (full) and subscription mode (2pay/3pay)
        if ((session.mode === 'payment' || session.mode === 'subscription') && 
            (session.metadata?.product_type === 'combined_intensive_continuity' || 
             (session.mode === 'payment' && session.metadata?.purchase_type === 'intensive' && session.metadata?.continuity_price_id))) {
          console.log('🔄 Processing combined intensive + continuity checkout...')
          
          const customerEmail = session.customer_details?.email
          const intensivePaymentPlan = session.metadata.intensive_payment_plan || session.metadata.payment_plan || 'full'
          const continuityPlan = session.metadata.continuity_plan || 'annual'
          
          // Get Vision Pro price ID from metadata (stored in checkout)
          const continuityPriceId = session.metadata.continuity_price_id || 
                                     (continuityPlan === 'annual' 
                                       ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL 
                                       : process.env.NEXT_PUBLIC_STRIPE_PRICE_28DAY)
          
          if (!continuityPriceId) {
            console.error('Continuity price ID not found')
            break
          }
          
          // Get customer ID (different for payment vs subscription mode)
          let customerId: string | null = null
          if (session.mode === 'subscription') {
            const subscriptionId = session.subscription as string
            const tempSubscription = await stripe.subscriptions.retrieve(subscriptionId)
            customerId = tempSubscription.customer as string
          } else {
            // Payment mode - need to get customer from payment intent
            const paymentIntentId = session.payment_intent as string
            if (paymentIntentId) {
              const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
              customerId = paymentIntent.customer as string | null
            }
            // If no customer yet, we'll create one
            if (!customerId && customerEmail) {
              const customer = await stripe.customers.create({
                email: customerEmail ?? undefined,
                metadata: { source: 'intensive_checkout' },
              })
              customerId = customer.id
            }
          }
          
          if (!customerId) {
            console.error('Customer ID not found and could not create')
            break
          }
          
          // Handle guest checkout - create user account if needed
          let userId = session.metadata.user_id && session.metadata.user_id !== 'guest' ? session.metadata.user_id : null
          
          if (!userId && customerEmail) {
            console.log('Creating user account for combined checkout:', customerEmail)
            
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
              email: customerEmail,
              email_confirm: true,
            })

            if (authError) {
              console.error('Error creating user account:', authError)
              break
            }

            userId = authData.user.id
            console.log('Created user account for combined checkout:', userId)

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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
              console.log('Magic link generated for combined checkout:', customerEmail)
            }
          }

          if (!userId || userId === 'guest') {
            console.error('Missing valid user_id for combined checkout')
            break
          }

          const tierType = continuityPlan === 'annual' ? 'vision_pro_annual' : 'vision_pro_28day'

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

          // Create Vision Pro subscription separately with 56-day trial
          // This is configured via trial_period_days in Subscription.create API call
          // (Cannot be configured in Stripe Dashboard per price - trials are subscription-level only)
          const scheduleStartDate = Math.floor(Date.now() / 1000) + (56 * 24 * 60 * 60) // 56 days from now
          let subscriptionId: string | undefined
          
          try {
            console.log('Creating Vision Pro subscription separately with 56-day trial...')
            
            // Create Vision Pro subscription with 56-day trial via API
            // NOTE: Cannot configure trial_period_days in Stripe Dashboard per price
            // Must use trial_period_days parameter in Subscription.create API call
            const visionProSubscription = await stripe.subscriptions.create({
              customer: customerId,
              items: [
                {
                  price: continuityPriceId,
                  quantity: 1,
                },
              ],
              trial_period_days: 56, // Vision Pro trial (starts billing in 56 days)
              metadata: {
                product_type: 'vision_pro_continuity',
                tier_type: tierType,
                intensive_payment_plan: intensivePaymentPlan,
                continuity_plan: continuityPlan,
                intensive_checkout_session_id: session.id,
                billing_starts_day: '56',
              },
            })
            console.log('✅ Vision Pro subscription created separately:', visionProSubscription.id)
            
            const visionProSubId = visionProSubscription.id
            const visionProSub = visionProSubscription
            subscriptionId = visionProSubId
            
            // Create subscription record using Vision Pro subscription (has 56-day trial)
            const { data: newSubscription } = await supabase.from('customer_subscriptions').insert({
              user_id: userId,
              membership_tier_id: tier.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: visionProSubId,
              stripe_price_id: continuityPriceId,
              status: 'trialing' as any,
              current_period_start: new Date((visionProSub as any).current_period_start * 1000).toISOString(),
              current_period_end: new Date((visionProSub as any).current_period_end * 1000).toISOString(),
              trial_start: new Date().toISOString(),
              trial_end: new Date(scheduleStartDate * 1000).toISOString(),
            })
            .select()
            .single()

            console.log('✅ Vision Pro subscription record created:', visionProSubId)
            
            // Grant trial tokens
            if (tierType === 'vision_pro_annual') {
              const { data: result, error: grantError } = await supabase.rpc('grant_trial_tokens', {
                p_user_id: userId,
                p_subscription_id: newSubscription?.id || null,
                p_tokens: 1000000,
                p_trial_period_days: 56,
              })
              
              if (grantError) {
                console.error('❌ Failed to grant trial tokens:', grantError)
              } else {
                console.log('✅ Trial tokens granted for annual plan:', result)
              }
              
              await supabase
                .from('user_profiles')
                .update({ storage_quota_gb: 25 })
                .eq('user_id', userId)
            } else if (tierType === 'vision_pro_28day') {
              const { data: result, error: grantError } = await supabase.rpc('grant_trial_tokens', {
                p_user_id: userId,
                p_subscription_id: newSubscription?.id || null,
                p_tokens: 500000,
                p_trial_period_days: 56,
              })
              
              if (grantError) {
                console.error('❌ Failed to grant trial tokens:', grantError)
              } else {
                console.log('✅ Trial tokens granted for 28-day plan:', result)
              }
              
              await supabase
                .from('user_profiles')
                .update({ storage_quota_gb: 25 })
                .eq('user_id', userId)
            }
          } catch (scheduleError) {
            console.error('Failed to create subscription schedule:', scheduleError)
            // Don't break - intensive purchase is still valid
          }

          // 2. Create Intensive Purchase (only Intensive is in checkout)
          console.log('Creating intensive purchase...')
          const activationDeadline = new Date()
          activationDeadline.setHours(activationDeadline.getHours() + 72) // 72 hours from now

          // Get payment intent and amount (different for payment vs subscription mode)
          // Handle free intensive (coupon makes it $0)
          let paymentIntentId: string | null = null
          let intensiveAmount = session.amount_total || 0 // Use actual total (may be $0 with coupon)
          const promoCode = session.metadata.promo_code || ''
          const isFreeIntensive = session.metadata.is_free_intensive === 'true' || intensiveAmount === 0

          if (session.mode === 'subscription') {
            // Subscription mode - get payment intent from invoice
            const subscriptionId = session.subscription as string
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)
            const latestInvoiceId = subscription.latest_invoice as string
            if (latestInvoiceId) {
              const invoice = await stripe.invoices.retrieve(latestInvoiceId)
              paymentIntentId = (invoice as any).payment_intent as string | null
              intensiveAmount = (invoice as any).amount_paid || intensiveAmount
            }
          } else {
            // Payment mode - use session payment intent (may be null for free)
            paymentIntentId = session.payment_intent as string | null
            intensiveAmount = session.amount_total || 0
          }

          console.log(`💰 Intensive amount: $${(intensiveAmount / 100).toFixed(2)} ${isFreeIntensive ? '(FREE with promo: ' + promoCode + ')' : ''}`)

          const { data: intensive, error: intensiveError } = await supabaseAdmin
            .from('intensive_purchases')
            .insert({
              user_id: userId,
              stripe_payment_intent_id: paymentIntentId, // May be null for free purchases
              stripe_checkout_session_id: session.id,
              stripe_subscription_id: session.mode === 'subscription' ? session.subscription as string : null,
              amount: intensiveAmount, // May be 0 for free intensive
              payment_plan: intensivePaymentPlan,
              installments_total: intensivePaymentPlan === 'full' ? 1 : intensivePaymentPlan === '2pay' ? 2 : 3,
              installments_paid: 1,
              completion_status: 'pending',
              activation_deadline: activationDeadline.toISOString(),
              promo_code: promoCode || null, // Store promo code if used
            })
            .select()
            .single()

          if (intensiveError) {
            console.error('❌ Failed to create intensive purchase:', intensiveError)
            break
          }

          // Create checklist for intensive
          await supabaseAdmin.from('intensive_checklist').insert({
            intensive_id: intensive.id,
            user_id: userId,
          })

          console.log('✅ Combined checkout completed:', {
            userId,
            subscriptionId,
            intensiveId: intensive.id,
            intensivePaymentPlan,
            continuityPlan,
            deadline: activationDeadline.toISOString(),
          })

          // TODO: Send welcome email with intensive onboarding + subscription details
          // TODO: Schedule SMS reminders for intensive milestones
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

