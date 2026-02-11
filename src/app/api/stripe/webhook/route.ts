// /src/app/api/stripe/webhook/route.ts
// Stripe webhook handler for subscription events

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config'
import { getActivePackByKey } from '@/lib/billing/packs'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

type OrderInsertParams = {
  userId: string
  session: Stripe.Checkout.Session
  totalAmount: number
  paymentIntentId: string | null
  promoCode?: string | null
  referralSource?: string | null
  campaignName?: string | null
  supabaseAdmin: any
}

async function ensureOrder({
  userId,
  session,
  totalAmount,
  paymentIntentId,
  promoCode,
  referralSource,
  campaignName,
  supabaseAdmin,
}: OrderInsertParams) {
  const { data: existingOrder } = await (supabaseAdmin as any)
    .from('orders')
    .select('*')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle()

  if (existingOrder) {
    return existingOrder
  }

  const { data: order } = await (supabaseAdmin as any)
    .from('orders')
    .insert({
      user_id: userId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      total_amount: totalAmount,
      currency: session.currency || 'usd',
      status: totalAmount > 0 ? 'paid' : 'pending',
      paid_at: totalAmount > 0 ? new Date().toISOString() : null,
      promo_code: promoCode || null,
      referral_source: referralSource || null,
      campaign_name: campaignName || null,
      metadata: {
        source: session.metadata?.source || session.metadata?.product_type || 'stripe_checkout',
        mode: session.mode,
      },
    })
    .select()
    .single()

  return order
}

type OrderItemParams = {
  orderId: string
  stripePriceId: string | null
  amount: number
  currency: string
  isSubscription: boolean
  subscriptionId?: string | null
  quantity?: number
  extraFields?: Record<string, unknown>
  metadata?: Record<string, unknown>
  supabaseAdmin: any
}

async function createOrderItemByPriceId({
  orderId,
  stripePriceId,
  amount,
  currency,
  isSubscription,
  subscriptionId,
  quantity,
  extraFields,
  metadata,
  supabaseAdmin,
}: OrderItemParams) {
  if (!stripePriceId) {
    return null
  }

  const { data: price } = await (supabaseAdmin as any)
    .from('product_prices')
    .select('id, product_id')
    .eq('stripe_price_id', stripePriceId)
    .maybeSingle()

  if (!price) {
    return null
  }

  const { data: existingItem } = await (supabaseAdmin as any)
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .eq('price_id', price.id)
    .maybeSingle()

  if (existingItem) {
    return existingItem
  }

  const { data: orderItem } = await (supabaseAdmin as any)
    .from('order_items')
    .insert({
      order_id: orderId,
      product_id: price.product_id,
      price_id: price.id,
      quantity: quantity || 1,
      amount,
      currency,
      is_subscription: isSubscription,
      subscription_id: subscriptionId || null,
      metadata: metadata || {},
      ...(extraFields || {}),
    })
    .select()
    .single()

  return orderItem
}

type OrderItemByProductKeyParams = {
  orderId: string
  productKey: string
  amount: number
  currency: string
  isSubscription: boolean
  subscriptionId?: string | null
  quantity?: number
  extraFields?: Record<string, unknown>
  metadata?: Record<string, unknown>
  supabaseAdmin: any
}

type StorageAddonPrice = {
  stripePriceId: string
  grantAmount: number
  grantUnit: 'storage_gb'
  packKey?: string | null
}

async function getStorageAddonPrices(
  stripePriceIds: string[],
  supabaseAdmin: any
): Promise<StorageAddonPrice[]> {
  if (!stripePriceIds.length) {
    return []
  }

  const { data: rows } = await (supabaseAdmin as any)
    .from('product_prices')
    .select('stripe_price_id, metadata, products (key)')
    .in('stripe_price_id', stripePriceIds)

  if (!rows) {
    return []
  }

  return rows
    .filter((row: any) => row?.products?.key === 'storage')
    .map((row: any) => {
      const metadata = (row.metadata || {}) as Record<string, any>
      const grantAmountRaw =
        metadata.grant_amount ?? metadata.storage_gb
      const grantAmount =
        typeof grantAmountRaw === 'number' ? grantAmountRaw : Number(grantAmountRaw)

      if (!grantAmount || grantAmount <= 0) {
        return null
      }

      return {
        stripePriceId: row.stripe_price_id,
        grantAmount,
        grantUnit: 'storage_gb',
        packKey: typeof metadata.pack_key === 'string' ? metadata.pack_key : null,
      } as StorageAddonPrice
    })
    .filter((row: StorageAddonPrice | null): row is StorageAddonPrice => Boolean(row))
}

