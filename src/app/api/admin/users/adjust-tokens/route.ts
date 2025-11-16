import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/server'
import { grantTokens, recordAdminDeduction } from '@/lib/tokens/transactions'

export async function POST(req: NextRequest) {
  try {
    const { userId, delta } = await req.json()
    console.log('Admin token adjustment request:', { userId, delta })
    
    if (!userId || typeof delta !== 'number') {
      return NextResponse.json({ error: 'userId and delta required' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    
    // Get admin user for audit trail
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    
    // Ensure user profile exists first (handle multiple rows gracefully)
    const { data: existingProfiles, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userId)
    
    if (profileCheckError) {
      console.error('Error checking user profile:', profileCheckError)
      return NextResponse.json({ error: `Failed to check user profile: ${profileCheckError.message}` }, { status: 500 })
    }
    
    if (!existingProfiles || existingProfiles.length === 0) {
      // Create profile if it doesn't exist (tokens are tracked in token_transactions table)
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          storage_quota_gb: 1
        })
      
      if (createError) {
        console.error('Failed to create user profile:', createError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }
    } else if (existingProfiles.length > 1) {
      console.warn(`Multiple profiles found for user ${userId} - this should not happen`)
      // Continue anyway - token transaction will be recorded correctly
    }
    
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


