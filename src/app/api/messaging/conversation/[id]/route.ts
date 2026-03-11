// /src/app/api/messaging/conversation/[id]/route.ts
// Get SMS conversation thread for a lead, ticket, or user

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { getConversation } from '@/lib/messaging'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'lead', 'ticket', 'user', or 'phone'

    let messages: any[] = []

    switch (type) {
      case 'lead':
        messages = await getConversation({ leadId: id })
        break
      case 'ticket':
        messages = await getConversation({ ticketId: id })
        break
      case 'user':
        messages = await getConversation({ userId: id })
        break
      case 'phone':
        messages = await getConversation({ phoneNumber: id })
        break
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('❌ Error fetching conversation:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