async function createOrderItemByProductKey({
  orderId,
  productKey,
  amount,
  currency,
  isSubscription,
  subscriptionId,
  quantity,
  extraFields,
  metadata,
  supabaseAdmin,
}: OrderItemByProductKeyParams) {
  const { data: product } = await (supabaseAdmin as any)
    .from('products')
    .select('id')
    .eq('key', productKey)
    .maybeSingle()

  if (!product) {
    return null
  }

  const { data: existingItem } = await (supabaseAdmin as any)
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .eq('product_id', product.id)
    .maybeSingle()

  if (existingItem) {
    return existingItem
  }

  const { data: orderItem } = await (supabaseAdmin as any)
    .from('order_items')
    .insert({
      order_id: orderId,
      product_id: product.id,
      price_id: null,
      quantity: quantity || 1,
      amount,
      currency,
      is_subscription: isSubscription,
      subscription_id: subscriptionId || null,
      metadata: metadata || {},
      ...(extraFields || {}),
    })
    .select()
    .single()

  return orderItem
}

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
          
          // Grant tokens based on Stripe price ID (dynamic tier lookup)
          const priceId = subscription.items.data[0].price.id

          const { data: result, error: grantError } = await supabase
            .rpc('grant_tokens_by_stripe_price_id', {
              p_user_id: userId,
              p_stripe_price_id: priceId,
              p_subscription_id: newSubscription?.id || null,
            })

          if (grantError) {
            console.error('❌ Failed to grant tokens:', grantError)
            console.error('Price ID:', priceId)
          } else {
            console.log('✅ Tokens and storage granted:', result)
            console.log('Tier:', result.tier)
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

          // Record token pack purchase as a transaction (financial)
          const { recordTokenPackPurchase } = await import('@/lib/tokens/transactions')
          await recordTokenPackPurchase(
            userId,
            packId,
            tokensAmount,
            session.amount_total || 0,
            session.payment_intent as string,
            session.id,
            {
              purchase_amount: session.amount_total,
              purchase_currency: session.currency,
              pack_id: packId,
            },
            supabase
          )

          console.log('✅ Token pack granted:', {
            userId,
            packId,
            tokens: tokensAmount
          })
        }
        
        // Handle flexible pack purchases (tokens or storage)
        else if (session.mode === 'payment' && session.metadata?.purchase_type === 'flex_pack') {
          const userId = session.metadata.user_id
          const productKey = session.metadata.product_key
          const packKey = session.metadata.pack_key
          const quantity = parseInt(session.metadata.quantity || '1', 10)

          if (!userId || !productKey || !packKey || !Number.isFinite(quantity)) {
            console.error('Missing metadata in flexible pack checkout session')
            break
          }

          const pack = await getActivePackByKey(
            productKey as any,
            packKey,
            supabaseAdmin
          )

          if (!pack) {
            console.error('Pack not found for flexible checkout:', { productKey, packKey })
            break
          }

          const paymentIntentId = session.payment_intent as string | null
          const orderTotal = session.amount_total || pack.unitAmount * quantity
          const order = await ensureOrder({
            userId,
            session,
            totalAmount: orderTotal,
            paymentIntentId,
            promoCode: session.metadata.promo_code || null,
            referralSource: session.metadata.referral_source || session.metadata.source || null,
            campaignName: session.metadata.campaign_name || null,
            supabaseAdmin,
          })

          const orderItem = await createOrderItemByProductKey({
            orderId: order.id,
            productKey,
            amount: orderTotal,
            currency: session.currency || pack.currency,
            isSubscription: false,
            quantity,
            metadata: {
              pack_key: packKey,
              grant_unit: pack.grantUnit,
              grant_amount: pack.grantAmount,
              unit_amount: pack.unitAmount,
              quantity,
            },
            extraFields: {
              stripe_payment_intent_id: paymentIntentId,
              stripe_checkout_session_id: session.id,
            },
            supabaseAdmin,
          })

          if (!orderItem?.id) {
            console.error('Failed to create flexible pack order item')
            break
          }

          if (pack.grantUnit === 'tokens') {
            const { recordTokenPackPurchase } = await import('@/lib/tokens/transactions')
            await recordTokenPackPurchase(
              userId,
              packKey,
              pack.grantAmount * quantity,
              session.amount_total || 0,
              session.payment_intent as string,
              session.id,
              {
                purchase_amount: session.amount_total,
                purchase_currency: session.currency,
                product_key: productKey,
                pack_key: packKey,
                unit_amount: pack.unitAmount,
                quantity,
              },
              supabase
            )
          } else if (pack.grantUnit === 'storage_gb') {
            const storageAmount = pack.grantAmount * quantity
            const { error: storageError } = await supabaseAdmin
              .from('user_storage')
              .insert({
                user_id: userId,
                quota_gb: storageAmount,
                metadata: {
                  purchase_amount: session.amount_total,
                  purchase_currency: session.currency,
                  product_key: productKey,
                  pack_key: packKey,
                  unit_amount: pack.unitAmount,
                  quantity,
                  stripe_payment_intent_id: paymentIntentId,
                  stripe_checkout_session_id: session.id,
                },
              })

            if (storageError) {
              console.error('Failed to grant storage:', storageError)
              break
            }
          } else {
            console.error('Unknown grant unit for flexible pack:', pack.grantUnit)
            break
          }

          console.log('Flexible pack granted:', {
            userId,
            productKey,
            packKey,
            quantity,
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
                redirectTo: `${appUrl}/auth/setup-password`,
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
          console.log('Creating intensive order item...')

          const activationDeadline = new Date()
          activationDeadline.setHours(activationDeadline.getHours() + 72)
          console.log('Activation deadline:', activationDeadline.toISOString())

          const paymentIntentId = session.payment_intent as string | null
          const orderTotal = session.amount_total || 49900
          const order = await ensureOrder({
            userId,
            session,
            totalAmount: orderTotal,
            paymentIntentId,
            promoCode: session.metadata.promo_code || null,
            referralSource: session.metadata.referral_source || session.metadata.source || null,
            campaignName: session.metadata.campaign_name || null,
            supabaseAdmin,
          })

          let intensivePriceId: string | null = null
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 })
            intensivePriceId = lineItems.data[0]?.price?.id ?? null
          } catch (lineItemError) {
            console.error('Unable to fetch line items for intensive order item:', lineItemError)
          }

          const intensiveOrderItem =
            (await createOrderItemByPriceId({
              orderId: order.id,
              stripePriceId: intensivePriceId,
              amount: orderTotal,
              currency: session.currency || 'usd',
              isSubscription: false,
              metadata: {
                payment_plan: paymentPlan,
              },
              extraFields: {
                stripe_payment_intent_id: paymentIntentId,
                stripe_checkout_session_id: session.id,
                payment_plan: paymentPlan,
                installments_total: paymentPlan === 'full' ? 1 : paymentPlan === '2pay' ? 2 : 3,
                installments_paid: 1,
                completion_status: 'pending',
                activation_deadline: activationDeadline.toISOString(),
                promo_code: session.metadata.promo_code || null,
                referral_source: session.metadata.referral_source || session.metadata.source || null,
                campaign_name: session.metadata.campaign_name || null,
              },
              supabaseAdmin,
            })) ||
            (await createOrderItemByProductKey({
              orderId: order.id,
              productKey: 'intensive',
              amount: orderTotal,
              currency: session.currency || 'usd',
              isSubscription: false,
              metadata: {
                payment_plan: paymentPlan,
              },
              extraFields: {
                stripe_payment_intent_id: paymentIntentId,
                stripe_checkout_session_id: session.id,
                payment_plan: paymentPlan,
                installments_total: paymentPlan === 'full' ? 1 : paymentPlan === '2pay' ? 2 : 3,
                installments_paid: 1,
                completion_status: 'pending',
                activation_deadline: activationDeadline.toISOString(),
                promo_code: session.metadata.promo_code || null,
                referral_source: session.metadata.referral_source || session.metadata.source || null,
                campaign_name: session.metadata.campaign_name || null,
              },
              supabaseAdmin,
            }))

          if (!intensiveOrderItem?.id) {
            console.error('❌ Failed to create intensive order item')
            break
          }

          await supabaseAdmin.from('intensive_checklist').insert({
            intensive_id: intensiveOrderItem.id,
            user_id: userId,
          })

          console.log('✅ Intensive order item created:', {
            userId,
            intensiveId: intensiveOrderItem.id,
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
                    intensive_order_item_id: intensiveOrderItem.id,
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

                const membershipOrderItem =
                  (await createOrderItemByPriceId({
                    orderId: order.id,
                    stripePriceId: continuityPriceId,
                    amount: 0,
                    currency: session.currency || 'usd',
                    isSubscription: true,
                    subscriptionId: newSubscription?.id || null,
                    metadata: {
                      trial_days: 56,
                      billing_starts_day: 56,
                    },
                    supabaseAdmin,
                  })) ||
                  (await createOrderItemByProductKey({
                    orderId: order.id,
                    productKey: tierType,
                    amount: 0,
                    currency: session.currency || 'usd',
                    isSubscription: true,
                    subscriptionId: newSubscription?.id || null,
                    metadata: {
                      trial_days: 56,
                      billing_starts_day: 56,
                    },
                    supabaseAdmin,
                  }))

                if (membershipOrderItem?.id && newSubscription?.id) {
                  await supabaseAdmin
                    .from('customer_subscriptions')
                    .update({
                      order_id: order.id,
                      order_item_id: membershipOrderItem.id,
                    })
                    .eq('id', newSubscription.id)
                }

                // Grant intensive trial tokens (1M for 56 days)
                const { data: result, error: grantError } = await supabase
                  .rpc('grant_trial_tokens', {
                    p_user_id: userId,
                    p_intensive_id: intensiveOrderItem.id || null,
                  })

                if (grantError) {
                  console.error('❌ Failed to grant intensive trial tokens:', grantError)
                } else {
                  console.log('✅ Intensive trial tokens granted:', result)
                }

                // Create household if plan_type is 'household'
                const planType = session.metadata?.plan_type
                if (planType === 'household') {
                  console.log('🏠 Creating household for user:', userId)
                  
                  try {
                    // Create household record
                    const { data: household, error: householdError } = await supabaseAdmin
                      .from('households')
                      .insert({
                        admin_user_id: userId,
                        name: `${customerEmail?.split('@')[0] || 'My'}'s Household`,
                        max_members: 2, // Household plans come with 2 seats
                        shared_tokens_enabled: true, // Default to shared tokens for households
                      })
                      .select()
                      .single()

                    if (householdError) {
                      console.error('❌ Failed to create household:', householdError)
                    } else {
                      console.log('✅ Household created:', household.id)

                      // Update user profile with household info
                      const { error: profileError } = await supabaseAdmin
                        .from('user_profiles')
                        .upsert({
                          user_id: userId,
                          household_id: household.id,
                          is_household_admin: true,
                        }, {
                          onConflict: 'user_id',
                        })

                      if (profileError) {
                        console.error('❌ Failed to update user profile with household:', profileError)
                      } else {
                        console.log('✅ User profile updated with household info')
                      }

                      // Add admin as first household member
                      const { error: memberError } = await supabaseAdmin
                        .from('household_members')
                        .insert({
                          household_id: household.id,
                          user_id: userId,
                          role: 'admin',
                          joined_at: new Date().toISOString(),
                        })

                      if (memberError) {
                        console.error('❌ Failed to add admin to household_members:', memberError)
                      } else {
                        console.log('✅ Admin added to household_members')
                      }
                    }
                  } catch (householdError) {
                    console.error('❌ Error in household creation:', householdError)
                    // Don't break - subscription is still valid
                  }
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
                redirectTo: `${appUrl}/auth/setup-password`,
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
          let customerSubscriptionId: string | null = null
          
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
            customerSubscriptionId = newSubscription?.id || null
            
            // Create household if plan_type is 'household'
            const planType = session.metadata?.plan_type
            if (planType === 'household') {
              console.log('🏠 Creating household for user:', userId)
              
              try {
                // Create household record
                const { data: household, error: householdError } = await supabaseAdmin
                  .from('households')
                  .insert({
                    admin_user_id: userId,
                    name: `${customerEmail?.split('@')[0] || 'My'}'s Household`,
                    max_members: 2, // Household plans come with 2 seats
                    shared_tokens_enabled: true, // Default to shared tokens for households
                  })
                  .select()
                  .single()

                if (householdError) {
                  console.error('❌ Failed to create household:', householdError)
                } else {
                  console.log('✅ Household created:', household.id)

                  // Update user profile with household info
                  const { error: profileError } = await supabaseAdmin
                    .from('user_profiles')
                    .upsert({
                      user_id: userId,
                      household_id: household.id,
                      is_household_admin: true,
                    }, {
                      onConflict: 'user_id',
                    })

                  if (profileError) {
                    console.error('❌ Failed to update user profile with household:', profileError)
                  } else {
                    console.log('✅ User profile updated with household info')
                  }

                  // Add admin as first household member
                  const { error: memberError } = await supabaseAdmin
                    .from('household_members')
                    .insert({
                      household_id: household.id,
                      user_id: userId,
                      role: 'admin',
                      joined_at: new Date().toISOString(),
                    })

                  if (memberError) {
                    console.error('❌ Failed to add admin to household_members:', memberError)
                  } else {
                    console.log('✅ Admin added to household_members')
                  }
                }
              } catch (householdError) {
                console.error('❌ Error in household creation:', householdError)
                // Don't break - subscription is still valid
              }
            }
          } catch (scheduleError) {
            console.error('Failed to create subscription schedule:', scheduleError)
            // Don't break - intensive purchase is still valid
          }

          // 2. Create Intensive Order Item (only Intensive is in checkout)
          console.log('Creating intensive order item...')
          const activationDeadline = new Date()
          activationDeadline.setHours(activationDeadline.getHours() + 72)

          let paymentIntentId: string | null = null
          let intensiveAmount = session.amount_total || 0
          const promoCode = session.metadata.promo_code || ''
          const isFreeIntensive = session.metadata.is_free_intensive === 'true' || intensiveAmount === 0

          if (session.mode === 'subscription') {
            const subscriptionId = session.subscription as string
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)
            const latestInvoiceId = subscription.latest_invoice as string
            if (latestInvoiceId) {
              const invoice = await stripe.invoices.retrieve(latestInvoiceId)
              paymentIntentId = (invoice as any).payment_intent as string | null
              intensiveAmount = (invoice as any).amount_paid || intensiveAmount
            }
          } else {
            paymentIntentId = session.payment_intent as string | null
            intensiveAmount = session.amount_total || 0
          }

          console.log(`💰 Intensive amount: $${(intensiveAmount / 100).toFixed(2)} ${isFreeIntensive ? '(FREE with promo: ' + promoCode + ')' : ''}`)

          const order = await ensureOrder({
            userId,
            session,
            totalAmount: intensiveAmount,
            paymentIntentId,
            promoCode: promoCode || null,
            referralSource: session.metadata.referral_source || session.metadata.source || null,
            campaignName: session.metadata.campaign_name || null,
            supabaseAdmin,
          })

          let intensivePriceId: string | null = null
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 })
            intensivePriceId = lineItems.data[0]?.price?.id ?? null
          } catch (lineItemError) {
            console.error('Unable to fetch line items for combined checkout:', lineItemError)
          }

          const intensiveOrderItem =
            (await createOrderItemByPriceId({
              orderId: order.id,
              stripePriceId: intensivePriceId,
              amount: intensiveAmount,
              currency: session.currency || 'usd',
              isSubscription: false,
              metadata: {
                payment_plan: intensivePaymentPlan,
                is_free: isFreeIntensive,
              },
              extraFields: {
                stripe_payment_intent_id: paymentIntentId,
                stripe_checkout_session_id: session.id,
                payment_plan: intensivePaymentPlan,
                installments_total: intensivePaymentPlan === 'full' ? 1 : intensivePaymentPlan === '2pay' ? 2 : 3,
                installments_paid: 1,
                completion_status: 'pending',
                activation_deadline: activationDeadline.toISOString(),
                promo_code: promoCode || null,
                referral_source: session.metadata.referral_source || session.metadata.source || null,
                campaign_name: session.metadata.campaign_name || null,
              },
              supabaseAdmin,
            })) ||
            (await createOrderItemByProductKey({
              orderId: order.id,
              productKey: 'intensive',
              amount: intensiveAmount,
              currency: session.currency || 'usd',
              isSubscription: false,
              metadata: {
                payment_plan: intensivePaymentPlan,
                is_free: isFreeIntensive,
              },
              extraFields: {
                stripe_payment_intent_id: paymentIntentId,
                stripe_checkout_session_id: session.id,
                payment_plan: intensivePaymentPlan,
                installments_total: intensivePaymentPlan === 'full' ? 1 : intensivePaymentPlan === '2pay' ? 2 : 3,
                installments_paid: 1,
                completion_status: 'pending',
                activation_deadline: activationDeadline.toISOString(),
                promo_code: promoCode || null,
                referral_source: session.metadata.referral_source || session.metadata.source || null,
                campaign_name: session.metadata.campaign_name || null,
              },
              supabaseAdmin,
            }))

          if (!intensiveOrderItem?.id) {
            console.error('❌ Failed to create intensive order item for combined checkout')
            break
          }

          await supabaseAdmin.from('intensive_checklist').insert({
            intensive_id: intensiveOrderItem.id,
            user_id: userId,
          })

          const { data: result, error: grantError } = await supabase
            .rpc('grant_trial_tokens', {
              p_user_id: userId,
              p_intensive_id: intensiveOrderItem.id,
            })

          if (grantError) {
            console.error('❌ Failed to grant intensive trial tokens:', grantError)
          } else {
            console.log('✅ Intensive trial tokens granted:', result)
          }

          const membershipOrderItem =
            (await createOrderItemByPriceId({
              orderId: order.id,
              stripePriceId: continuityPriceId,
              amount: 0,
              currency: session.currency || 'usd',
              isSubscription: true,
              subscriptionId: customerSubscriptionId,
              metadata: {
                trial_days: 56,
                billing_starts_day: 56,
              },
              supabaseAdmin,
            })) ||
            (await createOrderItemByProductKey({
              orderId: order.id,
              productKey: tierType,
              amount: 0,
              currency: session.currency || 'usd',
              isSubscription: true,
              subscriptionId: customerSubscriptionId,
              metadata: {
                trial_days: 56,
                billing_starts_day: 56,
              },
              supabaseAdmin,
            }))

          if (membershipOrderItem?.id && customerSubscriptionId) {
            await supabaseAdmin
              .from('customer_subscriptions')
              .update({
                order_id: order.id,
                order_item_id: membershipOrderItem.id,
              })
              .eq('id', customerSubscriptionId)
          }

          console.log('✅ Combined checkout completed:', {
            userId,
            subscriptionId,
            intensiveId: intensiveOrderItem.id,
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

        const { data: subscriptionRow } = await supabase
          .from('customer_subscriptions')
          .select('id, user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()

        if (subscriptionRow?.id) {
          const priceIds = (subscription.items?.data || [])
            .map((item) => item.price?.id)
            .filter((id): id is string => Boolean(id))

          const storagePrices = await getStorageAddonPrices(priceIds, supabaseAdmin)
          const allowedPriceIds = new Set(storagePrices.map((price) => price.stripePriceId))

          const { data: existingStorage } = await supabaseAdmin
            .from('user_storage')
            .select('id, metadata')
            .eq('subscription_id', subscriptionRow.id)

          const staleIds = (existingStorage || [])
            .filter((row: any) => row?.metadata?.storage_addon === true)
            .filter((row: any) => !allowedPriceIds.has(row?.metadata?.stripe_price_id))
            .map((row: any) => row.id)

          if (staleIds.length > 0) {
            await supabaseAdmin
              .from('user_storage')
              .delete()
              .in('id', staleIds)
          }
        }

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

        const { data: subscriptionRow } = await supabase
          .from('customer_subscriptions')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()

        if (subscriptionRow?.id) {
          const { data: existingStorage } = await supabaseAdmin
            .from('user_storage')
            .select('id, metadata')
            .eq('subscription_id', subscriptionRow.id)

          const addonIds = (existingStorage || [])
            .filter((row: any) => row?.metadata?.storage_addon === true)
            .map((row: any) => row.id)

          if (addonIds.length > 0) {
            await supabaseAdmin
              .from('user_storage')
              .delete()
              .in('id', addonIds)
          }
        }

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
              stripe_price_id,
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
              
              // Get cycle number from token_transactions history
              const { count } = await supabase
                .from('token_transactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', subscription.user_id)
                .eq('subscription_id', subscription.id)
                .eq('action_type', 'subscription_grant')
                .gt('tokens_used', 0) // Only count grants (not deductions)
              
              // Grant tokens for renewal (dynamic tier lookup)
              const { data: result, error: grantError } = await supabase
                .rpc('grant_tokens_by_stripe_price_id', {
                  p_user_id: subscription.user_id,
                  p_stripe_price_id: subscription.stripe_price_id,
                  p_subscription_id: subscription.id,
                })
              
              if (grantError) {
                console.error('❌ Failed to grant tokens on renewal:', grantError)
              } else {
                console.log('✅ Renewal tokens granted:', result)
              }
            }

            const invoiceLines = (invoice as any).lines?.data || []
            const linePriceIds = invoiceLines
              .map((line: any) => line?.price?.id)
              .filter((id: any): id is string => Boolean(id))

            const storagePrices = await getStorageAddonPrices(linePriceIds, supabaseAdmin)
            if (storagePrices.length > 0) {
              const { data: existingStorage } = await supabaseAdmin
                .from('user_storage')
                .select('id, metadata')
                .eq('subscription_id', subscription.id)

              for (const line of invoiceLines) {
                const priceId = line?.price?.id
                if (!priceId) {
                  continue
                }

                const storagePrice = storagePrices.find((price) => price.stripePriceId === priceId)
                if (!storagePrice) {
                  continue
                }

                const alreadyGranted = (existingStorage || []).some(
                  (row: any) =>
                    row?.metadata?.storage_addon === true &&
                    row?.metadata?.stripe_price_id === priceId
                )

                if (alreadyGranted) {
                  continue
                }

                const quantity = Number.isFinite(line?.quantity) ? line.quantity : 1
                const storageAmount = storagePrice.grantAmount * quantity

                const { error: storageError } = await supabaseAdmin
                  .from('user_storage')
                  .insert({
                    user_id: subscription.user_id,
                    quota_gb: storageAmount,
                    subscription_id: subscription.id,
                    metadata: {
                      storage_addon: true,
                      stripe_price_id: priceId,
                      pack_key: storagePrice.packKey,
                      quantity,
                      invoice_id: invoice.id,
                    },
                  })

                if (storageError) {
                  console.error('Failed to grant storage add-on:', storageError)
                }
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

