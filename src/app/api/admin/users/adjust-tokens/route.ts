import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { grantTokens, recordAdminDeduction } from '@/lib/tokens/transactions'

export async function POST(req: NextRequest) {
  try {
    // First verify user is authenticated and has super_admin role
    const userSupabase = await createClient()
    const { data: { user } } = await userSupabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check super_admin role in user_accounts
    const { data: adminAccount } = await userSupabase
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminAccount?.role !== 'super_admin' && adminAccount?.role !== 'admin') {
      console.log('Token adjustment denied - not admin:', { userId: user.id, role: adminAccount?.role })
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, delta } = await req.json()
    console.log('Admin token adjustment request:', { userId, delta, adminId: user.id })
    
    if (!userId || typeof delta !== 'number') {
      return NextResponse.json({ error: 'userId and delta required' }, { status: 400 })
    }

    // Use service role client to bypass RLS for the actual operation
    const supabase = createAdminClient()
    const adminUser = user
    
    // Record as a transaction (financial)
    try {
      if (delta > 0) {
        await grantTokens(
          userId,
          delta,
          'admin',
          {
            admin_action: true,
            delta: delta,
            reason: 'Admin token adjustment'
          },
          supabase
        )
        console.log('✅ Admin grant recorded successfully')
      } else {
        await recordAdminDeduction(
          userId,
          Math.abs(delta),
          'Admin token adjustment',
          adminUser?.id, // Admin user ID
          supabase
        )
        console.log('✅ Admin deduction recorded successfully')
      }
    } catch (transactionError: any) {
      console.error('❌ Failed to record transaction:', transactionError)
      console.error('Transaction error details:', {
        message: transactionError.message,
        stack: transactionError.stack,
        code: transactionError.code,
        details: transactionError.details,
        hint: transactionError.hint
      })
      return NextResponse.json({ 
        error: `Failed to record transaction: ${transactionError.message || 'Unknown error'}`,
        details: transactionError.message || transactionError.toString(),
        code: transactionError.code,
        hint: transactionError.hint
      }, { status: 500 })
    }
    
    console.log('Token adjustment completed successfully')
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Unexpected error in adjust-tokens:', e)
    console.error('Error details:', {
      message: e.message,
      stack: e.stack,
      code: e.code,
      details: e.details,
      hint: e.hint
    })
    return NextResponse.json({ 
      error: e.message || 'Unexpected error',
      details: e.toString(),
      code: e.code,
      hint: e.hint
    }, { status: 500 })
  }
}


