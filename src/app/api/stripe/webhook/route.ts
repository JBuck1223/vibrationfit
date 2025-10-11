// /src/app/api/stripe/webhook/route.ts
// Stripe webhook handler for subscription events

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
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

  const supabase = await createClient()

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
          await supabase.from('customer_subscriptions').insert({
            user_id: userId,
            membership_tier_id: tier.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status as any,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          })

          console.log('✅ Subscription created:', subscriptionId)
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
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
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

        if (invoice.subscription) {
          const customerId = invoice.customer as string

          // Find user by customer ID
          const { data: subscription } = await supabase
            .from('customer_subscriptions')
            .select('user_id, id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (subscription) {
            // Record payment
            await supabase.from('payment_history').insert({
              user_id: subscription.user_id,
              subscription_id: subscription.id,
              stripe_payment_intent_id: invoice.payment_intent as string,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'succeeded',
              description: invoice.description || 'Subscription payment',
              paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
            })

            console.log('✅ Payment recorded:', invoice.id)
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
            amount: invoice.amount_due,
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

