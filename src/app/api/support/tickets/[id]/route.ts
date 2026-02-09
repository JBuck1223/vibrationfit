// /src/app/api/support/tickets/[id]/route.ts
// Individual ticket operations

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isUserAdmin } from '@/lib/supabase/admin'

// Allowed fields for ticket updates
const TICKET_UPDATABLE_FIELDS = [
  'status', 'priority', 'category', 'assigned_to',
  'resolved_at', 'closed_at',
] as const

function pickAllowedFields(body: Record<string, unknown>, allowedFields: readonly string[]) {
  const result: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) {
      result[key] = body[key]
    }
  }
  return result
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const adminClient = createAdminClient()

    // Get ticket
    const { data: ticket, error } = await adminClient
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching ticket:', error)
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check permissions
    const isAdmin = isUserAdmin(user)
    const isOwner = user?.id === ticket.user_id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get replies
    const { data: replies } = await adminClient
      .from('support_ticket_replies')
      .select('*, admin:admin_id(email)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      ticket,
      replies: replies || [],
    })
  } catch (error: unknown) {
    console.error('Error in get ticket API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const body = await request.json()
    const updateData = pickAllowedFields(body, TICKET_UPDATABLE_FIELDS)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update ticket
    const { data: ticket, error } = await adminClient
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating ticket:', error)
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    return NextResponse.json({ ticket })
  } catch (error: unknown) {
    console.error('Error in update ticket API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
