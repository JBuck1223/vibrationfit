// /src/app/api/messaging/conversation/[id]/route.ts
// Get SMS conversation thread for a lead, ticket, or user

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConversation } from '@/lib/messaging'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'lead', 'ticket', 'user', or 'phone'

    let messages: any[] = []

    switch (type) {
      case 'lead':
        messages = await getConversation({ leadId: params.id })
        break
      case 'ticket':
        messages = await getConversation({ ticketId: params.id })
        break
      case 'user':
        messages = await getConversation({ userId: params.id })
        break
      case 'phone':
        messages = await getConversation({ phoneNumber: params.id })
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

