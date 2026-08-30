// Admin Products & Pricing hub API.
// Every product and price is DB-driven — changes here take effect on checkout
// and renewals immediately, with zero payment-gateway setup.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyAdminAccess } from '@/lib/supabase/admin'

const PRODUCT_TYPES = ['membership', 'intensive', 'storage', 'tokens', 'coaching', 'addon', 'other']

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** GET: all products with their prices. */
export async function GET() {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const admin = getServiceClient()
  const { data: products, error } = await admin
    .from('products')
    .select(`
      id, key, name, description, product_type, is_subscription, is_active, metadata, created_at,
      product_prices ( id, unit_amount, currency, interval_unit, interval_count, is_active, metadata, stripe_price_id, created_at )
    `)
    .order('key', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ products: products || [] })
}

/** POST: create a product. */
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const { key, name, description, productType, isSubscription } = body as {
    key?: string
    name?: string
    description?: string
    productType?: string
    isSubscription?: boolean
  }

  if (!key?.trim() || !name?.trim()) {
    return NextResponse.json({ error: 'Key and name are required' }, { status: 400 })
  }
  if (!/^[a-z0-9_-]+$/.test(key.trim())) {
    return NextResponse.json({ error: 'Key must be lowercase letters, numbers, underscores, or dashes' }, { status: 400 })
  }
  if (productType && !PRODUCT_TYPES.includes(productType)) {
    return NextResponse.json({ error: `Type must be one of: ${PRODUCT_TYPES.join(', ')}` }, { status: 400 })
  }

  const admin = getServiceClient()
  const { data: product, error } = await admin
    .from('products')
    .insert({
      key: key.trim(),
      name: name.trim(),
      description: description?.trim() || null,
      product_type: productType || 'other',
      is_subscription: Boolean(isSubscription),
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A product with this key already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ product })
}

/** PATCH: update a product (name, description, type, active). */
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const { id, ...updates } = body as Record<string, any>

  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
  }

  const allowedFields = ['name', 'description', 'product_type', 'is_subscription', 'is_active']
  const filteredUpdates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in updates) filteredUpdates[field] = updates[field]
  }

  if ('product_type' in filteredUpdates && !PRODUCT_TYPES.includes(filteredUpdates.product_type as string)) {
    return NextResponse.json({ error: `Type must be one of: ${PRODUCT_TYPES.join(', ')}` }, { status: 400 })
  }
  if (Object.keys(filteredUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  filteredUpdates.updated_at = new Date().toISOString()

  const admin = getServiceClient()
  const { data: product, error } = await admin
    .from('products')
    .update(filteredUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ product })
}
