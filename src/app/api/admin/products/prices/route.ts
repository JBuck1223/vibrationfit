// Admin CRUD for product_prices — the single source of truth for every
// amount charged at checkout and on renewals (intensives, seats, packs,
// add-ons). Metadata keys (payment_plan, plan_type, pack_key, addon_key,
// grant_amount, grant_unit) drive how checkout resolves each price.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyAdminAccess } from '@/lib/supabase/admin'

const INTERVAL_UNITS = ['day', 'week', 'month', 'year']

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function parseMetadata(raw: unknown): Record<string, unknown> | null {
  if (raw === undefined || raw === null || raw === '') return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return typeof parsed === 'object' && parsed !== null ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

/** POST: create a price for a product. */
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const { productId, unitAmount, currency, intervalUnit, intervalCount, metadata } = body as {
    productId?: string
    unitAmount?: number
    currency?: string
    intervalUnit?: string | null
    intervalCount?: number
    metadata?: unknown
  }

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
  }
  if (typeof unitAmount !== 'number' || unitAmount < 0 || !Number.isInteger(unitAmount)) {
    return NextResponse.json({ error: 'Amount must be a non-negative integer (cents)' }, { status: 400 })
  }
  if (intervalUnit && !INTERVAL_UNITS.includes(intervalUnit)) {
    return NextResponse.json({ error: `Interval must be one of: ${INTERVAL_UNITS.join(', ')} (or empty for one-time)` }, { status: 400 })
  }

  const parsedMetadata = parseMetadata(metadata)
  if (parsedMetadata === null) {
    return NextResponse.json({ error: 'Metadata must be valid JSON' }, { status: 400 })
  }

  const admin = getServiceClient()
  const { data: price, error } = await admin
    .from('product_prices')
    .insert({
      product_id: productId,
      unit_amount: unitAmount,
      currency: currency || 'usd',
      interval_unit: intervalUnit || null,
      interval_count: intervalCount || 1,
      is_active: true,
      metadata: parsedMetadata,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ price })
}

/** PATCH: update a price (amount, interval, metadata, active). */
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const { id, unitAmount, currency, intervalUnit, intervalCount, metadata, isActive } = body as {
    id?: string
    unitAmount?: number
    currency?: string
    intervalUnit?: string | null
    intervalCount?: number
    metadata?: unknown
    isActive?: boolean
  }

  if (!id) {
    return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (unitAmount !== undefined) {
    if (typeof unitAmount !== 'number' || unitAmount < 0 || !Number.isInteger(unitAmount)) {
      return NextResponse.json({ error: 'Amount must be a non-negative integer (cents)' }, { status: 400 })
    }
    updates.unit_amount = unitAmount
  }
  if (currency !== undefined) updates.currency = currency
  if (intervalUnit !== undefined) {
    if (intervalUnit && !INTERVAL_UNITS.includes(intervalUnit)) {
      return NextResponse.json({ error: `Interval must be one of: ${INTERVAL_UNITS.join(', ')} (or empty for one-time)` }, { status: 400 })
    }
    updates.interval_unit = intervalUnit || null
  }
  if (intervalCount !== undefined) updates.interval_count = intervalCount
  if (isActive !== undefined) updates.is_active = Boolean(isActive)
  if (metadata !== undefined) {
    const parsedMetadata = parseMetadata(metadata)
    if (parsedMetadata === null) {
      return NextResponse.json({ error: 'Metadata must be valid JSON' }, { status: 400 })
    }
    updates.metadata = parsedMetadata
  }

  const admin = getServiceClient()
  const { data: price, error } = await admin
    .from('product_prices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ price })
}
